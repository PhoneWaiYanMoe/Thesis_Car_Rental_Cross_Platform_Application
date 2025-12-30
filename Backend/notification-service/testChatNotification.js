const amqp = require("amqplib");

async function testChatNotification() {
  try {
    console.log("Testing Chat Push Notification...\n");

    const connection = await amqp.connect("amqp://localhost:5672");
    const channel = await connection.createChannel();

    const exchange = "wiz.events";
    await channel.assertExchange(exchange, "topic", { durable: true });

    // chat message event
    const event = {
      eventId: `chat-test-${Date.now()}`,
      eventType: "chat.message_received",
      timestamp: new Date().toISOString(),
      data: {
        recipientUserId: "550e8400-e29b-41d4-a716-446655440000", // recipient user ID
        senderId: "abc123-sender-id",
        senderName: "Nguen Van A",
        messagePreview: "Hey! Are you available for pickup tomorrow?",
        chatId: "chat-abc-123",
      },
    };

    channel.publish(
      exchange,
      "chat.message_received",
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );

    console.log("Chat notification event published");
    console.log("Event type:", event.eventType);
    console.log("\nExpected behavior:");
    console.log("1. Notification Service gets user devices from User Service");
    console.log("2. Sends push to all user's devices");
    console.log("3. Cleans up invalid tokens");
    console.log("\nCheck:");
    console.log("- Notification Service terminal for logs");
    console.log("- Mobile device(s) for push notification");

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

testChatNotification();
