const amqp = require("amqplib");

async function publishEvent() {
  try {
    // connect to RabbitMQ
    const connection = await amqp.connect("amqp://localhost:5672");
    const channel = await connection.createChannel();

    const exchange = "wiz.events";
    await channel.assertExchange(exchange, "topic", { durable: true });

    // event data
    const event = {
      eventId: "test-event-001",
      eventType: "user.registered",
      timestamp: new Date().toISOString(),
      data: {
        userId: "550e8400-e29b-41d4-a716-446655440000",
        email: "maungmyatthiri@gmail.com",
        fullName: "Nguen Van A",
        otp: "987654",
      },
      metadata: {
        source: "test-script",
        version: "1.0",
      },
    };

    // publish to RabbitMQ
    channel.publish(
      exchange,
      "user.registered",
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );

    console.log("Event published to RabbitMQ");
    console.log("Event:", event);
    console.log("\nCheck:");
    console.log("1. Notification Service terminal for logs");
    console.log("2. Your email inbox for OTP email");

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

publishEvent();
