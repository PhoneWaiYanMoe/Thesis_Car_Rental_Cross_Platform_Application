const express = require("express");
const router = express.Router();
const mediaController = require("../controllers/media.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const {
  uploadSingle,
  uploadMultiple,
} = require("../middleware/upload.middleware");

// All routes require authentication
router.use(authenticateToken);

// Upload single file
router.post("/upload", uploadSingle("file"), mediaController.uploadSingle);

// Upload multiple files (batch)
router.post(
  "/upload/batch",
  uploadMultiple("files", 10),
  mediaController.uploadBatch
);

// Get file by ID
router.get("/:id", mediaController.getFileById);

// Delete file
router.delete("/:id", mediaController.deleteFile);

// Get user's files (optional type filter)
router.get("/user/files", mediaController.getUserFiles);

module.exports = router;
