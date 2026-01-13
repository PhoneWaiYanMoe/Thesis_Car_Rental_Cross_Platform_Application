// format success response
function successResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    ...data
  };
}

// format error response
function errorResponse(message, details = null) {
  const response = {
    success: false,
    message
  };
  
  if (details) {
    response.details = details;
  }
  
  return response;
}

module.exports = {
  successResponse,
  errorResponse
};