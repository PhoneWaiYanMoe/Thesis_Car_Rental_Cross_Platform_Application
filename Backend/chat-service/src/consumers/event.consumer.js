const { getChannel } = require("../config/rabbitmq");
const conversationService = require("../services/conversation.service");

class EventConsumer {
  async startConsuming() {
    const channel = getChannel();

    if (!channel) {
      console.error("RabbitMQ channel not available");
      return;
    }

    const exchange = "wiz.events";
    const queue = "chat-service-queue";

    // assert queue
    await channel.assertQueue(queue, { durable: true });

    // bind to relevant routing keys
    const routingKeys = [
      "booking.accepted_by_owner",
      "booking.completed",
      "user.status_changed",
    ];

    for (const key of routingKeys) {
      await channel.bindQueue(queue, exchange, key);
    }

    console.log("Chat event consumer started, waiting for messages...");

    // consume messages
    channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          console.log(`Received event: ${event.eventType}`);

          await this.handleEvent(event);

          channel.ack(msg);
        } catch (error) {
          console.error("Error processing event:", error);
          channel.nack(msg, false, true);
        }
      }
    });
  }

  async handleEvent(event) {
    const { eventType, data } = event;

    try {
      switch (eventType) {
        case "booking.accepted_by_owner":
          // create conversation when booking is confirmed
          await conversationService.createConversation(
            data.bookingId,
            data.customerId,
            data.ownerId,
            data.vehicleId
          );
          console.log(`Conversation created for booking ${data.bookingId}`);
          break;

        case "booking.completed":
          // optionally close conversation
          // await conversationService.closeConversation(data.bookingId);
          console.log(`Booking ${data.bookingId} completed`);
          break;

        case "user.status_changed":
          // handle user banned, could block their conversations
          if (data.newStatus === "banned") {
            console.log(`User ${data.userId} was banned`);
          }
          break;

        default:
          console.log(`No handler for event: ${eventType}`);
      }
    } catch (error) {
      console.error(`Error handling ${eventType}:`, error);
      throw error;
    }
  }
}

module.exports = new EventConsumer();
