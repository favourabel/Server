const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderToPaid,
  cancelOrder,
  getOrderStats,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateObjectId,
  handleValidationErrors,
} = require('../middleware/validateRequest');

// All routes require authentication
router.use(protect);

// User routes
router.post('/', validateCreateOrder, handleValidationErrors, createOrder);
router.get('/my-orders', getMyOrders);

// Admin/Seller routes
router.get('/stats', authorize('admin', 'seller'), getOrderStats);
router.get('/', authorize('admin', 'seller'), getAllOrders);

// Order specific routes
router.get('/:id', validateObjectId, handleValidationErrors, getOrderById);
router.put(
  '/:id/status',
  validateObjectId,
  validateUpdateOrderStatus,
  handleValidationErrors,
  authorize('admin', 'seller'),
  updateOrderStatus
);
router.put('/:id/pay', validateObjectId, handleValidationErrors, updateOrderToPaid);
router.put('/:id/cancel', validateObjectId, handleValidationErrors, cancelOrder);

module.exports = router;