const pool = require("../config/database");

class RequestAction {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS request_actions (
        id SERIAL PRIMARY KEY,
        request_id INTEGER REFERENCES requests(id),
        performed_by VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(query);
    console.log("Request actions table created/verified");
  }

  static async create(actionData) {
    const { requestId, performedBy, action, notes } = actionData;

    const query = `
      INSERT INTO request_actions (request_id, performed_by, action, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [requestId, performedBy, action, notes];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByRequestId(requestId) {
    const query =
      "SELECT * FROM request_actions WHERE request_id = $1 ORDER BY created_at DESC";
    const result = await pool.query(query, [requestId]);
    return result.rows;
  }
}

module.exports = { Request, RequestAction };
