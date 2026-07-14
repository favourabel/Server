const multer = require('multer');
const path = require('path');
const { errorResponse } = require('../utils/ApiResponse');

// Configure storage for local file system (fallback if not using Cloudinary)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
  }
};

// Create multer upload middleware for local storage
const uploadLocal = multer({
  storage: localStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Middleware for handling single image upload (local)
exports.uploadSingleImage = uploadLocal.single('image');

// Middleware for handling multiple images upload (local)
exports.uploadMultipleImages = uploadLocal.array('images', 5);

// Middleware for handling avatar upload (local)
exports.uploadAvatar = uploadLocal.single('avatar');

// Error handling middleware for multer
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json(
        errorResponse('File size too large. Maximum size is 5MB', null, 400)
      );
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json(
        errorResponse('Too many files uploaded', null, 400)
      );
    }
    return res.status(400).json(
      errorResponse('File upload error', err.message, 400)
    );
  }

  if (err) {
    return res.status(400).json(
      errorResponse(err.message || 'File upload error', null, 400)
    );
  }

  next();
};

// Validate image dimensions (optional middleware)
exports.validateImageDimensions = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  try {
    const sharp = require('sharp');
    const files = req.files || [req.file];

    for (const file of files) {
      if (file) {
        const metadata = await sharp(file.path).metadata();

        // Check minimum dimensions (e.g., 200x200)
        if (metadata.width < 200 || metadata.height < 200) {
          return res.status(400).json(
            errorResponse('Image dimensions must be at least 200x200 pixels', null, 400)
          );
        }

        // Check maximum dimensions (e.g., 4000x4000)
        if (metadata.width > 4000 || metadata.height > 4000) {
          return res.status(400).json(
            errorResponse('Image dimensions must not exceed 4000x4000 pixels', null, 400)
          );
        }
      }
    }

    next();
  } catch (error) {
    return res.status(400).json(
      errorResponse('Invalid image file', error.message, 400)
    );
  }
};