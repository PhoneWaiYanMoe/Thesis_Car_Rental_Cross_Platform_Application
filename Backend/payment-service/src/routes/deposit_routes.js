const express = require("express");
const router = express.Router();
const depositController = require("../controllers/deposit_controller");
const { authenticate } = require("../middleware/auth");
const { validateCreateIntent } = require("../middleware/validation");

router.use(authenticate);

router.post(
  "/intent",
  validateCreateIntent,
  depositController.createDepositIntent.bind(depositController),
);
router.post(
  "/:intentId/confirm",
  depositController.confirmDeposit.bind(depositController),
);

// ✅ NEW: Verify payment status by querying Stripe (fallback if webhook fails)
router.get(
  "/:intentId/verify",
  depositController.verifyDepositPayment.bind(depositController),
);

module.exports = router;
