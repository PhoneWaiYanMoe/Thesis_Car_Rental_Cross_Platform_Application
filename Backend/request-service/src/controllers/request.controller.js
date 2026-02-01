const requestService = require("../services/request.service");
const {
  successResponse,
  errorResponse,
} = require("../utils/responseFormatter");

class RequestController {
  async createRequest(req, res, next) {
    try {
      const { title, category, description, priority, attachmentIds } =
        req.body;

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
      ];
      if (!validCategories.includes(category)) {
        return res
          .status(400)
          .json(
            errorResponse(
              `Invalid category. Must be one of: ${validCategories.join(", ")}`
            )
          );
      }

      const validPriorities = ["low", "medium", "high"];
      if (priority && !validPriorities.includes(priority)) {
        return res
          .status(400)
          .json(
            errorResponse(
              `Invalid priority. Must be one of: ${validPriorities.join(", ")}`
            )
          );
      }

      const request = await requestService.createRequest(req.user.userId, {
        category,
        title,
        description,
        priority,
        attachmentIds,
        userEmail: req.user.email
      });

      res.status(201).json(
        successResponse(
          {
            request: {
              userId: request.userId,
              title: request.title,
              category: request.category,
              status: request.status,
              createdAt: request.created_at,
            },
          },
          "Request submitted successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

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

  async getRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const { request, actions } = await requestService.getRequestById(id);

      res.json(
        successResponse({
          request: {
            ...request,
            notes: actions,
          },
        })
      );
    } catch (error) {
      if (error.message === "Request not found") {
        return res.status(404).json(errorResponse(error.message));
      }
      next(error);
    }
  }

  async getMyRequests(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      const result = await requestService.getUserRequests(req.user.userId, filters);

      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json(errorResponse("Status is required"));
      }

      const request = await requestService.updateStatus(
        id,
        status,
        req.user.userId,
        notes
      );

      res.json(
        successResponse(
          {
            newStatus: request.status,
          },
          "Request status updated"
        )
      );
    } catch (error) {
      if (error.message === "Request not found") {
        return res.status(404).json(errorResponse(error.message));
      }
      next(error);
    }
  }

  async approveRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const request = await requestService.approveRequest(
        id,
        req.user.userId,
        notes || "Request approved"
      );

      res.json(
        successResponse(
          {
            request,
          },
          "Request approved successfully"
        )
      );
    } catch (error) {
      if (error.message === "Request not found") {
        return res.status(404).json(errorResponse(error.message));
      }
      next(error);
    }
  }

  async denyRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json(errorResponse("Reason is required"));
      }

      const request = await requestService.denyRequest(id, req.user.userId, reason);

      res.json(
        successResponse(
          {
            request,
          },
          "Request denied"
        )
      );
    } catch (error) {
      if (error.message === "Request not found") {
        return res.status(404).json(errorResponse(error.message));
      }
      next(error);
    }
  }

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
}

module.exports = new RequestController();
