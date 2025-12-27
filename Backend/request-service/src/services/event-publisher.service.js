const { v4: uuidv4 } = require("uuid");
const rabbitmqConnection = require("../config/rabbitmq");

class EventPublisher {
  async publish(routingKey, eventType, data) {
    try {
      const channel = rabbitmqConnection.channel;

      if (!channel) {
        console.error("RabbitMQ channel not available");
        return;
      }

      const event = {
        eventId: uuidv4(),
        eventType,
        timestamp: new Date().toISOString(),
        data,
        metadata: {
          source: "request-service",
          version: "1.0",
        },
      };

      channel.publish(
        "wiz.events",
        routingKey,
        Buffer.from(JSON.stringify(event)),
        { persistent: true }
      );

      console.log(`📤 Event published: ${routingKey}`, {
        eventId: event.eventId,
        eventType: event.eventType,
      });
    } catch (error) {
      console.error("Error publishing event:", error.message);
    }
  }
}

module.exports = new EventPublisher();
