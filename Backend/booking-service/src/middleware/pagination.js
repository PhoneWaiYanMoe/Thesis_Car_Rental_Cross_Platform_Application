// Backend/booking-service/src/middleware/pagination.js
// Reusable pagination utilities

/**
 * Parse and validate pagination parameters
 */
function parsePaginationParams(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Build pagination response
 */
function buildPaginationResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total: parseInt(total),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

/**
 * Parse date filter parameter
 */
function parseDateFilter(filter, customStartDate, customEndDate) {
  const now = new Date();
  let startDate, endDate;

  switch (filter) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );
      break;

    case "this_week":
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      startDate = startOfWeek;
      endDate = endOfWeek;
      break;

    case "this_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      break;

    case "this_year":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    case "custom":
      if (!customStartDate || !customEndDate) {
        throw new Error(
          "startDate and endDate are required for custom date range",
        );
      }
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format");
      }

      if (startDate > endDate) {
        throw new Error("startDate must be before endDate");
      }
      break;

    case "all_time":
    default:
      // No date filtering
      return null;
  }

  return { startDate, endDate };
}

/**
 * Parse sort parameter
 */
function parseSortParams(sortBy = "recently", sortOrder = "desc") {
  const validSortFields = {
    recently: "created_at",
    amount: "total_amount",
    duration: "duration_days",
    start_date: "start_date",
  };

  const validOrders = ["asc", "desc"];

  const field = validSortFields[sortBy] || validSortFields.recently;
  const order = validOrders.includes(sortOrder.toLowerCase())
    ? sortOrder.toUpperCase()
    : "DESC";

  return { field, order };
}

/**
 * Parse status filter (supports multiple statuses)
 */
function parseStatusFilter(statusParam) {
  if (!statusParam || statusParam === "all") {
    return null;
  }

  // Support comma-separated statuses
  const statuses = Array.isArray(statusParam)
    ? statusParam
    : statusParam.split(",").map((s) => s.trim());

  // Map "ongoing" to actual statuses
  const expandedStatuses = [];
  statuses.forEach((status) => {
    switch (status) {
      case "ongoing":
        expandedStatuses.push("booking", "picked_up");
        break;
      case "active":
        expandedStatuses.push("picked_up");
        break;
      case "waiting":
        expandedStatuses.push("pending_payment", "pending");
        break;
      default:
        expandedStatuses.push(status);
    }
  });

  return [...new Set(expandedStatuses)]; // Remove duplicates
}

/**
 * Middleware to validate and parse common query parameters
 */
const validateQueryParams = (req, res, next) => {
  try {
    // Parse pagination
    req.pagination = parsePaginationParams(req);

    // Parse date filter
    try {
      req.dateFilter = parseDateFilter(
        req.query.filter,
        req.query.startDate,
        req.query.endDate,
      );
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Parse sort
    req.sortParams = parseSortParams(req.query.sortBy, req.query.sortOrder);

    // Parse status
    req.statusFilter = parseStatusFilter(req.query.status);

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "Invalid query parameters",
      details: error.message,
    });
  }
};

module.exports = {
  parsePaginationParams,
  buildPaginationResponse,
  parseDateFilter,
  parseSortParams,
  parseStatusFilter,
  validateQueryParams,
};
