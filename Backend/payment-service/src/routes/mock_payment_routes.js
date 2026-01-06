// Backend/payment-service/src/routes/mock_payment_routes.js
// ✅ Mock payment page for testing payment flow

const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const bookingGrpcClient = require("../grpc/booking_grpc_client");

/**
 * Mock payment page (simulates VNPay/PayPal/Stripe payment page)
 */
router.get("/mock-payment", (req, res) => {
  const { orderId, amount, provider, returnUrl } = req.query;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mock Payment - ${provider.toUpperCase()}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          width: 100%;
          padding: 40px;
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo h1 {
          color: #667eea;
          font-size: 32px;
          margin-bottom: 10px;
        }
        .badge {
          display: inline-block;
          background: #ffd700;
          color: #000;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        .info {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 15px;
        }
        .info-row:last-child {
          margin-bottom: 0;
          padding-top: 12px;
          border-top: 2px dashed #dee2e6;
          font-weight: bold;
          font-size: 18px;
        }
        .label {
          color: #6c757d;
        }
        .value {
          color: #212529;
          font-weight: 600;
        }
        .amount {
          color: #667eea;
        }
        .buttons {
          display: flex;
          gap: 15px;
        }
        button {
          flex: 1;
          padding: 16px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-success {
          background: #10b981;
          color: white;
        }
        .btn-success:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
        }
        .btn-cancel {
          background: #ef4444;
          color: white;
        }
        .btn-cancel:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
          font-size: 14px;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>🎭 Mock Payment</h1>
          <span class="badge">TESTING MODE</span>
        </div>

        <div class="info">
          <div class="info-row">
            <span class="label">Provider:</span>
            <span class="value">${provider.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="label">Order ID:</span>
            <span class="value">${orderId}</span>
          </div>
          <div class="info-row">
            <span class="label">Amount:</span>
            <span class="value amount">${parseInt(amount).toLocaleString(
              "vi-VN"
            )} VND</span>
          </div>
        </div>

        <div class="buttons">
          <button class="btn-success" onclick="completePayment()">
            ✅ Complete Payment
          </button>
          <button class="btn-cancel" onclick="cancelPayment()">
            ❌ Cancel
          </button>
        </div>

        <div class="warning">
          ⚠️ This is a mock payment page for testing. No real transaction will occur.
        </div>
      </div>

      <script>
        function completePayment() {
          // Simulate successful payment
          const returnUrl = '${returnUrl}';
          const orderId = '${orderId}';
          
          // Build VNPay-like return URL
          const successUrl = returnUrl + 
            '?vnp_TxnRef=' + orderId +
            '&vnp_Amount=' + (${amount} * 100) +
            '&vnp_ResponseCode=00' +
            '&vnp_TransactionNo=MOCK' + Date.now() +
            '&vnp_SecureHash=mock_signature';
          
          window.location.href = successUrl;
        }

        function cancelPayment() {
          // Simulate cancelled payment
          const returnUrl = '${returnUrl}';
          const orderId = '${orderId}';
          
          const cancelUrl = returnUrl + 
            '?vnp_TxnRef=' + orderId +
            '&vnp_ResponseCode=24' +
            '&vnp_SecureHash=mock_signature';
          
          window.location.href = cancelUrl;
        }
      </script>
    </body>
    </html>
  `);
});

/**
 * Mock webhook handler (simulates immediate payment success)
 */
router.post("/mock-webhook/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find transaction
    const result = await pool.query(
      `SELECT transaction_id, booking_id, type 
       FROM transactions 
       WHERE intent_id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const transaction = result.rows[0];

    // Update transaction status
    await pool.query(
      `UPDATE transactions
       SET status = 'succeeded',
           provider_transaction_id = $1,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE transaction_id = $2`,
      [`mock_txn_${Date.now()}`, transaction.transaction_id]
    );

    console.log(`✅ [MOCK] Payment success: ${orderId}`);

    // Trigger booking status update
    if (transaction.type === "deposit") {
      await bookingGrpcClient.updateBookingAfterDepositPayment(
        transaction.booking_id,
        transaction.transaction_id
      );
    } else if (transaction.type === "final_payment") {
      await bookingGrpcClient.updateBookingAfterFinalPayment(
        transaction.booking_id,
        transaction.transaction_id
      );
    }

    res.json({ success: true, message: "Mock payment completed" });
  } catch (error) {
    console.error("❌ Mock webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
