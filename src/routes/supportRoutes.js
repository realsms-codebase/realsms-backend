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

const {
  protectSupportUser,
  protectSupportAdmin,
} = require("../middleware/supportAuthMiddleware");


// USER SUPPORT ROUTES
router.post("/send", protectSupportUser, sendMessage);
router.get("/user", protectSupportUser, getUserMessages);


// ADMIN SUPPORT ROUTES
router.get("/admin", protectSupportAdmin, getAdminMessages);
router.get("/admin/unread", protectSupportAdmin, getUnreadMessages);
router.post("/reply", protectSupportAdmin, adminReply);
router.put("/admin/read/:userId", protectSupportAdmin, markMessagesAsRead);


module.exports = router;
