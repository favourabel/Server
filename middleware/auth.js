// Authentication middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/ApiResponse');
// JWT protect middleware (Use this everywhere)

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json(
      errorResponse('Access denied. No token provided.', null, 401)
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json(
        errorResponse('User not found.', null, 401)
      );
    }

    next();
  } catch (error) {
    return res.status(403).json(
      errorResponse('Invalid token.', null, 403)
    );
  }
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        errorResponse('Unauthorized', null, 401)
      );
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        errorResponse('Access denied. Insufficient permissions.', null, 403)
      );
    }

    next();
  };
};