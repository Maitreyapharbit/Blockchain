const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404, code: 'RESOURCE_NOT_FOUND' };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400, code: 'DUPLICATE_FIELD' };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = { message, statusCode: 400, code: 'VALIDATION_ERROR' };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401, code: 'INVALID_TOKEN' };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401, code: 'TOKEN_EXPIRED' };
  }

  // Blockchain errors
  if (err.code === 'CALL_EXCEPTION') {
    const message = 'Blockchain call failed';
    error = { message, statusCode: 500, code: 'BLOCKCHAIN_ERROR' };
  }

  if (err.code === 'INSUFFICIENT_FUNDS') {
    const message = 'Insufficient funds for transaction';
    error = { message, statusCode: 400, code: 'INSUFFICIENT_FUNDS' };
  }

  if (err.code === 'NETWORK_ERROR') {
    const message = 'Blockchain network error';
    error = { message, statusCode: 503, code: 'NETWORK_ERROR' };
  }

  // AWS S3 errors
  if (err.code === 'NoSuchBucket') {
    const message = 'S3 bucket not found';
    error = { message, statusCode: 500, code: 'S3_BUCKET_NOT_FOUND' };
  }

  if (err.code === 'AccessDenied') {
    const message = 'S3 access denied';
    error = { message, statusCode: 403, code: 'S3_ACCESS_DENIED' };
  }

  // Database errors
  if (err.code === 'ECONNREFUSED') {
    const message = 'Database connection failed';
    error = { message, statusCode: 503, code: 'DATABASE_CONNECTION_ERROR' };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    const message = 'Too many requests';
    error = { message, statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400, code: 'FILE_TOO_LARGE' };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400, code: 'UNEXPECTED_FILE_FIELD' };
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  const message = error.message || 'Internal Server Error';

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const response = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  // Include stack trace in development
  if (isDevelopment) {
    response.stack = err.stack;
    response.details = error.details || {};
  }

  // Include request ID if available
  if (req.id) {
    response.requestId = req.id;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error);
};

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response helper
 */
const sendErrorResponse = (res, message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = {}) => {
  const response = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
    ...details
  };

  res.status(statusCode).json(response);
};

/**
 * Success response helper
 */
const sendSuccessResponse = (res, data, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  res.status(statusCode).json(response);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
  sendErrorResponse,
  sendSuccessResponse
};
