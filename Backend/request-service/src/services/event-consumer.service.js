const rabbitmqConnection = require("../config/rabbitmq");
const requestService = require("./request.service");

class EventConsumer {
  async startConsuming() {
    try {
      await this._subscribe();

      rabbitmqConnection.onReconnect(async () => {
        console.log("🔄 Re-subscribing to events after RabbitMQ reconnect...");
        await this._subscribe();
      });
    } catch (error) {
      console.error("❌ Error starting event consumer:", error);
    }
  }

  async _subscribe() {
    const channel = rabbitmqConnection.getChannel();

    if (!channel) {
      console.error("❌ RabbitMQ channel not available for consuming");
      return;
    }

    const exchangeName = "wiz.events";
    const queueName = "request-service-queue";

    await channel.assertQueue(queueName, { durable: true });

    const routingKeys = [
      "vehicle.updated",
      "vehicle.status_changed",
      "contract.signed",
      "review.created",
      "review.owner_reviewed",
      "review.response_posted",
      "vehicle.created",
      "chat.message_received",
      "booking.dispute_opened", // ✅ NEW
    ];

    for (const key of routingKeys) {
      await channel.bindQueue(queueName, exchangeName, key);
    }

    console.log(
      `✓ Request service listening for events: ${routingKeys.join(", ")}`,
    );

    channel.consume(
      queueName,
      async (msg) => {
        if (msg) {
          try {
            const event = JSON.parse(msg.content.toString());
            console.log(`📨 Received event: ${event.eventType}`, {
              eventId: event.eventId,
            });

            await this.handleEvent(event);
            channel.ack(msg);
          } catch (error) {
            console.error("❌ Error processing event:", error);
            channel.nack(msg, false, true);
          }
        }
      },
      { noAck: false },
    );
  }

  async handleEvent(event) {
    const { eventType, data } = event;

    try {
      switch (eventType) {
        case "vehicle.updated":
          await this.handleVehicleUpdated(data);
          break;

        case "vehicle.status_changed":
          await this.handleVehicleStatusChanged(data);
          break;

        case "contract.signed":
          await this.handleContractSigned(data);
          break;

        case "vehicle.created":
          await requestService.createVehicleRegisterConfirmationRequest({
            vehicleId: data.vehicleId,
            ownerId: data.ownerId,
            ownerEmail: data.ownerEmail,
            description: `New vehicle registered: ${data.name} (ID: ${data.vehicleId})`,
          });
          console.log(
            `✓ Created vehicle registration confirmation request for new vehicle: ${data.vehicleId}`,
          );
          break;

        case "booking.dispute_opened": // ✅ NEW
          await this.handleDisputeOpened(data);
          break;

        default:
          console.log(`ℹ️ No handler for event type: ${eventType}`);
      }
    } catch (error) {
      console.error(`❌ Error handling event ${eventType}:`, error);
      throw error;
    }
  }

  async handleVehicleUpdated(data) {
    if (data.isYearlyConfirmation) {
      await requestService.createYearlyVehicleConfirmationRequest({
        vehicleId: data.vehicleId,
        ownerId: data.ownerId,
        userId: data.userId || data.ownerId,
        userEmail: data.userEmail,
        description: data.description || "Annual vehicle confirmation required",
      });
      console.log(
        `✓ Created vehicle confirmation request for vehicle: ${data.vehicleId}`,
      );
    } else {
      await requestService.createVehicleUpdateRequest({
        vehicleId: data.vehicleId,
        ownerId: data.ownerId,
        userId: data.ownerId,
        userEmail: data.userEmail,
        updateType: data.updateType || "general",
        description: data.description,
      });
      console.log(
        `✓ Created vehicle update request for vehicle: ${data.vehicleId}`,
      );
    }
  }

  async handleVehicleStatusChanged(data) {
    let category = "vehicle_listing";
    let title = `Vehicle Status Changed - Vehicle #${data.vehicleId}`;

    if (data.newStatus === "deactivated" || data.action === "deactivate") {
      category = "vehicle_deactivation";
      title = `Vehicle Deactivation Request - Vehicle #${data.vehicleId}`;
    } else if (data.newStatus === "active" || data.action === "reactivate") {
      category = "vehicle_reactivation";
      title = `Vehicle Reactivation Request - Vehicle #${data.vehicleId}`;
    }

    await requestService.createRequest(data.userId || data.ownerId, {
      userEmail: data.userEmail,
      ownerId: data.ownerId,
      vehicleId: data.vehicleId,
      category,
      title,
      description: data.reason || `Vehicle status change to: ${data.newStatus}`,
      priority: "medium",
    });

    console.log(
      `✓ Created vehicle status change request for vehicle: ${data.vehicleId}`,
    );
  }

  async handleContractSigned(data) {
    await requestService.createBookingConfirmationRequest({
      bookingId: data.bookingId,
      vehicleId: data.vehicleId,
      customerId: data.customerId,
      ownerId: data.ownerId,
      userId: data.customerId,
      userEmail: data.customerEmail,
    });

    console.log(
      `✓ Created booking confirmation request for booking: ${data.bookingId}`,
    );
  }

  // ✅ NEW
  async handleDisputeOpened(data) {
    await requestService.createRequest(data.ownerId, {
      userEmail: data.ownerEmail,
      ownerId: data.ownerId,
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      bookingId: data.bookingId,
      category: "damage_report",
      title: `Dispute Opened - Booking #${data.bookingId}`,
      description: `Owner reported damages for booking ID: ${data.bookingId}.\n\nDamages reported: ${data.damagesReported || "No details provided"}`,
      priority: "high",
    });

    console.log(`✓ Created dispute request for booking: ${data.bookingId}`);
  }
}

module.exports = new EventConsumer();
