const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadAvatar,
  getUserStats,
  deactivateUser,
  activateUser,
} = require('../controllers/UserController');
const { protect, authorize } = require('../middleware/auth');
const { uploadAvatar: uploadAvatarMiddleware } = require('../config/Cloudinary');
const { handleUploadError } = require('../middleware/Upload');
const {
  validateObjectId,
  handleValidationErrors,
} = require('../middleware/ValidateRequest');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// User management routes
router.get('/', getAllUsers);
router.get('/stats', getUserStats);
router.get('/:id', validateObjectId, handleValidationErrors, getUserById);
router.put('/:id', validateObjectId, handleValidationErrors, updateUser);
router.delete('/:id', validateObjectId, handleValidationErrors, deleteUser);

// User avatar upload
router.put(
  '/:id/avatar',
  validateObjectId,
  uploadAvatarMiddleware,
  handleUploadError,
  handleValidationErrors,
  uploadAvatar
);

// User account activation/deactivation
router.put('/:id/deactivate', validateObjectId, handleValidationErrors, deactivateUser);
router.put('/:id/activate', validateObjectId, handleValidationErrors, activateUser);

module.exports = router;