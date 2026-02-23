const Request = require("../models/Request");
const RequestAction = require("../models/RequestAction");
const RequestAttachment = require("../models/RequestAttachment");
const eventPublisher = require("./event-publisher.service");

class RequestService {
  /**
   * Create a general user request
   */
  async createRequest(userId, requestData) {
    const request = await Request.create({
      userId,
      userEmail: requestData.userEmail,
      customerId: requestData.customerId,
      ownerId: requestData.ownerId,
      vehicleId: requestData.vehicleId,
      bookingId: requestData.bookingId,
      category: requestData.category,
      title: requestData.title,
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

    // publish event
    await eventPublisher.publish("request.created", "request.created", {
      requestId: request.id,
      userId: request.user_id,
      userEmail: request.user_email,
      customerId: request.customer_id,
      ownerId: request.owner_id,
      vehicleId: request.vehicle_id,
      bookingId: request.booking_id,
      category: request.category,
      title: request.title,
      priority: request.priority,
      status: request.status,
    });

    return request;
  }

  /**
   * Create booking confirmation request (created by customer)
   */
  async createBookingConfirmationRequest(eventData) {
    const { bookingId, vehicleId, customerId, ownerId, userId } = eventData;

    const request = await Request.create({
      userId: userId || customerId,
      userEmail: eventData.userEmail,
      customerId,
      ownerId,
      vehicleId,
      bookingId,
      category: "booking_confirmation",
      title: `Booking Confirmation Request - Booking #${bookingId}`,
      description: `Booking confirmation required for booking ID: ${bookingId}`,
      priority: "high",
    });

    await RequestAction.create({
      requestId: request.id,
      performedBy: "system",
      action: "request_created",
      notes: "Auto-generated from booking event",
    });

    await eventPublisher.publish("request.created", "request.created", {
      requestId: request.id,
      userId: request.user_id,
      customerId: request.customer_id,
      ownerId: request.owner_id,
      vehicleId: request.vehicle_id,
      bookingId: request.booking_id,
      category: request.category,
      title: request.title,
      priority: request.priority,
      status: request.status,
    });

    return request;
  }

  /**
   * Create vehicle confirmation request (created by system after owner register a vehicle)
   */
  async createVehicleRegisterConfirmationRequest(eventData) {
    const { vehicleId, ownerId, ownerEmail } = eventData;

    const request = await Request.create({
      userId: ownerId,
      userEmail: ownerEmail,
      ownerId,
      vehicleId,
      category: "vehicle_register_confirmation",
      title: `Vehicle Registration Confirmation - Vehicle #${vehicleId}`,
      description:
        eventData.description || "Vehicle registration confirmation required",
      priority: "high",
    });

    await RequestAction.create({
      requestId: request.id,
      performedBy: "system",
      action: "request_created",
      notes: "Auto-generated for vehicle registration confirmation",
    });

    await eventPublisher.publish("request.created", "request.created", {
      requestId: request.id,
      userId: request.user_id,
      ownerId: request.owner_id,
      vehicleId: request.vehicle_id,
      category: request.category,
      title: request.title,
      priority: request.priority,
      status: request.status,
    });

    return request;
  }

  /**
   * Create vehicle update request (from vehicle.updated event)
   */
  async createVehicleUpdateRequest(eventData) {
    const { vehicleId, ownerId, updateType, userId } = eventData;

    const request = await Request.create({
      userId: userId || ownerId,
      userEmail: eventData.userEmail,
      ownerId,
      vehicleId,
      category: "vehicle_update",
      title: `Vehicle Update Request - Vehicle #${vehicleId}`,
      description:
        eventData.description || `Vehicle update requested: ${updateType}`,
      priority: "medium",
    });

    await RequestAction.create({
      requestId: request.id,
      performedBy: "system",
      action: "request_created",
      notes: "Auto-generated from vehicle.updated event",
    });

    await eventPublisher.publish("request.created", "request.created", {
      requestId: request.id,
      userId: request.user_id,
      ownerId: request.owner_id,
      vehicleId: request.vehicle_id,
      category: request.category,
      title: request.title,
      priority: request.priority,
      status: request.status,
    });

    return request;
  }

  /**
   * Create yearly vehicle confirmation request
   */
  async createYearlyVehicleConfirmationRequest(eventData) {
    const { vehicleId, ownerId, ownerEmail } = eventData;

    const request = await Request.create({
      userId: ownerId,
      userEmail: ownerEmail,
      ownerId,
      vehicleId,
      category: "yearly_vehicle_confirmation",
      title: `Yearly Vehicle Confirmation - Vehicle #${vehicleId}`,
      description:
        eventData.description || "Annual vehicle confirmation required",
      priority: "high",
    });

    await RequestAction.create({
      requestId: request.id,
      performedBy: "system",
      action: "request_created",
      notes: "Auto-generated for yearly confirmation",
    });

    await eventPublisher.publish("request.created", "request.created", {
      requestId: request.id,
      userId: request.user_id,
      ownerId: request.owner_id,
      vehicleId: request.vehicle_id,
      category: request.category,
      title: request.title,
      priority: request.priority,
      status: request.status,
    });

    return request;
  }

  /**
   * Get all requests with filters
   */
  async getRequests(filters) {
    const result = await Request.findAll(filters);

    // fetch attachments for each request
    for (let request of result.requests) {
      request.attachmentIds = await RequestAttachment.findByRequestId(
        request.id,
      );
    }

    return result;
  }

  /**
   * Get request by ID
   */
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

  /**
   * Get user's own requests
   */
  async getUserRequests(userId, filters) {
    const result = await Request.findByUserId(userId, filters);

    // fetch attachments for each request
    for (let request of result.requests) {
      request.attachmentIds = await RequestAttachment.findByRequestId(
        request.id,
      );
    }

    return result;
  }

  /**
   * Update request status
   */
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

    // publish status change event
    await eventPublisher.publish(`request.${status}`, `request.${status}`, {
      requestId: request.id,
      userId: request.user_id,
      customerId: request.customer_id,
      ownerId: request.owner_id,
      vehicleId: request.vehicle_id,
      bookingId: request.booking_id,
      category: request.category,
      newStatus: status,
      handledBy,
      notes,
    });

    return request;
  }

  /**
   * Approve request with category-specific events
   */
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

    // publish general approval event
    await eventPublisher.publish("request.approved", "request.approved", {
      requestId: request.id,
      userId: request.user_id,
      userEmail: request.user_email,
      customerId: request.customer_id,
      ownerId: request.owner_id,
      vehicleId: request.vehicle_id,
      bookingId: request.booking_id,
      title: request.title,
      category: request.category,
      handledBy,
      notes,
    });

    // publish category-specific approval events
    await this._publishCategorySpecificEvent(
      request,
      "approved",
      handledBy,
      notes,
    );

    return request;
  }

  /**
   * Deny request with category-specific events
   */
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

    // publish general denial event
    await eventPublisher.publish("request.denied", "request.denied", {
      requestId: request.id,
      userId: request.user_id,
      userEmail: request.user_email,
      customerId: request.customer_id,
      ownerId: request.owner_id,
      vehicleId: request.vehicle_id,
      bookingId: request.booking_id,
      category: request.category,
      title: request.title,
      handledBy,
      reason,
    });

    // publish category-specific denial events
    await this._publishCategorySpecificEvent(
      request,
      "denied",
      handledBy,
      reason,
    );

    return request;
  }

  /**
   * Pause request
   */
  async pauseRequest(id, handledBy, reason) {
    const request = await Request.pause(id, handledBy, reason);

    if (!request) {
      throw new Error("Request not found");
    }

    await RequestAction.create({
      requestId: id,
      performedBy: handledBy,
      action: "request_paused",
      notes: reason || "Request paused",
    });

    await eventPublisher.publish("request.paused", "request.paused", {
      requestId: request.id,
      userId: request.user_id,
      category: request.category,
      handledBy,
      reason,
    });

    return request;
  }

  /**
   * Resume paused request
   */
  async resumeRequest(id, handledBy, notes) {
    const request = await Request.resume(id, handledBy, notes);

    if (!request) {
      throw new Error("Request not found");
    }

    await RequestAction.create({
      requestId: id,
      performedBy: handledBy,
      action: "request_resumed",
      notes: notes || "Request resumed",
    });

    await eventPublisher.publish("request.processing", "request.processing", {
      requestId: request.id,
      userId: request.user_id,
      category: request.category,
      handledBy,
      notes,
    });

    return request;
  }

  /**
   * Add note to request
   */
  async addNote(id, performedBy, note) {
    await RequestAction.create({
      requestId: id,
      performedBy,
      action: "note_added",
      notes: note,
    });

    return { success: true };
  }

  /**
   * Publish category-specific events
   */
  async _publishCategorySpecificEvent(request, action, handledBy, notes) {
    const eventMap = {
      user_account_deletion: `request.user_account_deletion_${action}`,
      vehicle_deactivation: `request.vehicle_deactivation_${action}`,
      vehicle_reactivation: `request.vehicle_reactivation_${action}`,
      vehicle_register_confirmation: `request.vehicle_verification_${action}`,
      yearly_vehicle_confirmation: `request.vehicle_verification_${action}`,
      vehicle_update: `request.vehicle_verification_${action}`,
      owner_verification: `request.owner_verification_${action}`,
      user_license_verification: `request.user_license_verification_${action}`,
    };

    const eventType = eventMap[request.category];
    if (eventType) {
      await eventPublisher.publish(eventType, eventType, {
        requestId: request.id,
        userId: request.user_id,
        userEmail: request.user_email,
        customerId: request.customer_id,
        ownerId: request.owner_id,
        vehicleId: request.vehicle_id,
        bookingId: request.booking_id,
        category: request.category,
        handledBy,
        notes,
      });
    }
  }
}

module.exports = new RequestService();
