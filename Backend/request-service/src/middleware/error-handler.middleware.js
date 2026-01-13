const { errorResponse } = require('../utils/responseFormatter');

// global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json(
      errorResponse('Validation error', err.details)
    );
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(
      errorResponse('Unauthorized')
    );
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json(
      errorResponse('Forbidden')
    );
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json(
      errorResponse('Resource not found')
    );
  }

  // default error
  res.status(err.status || 500).json(
    errorResponse(
      err.message || 'Internal server error',
      process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
    )
  );
};

// handle 404 routes
const notFoundHandler = (req, res) => {
  res.status(404).json(
    errorResponse(`Route ${req.method} ${req.path} not found`)
  );
};

module.exports = {
  errorHandler,
  notFoundHandler
};