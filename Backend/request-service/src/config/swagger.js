const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Request Service API",
      version: "1.0.0",
      description: "API documentation for the Request Management Service",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3010",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT Bearer token",
        },
      },
      schemas: {
        Request: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Request ID",
            },
            user_id: {
              type: "string",
              description: "User ID who created the request",
            },
            user_email: {
              type: "string",
              format: "email",
              description: "User email",
            },
            customer_id: {
              type: "string",
              nullable: true,
              description: "Customer ID (nullable)",
            },
            owner_id: {
              type: "string",
              nullable: true,
              description: "Owner ID (nullable)",
            },
            vehicle_id: {
              type: "string",
              nullable: true,
              description: "Vehicle ID (nullable)",
            },
            booking_id: {
              type: "string",
              nullable: true,
              description: "Booking ID (nullable)",
            },
            category: {
              type: "string",
              enum: [
                "booking_issue",
                "verification",
                "account_issue",
                "vehicle_listing",
                "payment_issue",
                "booking_change",
                "report",
                "vehicle_update",
                "yearly_vehicle_confirmation",
                "booking_confirmation",
                "refund_request",
                "payment_dispute",
                "user_license_verification",
                "owner_verification",
                "vehicle_deactivation",
                "vehicle_reactivation",
                "user_account_deletion",
                "contract_issue",
                "insurance_claim",
                "damage_report",
                "other",
              ],
              description: "Request category",
            },
            title: {
              type: "string",
              description: "Request title",
            },
            description: {
              type: "string",
              description: "Request description",
            },
            status: {
              type: "string",
              enum: ["pending", "processing", "approved", "denied", "paused"],
              description: "Request status",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "Request priority",
            },
            handled_by: {
              type: "string",
              nullable: true,
              description: "Staff member handling the request",
            },
            handled_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              description: "When the request was handled",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        CreateRequestInput: {
          type: "object",
          required: ["title", "category", "description"],
          properties: {
            title: {
              type: "string",
              description: "Request title",
              example: "Issue with booking cancellation",
            },
            category: {
              type: "string",
              description: "Request category",
              example: "booking_issue",
            },
            description: {
              type: "string",
              description: "Detailed description of the request",
              example: "I'm unable to cancel my booking for vehicle ABC123",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "Request priority (default: medium)",
              example: "high",
            },
            customerId: {
              type: "string",
              nullable: true,
              description: "Customer ID if applicable",
            },
            ownerId: {
              type: "string",
              nullable: true,
              description: "Owner ID if applicable",
            },
            vehicleId: {
              type: "string",
              nullable: true,
              description: "Vehicle ID if applicable",
            },
            bookingId: {
              type: "string",
              nullable: true,
              description: "Booking ID if applicable",
            },
            attachmentIds: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of attachment/media IDs",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Success",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
            details: {
              type: "object",
              nullable: true,
            },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Success",
            },
            requests: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Request",
              },
            },
            total: {
              type: "integer",
              description: "Total number of requests",
            },
            page: {
              type: "integer",
              description: "Current page number",
            },
            limit: {
              type: "integer",
              description: "Items per page",
            },
            totalPages: {
              type: "integer",
              description: "Total number of pages",
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
