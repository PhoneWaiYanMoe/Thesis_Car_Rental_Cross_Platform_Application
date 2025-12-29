const amqp = require("amqplib");

async function publishBookingEvent() {
  const connection = await amqp.connect("amqp://localhost:5672");
  const channel = await connection.createChannel();
  await channel.assertExchange("wiz.events", "topic", { durable: true });

  const event = {
    eventId: "test-booking-001",
    eventType: "booking.accepted_by_owner",
    timestamp: new Date().toISOString(),
    data: {
      customerId: "550e8400-e29b-41d4-a716-446655440000",
      customerEmail: "maungmyatthiri@example.com",
      customerName: "Nguen Van A",
      bookingId: "3f1c9a2e-8b4d-4c7a-9e6f-2d1a5b9c8e42",
      vehicleName: "BMW X1 2020",
      startDate: "2024-12-25 09:00",
      endDate: "2024-12-28 18:00",
      totalAmount: "2,940,000",
    },
  };

  channel.publish(
    "wiz.events",
    "booking.accepted_by_owner",
    Buffer.from(JSON.stringify(event)),
    { persistent: true }
  );

  console.log("Booking event published");
  console.log("Check email and in-app notifications!");

  setTimeout(() => {
    connection.close();
    process.exit(0);
  }, 500);
}

publishBookingEvent();
