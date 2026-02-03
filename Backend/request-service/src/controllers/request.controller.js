const requestService = require("../services/request.service");
const {
  successResponse,
  errorResponse,
} = require("../utils/responseFormatter");

class RequestController {
  /**
   * Create a new request
   * POST /requests
   */
  async createRequest(req, res, next) {
    try {
      const {
        title,
        category,
        description,
        priority,
        attachmentIds,
        customerId,
        ownerId,
        vehicleId,
        bookingId,
      } = req.body;

      // validation
      if (!title || !category || !description) {
        return res
          .status(400)
          .json(errorResponse("Title, category, and description are required"));
      }

      const validCategories = [
        "booking_issue",
        "verification",
        "account_issue",
        "vehicle_listing",
        "payment_issue",
        "booking_change",
        "report",
        "vehicle_update",
        "yearly_vehicle_confirmation",
        "booking_confirmation",
        "refund_request",
        "payment_dispute",
        "user_license_verification",
        "owner_verification",
        "vehicle_deactivation",
        "vehicle_reactivation",
        "user_account_deletion",
        "contract_issue",
        "insurance_claim",
        "damage_report",
        "other",
      ];

      if (!validCategories.includes(category)) {
        return res
          .status(400)
          .json(
            errorResponse(
              `Invalid category. Must be one of: ${validCategories.join(", ")}`,
            ),
          );
      }

      const validPriorities = ["low", "medium", "high"];
      if (priority && !validPriorities.includes(priority)) {
        return res
          .status(400)
          .json(
            errorResponse(
              `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
            ),
          );
      }

      const request = await requestService.createRequest(req.user.userId, {
        category,
        title,
        description,
        priority,
        attachmentIds,
        userEmail: req.user.email,
        customerId,
        ownerId,
        vehicleId,
        bookingId,
      });

      res.status(201).json(
        successResponse(
          {
            request: {
              id: request.id,
              userId: request.user_id,
              customerId: request.customer_id,
              ownerId: request.owner_id,
              vehicleId: request.vehicle_id,
              bookingId: request.booking_id,
              title: request.title,
              category: request.category,
              status: request.status,
              priority: request.priority,
              createdAt: request.created_at,
            },
          },
          "Request submitted successfully",
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all requests with filters
   * GET /requests
   */
  async getRequests(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        category: req.query.category,
        handledBy: req.query.handledBy,
        currentUserId: req.user.userId,
        search: req.query.search,
        sortBy: req.query.sortBy,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      };

      const result = await requestService.getRequests(filters);

      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get request by ID
   * GET /requests/:id
   */
  async getRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const { request, actions } = await requestService.getRequestById(id);

      res.json(
        successResponse({
          request: {
            ...request,
            actions,
          },
        }),
      );
    } catch (error) {
      if (error.message === "Request not found") {
        return res.status(404).json(errorResponse(error.message));
      }
      next(error);
    }
  }

  /**
   * Get current user's requests
   * GET /requests/my-requests
   */
  async getMyRequests(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        category: req.query.category,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      const result = await requestService.getUserRequests(
        req.user.userId,
        filters,
      );

      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update request status
   * PATCH /requests/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json(errorResponse("Status is required"));
      }

      const validStatuses = [
        "pending",
        "processing",
        "approved",
        "denied",
        "paused",
      ];
      if (!validStatuses.includes(status)) {
        return res
          .status(400)
          .json(
            errorResponse(
              `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            ),
          );
      }

      const request = await requestService.updateStatus(
        id,
        status,
        req.user.userId,
        notes,
      );

      res.json(
        successResponse(
          {
            request: {
              id: request.id,
              status: request.status,
              handledBy: request.handled_by,
              updatedAt: request.updated_at,
            },
          },
          "Request status updated",
        ),
      );
    } catch (error) {
      if (error.message === "Request not found") {
        return res.status(404).json(errorResponse(error.message));
      }
      next(error);
    }
  }

  /**
   * Approve request
   * POST /requests/:id/approve
   */
  async approveRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const request = await requestService.approveRequest(
        id,
        req.user.userId,
        notes || "Request approved",
      );

      res.json(
        successResponse(
          {
            request: {
              id: request.id,
              status: request.status,
              handledBy: request.handled_by,
              handledAt: request.handled_at,
            },
          },
          "Request approved successfully",
        ),
      );
    } catch (error) {
      if (error.message === "Request not found") {
        return res.status(404).json(errorResponse(error.message));
      }
      next(error);
    }
  }

  /**
   * Deny request
   * POST /requests/:id/deny
   */
  async denyRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json(errorResponse("Reason is required"));
      }

      const request = await requestService.denyRequest(
        id,
        req.user.userId,
        reason,
      );

      res.json(
        successResponse(
          {
            request: {
              id: request.id,
              status: request.status,
              handledBy: request.handled_by,
              handledAt: request.handled_at,
            },
          },
          "Request denied",
        ),
      );
    } catch (error) {
      if (error.message === "Request not found") {
        return res.status(404).json(errorResponse(error.message));
      }
      next(error);
    }
  }

  /**
   * Pause request
   * POST /requests/:id/pause
   */
  async pauseRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const request = await requestService.pauseRequest(
        id,
        req.user.userId,
        reason || "Request paused",
      );

      res.json(
        successResponse(
          {
            request: {
              id: request.id,
              status: request.status,
              handledBy: request.handled_by,
            },
          },
          "Request paused",
        ),
      );
    } catch (error) {
      if (error.message === "Request not found") {
        return res.status(404).json(errorResponse(error.message));
      }
      next(error);
    }
  }

  /**
   * Resume paused request
   * POST /requests/:id/resume
   */
  async resumeRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const request = await requestService.resumeRequest(
        id,
        req.user.userId,
        notes || "Request resumed",
      );

      res.json(
        successResponse(
          {
            request: {
              id: request.id,
              status: request.status,
              handledBy: request.handled_by,
            },
          },
          "Request resumed and set to processing",
        ),
      );
    } catch (error) {
      if (error.message === "Request not found") {
        return res.status(404).json(errorResponse(error.message));
      }
      next(error);
    }
  }

  /**
   * Add note to request
   * POST /requests/:id/notes
   */
  async addNote(req, res, next) {
    try {
      const { id } = req.params;
      const { note } = req.body;

      if (!note) {
        return res.status(400).json(errorResponse("Note is required"));
      }

      await requestService.addNote(id, req.user.userId, note);

      res.json(successResponse({}, "Note added successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available categories
   * GET /requests/metadata/categories
   */
  async getCategories(req, res, next) {
    try {
      const categories = [
        { value: "booking_issue", label: "Booking Issue" },
        { value: "verification", label: "Verification" },
        { value: "account_issue", label: "Account Issue" },
        { value: "vehicle_listing", label: "Vehicle Listing" },
        { value: "payment_issue", label: "Payment Issue" },
        { value: "booking_change", label: "Booking Change" },
        { value: "report", label: "Report" },
        { value: "vehicle_update", label: "Vehicle Update" },
        {
          value: "yearly_vehicle_confirmation",
          label: "Yearly Vehicle Confirmation",
        },
        { value: "booking_confirmation", label: "Booking Confirmation" },
        { value: "refund_request", label: "Refund Request" },
        { value: "payment_dispute", label: "Payment Dispute" },
        {
          value: "user_license_verification",
          label: "User License Verification",
        },
        { value: "owner_verification", label: "Owner Verification" },
        { value: "vehicle_deactivation", label: "Vehicle Deactivation" },
        { value: "vehicle_reactivation", label: "Vehicle Reactivation" },
        { value: "user_account_deletion", label: "User Account Deletion" },
        { value: "contract_issue", label: "Contract Issue" },
        { value: "insurance_claim", label: "Insurance Claim" },
        { value: "damage_report", label: "Damage Report" },
        { value: "other", label: "Other" },
      ];

      res.json(successResponse({ categories }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available statuses
   * GET /requests/metadata/statuses
   */
  async getStatuses(req, res, next) {
    try {
      const statuses = [
        { value: "pending", label: "Pending" },
        { value: "processing", label: "Processing" },
        { value: "approved", label: "Approved" },
        { value: "denied", label: "Denied" },
        { value: "paused", label: "Paused" },
      ];

      res.json(successResponse({ statuses }));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RequestController();
