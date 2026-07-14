// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { adminAuth } = require('../middleware/AdminAuth');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/ProductController');

// ==================== MULTER CONFIG (for image upload) ====================

// Ensure uploads folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// ==================== ROUTES ====================

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin-only routes with image upload support
router.post('/', adminAuth, upload.array('images', 5), createProduct);
router.put('/:id', adminAuth, upload.array('images', 5), updateProduct);
router.delete('/:id', adminAuth, deleteProduct);

module.exports = router;