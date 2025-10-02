// Error handling middleware

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const sendSuccessResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendErrorResponse = (res, statusCode, message, error = null) => {
  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message,
      details: error
    }
  });
};

module.exports = {
  asyncHandler,
  sendSuccessResponse,
  sendErrorResponse
};