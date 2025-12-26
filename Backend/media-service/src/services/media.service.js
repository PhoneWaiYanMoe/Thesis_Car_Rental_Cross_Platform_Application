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
  async uploadSingleFile(file, uploaderId, ownerId, ownerType, type) {
    try {
      let processedBuffer = file.buffer;
      let thumbnailBuffer = null;
      let metadata = {};

      // process image files
      if (isImageFile(file.mimetype)) {
        // get original metadata
        metadata = await getImageMetadata(file.buffer);

        // process main image
        processedBuffer = await processImage(file.buffer, {
          width: 1200,
          quality: 85,
          format: "jpeg",
        });

        // create thumbnail
        thumbnailBuffer = await createThumbnail(file.buffer, 300);
      }

      // upload main file to Cloudinary
      const uploadResult = await this.uploadToCloudinary(
        processedBuffer,
        `wiz/${type}`,
        file.originalname
      );

      // upload thumbnail if it's an image
      let thumbnailUrl = null;
      if (thumbnailBuffer) {
        const thumbnailResult = await this.uploadToCloudinary(
          thumbnailBuffer,
          `wiz/${type}/thumbnails`,
          `thumb_${file.originalname}`
        );
        thumbnailUrl = thumbnailResult.secure_url;
      }

      // save to database
      const mediaFile = await MediaFile.create({
        id: uuidv4(),
        uploaderId,
        ownerId,
        ownerType,
        type,
        url: uploadResult.secure_url,
        thumbnailUrl,
        cloudinaryPublicId: uploadResult.public_id,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        width: metadata.width || null,
        height: metadata.height || null,
      });

      // return without cloudinaryPublicId
      return this.formatMediaResponse(mediaFile);
    } catch (error) {
      throw new Error("File upload failed: " + error.message);
    }
  }

  async uploadMultipleFiles(files, uploaderId, ownerId, ownerType, type) {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadSingleFile(file, uploaderId, ownerId, ownerType, type)
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

  async getFileById(fileId) {
    const file = await MediaFile.findOne({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error("File not found");
    }

    return this.formatMediaResponse(file);
  }

  async getBatchByIds(ids) {
    const files = await MediaFile.findAll({
      where: { id: ids },
    });

    // transform to object with id as key
    const result = {};
    files.forEach((file) => {
      result[file.id] = this.formatMediaResponse(file);
    });

    return result;
  }

  async getByOwner(ownerType, ownerId, type = null) {
    const where = {
      ownerType,
      ownerId,
    };

    if (type) {
      where.type = type;
    }

    const files = await MediaFile.findAll({
      where,
      order: [["uploadedAt", "DESC"]],
    });

    return files.map((file) => this.formatMediaResponse(file));
  }

  async deleteFile(fileId, userId, userType) {
    const file = await MediaFile.findOne({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error("File not found");
    }

    // check authorization, must be uploader or admin
    if (file.uploaderId !== userId && userType !== "admin") {
      throw new Error("Unauthorized: You can only delete files you uploaded");
    }

    // delete from Cloudinary
    await cloudinary.uploader.destroy(file.cloudinaryPublicId);

    // delete thumbnail if exists
    if (file.thumbnailUrl) {
      const thumbnailPublicId = this.extractPublicIdFromUrl(file.thumbnailUrl);
      await cloudinary.uploader.destroy(thumbnailPublicId);
    }

    // delete from database
    await file.destroy();

    return { success: true, message: "File deleted successfully" };
  }

  extractPublicIdFromUrl(url) {
    // extract public_id from Cloudinary URL
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    const folder = parts.slice(-3, -1).join("/");
    return `${folder}/${filename.split(".")[0]}`;
  }

  // format response without cloudinaryPublicId
  formatMediaResponse(file) {
    const fileData = file.toJSON ? file.toJSON() : file;

    return {
      id: fileData.id,
      url: fileData.url,
      thumbnailUrl: fileData.thumbnailUrl,
      ownerId: fileData.ownerId,
      ownerType: fileData.ownerType,
      uploaderId: fileData.uploaderId,
      type: fileData.type,
      width: fileData.width,
      height: fileData.height,
      fileName: fileData.fileName,
      size: fileData.size,
      mimeType: fileData.mimeType,
      uploadedAt: fileData.uploadedAt,
    };
  }
}

module.exports = new MediaService();
