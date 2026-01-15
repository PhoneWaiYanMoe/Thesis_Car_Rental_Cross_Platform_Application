const { getChannel } = require("../config/rabbitmq");
const notificationService = require("../services/notification.service");
const emailService = require("../services/email.service");

class EventConsumer {
  async startConsuming() {
    const channel = getChannel();

    if (!channel) {
      console.error("RabbitMQ channel not available");
      return;
    }

    const exchange = "wiz.events";
    const queue = "notification-service-queue";

    await channel.assertQueue(queue, { durable: true });

    const routingKeys = [
      "user.registered",
      "user.password_reset_requested",
      "user.password_changed",
      "user.license_uploaded",
      "user.status_changed",
      "booking.created",
      "booking.accepted_by_owner",
      "booking.rejected_by_owner",
      "booking.pickup_confirmed",
      "booking.completed",
      "booking.cancelled",
      "payment.deposit_completed",
      "payment.final_completed",
      "payment.refund_initiated",
      "payment.refund_completed",
      "payment.payout_completed",
      "review.created",
      "review.owner_reviewed",
      "review.response_posted",
      "vehicle.created",
      "vehicle.status_changed",
      "request.created",
      "request.approved",
      "request.denied",
      "contract.signed",
      "staff.created",
    ];

    for (const key of routingKeys) {
      await channel.bindQueue(queue, exchange, key);
    }

    console.log("Notification consumer started, waiting for messages...");

    channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          console.log(`Received event: ${event.eventType}`);

          await this.handleEvent(event);

          channel.ack(msg);
        } catch (error) {
          console.error("Error processing event:", error);
          channel.nack(msg, false, true);
        }
      }
    });
  }

  async handleEvent(event) {
    const { eventType, data } = event;

    try {
      switch (eventType) {
        // user events
        case "user.registered":
          await emailService.sendOTPEmail(
            data.email,
            data.otp,
            "Email Verification"
          );
          break;

        case "user.password_reset_requested":
          await emailService.sendOTPEmail(
            data.email,
            data.otp,
            "Password Reset"
          );
          break;

        case "user.password_changed":
          await notificationService.sendNotification(
            "system",
            "Password Changed",
            "Your password has been changed successfully.",
            { email: data.email },
            ["email"]
          );
          break;

        case "user.license_uploaded":
          await notificationService.sendNotification(
            "request",
            "License Submitted",
            "Your driver license has been submitted for verification.",
            { email: data.email },
            ["email"]
          );
          break;

        case "user.status_changed":
          await notificationService.sendNotification(
            "system",
            "Account Status Updated",
            `Your account status has been changed to: ${data.newStatus}`,
            { email: data.email },
            ["email"]
          );
          break;

        // booking events
        case "booking.created":
          await notificationService.sendNotification(
            "booking",
            "Booking Created",
            `Your booking for ${data.vehicleName} has been created.`,
            {
              email: data.customerEmail,
              bookingData: {
                customerName: data.customerName,
                bookingId: data.bookingId,
                vehicleName: data.vehicleName,
                startDate: data.startDate,
                endDate: data.endDate,
                totalAmount: data.totalAmount,
              },
            },
            ["email"]
          );
          break;

        case "booking.accepted_by_owner":
          await notificationService.sendNotification(
            "booking",
            "Booking Confirmed!",
            `Your booking for ${data.vehicleName} has been confirmed.`,
            {
              email: data.customerEmail,
              bookingData: {
                customerName: data.customerName,
                bookingId: data.bookingId,
                vehicleName: data.vehicleName,
                startDate: data.startDate,
                endDate: data.endDate,
                totalAmount: data.totalAmount,
              },
            },
            ["email"]
          );
          break;

        case "booking.rejected_by_owner":
          await notificationService.sendNotification(
            "booking",
            "Booking Rejected",
            `Your booking for ${data.vehicleName} was not accepted.`,
            {
              email: data.customerEmail,
              reason: data.reason,
            },
            ["email"]
          );
          break;

        case "booking.pickup_confirmed":
          await notificationService.sendNotification(
            "booking",
            "Vehicle Picked Up",
            `${data.customerName} has picked up your vehicle.`,
            { email: data.ownerEmail },
            ["email"]
          );
          break;

        case "booking.completed":
          await notificationService.sendNotification(
            "booking",
            "Rental Completed",
            "Thank you for renting! Please rate your experience.",
            {
              email: data.customerEmail,
            },
            ["email"]
          );
          break;

        case "booking.cancelled":
          // send to customer
          if (data.customerEmail) {
            await notificationService.sendNotification(
              "booking",
              "Booking Cancelled",
              `Booking ${data.bookingId} has been cancelled.`,
              {
                email: data.customerEmail,
              },
              ["email"]
            );
          }
          // send to owner
          if (data.ownerEmail) {
            await notificationService.sendNotification(
              "booking",
              "Booking Cancelled",
              `Booking ${data.bookingId} has been cancelled.`,
              {
                email: data.ownerEmail,
              },
              ["email"]
            );
          }
          break;

        // payment events
        case "payment.deposit_completed":
        case "payment.final_completed":
          await notificationService.sendNotification(
            "payment",
            "Payment Successful",
            `Payment of ${data.amount} VND received.`,
            {
              email: data.userEmail,
              paymentData: {
                customerName: data.customerName,
                transactionId: data.transactionId,
                bookingId: data.bookingId,
                paymentType: data.type,
                amount: data.amount,
                paymentDate: new Date().toISOString(),
              },
            },
            ["email"]
          );
          break;

        case "payment.refund_initiated":
          await notificationService.sendNotification(
            "payment",
            "Refund Processing",
            `Your refund of ${data.amount} VND is being processed.`,
            {
              email: data.userEmail,
            },
            ["email"]
          );
          break;

        case "payment.refund_completed":
          await notificationService.sendNotification(
            "payment",
            "Refund Completed",
            `Your refund of ${data.amount} VND has been completed.`,
            {
              email: data.userEmail,
            },
            ["email"]
          );
          break;

        case "payment.payout_completed":
          await notificationService.sendNotification(
            "payment",
            "Payout Completed",
            `Payout of ${data.amount} VND transferred to your account.`,
            {
              email: data.ownerEmail,
            },
            ["email"]
          );
          break;

        // review events
        case "review.created":
          await notificationService.sendNotification(
            "review",
            "New Review Received",
            `You received a ${data.rating}-star review for ${data.vehicleName}.`,
            { email: data.ownerEmail },
            ["email"]
          );
          break;

        case "review.owner_reviewed":
          await notificationService.sendNotification(
            "review",
            "New Owner Review",
            `You received a ${data.rating}-star rating from ${data.customerName}.`,
            { email: data.ownerEmail },
            ["email"]
          );
          break;

        case "review.response_posted":
          await notificationService.sendNotification(
            "review",
            "Owner Responded",
            "The owner responded to your review.",
            { email: data.reviewerEmail },
            ["email"]
          );
          break;

        // vehicle events
        case "vehicle.created":
          await notificationService.sendNotification(
            "vehicle",
            "Vehicle Submitted",
            "Your vehicle listing has been submitted for review.",
            {
              email: data.ownerEmail,
            },
            ["email"]
          );
          break;

        case "vehicle.status_changed":
          await notificationService.sendNotification(
            "vehicle",
            "Vehicle Status Updated",
            `Your vehicle status has been changed to: ${data.newStatus}`,
            {
              email: data.ownerEmail,
            },
            ["email"]
          );
          break;

        // request events
        case "request.created":
          await notificationService.sendNotification(
            "request",
            "Request Created",
            `Your request "${data.title}" has been created.`,
            { email: data.userEmail },
            ["email"]
          );
          break;

        case "request.approved":
          await notificationService.sendNotification(
            "request",
            "Request Approved",
            `Your request "${data.title}" has been approved.`,
            { email: data.userEmail },
            ["email"]
          );
          break;

        case "request.denied":
          await notificationService.sendNotification(
            "request",
            "Request Denied",
            `Your request "${data.title}" was denied. Reason: ${data.reason}`,
            { email: data.userEmail },
            ["email"]
          );
          break;

        // contract events
        case "contract.signed":
          await notificationService.sendNotification(
            "booking",
            "Contract Signed",
            `${data.customerName} has signed the rental contract.`,
            { email: data.ownerEmail },
            ["email"]
          );
          break;

        // chat events (push notification only events)
        case "chat.message_received":
          await notificationService.sendNotification(
            "chat",
            data.senderName,
            data.messagePreview,
            {
              userId: data.recipientUserId,
              chatId: data.chatId,
              senderId: data.senderId,
              senderName: data.senderName,
              type: "chat_message",
            },
            ["push"]
          );
          break;

        default:
          console.log(`No handler for event: ${eventType}`);
      }
    } catch (error) {
      console.error(`Error handling ${eventType}:`, error);
      throw error;
    }
  }
}

module.exports = new EventConsumer();
