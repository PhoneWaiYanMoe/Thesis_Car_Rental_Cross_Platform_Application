const pool = require("../config/database");

class RequestAttachment {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS request_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
        media_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_request_attachments_request_id 
      ON request_attachments(request_id);
    `;

    await pool.query(query);
    console.log("Request attachments table created/verified");
  }

  static async createMany(requestId, mediaIds) {
    if (!mediaIds || mediaIds.length === 0) return [];

    const values = mediaIds
      .map((mediaId, index) => `($1, $${index + 2})`)
      .join(", ");

    const query = `
      INSERT INTO request_attachments (request_id, media_id)
      VALUES ${values}
      RETURNING *
    `;

    const params = [requestId, ...mediaIds];
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByRequestId(requestId) {
    const query = `
      SELECT media_id 
      FROM request_attachments 
      WHERE request_id = $1
      ORDER BY created_at
    `;
    const result = await pool.query(query, [requestId]);
    return result.rows.map((row) => row.media_id);
  }

  static async deleteByRequestId(requestId) {
    const query = "DELETE FROM request_attachments WHERE request_id = $1";
    await pool.query(query, [requestId]);
  }
}

module.exports = RequestAttachment;
