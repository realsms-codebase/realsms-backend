// const express = require("express");
// const router = express.Router();

// const {
//   sendMessage,
//   adminReply,
//   getUserMessages,
//   getAdminMessages,
// } = require("../controllers/supportController");

// const { protectSupportUser, protectSupportAdmin } = require("../middleware/supportAuthMiddleware");

// // USER SUPPORT ROUTES
// router.post("/send", protectSupportUser, sendMessage);
// router.get("/user", protectSupportUser, getUserMessages);

// // ADMIN SUPPORT ROUTES
// router.get("/admin", protectSupportAdmin, getAdminMessages);
// router.post("/reply", protectSupportAdmin, adminReply);

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const {
//   sendMessage,
//   adminReply,
//   getUserMessages,
//   getAdminMessages,
//   getUnreadMessages,
//   markMessagesAsRead,
// } = require("../controllers/supportController");

// const {
//   protectSupportUser,
//   protectSupportAdmin,
// } = require("../middleware/supportAuthMiddleware");


// // USER SUPPORT ROUTES
// router.post("/send", protectSupportUser, sendMessage);
// router.get("/user", protectSupportUser, getUserMessages);


// // ADMIN SUPPORT ROUTES
// router.get("/admin", protectSupportAdmin, getAdminMessages);
// router.get("/admin/unread", protectSupportAdmin, getUnreadMessages);
// router.post("/reply", protectSupportAdmin, adminReply);
// router.put("/admin/read/:userId", protectSupportAdmin, markMessagesAsRead);


// module.exports = router;


// routes/supportRoutes.js
const express = require("express");
const router = express.Router();

const {
  sendMessage,
  adminReply,
  getUserMessages,
  getAdminMessages,
  getUnreadMessages,
  markMessagesAsRead,
} = require("../controllers/supportController");

const { protectSupportUser } = require("../middleware/supportAuthMiddleware"); // for normal users
const { adminProtect } = require("../middleware/adminAuthMiddleware"); // main admin auth

// ================= USER SUPPORT ROUTES =================
// User sends a support message
router.post("/send", protectSupportUser, sendMessage);

// User gets their chat history
router.get("/user", protectSupportUser, getUserMessages);

// ================= ADMIN SUPPORT ROUTES =================
// Admin fetches all messages
router.get("/admin", adminProtect, getAdminMessages);

// Admin fetches only unread messages
router.get("/admin/unread", adminProtect, getUnreadMessages);

// Admin replies to a user
router.post("/reply", adminProtect, adminReply);

// Admin marks messages as read
router.put("/admin/read/:userId", adminProtect, markMessagesAsRead);

module.exports = router;
