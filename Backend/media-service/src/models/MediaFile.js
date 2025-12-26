const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const MediaFile = sequelize.define(
  "MediaFile",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "owner_id",
    },
    ownerType: {
      type: DataTypes.ENUM("VEHICLE", "REVIEW", "USER", "REQUEST"),
      allowNull: false,
      field: "owner_type",
    },
    uploaderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "uploader_id",
    },
    type: {
      type: DataTypes.ENUM(
        "vehicle_photo",
        "document",
        "review_photo",
        "license",
        "selfie",
        "passport",
        "contract",
        "profile"
      ),
      allowNull: false,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    thumbnailUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "thumbnail_url",
    },
    cloudinaryPublicId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "cloudinary_public_id",
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "file_name",
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "mime_type",
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "uploaded_at",
    },
  },
  {
    tableName: "media_files",
    timestamps: false,
  }
);

module.exports = MediaFile;
