// Backend/vehicle-service/src/handlers/eventHandlers.js
const pool = require("../config/database");
const eventEmitter = require("../utils/eventEmitter");

class EventHandlers {
  /**
   * Handle request.vehicle_deactivation_approved event
   */
  async handleVehicleDeactivationApproved(event) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { vehicleId, note } = event.data;

      await client.query(
        `UPDATE vehicles 
         SET status = 'deactivated',
             verification_notes = $1,
             updated_at = NOW()
         WHERE vehicle_id = $2`,
        [note || "Vehicle deactivated by admin approval", vehicleId],
      );

      await client.query("COMMIT");

      console.log(`✅ Vehicle ${vehicleId} deactivated via event`);

      // Emit status changed event
      await eventEmitter.emit("vehicle.status_changed", {
        vehicleId,
        oldStatus: "active",
        newStatus: "deactivated",
        reason: note,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error handling vehicle deactivation:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle request.vehicle_reactivation_approved event
   */
  async handleVehicleReactivationApproved(event) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { vehicleId, note } = event.data;

      await client.query(
        `UPDATE vehicles 
         SET status = 'active',
             verification_notes = $1,
             updated_at = NOW()
         WHERE vehicle_id = $2`,
        [note || "Vehicle reactivated by admin approval", vehicleId],
      );

      await client.query("COMMIT");

      console.log(`✅ Vehicle ${vehicleId} reactivated via event`);

      // Emit status changed event
      await eventEmitter.emit("vehicle.status_changed", {
        vehicleId,
        oldStatus: "deactivated",
        newStatus: "active",
        reason: note,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error handling vehicle reactivation:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle request.vehicle_verification_approved event
   */
  async handleVehicleVerificationApproved(event) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { vehicleId, note } = event.data;

      await client.query(
        `UPDATE vehicles 
         SET verification_status = 'approved',
             verification_notes = $1,
             last_verified_at = NOW(),
             next_verification_due = NOW() + INTERVAL '2 months',
             updated_at = NOW()
         WHERE vehicle_id = $2`,
        [note || null, vehicleId],
      );

      await client.query("COMMIT");

      console.log(`✅ Vehicle ${vehicleId} verification approved via event`);

      // Emit verification status changed event
      await eventEmitter.emit("vehicle.verification_status_changed", {
        vehicleId,
        verificationStatus: "approved",
        note,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error handling vehicle verification approval:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle request.vehicle_verification_denied event
   */
  async handleVehicleVerificationDenied(event) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { vehicleId, note } = event.data;

      await client.query(
        `UPDATE vehicles 
         SET verification_status = 'denied',
             verification_notes = $1,
             updated_at = NOW()
         WHERE vehicle_id = $2`,
        [note || "Verification denied", vehicleId],
      );

      await client.query("COMMIT");

      console.log(`✅ Vehicle ${vehicleId} verification denied via event`);

      // Emit verification status changed event
      await eventEmitter.emit("vehicle.verification_status_changed", {
        vehicleId,
        verificationStatus: "denied",
        note,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error handling vehicle verification denial:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle request.vehicle_banned event
   */
  async handleVehicleBanned(event) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { vehicleId, note } = event.data;

      await client.query(
        `UPDATE vehicles 
         SET status = 'banned',
             banned_reason = $1,
             updated_at = NOW()
         WHERE vehicle_id = $2`,
        [note || "Vehicle banned by admin", vehicleId],
      );

      await client.query("COMMIT");

      console.log(`✅ Vehicle ${vehicleId} banned via event`);

      // Emit status changed event
      await eventEmitter.emit("vehicle.status_changed", {
        vehicleId,
        newStatus: "banned",
        reason: note,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error handling vehicle ban:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle request.vehicle_unbanned event
   */
  async handleVehicleUnbanned(event) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { vehicleId } = event.data;

      await client.query(
        `UPDATE vehicles 
         SET status = 'active',
             banned_reason = NULL,
             updated_at = NOW()
         WHERE vehicle_id = $1`,
        [vehicleId],
      );

      await client.query("COMMIT");

      console.log(`✅ Vehicle ${vehicleId} unbanned via event`);

      // Emit status changed event
      await eventEmitter.emit("vehicle.status_changed", {
        vehicleId,
        newStatus: "active",
        reason: "Unbanned by admin",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error handling vehicle unban:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle booking.completed event - track revenue
   */
  async handleBookingCompleted(event) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { vehicleId, bookingId, totalAmount } = event.data;

      // Insert revenue history record
      await client.query(
        `INSERT INTO vehicle_revenue_history (vehicle_id, booking_id, amount, earned_at)
         VALUES ($1, $2, $3, NOW())`,
        [vehicleId, bookingId, totalAmount],
      );

      // Update total revenue for vehicle
      await client.query(
        `UPDATE vehicles 
         SET total_revenue_earned = total_revenue_earned + $1,
             updated_at = NOW()
         WHERE vehicle_id = $2`,
        [totalAmount, vehicleId],
      );

      await client.query("COMMIT");

      console.log(
        `✅ Revenue tracked for vehicle ${vehicleId}: ${totalAmount} VND`,
      );
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error tracking revenue:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Main event router
   */
  async handleEvent(event) {
    try {
      console.log(`📨 Processing event: ${event.eventType}`);

      switch (event.eventType) {
        case "request.vehicle_deactivation_approved":
          await this.handleVehicleDeactivationApproved(event);
          break;

        case "request.vehicle_reactivation_approved":
          await this.handleVehicleReactivationApproved(event);
          break;

        case "request.vehicle_verification_approved":
          await this.handleVehicleVerificationApproved(event);
          break;

        case "request.vehicle_verification_denied":
          await this.handleVehicleVerificationDenied(event);
          break;

        case "request.vehicle_banned":
          await this.handleVehicleBanned(event);
          break;

        case "request.vehicle_unbanned":
          await this.handleVehicleUnbanned(event);
          break;

        case "booking.completed":
          await this.handleBookingCompleted(event);
          break;

        default:
          console.log(`ℹ️ Unhandled event type: ${event.eventType}`);
      }
    } catch (error) {
      console.error(`❌ Error handling event ${event.eventType}:`, error);
    }
  }
}

module.exports = new EventHandlers();
