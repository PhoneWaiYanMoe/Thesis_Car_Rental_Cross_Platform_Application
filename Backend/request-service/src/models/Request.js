const pool = require("../config/database");

class Request {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        attachment_urls TEXT[],
        handled_by VARCHAR(255),
        handled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT status_check CHECK (status IN ('pending', 'inprocess', 'onhold', 'approved', 'denied')),
        CONSTRAINT priority_check CHECK (priority IN ('low', 'medium', 'high')),
        CONSTRAINT category_check CHECK (category IN ('booking_issue', 'verification', 'account_issue', 'vehicle_listing', 'payment_issue', 'booking_change', 'report'))
      );
    `;

    await pool.query(query);
    console.log("Requests table created/verified");
  }

  static async create(requestData) {
    const { userId, category, title, description, priority, attachmentUrls } =
      requestData;

    const query = `
      INSERT INTO requests (user_id, category, title, description, priority, attachment_urls)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      userId,
      category,
      title,
      description,
      priority || "medium",
      attachmentUrls || [],
    ];
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

    // Sorting
    const sortBy = filters.sortBy || "newest";
    if (sortBy === "newest") {
      query += " ORDER BY created_at DESC";
    } else if (sortBy === "oldest") {
      query += " ORDER BY created_at ASC";
    } else if (sortBy === "priority") {
      query +=
        " ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END";
    }

    // Pagination
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count
    const countQuery =
      "SELECT COUNT(*) FROM requests WHERE 1=1" +
      query.substring(
        query.indexOf("WHERE") + 5,
        query.indexOf("ORDER BY") > -1
          ? query.indexOf("ORDER BY")
          : query.indexOf("LIMIT")
      );
    const countResult = await pool.query(countQuery, values.slice(0, -2));

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

    const countQuery = "SELECT COUNT(*) FROM requests WHERE user_id = $1";
    const countResult = await pool.query(countQuery, [userId]);

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

    // Log action
    if (result.rows[0]) {
      await RequestAction.create({
        requestId: id,
        performedBy: handledBy,
        action: `status_changed_to_${status}`,
        notes: notes || `Status changed to ${status}`,
      });
    }

    return result.rows[0];
  }

  static async approve(id, handledBy, notes) {
    return await this.updateStatus(id, "approved", handledBy, notes);
  }

  static async deny(id, handledBy, reason) {
    return await this.updateStatus(id, "denied", handledBy, reason);
  }
}

module.exports = { Request };
