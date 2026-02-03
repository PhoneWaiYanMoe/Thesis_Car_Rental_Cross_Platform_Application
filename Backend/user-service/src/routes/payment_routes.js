// Backend/user-service/src/routes/payment_routes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment_controller");
const { authenticate } = require("../middleware/auth");

// All payment routes require authentication
router.use(authenticate);

// Get all payment methods for current user
router.get("/methods", paymentController.getPaymentMethods);

// Get single payment method
router.get("/methods/:methodId", paymentController.getPaymentMethod);

// Add new payment method
router.post("/methods", paymentController.addPaymentMethod);

// Update payment method
router.put("/methods/:methodId", paymentController.updatePaymentMethod);

// Delete payment method
router.delete("/methods/:methodId", paymentController.deletePaymentMethod);

// Set default payment method
router.put(
  "/methods/:methodId/set-default",
  paymentController.setDefaultPaymentMethod,
);

module.exports = router;
