const pool = require("../config/database");

class Request {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255),
        category VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        handled_by VARCHAR(255),
        handled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT status_check CHECK (status IN ('pending', 'inprocess', 'onhold', 'approved', 'denied')),
        CONSTRAINT priority_check CHECK (priority IN ('low', 'medium', 'high')),
        CONSTRAINT category_check CHECK (category IN ('booking_issue', 'verification', 'account_issue', 'vehicle_listing', 'payment_issue', 'booking_change', 'report'))
      );

      CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
      CREATE INDEX IF NOT EXISTS idx_requests_category ON requests(category);
      CREATE INDEX IF NOT EXISTS idx_requests_handled_by ON requests(handled_by);
    `;

    await pool.query(query);
    console.log("Requests table created/verified");
  }

  static async create(requestData) {
    const { userId, category, title, description, priority } = requestData;

    const query = `
    INSERT INTO requests (user_id, user_email, category, title, description, priority)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

    const values = [userId, requestData.userEmail, category, title, description, priority || "medium"];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = "SELECT * FROM requests WHERE 1=1";
    const values = [];
    let paramCount = 1;

    if (filters.status && filters.status !== "all") {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.category && filters.category !== "all") {
      query += ` AND category = $${paramCount}`;
      values.push(filters.category);
      paramCount++;
    }

    if (filters.handledBy) {
      if (filters.handledBy === "me") {
        query += ` AND handled_by = $${paramCount}`;
        values.push(filters.currentUserId);
        paramCount++;
      } else if (filters.handledBy !== "all") {
        query += ` AND handled_by = $${paramCount}`;
        values.push(filters.handledBy);
        paramCount++;
      }
    }

    if (filters.search) {
      query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    // sorting
    const sortBy = filters.sortBy || "newest";
    if (sortBy === "newest") {
      query += " ORDER BY created_at DESC";
    } else if (sortBy === "oldest") {
      query += " ORDER BY created_at ASC";
    } else if (sortBy === "priority") {
      query +=
        " ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END";
    }

    // pagination
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // get total count
    let countQuery = "SELECT COUNT(*) FROM requests WHERE 1=1";
    // remove limit and offset
    const countValues = values.slice(0, -2);

    if (filters.status && filters.status !== "all") {
      countQuery += " AND status = $1";
    }
    if (filters.category && filters.category !== "all") {
      const idx = filters.status && filters.status !== "all" ? 2 : 1;
      countQuery += ` AND category = $${idx}`;
    }

    const countResult = await pool.query(countQuery, countValues);

    return {
      requests: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  }

  static async findById(id) {
    const query = "SELECT * FROM requests WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId, filters = {}) {
    let query = "SELECT * FROM requests WHERE user_id = $1";
    const values = [userId];
    let paramCount = 2;

    if (filters.status && filters.status !== "all") {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    query += " ORDER BY created_at DESC";

    const limit = filters.limit || 10;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    const countQuery =
      "SELECT COUNT(*) FROM requests WHERE user_id = $1" +
      (filters.status && filters.status !== "all" ? " AND status = $2" : "");
    const countValues =
      filters.status && filters.status !== "all"
        ? [userId, filters.status]
        : [userId];
    const countResult = await pool.query(countQuery, countValues);

    return {
      requests: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  }

  static async updateStatus(id, status, handledBy, notes) {
    const query = `
      UPDATE requests 
      SET status = $1, 
          handled_by = $2, 
          handled_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [status, handledBy, id]);
    return result.rows[0];
  }

  static async approve(id, handledBy, notes) {
    return await this.updateStatus(id, "approved", handledBy, notes);
  }

  static async deny(id, handledBy, reason) {
    return await this.updateStatus(id, "denied", handledBy, reason);
  }
}

module.exports = Request;
