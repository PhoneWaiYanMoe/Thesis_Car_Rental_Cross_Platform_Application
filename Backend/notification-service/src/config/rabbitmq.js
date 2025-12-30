const amqp = require("amqplib");
require("dotenv").config();

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // create exchange
    await channel.assertExchange("wiz.events", "topic", { durable: true });

    console.log("Notification Service: RabbitMQ connected");

    return { connection, channel };
  } catch (error) {
    console.error("Notification Service: RabbitMQ connection failed:", error);
    // retry after 5 seconds
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
