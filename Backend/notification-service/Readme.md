# Notification Service - Quick Guide

## Overview

Notification service does sending emails and push notifications. No data is stored in the service. The service will sends email and push notifications automatically when you publish events to RabbitMQ.

## Features
- Event-driven notification system
- Multi-channel delivery (Email + Push Notifications)
- Automatic OTP email generation
- Branded email templates with Handlebars
- Multi-device push notification support
- Automatic FCM token cleanup
- Booking confirmation emails
- Payment receipt emails
- Real-time chat push notifications
- Asynchronous event processing
- Auto-retry on RabbitMQ connection failure
- Health check endpoint

## Tech Stack
- **Runtime**: Node.js + Express
- **Message Queue**: RabbitMQ (AMQP)
- **Email**: Nodemailer (SMTP)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Template Engine**: Handlebars
- **Service Communication**: Axios (REST)
- **Security**: Helmet, CORS, Rate Limiting
- **Event Pattern**: Topic-based routing

## How to Use

### 1. Publish an Event

```javascript
const amqp = require("amqplib");

async function sendNotification(eventType, data) {
  const connection = await amqp.connect("amqp://localhost:5672");
  const channel = await connection.createChannel();
  
  await channel.assertExchange("wiz.events", "topic", { durable: true });
  
  const event = {
    eventId: `event-${Date.now()}`,
    eventType: eventType,
    timestamp: new Date().toISOString(),
    data: data
  };
  
  channel.publish(
    "wiz.events",
    eventType,
    Buffer.from(JSON.stringify(event)),
    { persistent: true }
  );
  
  setTimeout(() => connection.close(), 500);
}
```

### 2. Use the Right Event Type

**User Events:**
```javascript
// Send OTP email
await sendNotification("user.registered", {
  email: "user@example.com",
  otp: "123456"
});

// Password reset OTP
await sendNotification("user.password_reset_requested", {
  email: "user@example.com",
  otp: "123456"
});
```

**Booking Events:**
```javascript
// Booking confirmed
await sendNotification("booking.accepted_by_owner", {
  customerEmail: "customer@example.com",
  customerName: "John Doe",
  bookingId: "BK-12345",
  vehicleName: "Toyota Camry 2023",
  startDate: "2025-01-15 10:00",
  endDate: "2025-01-20 10:00",
  totalAmount: "5000000"
});

// Booking cancelled
await sendNotification("booking.cancelled", {
  bookingId: "BK-12345",
  customerEmail: "customer@example.com",
  ownerEmail: "owner@example.com"
});
```

**Payment Events:**
```javascript
// Payment received
await sendNotification("payment.deposit_completed", {
  userEmail: "user@example.com",
  customerName: "John Doe",
  transactionId: "TXN-123",
  bookingId: "BK-12345",
  type: "deposit",
  amount: "2000000"
});
```

**Push Notifications:**
```javascript
// Chat message (push only)
await sendNotification("chat.message_received", {
  recipientUserId: "user-uuid-here",
  senderId: "sender-id",
  senderName: "John Doe",
  messagePreview: "Hey! Are you available?",
  chatId: "chat-123"
});
```

## All Available Events

| Event Type | Required Data | Sends |
|------------|---------------|-------|
| `user.registered` | email, otp | Email |
| `user.password_reset_requested` | email, otp | Email |
| `user.password_changed` | email | Email |
| `booking.created` | customerEmail, customerName, bookingId, vehicleName, startDate, endDate, totalAmount | Email |
| `booking.accepted_by_owner` | customerEmail, customerName, bookingId, vehicleName, startDate, endDate, totalAmount | Email |
| `booking.rejected_by_owner` | customerEmail, vehicleName, reason | Email |
| `booking.completed` | customerEmail | Email |
| `booking.cancelled` | bookingId, customerEmail, ownerEmail | Email |
| `payment.deposit_completed` | userEmail, customerName, transactionId, bookingId, type, amount | Email |
| `payment.final_completed` | userEmail, customerName, transactionId, bookingId, type, amount | Email |
| `payment.refund_completed` | userEmail, amount | Email |
| `vehicle.status_changed` | ownerEmail, newStatus | Email |
| `chat.message_received` | recipientUserId, senderId, senderName, messagePreview, chatId | Push |

## Quick Test

```bash
# Test email notification
node publishEvent.js

# Test push notification
node testChatNotification.js
```