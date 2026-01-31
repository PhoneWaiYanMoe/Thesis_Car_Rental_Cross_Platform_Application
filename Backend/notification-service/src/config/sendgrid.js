const sgMail = require("@sendgrid/mail");

// Initialize SendGrid
if (process.env.EMAIL_PASSWORD) {
  sgMail.setApiKey(process.env.EMAIL_PASSWORD);
  console.log("✅ SendGrid API initialized");
} else {
  console.error("❌ SendGrid API key not configured");
}

// Verify connection
const verifyConnection = async () => {
  try {
    if (!process.env.EMAIL_PASSWORD) {
      throw new Error("SendGrid API key not configured");
    }
    console.log("✅ SendGrid configuration verified");
    return true;
  } catch (error) {
    console.error("❌ SendGrid configuration error:", error.message);
    return false;
  }
};

// Call verification on startup
verifyConnection();

module.exports = sgMail;
