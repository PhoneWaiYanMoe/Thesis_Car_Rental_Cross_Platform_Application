const pool = require("../config/database");

class Request {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255),
        customer_id VARCHAR(255),
        owner_id VARCHAR(255),
        vehicle_id VARCHAR(255),
        booking_id VARCHAR(255),
        category VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        handled_by VARCHAR(255),
        handled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT status_check CHECK (status IN ('pending', 'processing', 'approved', 'denied', 'paused')),
        CONSTRAINT priority_check CHECK (priority IN ('low', 'medium', 'high')),
        CONSTRAINT category_check CHECK (category IN (
          'booking_issue',
          'verification',
          'account_issue',
          'vehicle_listing',
          'payment_issue',
          'booking_change',
          'report',
          'vehicle_update',
          'yearly_vehicle_confirmation',
          'booking_confirmation',
          'refund_request',
          'payment_dispute',
          'user_license_verification',
          'owner_verification',
          'vehicle_deactivation',
          'vehicle_reactivation',
          'user_account_deletion',
          'contract_issue',
          'insurance_claim',
          'damage_report',
          'other'
        ))
      );

      CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_requests_customer_id ON requests(customer_id);
      CREATE INDEX IF NOT EXISTS idx_requests_owner_id ON requests(owner_id);
      CREATE INDEX IF NOT EXISTS idx_requests_vehicle_id ON requests(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_requests_booking_id ON requests(booking_id);
      CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
      CREATE INDEX IF NOT EXISTS idx_requests_category ON requests(category);
      CREATE INDEX IF NOT EXISTS idx_requests_handled_by ON requests(handled_by);
      CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
    `;

    await pool.query(query);
    console.log("✓ Requests table created/verified");
  }

  static async create(requestData) {
    const {
      userId,
      userEmail,
      customerId,
      ownerId,
      vehicleId,
      bookingId,
      category,
      title,
      description,
      priority,
    } = requestData;

    const query = `
      INSERT INTO requests (
        user_id, 
        user_email, 
        customer_id,
        owner_id,
        vehicle_id,
        booking_id,
        category, 
        title, 
        description, 
        priority
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      userId,
      userEmail,
      customerId || null,
      ownerId || null,
      vehicleId || null,
      bookingId || null,
      category,
      title,
      description,
      priority || "medium",
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
      } else if (filters.handledBy === "unassigned") {
        query += ` AND handled_by IS NULL`;
      } else if (filters.handledBy !== "all") {
        query += ` AND handled_by = $${paramCount}`;
        values.push(filters.handledBy);
        paramCount++;
      }
    }

    if (filters.search) {
      query += ` AND (
        CAST(id AS TEXT) ILIKE $${paramCount} 
        OR title ILIKE $${paramCount} 
        OR user_id ILIKE $${paramCount}
        OR customer_id ILIKE $${paramCount}
        OR owner_id ILIKE $${paramCount}
        OR vehicle_id ILIKE $${paramCount}
        OR booking_id ILIKE $${paramCount}
      )`;
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
        " ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, created_at DESC";
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
    const countValues = [...values.slice(0, -2)]; // remove limit and offset

    let countParamCount = 1;
    if (filters.status && filters.status !== "all") {
      countQuery += ` AND status = $${countParamCount}`;
      countParamCount++;
    }
    if (filters.category && filters.category !== "all") {
      countQuery += ` AND category = $${countParamCount}`;
      countParamCount++;
    }
    if (filters.handledBy) {
      if (filters.handledBy === "me") {
        countQuery += ` AND handled_by = $${countParamCount}`;
        countParamCount++;
      } else if (filters.handledBy === "unassigned") {
        countQuery += ` AND handled_by IS NULL`;
      } else if (filters.handledBy !== "all") {
        countQuery += ` AND handled_by = $${countParamCount}`;
        countParamCount++;
      }
    }
    if (filters.search) {
      countQuery += ` AND (
        CAST(id AS TEXT) ILIKE $${countParamCount} 
        OR title ILIKE $${countParamCount} 
        OR user_id ILIKE $${countParamCount}
        OR customer_id ILIKE $${countParamCount}
        OR owner_id ILIKE $${countParamCount}
        OR vehicle_id ILIKE $${countParamCount}
        OR booking_id ILIKE $${countParamCount}
      )`;
      countParamCount++;
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

    if (filters.category && filters.category !== "all") {
      query += ` AND category = $${paramCount}`;
      values.push(filters.category);
      paramCount++;
    }

    query += " ORDER BY created_at DESC";

    const limit = filters.limit || 10;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    let countQuery = "SELECT COUNT(*) FROM requests WHERE user_id = $1";
    const countValues = [userId];
    let countParamCount = 2;

    if (filters.status && filters.status !== "all") {
      countQuery += ` AND status = $${countParamCount}`;
      countValues.push(filters.status);
      countParamCount++;
    }

    if (filters.category && filters.category !== "all") {
      countQuery += ` AND category = $${countParamCount}`;
      countValues.push(filters.category);
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

  static async updateStatus(id, status, handledBy, notes) {
    const query = `
      UPDATE requests 
      SET status = $1::varchar, 
          handled_by = $2, 
          handled_at = CASE 
            WHEN $1 = ANY (ARRAY['approved', 'denied']::varchar[]) 
              THEN CURRENT_TIMESTAMP 
            ELSE handled_at 
          END,
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

  static async pause(id, handledBy, reason) {
    return await this.updateStatus(id, "paused", handledBy, reason);
  }

  static async resume(id, handledBy, notes) {
    return await this.updateStatus(id, "processing", handledBy, notes);
  }
}

module.exports = Request;
