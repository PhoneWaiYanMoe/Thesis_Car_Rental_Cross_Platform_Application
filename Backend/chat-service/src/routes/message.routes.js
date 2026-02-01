const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// all routes require authentication
router.use(authenticateToken);

// get messages in conversation
router.get("/conversations/:id/messages", messageController.getMessages);

// send message
router.post("/conversations/:id/messages", messageController.sendMessage);

// mark message as read
router.patch("/messages/:id/read", messageController.markAsRead);

// mark all messages in conversation as read
router.patch("/conversations/:id/read-all", messageController.markAllAsRead);

// delete message
router.delete("/messages/:id", messageController.deleteMessage);

module.exports = router;
