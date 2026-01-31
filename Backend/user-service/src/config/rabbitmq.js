// Backend/user-service/src/config/rabbitmq.js
const amqp = require("amqplib");

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://admin:admin123@localhost:5672"
    );
    channel = await connection.createChannel();

    // Assert exchange
    await channel.assertExchange("wiz.events", "topic", { durable: true });

    console.log("✅ User Service: RabbitMQ connected");

    // Handle connection errors
    connection.on("error", (err) => {
      console.error("❌ RabbitMQ connection error:", err);
      setTimeout(connectRabbitMQ, 5000);
    });

    connection.on("close", () => {
      console.log("⚠️ RabbitMQ connection closed, reconnecting...");
      setTimeout(connectRabbitMQ, 5000);
    });

    return { connection, channel };
  } catch (error) {
    console.error(
      "❌ User Service: RabbitMQ connection failed:",
      error.message
    );
    // Retry after 5 seconds
    setTimeout(connectRabbitMQ, 5000);
  }
};

const getChannel = () => channel;
const getConnection = () => connection;

module.exports = {
  connectRabbitMQ,
  getChannel,
  getConnection,
};
