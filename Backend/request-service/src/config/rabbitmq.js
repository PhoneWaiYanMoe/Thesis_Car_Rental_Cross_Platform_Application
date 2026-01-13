const amqp = require("amqplib");

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange("wiz.events", "topic", {
        durable: true,
      });

      console.log("Connected to RabbitMQ");

      return this.channel;
    } catch (error) {
      console.error("RabbitMQ connection error:", error.message);
      throw error;
    }
  }

  getChannel() {
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
