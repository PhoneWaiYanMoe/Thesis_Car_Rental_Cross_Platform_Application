const amqp = require("amqplib");
require("dotenv").config();

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Create exchange
    await channel.assertExchange("wiz.events", "topic", { durable: true });

    console.log("Notification Service: RabbitMQ connected");

    return { connection, channel };
  } catch (error) {
    console.error("Notification Service: RabbitMQ connection failed:", error);
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
