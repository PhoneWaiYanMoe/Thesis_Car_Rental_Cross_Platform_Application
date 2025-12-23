const transporter = require('../config/nodemailer');
const handlebars = require('handlebars');
require('dotenv').config();

class EmailService {
  
  /**
   * Send email using template
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} template - HTML template string
   * @param {object} variables - Variables to replace in template
   * @returns {Promise} - Send result
   */
  async sendEmail(to, subject, template, variables = {}) {
    try {
      // Compile template with Handlebars
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(variables);

      // Email options
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: to,
        subject: subject,
        html: html
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent to ${to}: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('❌ Email send failed:', error);
      throw error;
    }
  }

  /**
   * Send OTP verification email
   */
  async sendOTPEmail(email, otp, purpose = 'Email Verification') {
    const subject = `${purpose} - Your OTP Code`;
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Wiz Car Rental</h1>
            <p>{{purpose}}</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your OTP code is:</p>
            <div class="otp-box">
              <div class="otp-code">{{otp}}</div>
            </div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Wiz Car Rental. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, template, { otp, purpose });
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(email, bookingData) {
    const subject = 'Booking Confirmed - Wiz Car Rental';
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #667eea; }
          .button { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
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
            <p>© 2024 Wiz Car Rental. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, template, {
      ...bookingData,
      bookingUrl: `${process.env.FRONTEND_URL}/bookings/${bookingData.bookingId}`
    });
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceipt(email, paymentData) {
    const subject = 'Payment Receipt - Wiz Car Rental';
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .receipt-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total-row { font-size: 18px; font-weight: bold; color: #10b981; }
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
              <div class="detail-row total-row">
                <span>Amount Paid:</span>
                <span>{{amount}} VND</span>
              </div>
            </div>

            <p>Thank you for your payment!</p>
          </div>
          <div class="footer">
            <p>© 2024 Wiz Car Rental. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, template, paymentData);
  }

  /**
   * Send generic notification email
   */
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
            <h1>🔔 {{title}}</h1>
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
            <p>© 2024 Wiz Car Rental. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, template, { title, message, actionUrl });
  }
}

module.exports = new EmailService();