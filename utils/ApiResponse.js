/**
 * Standardized API response formatter
 */

// Success response
exports.successResponse = (message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    statusCode,
  };

  if (data !== null) {
    response.data = data;
  }

  response.timestamp = new Date().toISOString();

  return response;
};

// Error response
exports.errorResponse = (message, errors = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
    statusCode,
  };

  if (errors !== null) {
    response.errors = Array.isArray(errors) ? errors : [errors];
  }

  response.timestamp = new Date().toISOString();

  return response;
};

// Pagination response
exports.paginationResponse = (message, data, pagination, statusCode = 200) => {
  return {
    success: true,
    message,
    statusCode,
    data,
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      itemsPerPage: pagination.itemsPerPage,
      hasNextPage: pagination.currentPage < pagination.totalPages,
      hasPreviousPage: pagination.currentPage > 1,
    },
    timestamp: new Date().toISOString(),
  };
};