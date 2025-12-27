const express = require("express");

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Request service is running on the server port 3010.",
  });
});

// Example API route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
