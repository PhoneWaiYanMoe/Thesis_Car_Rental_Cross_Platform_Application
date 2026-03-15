const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Conversation = sequelize.define(
  "Conversation",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "booking_id",
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "customer_id",
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "owner_id",
    },
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "vehicle_id",
    },
    status: {
      type: DataTypes.ENUM("active", "closed", "blocked"),
      defaultValue: "active",
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_message_at",
    },
    lastMessageContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "last_message_content",
    },
    lastMessageSenderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "last_message_sender_id",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
  },
  {
    tableName: "conversations",
    timestamps: false,
    indexes: [
      { fields: ["booking_id"] },
      { fields: ["customer_id"] },
      { fields: ["owner_id"] },
      { fields: ["status"] },
    ],
  },
);

module.exports = Conversation;
