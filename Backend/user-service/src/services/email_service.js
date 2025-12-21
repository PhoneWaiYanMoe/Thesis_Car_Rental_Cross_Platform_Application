const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    // In development without credentials, use Ethereal Email (fake SMTP)
    if (process.env.NODE_ENV === "development" && !process.env.EMAIL_USER) {
      console.log("⚠️  No email credentials - using Ethereal fake SMTP");
      try {
        const testAccount = await nodemailer.createTestAccount();

        this.transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        console.log("📧 Ethereal Email setup - Check preview URLs in console");
        return;
      } catch (error) {
        console.error("❌ Ethereal setup failed:", error.message);
        // Continue with null transporter
      }
    }

    // Production: Use real SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection
    try {
      await this.transporter.verify();
      console.log("✅ Email service ready");
    } catch (error) {
      console.error("❌ Email verification failed:", error.message);
      console.error("💡 Check your EMAIL_USER and EMAIL_PASSWORD in .env");
      console.error("💡 For Gmail, use an App Password (not regular password)");
    }
  }

  async sendOTPEmail(to, otp, subject) {
    if (!this.transporter) {
      await this.initTransporter();
    }

    const mailOptions = {
      from: `"Wiz Car Rental" <${
        process.env.EMAIL_USER || "test@ethereal.email"
      }>`,
      to,
      subject: `${subject} - OTP Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6C5CE7;">${subject}</h2>
          <p>Your verification code is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in ${
            process.env.OTP_EXPIRY_MINUTES || 10
          } minutes.</p>
          <p style="color: #666;">If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Wiz Car Rental - Rent with confidence</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${to}`);

      // If using Ethereal, show preview URL
      if (
        process.env.NODE_ENV === "development" &&
        nodemailer.getTestMessageUrl(info)
      ) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log("📧 Email Preview URL:", previewUrl);
        console.log("📧 Open this URL in your browser to see the email");
      }

      return info;
    } catch (error) {
      console.error("❌ Email sending failed:", error.message);

      // Log more details for debugging
      if (error.code === "EAUTH") {
        console.error(
          "💡 Authentication failed - Check EMAIL_USER and EMAIL_PASSWORD"
        );
        console.error(
          "💡 For Gmail: Go to https://myaccount.google.com/apppasswords"
        );
      } else if (error.code === "ESOCKET") {
        console.error("💡 Connection failed - Check EMAIL_HOST and EMAIL_PORT");
      } else if (error.code === "ETIMEDOUT") {
        console.error("💡 Connection timeout - Check your internet connection");
      }

      throw error;
    }
  }
}

module.exports = new EmailService();
