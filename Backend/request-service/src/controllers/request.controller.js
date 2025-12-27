const requestService = require("../services/request.service");

class RequestController {
  async createRequest(req, res) {
    try {
      const { title, category, description, priority, attachmentUrls } =
        req.body;

      if (!title || !category || !description) {
        return res.status(400).json({
          success: false,
          message: "Title, category, and description are required",
        });
      }

      const request = await requestService.createRequest(req.user.id, {
        category,
        title,
        description,
        priority,
        attachmentUrls,
      });

      res.status(201).json({
        success: true,
        message: "Request submitted successfully",
        request: {
          id: request.id,
          title: request.title,
          category: request.category,
          status: request.status,
          createdAt: request.created_at,
        },
      });
    } catch (error) {
      console.error("Error creating request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create request",
        error: error.message,
      });
    }
  }

  async getRequests(req, res) {
    try {
      const filters = {
        status: req.query.status,
        category: req.query.category,
        handledBy: req.query.handledBy,
        currentUserId: req.user.id,
        search: req.query.search,
        sortBy: req.query.sortBy,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      };

      const result = await requestService.getRequests(filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch requests",
        error: error.message,
      });
    }
  }

  async getRequestById(req, res) {
    try {
      const { id } = req.params;
      const { request, actions } = await requestService.getRequestById(id);

      res.json({
        success: true,
        request: {
          ...request,
          notes: actions,
        },
      });
    } catch (error) {
      console.error("Error fetching request:", error);
      res.status(error.message === "Request not found" ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMyRequests(req, res) {
    try {
      const filters = {
        status: req.query.status,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      const result = await requestService.getUserRequests(req.user.id, filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error fetching user requests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch requests",
        error: error.message,
      });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const request = await requestService.updateStatus(
        id,
        status,
        req.user.id,
        notes
      );

      res.json({
        success: true,
        message: "Request status updated",
        newStatus: request.status,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(error.message === "Request not found" ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async approveRequest(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const request = await requestService.approveRequest(
        id,
        req.user.id,
        notes || "Request approved"
      );

      res.json({
        success: true,
        message: "Request approved successfully",
        request,
      });
    } catch (error) {
      console.error("Error approving request:", error);
      res.status(error.message === "Request not found" ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async denyRequest(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Reason is required",
        });
      }

      const request = await requestService.denyRequest(id, req.user.id, reason);

      res.json({
        success: true,
        message: "Request denied",
        request,
      });
    } catch (error) {
      console.error("Error denying request:", error);
      res.status(error.message === "Request not found" ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async addNote(req, res) {
    try {
      const { id } = req.params;
      const { note } = req.body;

      if (!note) {
        return res.status(400).json({
          success: false,
          message: "Note is required",
        });
      }

      await requestService.addNote(id, req.user.id, note);

      res.json({
        success: true,
        message: "Note added successfully",
      });
    } catch (error) {
      console.error("Error adding note:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add note",
        error: error.message,
      });
    }
  }
}

module.exports = new RequestController();
