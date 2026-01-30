const sgMail = require("../config/sendgrid");
const handlebars = require("handlebars");
require("dotenv").config();

class EmailService {
  /**
   * Send email using SendGrid API
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} template - HTML template string
   * @param {object} variables - Variables to replace in template
   * @returns {Promise} - Send result
   */
  async sendEmail(to, subject, template, variables = {}) {
    try {
      // Compile template with handlebars
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(variables);

      // Email options for SendGrid
      const msg = {
        to: to,
        from: {
          email: process.env.EMAIL_FROM_ADDRESS,
          name: process.env.EMAIL_FROM_NAME || "Wiz Car Rental",
        },
        subject: subject,
        html: html,
      };

      // Send email via SendGrid API
      const response = await sgMail.send(msg);

      console.log(`✅ Email sent to ${to} via SendGrid`);
      console.log(`📧 Message ID: ${response[0].headers["x-message-id"]}`);

      return {
        success: true,
        messageId: response[0].headers["x-message-id"],
        statusCode: response[0].statusCode,
      };
    } catch (error) {
      console.error("❌ SendGrid email send failed:", error);

      if (error.response) {
        console.error("SendGrid Error Details:", error.response.body);
      }

      throw error;
    }
  }

  // Send OTP verification email
  async sendOTPEmail(email, otp, purpose = "Email Verification") {
    const subject = `${purpose} - Your OTP Code`;
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            margin: 0;
            background: #f3f4f6;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #111827;
          }
          .wrapper {
            padding: 32px 16px;
          }
          .card {
            max-width: 560px;
            margin: auto;
            background: #ffffff;
            border-radius: 10px;
            padding: 32px;
          }
          .brand {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 24px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 12px;
          }
          .otp {
            font-size: 32px;
            letter-spacing: 6px;
            font-weight: 700;
            text-align: center;
            padding: 20px;
            margin: 24px 0;
            background: #f9fafb;
            border-radius: 8px;
          }
          .muted {
            color: #6b7280;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 24px;
            font-size: 12px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="brand">Wiz Car Rental</div>

            <div class="title">{{purpose}}</div>
            <p>Please use the following one-time password to continue:</p>

            <div class="otp">{{otp}}</div>

            <p class="muted">
              This code will expire in 10 minutes.<br>
              If you did not request this, you can safely ignore this email.
            </p>
          </div>

          <div class="footer">
            © 2025 Wiz Car Rental
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, template, { otp, purpose });
  }

  // Send booking confirmation email
  async sendBookingConfirmation(email, bookingData) {
    const subject = "Booking Confirmed - Wiz Car Rental";
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6679C0; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #667eea; }
          .button { background: #6679C0; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi {{customerName}},</p>
            <p>Great news! Your booking has been confirmed.</p>
            
            <div class="booking-card">
              <h3>Booking Details</h3>
              <div class="detail-row">
                <span class="label">Booking ID:</span>
                <span>{{bookingId}}</span>
              </div>
              <div class="detail-row">
                <span class="label">Vehicle:</span>
                <span>{{vehicleName}}</span>
              </div>
              <div class="detail-row">
                <span class="label">Pickup:</span>
                <span>{{startDate}}</span>
              </div>
              <div class="detail-row">
                <span class="label">Return:</span>
                <span>{{endDate}}</span>
              </div>
              <div class="detail-row">
                <span class="label">Total Amount:</span>
                <span><strong>{{totalAmount}} VND</strong></span>
              </div>
            </div>

            <center>
              <a href="{{bookingUrl}}" class="button">View Booking Details</a>
            </center>

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Complete final payment before pickup</li>
              <li>Bring your driver's license</li>
              <li>Arrive 15 minutes before pickup time</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2025 Wiz Car Rental. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, template, {
      ...bookingData,
      bookingUrl: `${process.env.FRONTEND_URL}/bookings/${bookingData.bookingId}`,
    });
  }

  // Send payment receipt email
  async sendPaymentReceipt(email, paymentData) {
    const subject = "Payment Receipt - Wiz Car Rental";
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6679C0; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .receipt-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Successful</h1>
          </div>
          <div class="content">
            <p>Hi {{customerName}},</p>
            <p>Your payment has been processed successfully.</p>
            
            <div class="receipt-card">
              <h3>Payment Receipt</h3>
              <div class="detail-row">
                <span>Transaction ID:</span>
                <span>{{transactionId}}</span>
              </div>
              <div class="detail-row">
                <span>Booking ID:</span>
                <span>{{bookingId}}</span>
              </div>
              <div class="detail-row">
                <span>Payment Type:</span>
                <span>{{paymentType}}</span>
              </div>
              <div class="detail-row">
                <span>Date:</span>
                <span>{{paymentDate}}</span>
              </div>
              <div class="detail-row">
                <span>Amount Paid:</span>
                <span><strong>{{amount}} VND</strong></span>
              </div>
            </div>

            <p>Thank you for your payment!</p>
          </div>
          <div class="footer">
            <p>© 2025 Wiz Car Rental. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, template, paymentData);
  }

  // Send generic notification email
  async sendNotificationEmail(email, title, message, actionUrl = null) {
    const subject = title;
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; }
          .button { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>{{title}}</h1>
          </div>
          <div class="content">
            <div class="message-box">
              <p>{{message}}</p>
            </div>
            {{#if actionUrl}}
            <center>
              <a href="{{actionUrl}}" class="button">Take Action</a>
            </center>
            {{/if}}
          </div>
          <div class="footer">
            <p>© 2025 Wiz Car Rental. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, template, {
      title,
      message,
      actionUrl,
    });
  }
}

module.exports = new EmailService();
