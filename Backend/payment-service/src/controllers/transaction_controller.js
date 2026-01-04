const pool = require('../config/database');

class TransactionController {
  async getTransactions(req, res, next) {
    try {
      const userId = req.user.userId;
      const { type = 'all', status = 'all', page = 1, limit = 20 } = req.query;

      let query = `
        SELECT * FROM transactions
        WHERE user_id = $1
      `;

      const params = [userId];
      let paramIndex = 2;

      if (type !== 'all') {
        query += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (status !== 'all') {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const result = await pool.query(query, params);

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM transactions WHERE user_id = $1',
        [userId]
      );

      res.json({
        transactions: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      next(error);
    }
  }

  async getTransactionById(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const result = await pool.query(
        'SELECT * FROM transactions WHERE transaction_id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get transaction error:', error);
      next(error);
    }
  }

  async getBookingTransactions(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookingId } = req.params;

      const result = await pool.query(
        `SELECT * FROM transactions
         WHERE booking_id = $1 AND user_id = $2
         ORDER BY created_at DESC`,
        [bookingId, userId]
      );

      // Calculate summary
      const summary = {
        totalPaid: 0,
        totalRefunded: 0,
        depositStatus: 'unpaid',
        finalPaymentStatus: 'unpaid',
      };

      result.rows.forEach(tx => {
        if (tx.status === 'succeeded') {
          if (tx.type === 'deposit') {
            summary.depositStatus = 'paid';
            summary.totalPaid += tx.amount;
          } else if (tx.type === 'final_payment') {
            summary.finalPaymentStatus = 'paid';
            summary.totalPaid += tx.amount;
          }
        } else if (tx.type === 'refund' && tx.status === 'succeeded') {
          summary.totalRefunded += tx.amount;
        }
      });

      res.json({
        bookingId,
        transactions: result.rows,
        summary,
      });
    } catch (error) {
      console.error('Get booking transactions error:', error);
      next(error);
    }
  }
}

module.exports = new TransactionController();
