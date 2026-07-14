const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const logger = require('../utils/Logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify Cloudinary configuration
const verifyCloudinaryConfig = () => {
  try {
    cloudinary.api.ping((error, result) => {
      if (error) {
        logger.error('❌ Cloudinary configuration error:', { error: error.message });
      } else {
        logger.info('✅ Cloudinary connected successfully');
      }
    });
  } catch (error) {
    logger.error('❌ Cloudinary setup error:', { error: error.message });
  }
};

// Create Cloudinary storage for products
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
});

// Create Cloudinary storage for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
});

// Upload middleware for products (multiple images)
const uploadProductImages = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
}).array('images', 5); // Max 5 images

// Upload middleware for avatar (single image)
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
}).single('avatar');

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info('Image deleted from Cloudinary:', { publicId, result });
    return result;
  } catch (error) {
    logger.error('Error deleting image from Cloudinary:', { error: error.message });
    throw error;
  }
};

// Delete multiple images
const deleteImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    logger.info('Images deleted from Cloudinary:', { count: publicIds.length });
    return result;
  } catch (error) {
    logger.error('Error deleting images from Cloudinary:', { error: error.message });
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadProductImages,
  uploadAvatar,
  deleteImage,
  deleteImages,
  verifyCloudinaryConfig,
};