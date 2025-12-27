const { Request, RequestAction } = require("../models/Request");
const eventPublisher = require("./event-publisher.service");

class RequestService {
  async createRequest(userId, requestData) {
    const request = await Request.create({
      userId,
      ...requestData,
    });

    // Publish event
    await eventPublisher.publish("request.created", "request.created", {
      requestId: request.id,
      userId: request.user_id,
      category: request.category,
      title: request.title,
      priority: request.priority,
    });

    return request;
  }

  async getRequests(filters) {
    return await Request.findAll(filters);
  }

  async getRequestById(id) {
    const request = await Request.findById(id);
    if (!request) {
      throw new Error("Request not found");
    }

    const actions = await RequestAction.findByRequestId(id);
    return { request, actions };
  }

  async getUserRequests(userId, filters) {
    return await Request.findByUserId(userId, filters);
  }

  async updateStatus(id, status, handledBy, notes) {
    const request = await Request.updateStatus(id, status, handledBy, notes);

    if (!request) {
      throw new Error("Request not found");
    }

    // Publish event
    await eventPublisher.publish(
      "request.status_changed",
      "request.status_changed",
      {
        requestId: request.id,
        userId: request.user_id,
        newStatus: status,
        handledBy,
        notes,
      }
    );

    return request;
  }

  async approveRequest(id, handledBy, notes) {
    const request = await Request.approve(id, handledBy, notes);

    if (!request) {
      throw new Error("Request not found");
    }

    // Publish events
    await eventPublisher.publish("request.approved", "request.approved", {
      requestId: request.id,
      userId: request.user_id,
      category: request.category,
      handledBy,
      notes,
    });

    await eventPublisher.publish("request.resolved", "request.resolved", {
      requestId: request.id,
      resolution: "approved",
    });

    return request;
  }

  async denyRequest(id, handledBy, reason) {
    const request = await Request.deny(id, handledBy, reason);

    if (!request) {
      throw new Error("Request not found");
    }

    // Publish events
    await eventPublisher.publish("request.denied", "request.denied", {
      requestId: request.id,
      userId: request.user_id,
      category: request.category,
      handledBy,
      reason,
    });

    await eventPublisher.publish("request.resolved", "request.resolved", {
      requestId: request.id,
      resolution: "denied",
    });

    return request;
  }

  async addNote(id, performedBy, note) {
    await RequestAction.create({
      requestId: id,
      performedBy,
      action: "note_added",
      notes: note,
    });

    return { success: true };
  }
}

module.exports = new RequestService();
