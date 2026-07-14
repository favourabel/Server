const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/ApiResponse');
const { setTokenCookie, clearTokenCookie } = require('../utils/GenerateToken');
const sendEmail = require('../utils/SendEmail');
const { welcomeEmail, passwordResetEmail } = require('../utils/EmailTemplates');
const logger = require('../utils/Logger');
const crypto = require('crypto');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    // Generate token
    const token = user.generateAuthToken();

    // Set cookie
    setTokenCookie(res, token);

    // Send welcome email (don't wait for it)
    sendEmail({
      to: user.email,
      subject: 'Welcome to Our Store!',
      html: welcomeEmail(user.name),
    }).catch(err => logger.error('Welcome email failed:', { error: err.message }));

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json(
      successResponse(
        'User registered successfully',
        {
          user: user.getPublicProfile(),
          token,
        },
        201
      )
    );
  } catch (error) {
    logger.error('Registration error:', { error: error.message });

    if (error.code === 11000) {
      return res.status(400).json(
        errorResponse('Email already registered', null, 400)
      );
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json(
        errorResponse('Validation failed', messages, 400)
      );
    }

    res.status(500).json(
      errorResponse('Registration failed', error.message, 500)
    );
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json(
        errorResponse('Invalid email or password', null, 401)
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json(
        errorResponse('Your account has been deactivated', null, 403)
      );
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json(
        errorResponse('Invalid email or password', null, 401)
      );
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = user.generateAuthToken();

    // Set cookie
    setTokenCookie(res, token);

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json(
      successResponse(
        'Login successful',
        {
          user: user.getPublicProfile(),
          token,
        }
      )
    );
  } catch (error) {
    logger.error('Login error:', { error: error.message });

    res.status(500).json(
      errorResponse('Login failed', error.message, 500)
    );
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Clear token cookie
    clearTokenCookie(res);

    logger.info(`User logged out: ${req.user.email}`);

    res.status(200).json(
      successResponse('Logout successful')
    );
  } catch (error) {
    logger.error('Logout error:', { error: error.message });

    res.status(500).json(
      errorResponse('Logout failed', error.message, 500)
    );
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json(
      successResponse('User profile retrieved', user.getPublicProfile())
    );
  } catch (error) {
    logger.error('Get profile error:', { error: error.message });

    res.status(500).json(
      errorResponse('Failed to get profile', error.message, 500)
    );
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true,
      }
    );

    logger.info(`Profile updated: ${user.email}`);

    res.status(200).json(
      successResponse('Profile updated successfully', user.getPublicProfile())
    );
  } catch (error) {
    logger.error('Update profile error:', { error: error.message });

    res.status(500).json(
      errorResponse('Failed to update profile', error.message, 500)
    );
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json(
        errorResponse('Current password is incorrect', null, 401)
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed: ${user.email}`);

    res.status(200).json(
      successResponse('Password changed successfully')
    );
  } catch (error) {
    logger.error('Change password error:', { error: error.message });

    res.status(500).json(
      errorResponse('Failed to change password', error.message, 500)
    );
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json(
        errorResponse('No user found with that email', null, 404)
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire time (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: passwordResetEmail(user, resetUrl),
    });

    logger.info(`Password reset email sent to: ${user.email}`);

    res.status(200).json(
      successResponse('Password reset email sent')
    );
  } catch (error) {
    logger.error('Forgot password error:', { error: error.message });

    // Clear reset token fields if email fails
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(500).json(
      errorResponse('Email could not be sent', error.message, 500)
    );
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json(
        errorResponse('Invalid or expired reset token', null, 400)
      );
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.info(`Password reset successful: ${user.email}`);

    // Generate token
    const token = user.generateAuthToken();

    // Set cookie
    setTokenCookie(res, token);

    res.status(200).json(
      successResponse(
        'Password reset successful',
        {
          user: user.getPublicProfile(),
          token,
        }
      )
    );
  } catch (error) {
    logger.error('Reset password error:', { error: error.message });

    res.status(500).json(
      errorResponse('Password reset failed', error.message, 500)
    );
  }
};