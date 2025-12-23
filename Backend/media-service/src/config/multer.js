const multer = require("multer");
const path = require("path");

// Use memory storage to process files before uploading to Cloudinary
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = (process.env.ALLOWED_IMAGE_TYPES || "").split(",");
  const allowedDocTypes = (process.env.ALLOWED_DOCUMENT_TYPES || "").split(",");
  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`),
      false
    );
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
  },
});

module.exports = upload;
