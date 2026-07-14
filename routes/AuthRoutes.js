const express = require('express');
const router = express.Router();
const {
  register, login, logout, getMe, updateProfile, changePassword, forgotPassword, resetPassword,
} = require('../controllers/AuthController');

// ✅ FIX: Import 'protect' instead of 'authenticateJWT'
const { protect } = require('../middleware/auth'); 

const {
  validateRegister, validateLogin, handleValidationErrors,
} = require('../middleware/ValidateRequest');

// Public routes
router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

// Protected routes
router.use(protect); // ✅ FIX: Changed from authenticateJWT to protect

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

module.exports = router;