const validateFileType = (mimetype, allowedTypes) => {
  return allowedTypes.includes(mimetype);
};

const validateFileSize = (size, maxSize) => {
  return size <= maxSize;
};

const isImageFile = (mimetype) => {
  return mimetype.startsWith("image/");
};

const isDocumentFile = (mimetype) => {
  const docTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  return docTypes.includes(mimetype);
};

const getFileCategory = (type) => {
  const categories = {
    avatar: "user",
    vehicle_photo: "vehicle",
    document: "document",
    review_photo: "review",
    license: "user",
    selfie: "user",
    passport: "user",
    contract: "document",
  };
  return categories[type] || "other";
};

module.exports = {
  validateFileType,
  validateFileSize,
  isImageFile,
  isDocumentFile,
  getFileCategory,
};
