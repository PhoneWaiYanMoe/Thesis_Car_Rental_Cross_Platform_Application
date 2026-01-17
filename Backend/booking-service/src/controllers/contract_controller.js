// Backend/booking-service/src/controllers/contract_controller.js
const pool = require("../config/database");
const PDFDocument = require("pdfkit");
const axios = require("axios");
const FormData = require("form-data");

class ContractController {
  // ==================== HELPER: Generate Platform Contract PDF ====================

  async generatePlatformContract(
    booking,
    vehicleInfo,
    customerInfo,
    ownerInfo
  ) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Header
        doc.fontSize(20).text("VEHICLE RENTAL AGREEMENT", { align: "center" });
        doc.moveDown();
        doc
          .fontSize(10)
          .text(`Contract ID: ${booking.booking_id}`, { align: "center" });
        doc.text(`Generated: ${new Date().toLocaleString()}`, {
          align: "center",
        });
        doc.moveDown(2);

        // Parties
        doc.fontSize(14).text("PARTIES TO THIS AGREEMENT", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Owner: ${ownerInfo.full_name}`);
        doc.text(`Email: ${ownerInfo.email}`);
        doc.moveDown(0.5);
        doc.text(`Renter: ${customerInfo.full_name}`);
        doc.text(`Email: ${customerInfo.email}`);
        doc.text(`License: ${customerInfo.license_number}`);
        doc.moveDown(2);

        // Vehicle Details
        doc.fontSize(14).text("VEHICLE DETAILS", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Vehicle: ${vehicleInfo.name}`);
        doc.text(`Type: ${vehicleInfo.vehicle_type || "N/A"}`);
        doc.text(`Transmission: ${vehicleInfo.transmission || "N/A"}`);
        doc.moveDown(2);

        // Rental Period
        doc.fontSize(14).text("RENTAL PERIOD", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        const startDate = new Date(booking.start_date);
        const endDate = new Date(booking.end_date);
        doc.text(`Start: ${startDate.toLocaleString()}`);
        doc.text(`End: ${endDate.toLocaleString()}`);
        doc.text(`Duration: ${booking.duration_days} day(s)`);
        doc.moveDown(2);

        // Pricing
        doc.fontSize(14).text("PRICING & PAYMENT", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Rental Price: ${this.formatPrice(booking.rental_price)} VND`);
        doc.text(
          `Insurance Fee (${booking.insurance_coverage}%): ${this.formatPrice(
            booking.insurance_fee
          )} VND`
        );
        doc.text(
          `Total Amount: ${this.formatPrice(booking.total_amount)} VND`,
          { bold: true }
        );
        doc.text(
          `Deposit (30%): ${this.formatPrice(booking.deposit_amount)} VND`
        );
        doc.text(
          `Remaining Payment: ${this.formatPrice(
            booking.remaining_payment
          )} VND`
        );
        doc.moveDown(2);

        // Terms & Conditions
        doc.addPage();
        doc.fontSize(14).text("TERMS & CONDITIONS", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        const terms = [
          "1. VEHICLE USE: The Renter agrees to use the vehicle only for lawful purposes and in accordance with all traffic laws.",
          "2. INSURANCE: The rental includes basic insurance coverage as specified. Renter is responsible for damages not covered by insurance.",
          "3. FUEL: The vehicle must be returned with the same fuel level as at pickup.",
          "4. MILEAGE: Unlimited mileage is included unless otherwise specified.",
          "5. PROHIBITED USES: The vehicle shall not be used for: racing, towing, off-road driving, illegal activities, or by unauthorized drivers.",
          "6. INSPECTION: Both parties agree to inspect the vehicle at pickup and return, documenting its condition with photos.",
          "7. LATE RETURN: Late returns may incur additional charges at the daily rental rate.",
          "8. DAMAGE: Renter is responsible for all damage to the vehicle during the rental period, subject to insurance coverage.",
          "9. CANCELLATION: Cancellations follow the platform's cancellation policy with applicable refunds.",
          "10. DISPUTE RESOLUTION: Any disputes will be resolved through the platform's customer support process.",
        ];

        terms.forEach((term) => {
          doc.text(term, { align: "justify" });
          doc.moveDown(0.5);
        });

        doc.moveDown(2);

        // Signatures Section
        doc.fontSize(14).text("SIGNATURES", { underline: true });
        doc.moveDown(2);

        doc.fontSize(10);
        doc.text("Owner Signature: _________________________", 100, doc.y);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 350, doc.y - 12);
        doc.moveDown(3);

        doc.text("Renter Signature: _________________________", 100, doc.y);
        doc.text("Date: _________________________", 350, doc.y - 12);
        doc.moveDown(2);

        // Footer
        doc
          .fontSize(8)
          .text(
            "This contract is legally binding. By signing, both parties agree to all terms and conditions stated herein.",
            { align: "center", color: "gray" }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // ==================== 1. AUTO-GENERATE CONTRACT (Called when booking approved) ====================

  async generateContract(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;
      const userId = req.user.userId;

      // Get booking details
      const bookingResult = await client.query(
        `SELECT * FROM bookings WHERE booking_id = $1`,
        [id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      // Only generate if status is 'booking' and deposit paid
      if (booking.status !== "booking" || !booking.deposit_paid) {
        return res.status(400).json({
          error:
            "Contract can only be generated for approved bookings with deposit paid",
        });
      }

      // Check if already generated
      if (booking.platform_contract_url) {
        return res.json({
          message: "Contract already generated",
          contractUrl: booking.platform_contract_url,
        });
      }

      // Fetch vehicle, customer, owner info
      const vehicleGrpcClient = require("../grpc/vehicle_grpc_client");
      const vehicleInfo = await vehicleGrpcClient.getVehicleInfo(
        booking.vehicle_id
      );

      // Get customer verification info
      const customerResult = await client.query(
        `SELECT uv.*, u.email, u.full_name 
         FROM user_verifications uv
         JOIN users u ON u.user_id = uv.user_id
         WHERE uv.user_id = $1`,
        [booking.customer_id]
      );

      const customerInfo = customerResult.rows[0] || {
        full_name: "Customer",
        email: "customer@example.com",
        license_number: "N/A",
      };

      // Get owner info
      const ownerResult = await client.query(
        `SELECT email, full_name FROM users WHERE user_id = $1`,
        [vehicleInfo.owner_id]
      );

      const ownerInfo = ownerResult.rows[0] || {
        full_name: "Owner",
        email: "owner@example.com",
      };

      // Generate PDF
      console.log("📄 Generating platform contract PDF...");
      const pdfBuffer = await this.generatePlatformContract(
        booking,
        vehicleInfo,
        customerInfo,
        ownerInfo
      );

      // Upload to media service
      const mediaServiceUrl =
        process.env.MEDIA_SERVICE_URL || "http://localhost:3008";
      const formData = new FormData();

      formData.append("file", pdfBuffer, {
        filename: `contract_${booking.booking_id}.pdf`,
        contentType: "application/pdf",
      });
      formData.append("ownerId", booking.booking_id);
      formData.append("ownerType", "REQUEST");
      formData.append("type", "contract");

      const uploadResponse = await axios.post(
        `${mediaServiceUrl}/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: req.headers.authorization,
          },
        }
      );

      const contractFileId = uploadResponse.data.fileId;

      console.log(`✅ Contract uploaded to media service: ${contractFileId}`);

      // Update booking with contract URL
      await client.query(
        `UPDATE bookings 
         SET platform_contract_url = $1,
             contract_generated_at = NOW(),
             updated_at = NOW()
         WHERE booking_id = $2`,
        [contractFileId, id]
      );

      await client.query("COMMIT");

      res.json({
        message: "Platform contract generated successfully",
        contractFileId: contractFileId,
        downloadUrl: `${mediaServiceUrl}/media/${contractFileId}`,
        nextStep: "Renter can now review and sign the contract",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Generate contract error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  // ==================== 2. OWNER UPLOAD CUSTOM CONTRACT ====================

  async uploadOwnerContract(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { contractFileId } = req.body;

      if (!contractFileId) {
        return res.status(400).json({
          error:
            "contractFileId is required (upload file to media service first)",
        });
      }

      // Get booking
      const bookingResult = await client.query(
        `SELECT * FROM bookings WHERE booking_id = $1`,
        [id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      // Verify ownership
      const vehicleGrpcClient = require("../grpc/vehicle_grpc_client");
      const ownershipCheck = await vehicleGrpcClient.checkVehicleOwnership(
        booking.vehicle_id,
        userId
      );

      if (!ownershipCheck.is_owner && userRole !== "admin") {
        return res.status(403).json({
          error: "Only the vehicle owner can upload custom contracts",
        });
      }

      if (booking.status !== "booking" && booking.status !== "pending") {
        return res.status(400).json({
          error: "Contract can only be uploaded for pending/booking status",
        });
      }

      // Update booking with owner contract
      await client.query(
        `UPDATE bookings 
         SET owner_contract_url = $1,
             owner_contract_uploaded_at = NOW(),
             updated_at = NOW()
         WHERE booking_id = $2`,
        [contractFileId, id]
      );

      await client.query("COMMIT");

      console.log(`✅ Owner uploaded custom contract for booking: ${id}`);

      // TODO: Send notification to customer

      res.json({
        message: "Custom contract uploaded successfully",
        contractFileId: contractFileId,
        notification: "Customer has been notified to review the contract",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Upload owner contract error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  // ==================== 3. GET CONTRACT (Customer/Owner view) ====================

  async getContract(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const bookingResult = await pool.query(
        `SELECT * FROM bookings WHERE booking_id = $1`,
        [id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      // Verify access (customer or owner)
      const vehicleGrpcClient = require("../grpc/vehicle_grpc_client");
      const vehicleInfo = await vehicleGrpcClient.getVehicleInfo(
        booking.vehicle_id
      );

      if (booking.customer_id !== userId && vehicleInfo.owner_id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const mediaServiceUrl =
        process.env.MEDIA_SERVICE_URL || "http://localhost:3008";

      // Priority: Owner contract > Platform contract
      const contractFileId =
        booking.owner_contract_url || booking.platform_contract_url;

      if (!contractFileId) {
        return res.status(404).json({
          error: "No contract available yet",
          canGenerate: booking.status === "booking" && booking.deposit_paid,
        });
      }

      res.json({
        contractFileId: contractFileId,
        contractUrl: `${mediaServiceUrl}/media/${contractFileId}`,
        contractType: booking.owner_contract_url
          ? "owner_custom"
          : "platform_generated",
        uploadedAt:
          booking.owner_contract_uploaded_at || booking.contract_generated_at,
        signed: !!booking.signed_contract_url,
        signedAt: booking.contract_signed_at,
      });
    } catch (error) {
      console.error("Get contract error:", error);
      next(error);
    }
  }

  // ==================== 4. SIGN CONTRACT (Customer upload signed version) ====================

  async signContract(req, res, next) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;
      const userId = req.user.userId;
      const { signedContractFileId, agreedToTerms } = req.body;

      if (!agreedToTerms) {
        return res.status(400).json({ error: "You must agree to the terms" });
      }

      if (!signedContractFileId) {
        return res.status(400).json({
          error:
            "signedContractFileId is required (upload signed contract to media service first)",
        });
      }

      // Get booking
      const bookingResult = await client.query(
        `SELECT * FROM bookings WHERE booking_id = $1 AND customer_id = $2`,
        [id, userId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      if (booking.status !== "booking") {
        return res.status(400).json({
          error: `Cannot sign contract. Current status: ${booking.status}`,
        });
      }

      if (!booking.deposit_paid) {
        return res.status(400).json({
          error: "Deposit must be paid before signing contract",
        });
      }

      if (booking.contract_signed_at) {
        return res.status(400).json({
          error: "Contract already signed",
        });
      }

      // Check if contract exists
      if (!booking.platform_contract_url && !booking.owner_contract_url) {
        return res.status(400).json({
          error: "No contract available to sign. Please generate one first.",
        });
      }

      // Update with signed contract
      await client.query(
        `UPDATE bookings 
         SET signed_contract_url = $1,
             contract_signed_at = NOW(),
             updated_at = NOW()
         WHERE booking_id = $2`,
        [signedContractFileId, id]
      );

      await client.query("COMMIT");

      console.log(`✅ Contract signed for booking: ${id}`);

      res.json({
        message:
          "Contract signed successfully. You can now pay the remaining amount.",
        bookingStatus: "booking",
        signedContractFileId: signedContractFileId,
        contractSignedAt: new Date().toISOString(),
        nextStep: "Pay remaining amount (final payment)",
        canPayFinalPayment: true,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Sign contract error:", error);
      next(error);
    } finally {
      client.release();
    }
  }

  // ==================== 5. PREVIEW CONTRACT BEFORE SIGNING ====================

  async previewContract(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const bookingResult = await pool.query(
        `SELECT * FROM bookings WHERE booking_id = $1 AND customer_id = $2`,
        [id, userId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];
      const contractFileId =
        booking.owner_contract_url || booking.platform_contract_url;

      if (!contractFileId) {
        return res.status(404).json({
          error: "No contract available for preview",
          suggestion: "Contract will be available after booking is approved",
        });
      }

      const mediaServiceUrl =
        process.env.MEDIA_SERVICE_URL || "http://localhost:3008";

      res.json({
        contractUrl: `${mediaServiceUrl}/media/${contractFileId}`,
        contractType: booking.owner_contract_url
          ? "owner_custom"
          : "platform_generated",
        requiresSignature: !booking.contract_signed_at,
        canSign:
          booking.status === "booking" &&
          booking.deposit_paid &&
          !booking.contract_signed_at,
      });
    } catch (error) {
      console.error("Preview contract error:", error);
      next(error);
    }
  }
}

module.exports = new ContractController();
