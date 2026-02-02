// Backend/user-service/src/controllers/user_controller.js
const pool = require("../config/database");
const eventPublisher = require("../services/event_publisher");

class UserController {
  /**
   * GET /users
   * Get all users with filtering, searching, sorting, and pagination
   * Excludes admin and support roles by default
   */
  async getAllUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        role = "",
        status = "",
        sortBy = "created_at",
        sortOrder = "DESC",
        includeAdmin = "false",
        includeSupport = "false",
      } = req.query;

      // Build WHERE clause
      const conditions = [];
      const params = [];
      let paramCount = 1;

      // Exclude admin and support unless explicitly requested
      if (includeAdmin === "false" && includeSupport === "false") {
        conditions.push(`role NOT IN ('admin', 'support')`);
      } else if (includeAdmin === "false") {
        conditions.push(`role != 'admin'`);
      } else if (includeSupport === "false") {
        conditions.push(`role != 'support'`);
      }

      // Search by name, email, or ID
      if (search && search.trim() !== "") {
        conditions.push(
          `(full_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR user_id::text = $${paramCount})`,
        );
        params.push(`%${search}%`);
        paramCount++;
      }

      // Filter by role
      if (role && role.trim() !== "") {
        conditions.push(`role = $${paramCount}`);
        params.push(role);
        paramCount++;
      }

      // Filter by status
      if (status && status.trim() !== "") {
        conditions.push(`status = $${paramCount}`);
        params.push(status);
        paramCount++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Validate sort column
      const allowedSortColumns = [
        "full_name",
        "created_at",
        "email",
        "role",
        "status",
      ];
      const sortColumn = allowedSortColumns.includes(sortBy)
        ? sortBy
        : "created_at";
      const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users ${whereClause}`,
        params,
      );
      const total = parseInt(countResult.rows[0].count);

      // Get users with statistics
      params.push(parseInt(limit));
      params.push((parseInt(page) - 1) * parseInt(limit));

      const result = await pool.query(
        `SELECT 
          u.user_id,
          u.email,
          u.full_name,
          u.phone,
          u.role,
          u.status,
          u.license_status,
          u.owner_status,
          u.is_verified,
          u.avatar_url,
          u.created_at,
          u.updated_at,
          s.total_bookings_as_customer,
          s.completed_bookings_as_customer,
          s.total_rentals_as_owner,
          s.average_rating_as_customer,
          s.average_rating_as_owner,
          s.total_spent,
          s.total_earned
         FROM users u
         LEFT JOIN user_statistics s ON u.user_id = s.user_id
         ${whereClause}
         ORDER BY u.${sortColumn} ${order}
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        params,
      );

      res.json({
        users: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get all users error:", error);
      next(error);
    }
  }

  /**
   * GET /users/support
   * Get all support users
   */
  async getSupportUsers(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const countResult = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'support'",
      );
      const total = parseInt(countResult.rows[0].count);

      const result = await pool.query(
        `SELECT 
          user_id,
          email,
          full_name,
          phone,
          status,
          is_verified,
          avatar_url,
          created_at,
          updated_at
         FROM users
         WHERE role = 'support'
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)],
      );

      res.json({
        users: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get support users error:", error);
      next(error);
    }
  }

  /**
   * GET /users/owners
   * Get all owner users
   */
  async getOwnerUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, status = "" } = req.query;

      let whereClause = "WHERE role = 'owner'";
      const params = [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)];

      if (status && status.trim() !== "") {
        whereClause += " AND status = $3";
        params.push(status);
      }

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users ${whereClause.replace(/\$\d+/g, (match) =>
          match === "$3" ? `'${status}'` : "",
        )}`,
      );
      const total = parseInt(countResult.rows[0].count);

      const result = await pool.query(
        `SELECT 
          u.user_id,
          u.email,
          u.full_name,
          u.phone,
          u.status,
          u.owner_status,
          u.license_status,
          u.is_verified,
          u.avatar_url,
          u.created_at,
          u.updated_at,
          s.total_rentals_as_owner,
          s.completed_rentals_as_owner,
          s.average_rating_as_owner,
          s.total_earned
         FROM users u
         LEFT JOIN user_statistics s ON u.user_id = s.user_id
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`,
        params,
      );

      res.json({
        users: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get owner users error:", error);
      next(error);
    }
  }

  /**
   * GET /users/customers
   * Get all customer users
   */
  async getCustomerUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, status = "" } = req.query;

      let whereClause = "WHERE role = 'customer'";
      const params = [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)];

      if (status && status.trim() !== "") {
        whereClause += " AND status = $3";
        params.push(status);
      }

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users ${whereClause.replace(/\$\d+/g, (match) =>
          match === "$3" ? `'${status}'` : "",
        )}`,
      );
      const total = parseInt(countResult.rows[0].count);

      const result = await pool.query(
        `SELECT 
          u.user_id,
          u.email,
          u.full_name,
          u.phone,
          u.status,
          u.license_status,
          u.is_verified,
          u.avatar_url,
          u.created_at,
          u.updated_at,
          s.total_bookings_as_customer,
          s.completed_bookings_as_customer,
          s.average_rating_as_customer,
          s.total_spent
         FROM users u
         LEFT JOIN user_statistics s ON u.user_id = s.user_id
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`,
        params,
      );

      res.json({
        users: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get customer users error:", error);
      next(error);
    }
  }

  /**
   * GET /users/:userId
   * Get user by ID with full details including statistics
   */
  async getUserById(req, res, next) {
    try {
      const { userId } = req.params;

      const result = await pool.query(
        `SELECT 
          u.*,
          s.total_bookings_as_customer,
          s.active_bookings_as_customer,
          s.completed_bookings_as_customer,
          s.cancelled_bookings_as_customer,
          s.total_rentals_as_owner,
          s.active_rentals_as_owner,
          s.completed_rentals_as_owner,
          s.cancelled_rentals_as_owner,
          s.total_spent,
          s.total_earned,
          s.average_rating_as_customer,
          s.total_reviews_as_customer,
          s.average_rating_as_owner,
          s.total_reviews_as_owner,
          s.last_booking_date,
          s.last_rental_date
         FROM users u
         LEFT JOIN user_statistics s ON u.user_id = s.user_id
         WHERE u.user_id = $1`,
        [userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't return password hash
      const user = result.rows[0];
      delete user.password_hash;

      res.json({ user });
    } catch (error) {
      console.error("Get user by ID error:", error);
      next(error);
    }
  }

  /**
   * PUT /users/:userId/role
   * Change user role (customer to owner)
   */
  async changeUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { newRole } = req.body;

      // Validate role
      if (!["customer", "owner"].includes(newRole)) {
        return res.status(400).json({
          error: "Invalid role. Only customer and owner roles can be assigned.",
        });
      }

      // Get current user
      const userResult = await pool.query(
        "SELECT role, email FROM users WHERE user_id = $1",
        [userId],
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentRole = userResult.rows[0].role;

      // Don't allow changing admin/support roles
      if (["admin", "support"].includes(currentRole)) {
        return res.status(400).json({
          error: "Cannot change role for admin or support users",
        });
      }

      // Update role
      const updateQuery =
        newRole === "owner"
          ? `UPDATE users 
             SET role = $1, owner_status = 'unverified', updated_at = NOW() 
             WHERE user_id = $2 
             RETURNING user_id, email, role, owner_status`
          : `UPDATE users 
             SET role = $1, owner_status = NULL, updated_at = NOW() 
             WHERE user_id = $2 
             RETURNING user_id, email, role, owner_status`;

      const result = await pool.query(updateQuery, [newRole, userId]);

      console.log(
        `✅ User ${userId} role changed from ${currentRole} to ${newRole}`,
      );

      res.json({
        message: "Role updated successfully",
        user: result.rows[0],
      });
    } catch (error) {
      console.error("Change user role error:", error);
      next(error);
    }
  }

  /**
   * PUT /users/:userId/status
   * Update user status (suspend, ban, activate)
   */
  async updateUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { status, reason } = req.body;

      // Validate status
      const validStatuses = ["normal", "active", "suspended", "banned"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const result = await pool.query(
        `UPDATE users 
         SET status = $1, updated_at = NOW() 
         WHERE user_id = $2 
         RETURNING user_id, email, status, role`,
        [status, userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Publish status change event
      await eventPublisher.publishUserStatusChanged(
        result.rows[0].email,
        userId,
        status,
        reason,
      );

      console.log(`✅ User ${userId} status changed to: ${status}`);

      res.json({
        message: "User status updated",
        user: result.rows[0],
      });
    } catch (error) {
      console.error("Update user status error:", error);
      next(error);
    }
  }

  /**
   * GET /users/:userId/license-status
   * Get user license verification status
   */
  async getLicenseStatus(req, res, next) {
    try {
      const { userId } = req.params;

      const result = await pool.query(
        `SELECT 
          user_id,
          email,
          license_status,
          license_url
         FROM users
         WHERE user_id = $1`,
        [userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        userId: result.rows[0].user_id,
        email: result.rows[0].email,
        licenseStatus: result.rows[0].license_status,
        hasLicense: !!result.rows[0].license_url,
      });
    } catch (error) {
      console.error("Get license status error:", error);
      next(error);
    }
  }

  /**
   * POST /users/:userId/upload-license
   * Upload driver's license (stores URL)
   */
  async uploadLicense(req, res, next) {
    try {
      const { userId } = req.params;
      const { licenseUrl } = req.body;

      if (!licenseUrl) {
        return res.status(400).json({ error: "License URL is required" });
      }

      const result = await pool.query(
        `UPDATE users 
         SET license_url = $1, license_status = 'pending', updated_at = NOW() 
         WHERE user_id = $2 
         RETURNING user_id, email, license_status`,
        [licenseUrl, userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Publish license uploaded event
      await eventPublisher.publishLicenseUploaded(result.rows[0].email, userId);

      console.log(`✅ License uploaded for user: ${userId}`);

      res.json({
        message: "License uploaded successfully",
        licenseStatus: result.rows[0].license_status,
      });
    } catch (error) {
      console.error("Upload license error:", error);
      next(error);
    }
  }
}

module.exports = new UserController();
