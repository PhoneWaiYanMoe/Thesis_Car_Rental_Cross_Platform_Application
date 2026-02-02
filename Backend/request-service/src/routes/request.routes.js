const express = require("express");
const router = express.Router();
const requestController = require("../controllers/request.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

// Metadata routes (public with authentication)
router.get(
  "/metadata/categories",
  authenticate,
  requestController.getCategories,
);
router.get("/metadata/statuses", authenticate, requestController.getStatuses);

// Public routes with authentication
router.post("/", authenticate, requestController.createRequest);
router.get("/my-requests", authenticate, requestController.getMyRequests);

// Support/Admin routes
router.get(
  "/",
  authenticate,
  requireRole("support", "admin"),
  requestController.getRequests,
);

router.get(
  "/:id",
  authenticate,
  requireRole("support", "admin"),
  requestController.getRequestById,
);

router.patch(
  "/:id/status",
  authenticate,
  requireRole("support", "admin"),
  requestController.updateStatus,
);

router.post(
  "/:id/approve",
  authenticate,
  requireRole("support", "admin"),
  requestController.approveRequest,
);

router.post(
  "/:id/deny",
  authenticate,
  requireRole("support", "admin"),
  requestController.denyRequest,
);

router.post(
  "/:id/pause",
  authenticate,
  requireRole("support", "admin"),
  requestController.pauseRequest,
);

router.post(
  "/:id/resume",
  authenticate,
  requireRole("support", "admin"),
  requestController.resumeRequest,
);

router.post(
  "/:id/notes",
  authenticate,
  requireRole("support", "admin"),
  requestController.addNote,
);

module.exports = router;
