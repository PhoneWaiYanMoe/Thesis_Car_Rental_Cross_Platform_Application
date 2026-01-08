const express = require("express");
const router = express.Router();
const conversationController = require("../controllers/conversation.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// all routes require authentication
router.use(authenticateToken);

// get user's conversations
router.get("/", conversationController.getConversations);

// get conversation by ID
router.get("/:id", conversationController.getConversationById);

// block conversation
router.post("/:id/block", conversationController.blockConversation);

// get total unread count
router.get("/unread/count", conversationController.getTotalUnreadCount);

module.exports = router;
