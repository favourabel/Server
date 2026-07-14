const { body, param, validationResult } = require('express-validator');
const { errorResponse } = require('../utils/ApiResponse');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json(
      errorResponse('Validation failed', errorMessages, 400)
    );
  }
  
  next();
};

// Validation rules for user registration
exports.validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  
  body('phone')
    .optional()
    .isMobilePhone().withMessage('Please provide a valid phone number'),
];

// Validation rules for user login
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// Validation rules for creating order
exports.validateCreateOrder = [
  body('orderItems')
    .isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  
  body('orderItems.*.product')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),
  
  body('orderItems.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  
  body('shippingAddress.fullName')
    .trim()
    .notEmpty().withMessage('Full name is required'),
  
  body('shippingAddress.email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  
  body('shippingAddress.phone')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
  
  body('shippingAddress.street')
    .trim()
    .notEmpty().withMessage('Street address is required'),
  
  body('shippingAddress.city')
    .trim()
    .notEmpty().withMessage('City is required'),
  
  body('shippingAddress.state')
    .trim()
    .notEmpty().withMessage('State is required'),
  
  body('shippingAddress.zipCode')
    .trim()
    .notEmpty().withMessage('Zip code is required'),
  
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['Credit Card', 'PayPal', 'Cash on Delivery', 'Bank Transfer'])
    .withMessage('Invalid payment method'),
];

// Validation rules for updating order status
exports.validateUpdateOrderStatus = [
  body('orderStatus')
    .notEmpty().withMessage('Order status is required')
    .isIn(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'])
    .withMessage('Invalid order status'),
  
  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 5 }).withMessage('Tracking number must be at least 5 characters'),
];

// Validation rules for creating product
exports.validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Product description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn([
      'Electronics',
      'Clothing',
      'Books',
      'Home & Garden',
      'Sports',
      'Toys',
      'Health & Beauty',
      'Food & Beverages',
      'Other',
    ]).withMessage('Invalid category'),
  
  body('stock')
    .notEmpty().withMessage('Stock quantity is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

// Validate MongoDB ObjectId
exports.validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
];