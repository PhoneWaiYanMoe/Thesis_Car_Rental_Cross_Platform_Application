// Backend/user-service/src/controllers/user_controller.js
const pool = require("../config/database");
const eventPublisher = require("../services/event_publisher");
const {
  fetchStaffPerformance,
  createRequest,
} = require("../clients/request_service_client");

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
        searchBy = "",
        role = "",
        status = "",
        sortBy = "created_at",
        sortOrder = "DESC",
        includeAdmin = "false",
        includeSupport = "false",
      } = req.query;

      const conditions = [];
      const params = [];
      let paramCount = 1;

      // Exclude admin and support unless explicitly requested
      if (includeAdmin === "false" && includeSupport === "false") {
        conditions.push(`u.role NOT IN ('admin', 'support')`);
      } else if (includeAdmin === "false") {
        conditions.push(`u.role != 'admin'`);
      } else if (includeSupport === "false") {
        conditions.push(`u.role != 'support'`);
      }

      // Search logic
      if (search && search.trim() !== "") {
        switch (searchBy) {
          case "fullName":
            conditions.push(`u.full_name ILIKE $${paramCount}`);
            params.push(`%${search}%`);
            paramCount++;
            break;

          case "email":
            conditions.push(`u.email ILIKE $${paramCount}`);
            params.push(`%${search}%`);
            paramCount++;
            break;

          case "id":
            conditions.push(`u.user_id::text = $${paramCount}`);
            params.push(search);
            paramCount++;
            break;

          default:
            conditions.push(
              `(u.full_name ILIKE $${paramCount}
              OR u.email ILIKE $${paramCount}
              OR u.user_id::text = $${paramCount})`,
            );
            params.push(`%${search}%`);
            paramCount++;
        }
      }

      // Filter by role
      if (role && role.trim() !== "") {
        conditions.push(`u.role = $${paramCount}`);
        params.push(role);
        paramCount++;
      }

      // Filter by status
      if (status && status.trim() !== "") {
        conditions.push(`u.status = $${paramCount}`);
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

      // Total count
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users u ${whereClause}`,
        params,
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Pagination
      params.push(parseInt(limit, 10));
      params.push((parseInt(page, 10) - 1) * parseInt(limit, 10));

      // Main query
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
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10)),
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
      const {
        page = 1,
        limit = 20,
        search = "",
        searchBy = "",
        status = "",
        sortBy = "created_at",
        sortOrder = "DESC",
      } = req.query;

      // 1. Extract auth token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // 2. Build WHERE clause (ONLY admin + support)
      const conditions = [`users.role IN ('support', 'admin')`];
      const params = [];
      let paramCount = 1;

      // Search logic
      if (search && search.trim() !== "") {
        switch (searchBy) {
          case "fullName":
            conditions.push(`users.full_name ILIKE $${paramCount}`);
            params.push(`%${search}%`);
            paramCount++;
            break;

          case "email":
            conditions.push(`users.email ILIKE $${paramCount}`);
            params.push(`%${search}%`);
            paramCount++;
            break;

          case "id":
            conditions.push(`users.user_id::text = $${paramCount}`);
            params.push(search);
            paramCount++;
            break;

          default:
            conditions.push(
              `(users.full_name ILIKE $${paramCount}
              OR users.email ILIKE $${paramCount}
              OR users.user_id::text = $${paramCount})`,
            );
            params.push(`%${search}%`);
            paramCount++;
        }
      }

      // Filter by status (admin may have NULL)
      if (status && status.trim() !== "") {
        conditions.push(`users.status = $${paramCount}`);
        params.push(status);
        paramCount++;
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      // 3. Validate sort column
      const allowedSortColumns = ["full_name", "email", "status", "created_at"];
      const sortColumn = allowedSortColumns.includes(sortBy)
        ? sortBy
        : "created_at";

      const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

      // 4. Count total
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users ${whereClause}`,
        params,
      );
      const total = Number(countResult.rows[0].count);

      // 5. Pagination params
      params.push(Number(limit));
      params.push((Number(page) - 1) * Number(limit));

      // 6. Fetch users
      const usersResult = await pool.query(
        `
      SELECT 
        users.user_id,
        users.email,
        users.full_name,
        users.phone,
        users.role,
        users.status,
        users.is_verified,
        users.avatar_url,
        users.created_at,
        users.updated_at
      FROM users
      ${whereClause}
      ORDER BY users.${sortColumn} ${order}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `,
        params,
      );

      // 7. Call Request Service
      const analyticsResponse = await fetchStaffPerformance(authHeader);
      const analyticsList = analyticsResponse?.staff || [];

      // Index analytics by staffId
      const analyticsMap = {};
      analyticsList.forEach((a) => {
        analyticsMap[String(a.staffId)] = a;
      });

      // 8. Merge users + analytics
      const users = usersResult.rows.map((user) => {
        const perf = analyticsMap[String(user.user_id)];

        return {
          id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          status: user.status ?? null,
          isVerified: user.is_verified,
          avatarUrl: user.avatar_url,
          joinedDate: user.created_at,

          // Analytics
          totalHandled: perf?.totalHandled ?? 0,
          totalApproved: perf?.approved ?? 0,
          totalDenied: perf?.denied ?? 0,
          avgResponseTime: perf?.avgResponseTime ?? null,
          approvalRate: perf?.approvalRate ?? 0,
          byCategory: perf?.byCategory ?? {},
        };
      });

      // 9. Response
      res.json({
        success: true,
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
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

  // get /users/:userId/logged-in-as get logged in as by userId
  async getLoggedInAsById(req, res, next) {
    try {
      const { userId } = req.params;

      const result = await pool.query(
        `SELECT *
         FROM users
         WHERE user_id = $1`,
        [userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't return password hash
      const user = result.rows[0];
      delete user.password_hash;

      res.json({ logged_in_as: user.logged_in_as });
    } catch (error) {
      console.error("Get user's logged in as status by ID error:", error);
      next(error);
    }
  }

  // put /users/:userId/logged-in-as update logged in as by userId
  async updateLoggedInAsById(req, res, next) {
    try {
      const { userId } = req.params;
      const { logged_in_as } = req.body;

      if (!["customer", "owner"].includes(logged_in_as)) {
        return res.status(400).json({
          error: "Invalid logged_in_as value. Must be 'customer' or 'owner'.",
        });
      }

      const result = await pool.query(
        `UPDATE users
         SET logged_in_as = $1, updated_at = NOW()
         WHERE user_id = $2
         RETURNING logged_in_as`,
        [logged_in_as, userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        message: "Logged in as updated successfully",
        logged_in_as: result.rows[0].logged_in_as,
      });
    } catch (error) {
      console.error("Update user's logged in as status by ID error:", error);
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
        "SELECT role, email, full_name FROM users WHERE user_id = $1",
        [userId],
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentRole = userResult.rows[0].role;
      const userEmail = userResult.rows[0].email;
      const fullName = userResult.rows[0].full_name;

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

      // ✅ If upgrading to owner, auto-create verification request
      if (newRole === "owner" && currentRole !== "owner") {
        try {
          const authToken = req.headers.authorization || `Bearer system-token`;

          await createRequest(authToken, {
            category: "owner_verification",
            title: `Owner Verification Request - ${fullName}`,
            description: `User ${fullName} (${userEmail}) has upgraded their account to Owner and requires verification.`,
            priority: "high",
          });

          console.log(
            `✅ Owner verification request created for user ${userId}`,
          );
        } catch (error) {
          console.error(
            `⚠️ Failed to create owner verification request: ${error.message}`,
          );
          // Don't fail the role change if request creation fails
        }
      }

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
