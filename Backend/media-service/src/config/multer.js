const multer = require("multer");
const path = require("path");

// use memory storage to process files before uploading to Cloudinary
const storage = multer.memoryStorage();

// ✅ IMPROVED: More lenient file filter for mobile uploads
const fileFilter = (req, file, cb) => {
  console.log(`📥 Receiving file: ${file.originalname}`);
  console.log(`   MIME type: ${file.mimetype}`);
  console.log(`   Field name: ${file.fieldname}`);

  // ✅ FIX 1: Accept any image/* MIME type (mobile devices use various types)
  const isImage = file.mimetype.startsWith("image/");

  // ✅ FIX 2: Accept common document types
  const allowedDocTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const isDocument = allowedDocTypes.includes(file.mimetype);

  if (isImage || isDocument) {
    console.log(`✅ File accepted: ${file.originalname}`);
    cb(null, true);
  } else {
    console.log(
      `❌ File rejected: ${file.originalname} (invalid MIME type: ${file.mimetype})`
    );
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only images and documents are allowed.`
      ),
      false
    );
  }
};

// multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB default (increased for mobile)
    files: 10, // max 10 files per request
  },
});

module.exports = upload;
