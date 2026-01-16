const amqp = require("amqplib");

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.maxRetries = 10;
    this.retryDelay = 3000; // 3 seconds
  }

  async connect(retryCount = 0) {
    try {
      console.log(
        `Attempting to connect to RabbitMQ (attempt ${retryCount + 1}/${
          this.maxRetries
        })...`
      );

      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange("wiz.events", "topic", {
        durable: true,
      });

      // Handle connection errors
      this.connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err.message);
      });

      this.connection.on("close", () => {
        console.log("RabbitMQ connection closed");
      });

      console.log("✓ Connected to RabbitMQ successfully");

      return this.channel;
    } catch (error) {
      console.error(
        `RabbitMQ connection error (attempt ${retryCount + 1}/${
          this.maxRetries
        }):`,
        error.message
      );

      if (retryCount < this.maxRetries - 1) {
        console.log(`Retrying in ${this.retryDelay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.connect(retryCount + 1);
      } else {
        console.error(
          "Max retry attempts reached. Could not connect to RabbitMQ."
        );
        throw error;
      }
    }
  }

  getChannel() {
    if (!this.channel) {
      console.warn("RabbitMQ channel is not available");
    }
    return this.channel;
  }

  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      console.log("RabbitMQ connection closed");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
    }
  }
}

module.exports = new RabbitMQConnection();
