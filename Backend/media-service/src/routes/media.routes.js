const express = require("express");
const router = express.Router();
const mediaController = require("../controllers/media.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const {
  uploadSingle,
  uploadMultiple,
} = require("../middleware/upload.middleware");

// protected routes, require authentication
router.post(
  "/upload",
  authenticateToken,
  uploadSingle("file"),
  mediaController.uploadSingle
);

router.post(
  "/upload/batch",
  authenticateToken,
  uploadMultiple("files", 10),
  mediaController.uploadBatch
);

router.delete("/:id", authenticateToken, mediaController.deleteFile);

// public routes, no authentication required
router.get("/media/:id", mediaController.getFileById);

router.post("/batch", mediaController.getBatch);

router.get("/batch", mediaController.getByOwner);

module.exports = router;
