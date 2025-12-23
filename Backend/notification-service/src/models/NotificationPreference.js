const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NotificationPreference = sequelize.define('NotificationPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    field: 'user_id'
  },
  preferences: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      email: {
        booking: true,
        payment: true,
        review: true,
        system: true,
        vehicle: true,
        request: true
      },
      push: {
        booking: true,
        payment: true,
        review: true,
        system: true,
        vehicle: true,
        request: true
      },
      inApp: {
        booking: true,
        payment: true,
        review: true,
        system: true,
        vehicle: true,
        request: true
      }
    }
  },
  fcmToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fcm_token'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'notification_preferences',
  timestamps: false
});

module.exports = NotificationPreference;