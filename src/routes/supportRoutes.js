const express = require("express");
const router = express.Router();

const {
  sendMessage,
  adminReply,
  getUserMessages,
  getAdminMessages,
  getUnreadMessages,
  markMessagesAsRead,
  markAdminMessagesAsRead,
  getUnreadCount,
} = require("../controllers/supportController");

const { protectSupportUser } = require("../middleware/supportAuthMiddleware"); // for normal users
const { protect, adminOnly } = require("../middleware/adminAuthMiddleware"); // main admin auth

// ================= USER SUPPORT ROUTES =================
// User sends a support message
router.post("/send", protectSupportUser, sendMessage);

router.put("/user/read", protectSupportUser, markAdminMessagesAsRead);

// User unread messages count (for badge)
router.get("/user/unread", protectSupportUser, getUnreadCount);

// User gets their chat history
router.get("/user", protectSupportUser, getUserMessages);

// ================= ADMIN SUPPORT ROUTES =================
// Admin fetches all messages
router.get("/admin", protect, adminOnly, getAdminMessages);

// Admin fetches only unread messages
router.get("/admin/unread", protect, adminOnly, getUnreadMessages);

// Admin replies to a user
router.post("/reply", protect, adminOnly, adminReply);

// Admin marks messages as read
router.put("/admin/read/:userId", protect, adminOnly, markMessagesAsRead); // <-- FIXED comma

module.exports = router;
