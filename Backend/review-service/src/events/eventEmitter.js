const amqp = require("amqplib");

class EventEmitter {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchange = "wiz.events";
    this.connected = false;
  }

  async connect() {
    try {
      const rabbitmqUrl =
        process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

      console.log("📡 Connecting to RabbitMQ...");
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Declare exchange
      await this.channel.assertExchange(this.exchange, "topic", {
        durable: true,
      });

      this.connected = true;
      console.log(`✅ Connected to RabbitMQ exchange: ${this.exchange}`);

      // Handle connection errors
      this.connection.on("error", (err) => {
        console.error("❌ RabbitMQ connection error:", err);
        this.connected = false;
      });

      this.connection.on("close", () => {
        console.log("⚠️  RabbitMQ connection closed");
        this.connected = false;
      });

      return this.channel;
    } catch (error) {
      console.error("❌ Failed to connect to RabbitMQ:", error.message);
      this.connected = false;
      throw error;
    }
  }

  async emit(eventType, data) {
    if (!this.connected || !this.channel) {
      console.warn(
        `⚠️  Cannot emit event ${eventType}: Not connected to RabbitMQ`,
      );
      return false;
    }

    try {
      const message = {
        eventType,
        data,
        timestamp: new Date().toISOString(),
        service: "review-service",
      };

      const routingKey = eventType;

      this.channel.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          contentType: "application/json",
        },
      );

      console.log(`📤 Event emitted: ${eventType}`, {
        routingKey,
        dataKeys: Object.keys(data),
      });

      return true;
    } catch (error) {
      console.error(`❌ Failed to emit event ${eventType}:`, error.message);
      return false;
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
      this.connected = false;
      console.log("RabbitMQ connection closed");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
    }
  }
}

module.exports = new EventEmitter();
