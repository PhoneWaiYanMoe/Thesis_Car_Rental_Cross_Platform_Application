const express = require("express");
const router = express.Router();
const finalPaymentController = require("../controllers/final_payment_controller");
const { authenticate } = require("../middleware/auth");
const { validateCreateIntent } = require("../middleware/validation");

router.use(authenticate);

router.post(
  "/intent",
  validateCreateIntent,
  finalPaymentController.createFinalPaymentIntent.bind(finalPaymentController),
);
router.post(
  "/:intentId/confirm",
  finalPaymentController.confirmFinalPayment.bind(finalPaymentController),
);

// ✅ NEW: Verify payment status by querying Stripe (fallback if webhook fails)
router.get(
  "/:intentId/verify",
  finalPaymentController.verifyFinalPayment.bind(finalPaymentController),
);

module.exports = router;
