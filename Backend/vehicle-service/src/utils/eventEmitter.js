// Backend/vehicle-service/src/utils/eventEmitter.js
const amqp = require("amqplib");

class EventEmitter {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchange = "wiz_events";
    this.isConnecting = false;
    this.reconnectTimeout = null;
  }

  async connect() {
    if (this.isConnecting) {
      console.log("⏳ RabbitMQ connection already in progress...");
      return;
    }

    try {
      this.isConnecting = true;
      const rabbitMQUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";

      console.log(`🔌 Connecting to RabbitMQ at ${rabbitMQUrl}...`);
      this.connection = await amqp.connect(rabbitMQUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchange, "topic", {
        durable: true,
      });

      console.log("✅ Connected to RabbitMQ and exchange created");

      // Handle connection errors
      this.connection.on("error", (err) => {
        console.error("❌ RabbitMQ connection error:", err.message);
        this.reconnect();
      });

      this.connection.on("close", () => {
        console.log("⚠️ RabbitMQ connection closed");
        this.reconnect();
      });

      this.isConnecting = false;
    } catch (error) {
      console.error("❌ Failed to connect to RabbitMQ:", error.message);
      this.isConnecting = false;
      this.reconnect();
    }
  }

  reconnect() {
    if (this.reconnectTimeout) {
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log("🔄 Attempting to reconnect to RabbitMQ...");
      this.reconnectTimeout = null;
      this.connect();
    }, 5000);
  }

  async emit(eventType, data) {
    try {
      if (!this.channel) {
        console.warn(
          "⚠️ RabbitMQ channel not available, attempting to connect...",
        );
        await this.connect();
      }

      if (!this.channel) {
        console.error("❌ Cannot emit event - RabbitMQ not connected");
        return false;
      }

      const eventPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        service: "vehicle-service",
        data: data,
      };

      const message = Buffer.from(JSON.stringify(eventPayload));

      this.channel.publish(this.exchange, eventType, message, {
        persistent: true,
        contentType: "application/json",
      });

      console.log(`📤 Event emitted: ${eventType}`, data);
      return true;
    } catch (error) {
      console.error(`❌ Failed to emit event ${eventType}:`, error.message);
      return false;
    }
  }

  async subscribe(eventTypes, callback) {
    try {
      if (!this.channel) {
        await this.connect();
      }

      const queue = "vehicle-service-queue";
      await this.channel.assertQueue(queue, { durable: true });

      // Bind to all event types
      for (const eventType of eventTypes) {
        await this.channel.bindQueue(queue, this.exchange, eventType);
        console.log(`📥 Subscribed to: ${eventType}`);
      }

      this.channel.consume(
        queue,
        async (msg) => {
          if (msg !== null) {
            try {
              const event = JSON.parse(msg.content.toString());
              console.log(`📨 Received event: ${event.event}`);
              await callback(event);
              this.channel.ack(msg);
            } catch (error) {
              console.error("❌ Error processing event:", error.message);
              this.channel.nack(msg, false, false); // Don't requeue
            }
          }
        },
        { noAck: false },
      );

      console.log(`✅ Event consumer started for vehicle-service`);
    } catch (error) {
      console.error("❌ Failed to subscribe to events:", error.message);
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log("✅ RabbitMQ connection closed gracefully");
    } catch (error) {
      console.error("❌ Error closing RabbitMQ connection:", error);
    }
  }
}

// Export singleton instance
module.exports = new EventEmitter();
