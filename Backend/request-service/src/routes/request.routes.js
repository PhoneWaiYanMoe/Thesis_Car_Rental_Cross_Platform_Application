const express = require("express");
const router = express.Router();
const requestController = require("../controllers/request.controller");
const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/roleC-heck.middleware");

// Public routes (with authentication)
router.post("/", authenticate, requestController.createRequest);
router.get("/my-requests", authenticate, requestController.getMyRequests);

// Support/Admin routes
router.get(
  "/",
  authenticate,
  requireRole("support", "admin"),
  requestController.getRequests
);

router.get(
  "/:id",
  authenticate,
  requireRole("support", "admin"),
  requestController.getRequestById
);

router.patch(
  "/:id/status",
  authenticate,
  requireRole("support", "admin"),
  requestController.updateStatus
);

router.post(
  "/:id/approve",
  authenticate,
  requireRole("support", "admin"),
  requestController.approveRequest
);

router.post(
  "/:id/deny",
  authenticate,
  requireRole("support", "admin"),
  requestController.denyRequest
);

router.post(
  "/:id/add-note",
  authenticate,
  requireRole("support", "admin"),
  requestController.addNote
);

module.exports = router;
