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

    // Assert queue
    await channel.assertQueue(queue, { durable: true });

    // Bind to relevant routing keys
    const routingKeys = [
      "user.registered",
      "user.verified",
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
      "request.status_changed",
      "request.approved",
      "request.denied",
      "contract.signed",
      "staff.created",
      "staff.status_changed",
    ];

    for (const key of routingKeys) {
      await channel.bindQueue(queue, exchange, key);
    }

    console.log("Notification consumer started, waiting for messages...");

    // Consume messages
    channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          console.log(`Received event: ${event.eventType}`);

          await this.handleEvent(event);

          channel.ack(msg);
        } catch (error) {
          console.error("Error processing event:", error);
          // Reject and requeue if processing fails
          channel.nack(msg, false, true);
        }
      }
    });
  }

  async handleEvent(event) {
    const { eventType, data } = event;

    try {
      switch (eventType) {
        // USER EVENTS
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
          await notificationService.createAndSendNotification(
            data.userId,
            "system",
            "Password Changed",
            "Your password has been changed successfully.",
            {},
            ["email", "in_app"]
          );
          break;

        case "user.license_uploaded":
          await notificationService.createAndSendNotification(
            data.userId,
            "request",
            "License Submitted",
            "Your driver license has been submitted for verification.",
            { requestId: data.requestId },
            ["email", "in_app"]
          );
          break;

        case "user.status_changed":
          await notificationService.createAndSendNotification(
            data.userId,
            "system",
            "Account Status Updated",
            `Your account status has been changed to: ${data.newStatus}`,
            { status: data.newStatus, reason: data.reason },
            ["email", "in_app"]
          );
          break;

        // BOOKING EVENTS
        case "booking.created":
          await notificationService.createAndSendNotification(
            data.customerId,
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
            ["email", "in_app"]
          );
          break;

        case "booking.accepted_by_owner":
          await notificationService.createAndSendNotification(
            data.customerId,
            "booking",
            "Booking Confirmed!",
            `Your booking for ${data.vehicleName} has been confirmed by the owner.`,
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
              bookingId: data.bookingId,
            },
            ["email", "push", "in_app"]
          );
          break;

        case "booking.rejected_by_owner":
          await notificationService.createAndSendNotification(
            data.customerId,
            "booking",
            "Booking Rejected",
            `Your booking request for ${data.vehicleName} was not accepted.`,
            { bookingId: data.bookingId, reason: data.reason },
            ["email", "push", "in_app"]
          );
          break;

        case "booking.pickup_confirmed":
          await notificationService.createAndSendNotification(
            data.ownerId,
            "booking",
            "Vehicle Picked Up",
            `${data.customerName} has picked up your vehicle.`,
            { bookingId: data.bookingId },
            ["push", "in_app"]
          );
          break;

        case "booking.completed":
          await notificationService.createAndSendNotification(
            data.customerId,
            "booking",
            "Rental Completed",
            "Thank you for renting with us! Please rate your experience.",
            { bookingId: data.bookingId },
            ["email", "push", "in_app"]
          );
          break;

        case "booking.cancelled":
          const recipients = [data.customerId, data.ownerId];
          for (const userId of recipients) {
            await notificationService.createAndSendNotification(
              userId,
              "booking",
              "Booking Cancelled",
              `Booking ${data.bookingId} has been cancelled.`,
              { bookingId: data.bookingId, reason: data.reason },
              ["email", "in_app"]
            );
          }
          break;

        // PAYMENT EVENTS
        case "payment.deposit_completed":
        case "payment.final_completed":
          await notificationService.createAndSendNotification(
            data.userId,
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
            ["email", "push", "in_app"]
          );
          break;

        case "payment.refund_initiated":
          await notificationService.createAndSendNotification(
            data.userId,
            "payment",
            "Refund Processing",
            `Your refund of ${data.amount} VND is being processed.`,
            { refundId: data.refundId },
            ["email", "in_app"]
          );
          break;

        case "payment.refund_completed":
          await notificationService.createAndSendNotification(
            data.userId,
            "payment",
            "Refund Completed",
            `Your refund of ${data.amount} VND has been completed.`,
            { refundId: data.refundId },
            ["email", "push", "in_app"]
          );
          break;

        case "payment.payout_completed":
          await notificationService.createAndSendNotification(
            data.ownerId,
            "payment",
            "Payout Completed",
            `Payout of ${data.amount} VND has been transferred to your account.`,
            { payoutId: data.payoutId },
            ["email", "push", "in_app"]
          );
          break;

        // REVIEW EVENTS
        case "review.created":
          await notificationService.createAndSendNotification(
            data.ownerId,
            "review",
            "New Review Received",
            `You received a ${data.rating}-star review for ${data.vehicleName}.`,
            { reviewId: data.reviewId, rating: data.rating },
            ["push", "in_app"]
          );
          break;

        case "review.owner_reviewed":
          await notificationService.createAndSendNotification(
            data.ownerId,
            "review",
            "New Owner Review",
            `You received a ${data.rating}-star rating from ${data.customerName}.`,
            { reviewId: data.reviewId },
            ["push", "in_app"]
          );
          break;

        case "review.response_posted":
          await notificationService.createAndSendNotification(
            data.reviewerId,
            "review",
            "Owner Responded",
            "The owner responded to your review.",
            { reviewId: data.reviewId },
            ["push", "in_app"]
          );
          break;

        // VEHICLE EVENTS
        case "vehicle.created":
          await notificationService.createAndSendNotification(
            data.ownerId,
            "vehicle",
            "Vehicle Submitted",
            "Your vehicle listing has been submitted for review.",
            { vehicleId: data.vehicleId },
            ["email", "in_app"]
          );
          break;

        case "vehicle.status_changed":
          await notificationService.createAndSendNotification(
            data.ownerId,
            "vehicle",
            "Vehicle Status Updated",
            `Your vehicle status has been changed to: ${data.newStatus}`,
            { vehicleId: data.vehicleId, status: data.newStatus },
            ["email", "push", "in_app"]
          );
          break;

        // REQUEST EVENTS
        case "request.approved":
          await notificationService.createAndSendNotification(
            data.userId,
            "request",
            "Request Approved",
            `Your request "${data.title}" has been approved.`,
            { requestId: data.requestId },
            ["email", "push", "in_app"]
          );
          break;

        case "request.denied":
          await notificationService.createAndSendNotification(
            data.userId,
            "request",
            "Request Denied",
            `Your request "${data.title}" was not approved. Reason: ${data.reason}`,
            { requestId: data.requestId },
            ["email", "push", "in_app"]
          );
          break;

        // CONTRACT EVENTS
        case "contract.signed":
          await notificationService.createAndSendNotification(
            data.ownerId,
            "booking",
            "Contract Signed",
            `${data.customerName} has signed the rental contract.`,
            { bookingId: data.bookingId, contractId: data.contractId },
            ["email", "in_app"]
          );
          break;

        // STAFF EVENTS
        case "staff.created":
          await emailService.sendNotificationEmail(
            data.email,
            "Welcome to Wiz Support Team",
            `Your support staff account has been created. You can now login with your credentials.`,
            `${process.env.FRONTEND_URL}/login`
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
