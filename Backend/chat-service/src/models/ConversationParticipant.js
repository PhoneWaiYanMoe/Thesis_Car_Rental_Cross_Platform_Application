const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ConversationParticipant = sequelize.define(
  "ConversationParticipant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "conversation_id",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },
    role: {
      type: DataTypes.ENUM("customer", "owner"),
      allowNull: false,
    },
    lastReadAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_read_at",
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "unread_count",
    },
    isTyping: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_typing",
    },
    lastTypingAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_typing_at",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    tableName: "conversation_participants",
    timestamps: false,
    indexes: [
      { fields: ["conversation_id", "user_id"], unique: true },
      { fields: ["user_id"] },
    ],
  }
);

module.exports = ConversationParticipant;
