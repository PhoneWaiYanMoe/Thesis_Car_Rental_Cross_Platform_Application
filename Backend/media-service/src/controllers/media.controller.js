const mediaService = require("../services/media.service");

class MediaController {
  async uploadSingle(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const { ownerId, ownerType, type } = req.body;

      if (!ownerId || !ownerType || !type) {
        return res.status(400).json({
          success: false,
          message: "ownerId, ownerType, and type are required",
        });
      }

      const file = await mediaService.uploadSingleFile(
        req.file,
        req.user.id, // uploaderId from JWT
        ownerId,
        ownerType,
        type
      );

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        fileId: file.id,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async uploadBatch(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const { ownerId, ownerType, type } = req.body;

      if (!ownerId || !ownerType || !type) {
        return res.status(400).json({
          success: false,
          message: "ownerId, ownerType, and type are required",
        });
      }

      const files = await mediaService.uploadMultipleFiles(
        req.files,
        req.user.id, // uploaderId from JWT
        ownerId,
        ownerType,
        type
      );

      res.status(200).json({
        success: true,
        message: "Files uploaded successfully",
        fileIds: files.map(f => f.id),
      });
    } catch (error) {
      console.error("Batch upload error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getFileById(req, res) {
    try {
      const { id } = req.params;
      const file = await mediaService.getFileById(id);

      res.status(200).json({
        success: true,
        file,
      });
    } catch (error) {
      console.error("Get file error:", error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getBatch(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "ids array is required",
        });
      }

      const files = await mediaService.getBatchByIds(ids);

      res.status(200).json(files);
    } catch (error) {
      console.error("Get batch error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getByOwner(req, res) {
    try {
      const { ownerType, ownerId, type } = req.query;

      if (!ownerType || !ownerId) {
        return res.status(400).json({
          success: false,
          message: "ownerType and ownerId are required",
        });
      }

      const files = await mediaService.getByOwner(ownerType, ownerId, type);

      res.status(200).json({
        items: files,
      });
    } catch (error) {
      console.error("Get by owner error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteFile(req, res) {
    try {
      const { id } = req.params;
      await mediaService.deleteFile(id, req.user.id, req.user.type);

      res.status(200).json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Delete file error:", error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new MediaController();
