const { errorResponse } = require('../utils/ApiResponse');
const logger = require('../utils/Logger');
// Not Found middleware

exports.notFound = (req, res, next) => {
  res.status(404).json(
    errorResponse(`Route not found - ${req.originalUrl}`, null, 404)
  );
};

// Global Error Handler
exports.errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json(
      errorResponse('Invalid ID format', err.message, 400)
    );
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(400).json(
      errorResponse(`${field} '${value}' already exists`, err.message, 400)
    );
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json(
      errorResponse('Validation Error', messages, 400)
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      errorResponse('Invalid token', err.message, 401)
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      errorResponse('Token expired', err.message, 401)
    );
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json(
        errorResponse('File size too large', 'Maximum file size is 5MB', 400)
      );
    }
    return res.status(400).json(
      errorResponse('File upload error', err.message, 400)
    );
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json(
    errorResponse(
      err.message || 'Internal Server Error',
      process.env.NODE_ENV === 'development' ? err.stack : null,
      statusCode
    )
  );
};