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

      const { type, category } = req.body;

      if (!type) {
        return res.status(400).json({
          success: false,
          message: "File type is required",
        });
      }

      const file = await mediaService.uploadSingleFile(
        req.file,
        req.user.id,
        type,
        category
      );

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        file: {
          id: file.id,
          url: file.url,
          thumbnailUrl: file.thumbnailUrl,
          type: file.type,
          size: file.size,
          mimeType: file.mimeType,
          uploadedAt: file.uploadedAt,
        },
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

      const { type, category } = req.body;

      if (!type) {
        return res.status(400).json({
          success: false,
          message: "File type is required",
        });
      }

      const files = await mediaService.uploadMultipleFiles(
        req.files,
        req.user.id,
        type,
        category
      );

      res.status(200).json({
        success: true,
        message: "Files uploaded successfully",
        files: files.map((file) => ({
          id: file.id,
          url: file.url,
          thumbnailUrl: file.thumbnailUrl,
          type: file.type,
          size: file.size,
          mimeType: file.mimeType,
          uploadedAt: file.uploadedAt,
        })),
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
      const file = await mediaService.getFileById(id, req.user.id);

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

  async deleteFile(req, res) {
    try {
      const { id } = req.params;
      await mediaService.deleteFile(id, req.user.id);

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

  async getUserFiles(req, res) {
    try {
      const { type } = req.query;
      const files = await mediaService.getUserFiles(req.user.id, type);

      res.status(200).json({
        success: true,
        files: files.map((file) => ({
          id: file.id,
          url: file.url,
          thumbnailUrl: file.thumbnailUrl,
          type: file.type,
          category: file.category,
          fileName: file.fileName,
          size: file.size,
          uploadedAt: file.uploadedAt,
        })),
      });
    } catch (error) {
      console.error("Get user files error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new MediaController();
