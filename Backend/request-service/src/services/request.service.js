const Request = require("../models/Request");
const RequestAction = require("../models/RequestAction");
const RequestAttachment = require("../models/RequestAttachment");
const eventPublisher = require("./event-publisher.service");

class RequestService {
  async createRequest(userId, requestData) {
    // create request
    const request = await Request.create({
      userId,
      category: requestData.category,
      title: requestData.title,
      userEmail: requestData.userEmail,
      description: requestData.description,
      priority: requestData.priority,
    });

    // save attachments if provided
    if (requestData.attachmentIds && requestData.attachmentIds.length > 0) {
      await RequestAttachment.createMany(request.id, requestData.attachmentIds);
    }

    // log action
    await RequestAction.create({
      requestId: request.id,
      performedBy: userId,
      action: "request_created",
      notes: "Request submitted",
    });

    // publish event with email and title
    await eventPublisher.publish("request.created", "request.created", {
      requestId: request.id,
      userId: request.user_id,
      userEmail: request.user_email,
      category: request.category,
      title: request.title,
      priority: request.priority,
    });

    return request;
  }

  async getRequests(filters) {
    const result = await Request.findAll(filters);

    // fetch attachments for each request
    for (let request of result.requests) {
      request.attachmentIds = await RequestAttachment.findByRequestId(
        request.id
      );
    }

    return result;
  }

  async getRequestById(id) {
    const request = await Request.findById(id);
    if (!request) {
      throw new Error("Request not found");
    }

    const actions = await RequestAction.findByRequestId(id);
    const attachmentIds = await RequestAttachment.findByRequestId(id);

    return {
      request: {
        ...request,
        attachmentIds,
      },
      actions,
    };
  }

  async getUserRequests(userId, filters) {
    const result = await Request.findByUserId(userId, filters);

    // fetch attachments for each request
    for (let request of result.requests) {
      request.attachmentIds = await RequestAttachment.findByRequestId(
        request.id
      );
    }

    return result;
  }

  async updateStatus(id, status, handledBy, notes) {
    const request = await Request.updateStatus(id, status, handledBy, notes);

    if (!request) {
      throw new Error("Request not found");
    }

    // log action
    await RequestAction.create({
      requestId: id,
      performedBy: handledBy,
      action: `status_changed_to_${status}`,
      notes: notes || `Status changed to ${status}`,
    });

    // publish event
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

    // log action
    await RequestAction.create({
      requestId: id,
      performedBy: handledBy,
      action: "request_approved",
      notes: notes || "Request approved",
    });

    // publish events
    await eventPublisher.publish("request.approved", "request.approved", {
      requestId: request.id,
      userId: request.user_id,
      userEmail: request.user_email,
      title: request.title,
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

    // log action
    await RequestAction.create({
      requestId: id,
      performedBy: handledBy,
      action: "request_denied",
      notes: reason || "Request denied",
    });

    // publish events
    await eventPublisher.publish("request.denied", "request.denied", {
      requestId: request.id,
      userId: request.user_id,
      category: request.category,
      userEmail: request.user_email,
      title: request.title,
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
