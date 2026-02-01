const amqp = require("amqplib");

let connection = null;
let channel = null;
let isConnecting = false;

const connectRabbitMQ = async (retryCount = 0) => {
  if (isConnecting) {
    console.log("⏳ Connection already in progress...");
    return { connection, channel };
  }

  isConnecting = true;

  try {
    const RABBITMQ_URL =
      process.env.RABBITMQ_URL || "amqp://admin:admin123@rabbitmq:5672";

    console.log(`🔄 Connecting to RabbitMQ... (Attempt ${retryCount + 1})`);
    console.log(`📡 URL: ${RABBITMQ_URL.replace(/\/\/.*@/, "//***:***@")}`);

    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Create exchange
    await channel.assertExchange("wiz.events", "topic", { durable: true });

    console.log("✅ Notification Service: RabbitMQ connected");
    console.log("✅ Exchange 'wiz.events' ready");

    isConnecting = false;

    // Handle connection errors
    connection.on("error", (err) => {
      console.error("❌ RabbitMQ connection error:", err.message);
      connection = null;
      channel = null;
      isConnecting = false;
      setTimeout(() => connectRabbitMQ(0), 5000);
    });

    connection.on("close", () => {
      console.log("⚠️ RabbitMQ connection closed");
      connection = null;
      channel = null;
      isConnecting = false;
      setTimeout(() => connectRabbitMQ(0), 5000);
    });

    // Handle channel errors
    channel.on("error", (err) => {
      console.error("❌ RabbitMQ channel error:", err.message);
    });

    channel.on("close", () => {
      console.log("⚠️ RabbitMQ channel closed");
      channel = null;
    });

    return { connection, channel };
  } catch (error) {
    console.error(
      `❌ Notification Service: RabbitMQ connection failed (Attempt ${
        retryCount + 1
      }):`,
      error.message
    );

    isConnecting = false;
    connection = null;
    channel = null;

    // Retry with exponential backoff
    const maxRetries = 10;
    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectRabbitMQ(retryCount + 1);
    } else {
      console.error("❌ Max retries reached. Please check RabbitMQ service.");
      throw error;
    }
  }
};

const getChannel = () => {
  if (!channel) {
    console.warn("⚠️ Channel not available. Attempting to reconnect...");
    connectRabbitMQ().catch((err) => {
      console.error("Failed to reconnect:", err);
    });
  }
  return channel;
};

const getConnection = () => connection;

module.exports = {
  connectRabbitMQ,
  getChannel,
  getConnection,
};
