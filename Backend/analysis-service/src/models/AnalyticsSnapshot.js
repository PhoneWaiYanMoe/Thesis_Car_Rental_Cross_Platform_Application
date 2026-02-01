const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AnalyticsSnapshot = sequelize.define(
  "AnalyticsSnapshot",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    snapshotType: {
      type: DataTypes.ENUM("daily", "weekly", "monthly"),
      allowNull: false,
    },
    snapshotDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    entityType: {
      type: DataTypes.ENUM("platform", "owner", "vehicle"),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.STRING,
      allowNull: true, // null for platform-wide snapshots
      comment: "Owner ID or Vehicle ID",
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "analytics_snapshots",
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ["snapshotType", "snapshotDate"],
      },
      {
        fields: ["entityType", "entityId"],
      },
      {
        fields: ["snapshotDate"],
      },
    ],
  },
);

module.exports = AnalyticsSnapshot;
