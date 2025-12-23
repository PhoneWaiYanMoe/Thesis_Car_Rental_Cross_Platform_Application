const sharp = require("sharp");

const processImage = async (buffer, options = {}) => {
  const {
    width = 1200,
    height = null,
    quality = 80,
    format = "jpeg",
  } = options;

  try {
    let image = sharp(buffer);

    // Resize image
    if (height) {
      image = image.resize(width, height, {
        fit: "cover",
        position: "center",
      });
    } else {
      image = image.resize(width, null, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Convert and optimize
    if (format === "jpeg") {
      image = image.jpeg({ quality });
    } else if (format === "png") {
      image = image.png({ quality });
    } else if (format === "webp") {
      image = image.webp({ quality });
    }

    return await image.toBuffer();
  } catch (error) {
    throw new Error("Image processing failed: " + error.message);
  }
};

const createThumbnail = async (buffer, size = 300) => {
  try {
    return await sharp(buffer)
      .resize(size, size, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch (error) {
    throw new Error("Thumbnail creation failed: " + error.message);
  }
};

const getImageMetadata = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    };
  } catch (error) {
    throw new Error("Failed to get image metadata: " + error.message);
  }
};

module.exports = {
  processImage,
  createThumbnail,
  getImageMetadata,
};
