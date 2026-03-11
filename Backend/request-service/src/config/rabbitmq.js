const amqp = require("amqplib");

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.maxRetries = 10;
    this.retryDelay = 5000; // 5 seconds
    this.isReconnecting = false;
    this._onReconnectCallbacks = [];
  }

  async connect(retryCount = 0) {
    try {
      console.log(
        `Attempting to connect to RabbitMQ (attempt ${retryCount + 1}/${this.maxRetries})...`,
      );

      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange("wiz.events", "topic", {
        durable: true,
      });

      // ✅ Auto-reconnect on unexpected close
      this.connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err.message);
      });

      this.connection.on("close", () => {
        console.warn("⚠️ RabbitMQ connection closed — attempting reconnect...");
        this.connection = null;
        this.channel = null;
        this._scheduleReconnect();
      });

      this.channel.on("error", (err) => {
        console.error("RabbitMQ channel error:", err.message);
      });

      this.channel.on("close", () => {
        console.warn("⚠️ RabbitMQ channel closed");
        this.channel = null;
      });

      console.log("✓ Connected to RabbitMQ successfully");
      this.isReconnecting = false;
      return this.channel;
    } catch (error) {
      console.error(
        `RabbitMQ connection error (attempt ${retryCount + 1}/${this.maxRetries}):`,
        error.message,
      );

      if (retryCount < this.maxRetries - 1) {
        console.log(`Retrying in ${this.retryDelay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.connect(retryCount + 1);
      } else {
        console.error(
          "Max retry attempts reached. Could not connect to RabbitMQ.",
        );
        throw error;
      }
    }
  }

  // ✅ Reconnect with delay, then re-trigger consumers
  _scheduleReconnect() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    setTimeout(async () => {
      try {
        await this.connect(0);

        // Re-run any registered post-reconnect callbacks (e.g. re-bind queues)
        for (const cb of this._onReconnectCallbacks) {
          try {
            await cb();
          } catch (err) {
            console.error("Error in reconnect callback:", err.message);
          }
        }
      } catch (err) {
        console.error("❌ Failed to reconnect to RabbitMQ:", err.message);
        // Try again
        this.isReconnecting = false;
        this._scheduleReconnect();
      }
    }, this.retryDelay);
  }

  // ✅ Register a callback to re-run after reconnect (e.g. re-subscribe queues)
  onReconnect(callback) {
    this._onReconnectCallbacks.push(callback);
  }

  getChannel() {
    if (!this.channel) {
      console.warn("⚠️ RabbitMQ channel not available — still reconnecting");
    }
    return this.channel;
  }

  async close() {
    try {
      // Remove close listeners to avoid triggering reconnect on intentional close
      if (this.connection) {
        this.connection.removeAllListeners("close");
        await this.connection.close();
      }
      console.log("RabbitMQ connection closed");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
    }
  }
}

module.exports = new RabbitMQConnection();
