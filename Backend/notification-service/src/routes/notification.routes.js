const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Get user notifications
router.get('/', notificationController.getNotifications);

// Mark single notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Get notification preferences
router.get('/preferences', notificationController.getPreferences);

// Update notification preferences
router.put('/preferences', notificationController.updatePreferences);

// Update FCM token (for push notifications)
router.post('/fcm-token', notificationController.updateFCMToken);

module.exports = router;