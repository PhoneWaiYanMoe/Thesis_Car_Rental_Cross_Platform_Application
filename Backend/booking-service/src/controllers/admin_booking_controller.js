// Backend/booking-service/src/controllers/admin_booking_controller.js
// Admin APIs for system-wide booking management

const pool = require("../config/database");
const {
  buildPaginationResponse,
  parseDateFilter,
  parseSortParams,
  parseStatusFilter,
} = require("../middleware/pagination");
const vehicleGrpcClient = require("../grpc/vehicle_grpc_client");
const userGrpcClient = require("../grpc/user_grpc_client");

class AdminBookingController {
  /**
   * GET /admin/bookings
   * Get all bookings with advanced filtering, pagination, and sorting
   */
  async getAllBookings(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        filter = "all_time",
        startDate,
        endDate,
        sortBy = "recently",
        sortOrder = "desc",
        search,
      } = req.query;

      // Parse parameters
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      // Build query
      let query = `SELECT 
        booking_id,
        customer_id,
        vehicle_id,
        status,
        start_date,
        end_date,
        duration_days,
        total_amount,
        deposit_amount,
        remaining_payment,
        deposit_paid,
        final_payment_paid,
        pickup_location,
        dropoff_location,
        driver_required,
        insurance_coverage,
        created_at,
        updated_at
      FROM bookings
      WHERE 1=1`;

      const params = [];
      let paramIndex = 1;

      // Status filter
      const statusFilter = parseStatusFilter(status);
      if (statusFilter && statusFilter.length > 0) {
        query += ` AND status = ANY($${paramIndex}::text[])`;
        params.push(statusFilter);
        paramIndex++;
      }

      // Date range filter
      try {
        const dateRange = parseDateFilter(filter, startDate, endDate);
        if (dateRange) {
          query += ` AND created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
          params.push(dateRange.startDate, dateRange.endDate);
          paramIndex += 2;
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      // Search filter
      if (search && search.trim() !== "") {
        const searchTerm = search.trim();
        query += ` AND (
          booking_id::text ILIKE $${paramIndex} OR
          vehicle_id::text ILIKE $${paramIndex} OR
          customer_id::text ILIKE $${paramIndex}
        )`;
        params.push(`%${searchTerm}%`);
        paramIndex++;
      }

      // Count total for pagination
      const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_bookings`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Sorting
      const { field, order } = parseSortParams(sortBy, sortOrder);
      query += ` ORDER BY ${field} ${order}`;

      // Pagination
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limitNum, offset);

      // Execute query
      const result = await pool.query(query, params);

      // Format response
      const bookings = result.rows.map((row) => ({
        id: row.booking_id,
        customerId: row.customer_id,
        vehicleId: row.vehicle_id,
        status: row.status,
        timeline: {
          startDate: row.start_date,
          endDate: row.end_date,
          duration: `${row.duration_days} days`,
        },
        payment: {
          totalAmount: row.total_amount,
          depositAmount: row.deposit_amount,
          remainingPayment: row.remaining_payment,
          depositPaid: row.deposit_paid,
          finalPaymentPaid: row.final_payment_paid,
        },
        location: {
          pickup: row.pickup_location,
          dropoff: row.dropoff_location,
        },
        options: {
          driverRequired: row.driver_required,
          insuranceCoverage: row.insurance_coverage,
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const response = buildPaginationResponse(
        bookings,
        total,
        pageNum,
        limitNum,
      );

      res.json({
        success: true,
        ...response,
      });
    } catch (error) {
      console.error("❌ Get all bookings error:", error);
      next(error);
    }
  }

  /**
   * GET /admin/bookings/by-status
   * Get bookings filtered by multiple statuses
   */
  async getBookingsByStatus(req, res, next) {
    try {
      const { statuses, page = 1, limit = 20, sortBy = "recently" } = req.query;

      if (!statuses) {
        return res.status(400).json({
          success: false,
          error: "statuses parameter is required (comma-separated)",
        });
      }

      // Parse statuses
      const statusList = parseStatusFilter(statuses);

      if (!statusList || statusList.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid status values",
        });
      }

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      // Count total
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM bookings WHERE status = ANY($1::text[])`,
        [statusList],
      );
      const total = parseInt(countResult.rows[0].count);

      // Get bookings
      const { field, order } = parseSortParams(sortBy);

      const result = await pool.query(
        `SELECT 
          booking_id, customer_id, vehicle_id, status,
          start_date, end_date, duration_days, total_amount,
          deposit_paid, final_payment_paid, created_at
         FROM bookings
         WHERE status = ANY($1::text[])
         ORDER BY ${field} ${order}
         LIMIT $2 OFFSET $3`,
        [statusList, limitNum, offset],
      );

      const bookings = result.rows.map((row) => ({
        id: row.booking_id,
        customerId: row.customer_id,
        vehicleId: row.vehicle_id,
        status: row.status,
        startDate: row.start_date,
        endDate: row.end_date,
        duration: `${row.duration_days} days`,
        totalAmount: row.total_amount,
        paymentStatus: {
          depositPaid: row.deposit_paid,
          finalPaid: row.final_payment_paid,
        },
        createdAt: row.created_at,
      }));

      const response = buildPaginationResponse(
        bookings,
        total,
        pageNum,
        limitNum,
      );

      res.json({
        success: true,
        statuses: statusList,
        ...response,
      });
    } catch (error) {
      console.error("❌ Get bookings by status error:", error);
      next(error);
    }
  }

  /**
   * GET /admin/bookings/search
   * Dedicated search endpoint for finding bookings
   */
  async searchBookings(req, res, next) {
    try {
      const { q, type, page = 1, limit = 20 } = req.query;

      if (!q || q.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "Search query 'q' is required",
        });
      }

      const searchTerm = q.trim();
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      let query = `SELECT 
        booking_id, customer_id, vehicle_id, status,
        start_date, end_date, duration_days, total_amount,
        created_at
      FROM bookings
      WHERE `;

      let whereClause = [];
      const params = [`%${searchTerm}%`];

      // Type-specific search
      if (type === "booking_id") {
        whereClause.push(`booking_id::text ILIKE $1`);
      } else if (type === "vehicle_id") {
        whereClause.push(`vehicle_id::text ILIKE $1`);
      } else if (type === "customer_id") {
        whereClause.push(`customer_id::text ILIKE $1`);
      } else {
        // Search all fields
        whereClause.push(`(
          booking_id::text ILIKE $1 OR
          vehicle_id::text ILIKE $1 OR
          customer_id::text ILIKE $1
        )`);
      }

      query += whereClause.join(" OR ");

      // Count total
      const countQuery = `SELECT COUNT(*) FROM (${query}) AS search_results`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Get results
      query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(limitNum, offset);

      const result = await pool.query(query, params);

      const bookings = result.rows.map((row) => ({
        id: row.booking_id,
        customerId: row.customer_id,
        vehicleId: row.vehicle_id,
        status: row.status,
        startDate: row.start_date,
        endDate: row.end_date,
        duration: `${row.duration_days} days`,
        totalAmount: row.total_amount,
        createdAt: row.created_at,
      }));

      const response = buildPaginationResponse(
        bookings,
        total,
        pageNum,
        limitNum,
      );

      res.json({
        success: true,
        searchQuery: searchTerm,
        searchType: type || "all",
        ...response,
      });
    } catch (error) {
      console.error("❌ Search bookings error:", error);
      next(error);
    }
  }

  /**
   * GET /admin/bookings/stats
   * Enhanced statistics for admin dashboard
   */
  async getEnhancedStats(req, res, next) {
    try {
      const { filter = "all_time", startDate, endDate } = req.query;

      // Parse date filter
      let dateRange = null;
      try {
        dateRange = parseDateFilter(filter, startDate, endDate);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      let dateCondition = "";
      const params = [];

      if (dateRange) {
        dateCondition = `WHERE created_at BETWEEN $1 AND $2`;
        params.push(dateRange.startDate, dateRange.endDate);
      }

      // Get comprehensive stats
      const statsResult = await pool.query(
        `SELECT 
          COUNT(*) as total_bookings,
          COUNT(*) FILTER (WHERE status = 'pending_payment') as pending_payment,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'booking') as booking,
          COUNT(*) FILTER (WHERE status = 'picked_up') as picked_up,
          COUNT(*) FILTER (WHERE status = 'return_submitted') as return_submitted,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
          COUNT(*) FILTER (WHERE status = 'dispute_opened') as dispute_opened,
          SUM(total_amount) FILTER (WHERE status = 'completed') as total_revenue,
          SUM(deposit_amount) FILTER (WHERE deposit_paid = true) as total_deposits,
          AVG(duration_days) as avg_duration,
          AVG(total_amount) as avg_booking_amount
         FROM bookings
         ${dateCondition}`,
        params,
      );

      const stats = statsResult.rows[0];

      // Get top vehicles
      const topVehiclesResult = await pool.query(
        `SELECT 
          vehicle_id,
          COUNT(*) as booking_count,
          SUM(total_amount) as total_revenue
         FROM bookings
         ${dateCondition}
         ${dateCondition ? "AND" : "WHERE"} status != 'cancelled'
         GROUP BY vehicle_id
         ORDER BY booking_count DESC
         LIMIT 5`,
        params,
      );

      // Get top customers
      const topCustomersResult = await pool.query(
        `SELECT 
          customer_id,
          COUNT(*) as booking_count,
          SUM(total_amount) as total_spent
         FROM bookings
         ${dateCondition}
         ${dateCondition ? "AND" : "WHERE"} status != 'cancelled'
         GROUP BY customer_id
         ORDER BY booking_count DESC
         LIMIT 5`,
        params,
      );

      res.json({
        success: true,
        period: filter,
        ...(dateRange && {
          dateRange: {
            start: dateRange.startDate,
            end: dateRange.endDate,
          },
        }),
        overview: {
          totalBookings: parseInt(stats.total_bookings || 0),
          totalRevenue: parseInt(stats.total_revenue || 0),
          totalDeposits: parseInt(stats.total_deposits || 0),
          avgDuration: parseFloat(parseFloat(stats.avg_duration || 0).toFixed(1)),
          avgBookingAmount: parseInt(stats.avg_booking_amount || 0),
        },
        byStatus: {
          pending_payment: parseInt(stats.pending_payment || 0),
          pending: parseInt(stats.pending || 0),
          booking: parseInt(stats.booking || 0),
          picked_up: parseInt(stats.picked_up || 0),
          return_submitted: parseInt(stats.return_submitted || 0),
          completed: parseInt(stats.completed || 0),
          cancelled: parseInt(stats.cancelled || 0),
          dispute_opened: parseInt(stats.dispute_opened || 0),
        },
        topVehicles: topVehiclesResult.rows.map((row) => ({
          vehicleId: row.vehicle_id,
          bookingCount: parseInt(row.booking_count),
          totalRevenue: parseInt(row.total_revenue),
        })),
        topCustomers: topCustomersResult.rows.map((row) => ({
          customerId: row.customer_id,
          bookingCount: parseInt(row.booking_count),
          totalSpent: parseInt(row.total_spent),
        })),
      });
    } catch (error) {
      console.error("❌ Get enhanced stats error:", error);
      next(error);
    }
  }

  /**
   * GET /admin/bookings/:id
   * Get detailed booking information (admin view)
   */
  async getBookingDetails(req, res, next) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT * FROM bookings WHERE booking_id = $1`,
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      const booking = result.rows[0];

      // Optionally fetch related data
      let vehicleInfo = null;
      let customerInfo = null;

      try {
        [vehicleInfo, customerInfo] = await Promise.all([
          vehicleGrpcClient.getVehicleInfo(booking.vehicle_id),
          userGrpcClient.getUserProfile(booking.customer_id),
        ]);
      } catch (error) {
        console.warn("⚠️  Could not fetch related data:", error.message);
      }

      res.json({
        success: true,
        booking: {
          id: booking.booking_id,
          status: booking.status,
          customer: {
            id: booking.customer_id,
            ...(customerInfo && {
              name: customerInfo.full_name,
              email: customerInfo.email,
            }),
          },
          vehicle: {
            id: booking.vehicle_id,
            ...(vehicleInfo && {
              name: vehicleInfo.name,
              type: vehicleInfo.vehicle_type,
            }),
          },
          timeline: {
            startDate: booking.start_date,
            endDate: booking.end_date,
            duration: booking.duration_days,
          },
          payment: {
            totalAmount: booking.total_amount,
            depositAmount: booking.deposit_amount,
            remainingPayment: booking.remaining_payment,
            depositPaid: booking.deposit_paid,
            finalPaymentPaid: booking.final_payment_paid,
            depositTransactionId: booking.deposit_transaction_id,
            finalPaymentTransactionId: booking.final_payment_transaction_id,
          },
          locations: {
            pickup: booking.pickup_location,
            dropoff: booking.dropoff_location,
          },
          options: {
            driverRequired: booking.driver_required,
            insuranceCoverage: booking.insurance_coverage,
            insuranceFee: booking.insurance_fee,
          },
          contract: {
            platformContractUrl: booking.platform_contract_url,
            ownerContractUrl: booking.owner_contract_url,
            signedContractUrl: booking.signed_contract_url,
            signedAt: booking.contract_signed_at,
          },
          timestamps: {
            created: booking.created_at,
            updated: booking.updated_at,
            ownerApproved: booking.owner_approved_at,
            pickupConfirmed: booking.pickup_confirmed_at,
            returnConfirmed: booking.return_confirmed_at,
          },
          ...(booking.status === "cancelled" && {
            cancellation: {
              reason: booking.cancellation_reason,
              date: booking.cancellation_date,
              refundAmount: booking.refund_amount,
              refundStatus: booking.refund_status,
            },
          }),
          ...(booking.status === "dispute_opened" && {
            dispute: {
              reason: booking.dispute_reason,
              openedAt: booking.dispute_opened_at,
              csAssignedId: booking.cs_assigned_id,
            },
          }),
        },
      });
    } catch (error) {
      console.error("❌ Get booking details error:", error);
      next(error);
    }
  }
}

module.exports = new AdminBookingController();
