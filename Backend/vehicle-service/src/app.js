require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const vehicleRoutes = require("./routes/vehicle_routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "vehicle-service",
    timestamp: new Date().toISOString(),
  });
});

// Load Swagger documentation
let swaggerDocument;
try {
  const yamlPath = path.join(__dirname, "../vehicle-api.yaml");
  swaggerDocument = YAML.load(yamlPath);
  swaggerDocument.servers = [
    { url: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3002}` },
  ];
  console.log("Swagger documentation loaded");
} catch (error) {
  console.warn("vehicle-api.yaml not found – Swagger UI disabled");
  swaggerDocument = { 
    openapi: "3.0.0",
    info: { 
      title: "Vehicle API", 
      version: "1.0.0",
      description: "Swagger documentation unavailable" 
    },
    paths: {}
  };
}

// Routes
app.use("/vehicles", vehicleRoutes);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Wiz Vehicle API Docs"
}));

// Redirect root to API docs
app.get("/", (req, res) => res.redirect("/api-docs"));

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Vehicle Service running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
});