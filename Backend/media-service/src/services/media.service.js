const cloudinary = require("../config/cloudinary");
const MediaFile = require("../models/MediaFile");
const { isImageFile } = require("../utils/fileValidation");
const {
  processImage,
  createThumbnail,
  getImageMetadata,
} = require("../utils/imageProcessor");
const { v4: uuidv4 } = require("uuid");

class MediaService {
  async uploadSingleFile(file, userId, type, category = null) {
    try {
      let processedBuffer = file.buffer;
      let thumbnailBuffer = null;
      let metadata = {};

      // Process image files
      if (isImageFile(file.mimetype)) {
        // Get original metadata
        metadata = await getImageMetadata(file.buffer);

        // Process main image
        processedBuffer = await processImage(file.buffer, {
          width: 1200,
          quality: 85,
          format: "jpeg",
        });

        // Create thumbnail
        thumbnailBuffer = await createThumbnail(file.buffer, 300);
      }

      // Upload main file to Cloudinary
      const uploadResult = await this.uploadToCloudinary(
        processedBuffer,
        `wiz/${type}`,
        file.originalname
      );

      // Upload thumbnail if it's an image
      let thumbnailUrl = null;
      if (thumbnailBuffer) {
        const thumbnailResult = await this.uploadToCloudinary(
          thumbnailBuffer,
          `wiz/${type}/thumbnails`,
          `thumb_${file.originalname}`
        );
        thumbnailUrl = thumbnailResult.secure_url;
      }

      // Save to database
      const mediaFile = await MediaFile.create({
        id: uuidv4(),
        userId,
        type,
        category,
        url: uploadResult.secure_url,
        thumbnailUrl,
        cloudinaryPublicId: uploadResult.public_id,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        width: metadata.width || null,
        height: metadata.height || null,
      });

      return mediaFile;
    } catch (error) {
      throw new Error("File upload failed: " + error.message);
    }
  }

  async uploadMultipleFiles(files, userId, type, category = null) {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadSingleFile(file, userId, type, category)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new Error("Multiple files upload failed: " + error.message);
    }
  }

  async uploadToCloudinary(buffer, folder, filename) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: `${Date.now()}_${filename.split(".")[0]}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
  }

  async getFileById(fileId, userId) {
    const file = await MediaFile.findOne({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error("File not found");
    }

    // Generate temporary URL (valid for 1 hour)
    const temporaryUrl = this.generateTemporaryUrl(file.cloudinaryPublicId);

    return {
      ...file.toJSON(),
      temporaryUrl,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    };
  }

  generateTemporaryUrl(publicId) {
    // Generate signed URL valid for 1 hour
    return cloudinary.url(publicId, {
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
  }

  async deleteFile(fileId, userId) {
    const file = await MediaFile.findOne({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error("File not found");
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(file.cloudinaryPublicId);

    // Delete thumbnail if exists
    if (file.thumbnailUrl) {
      const thumbnailPublicId = file.thumbnailUrl
        .split("/")
        .pop()
        .split(".")[0];
      await cloudinary.uploader.destroy(thumbnailPublicId);
    }

    // Delete from database
    await file.destroy();

    return { success: true, message: "File deleted successfully" };
  }

  async getUserFiles(userId, type = null) {
    const where = { userId };
    if (type) where.type = type;

    return await MediaFile.findAll({
      where,
      order: [["uploadedAt", "DESC"]],
    });
  }
}

module.exports = new MediaService();
