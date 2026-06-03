const express = require("express");
const router = express.Router();

const {
  sendBroadcastEmail,
} = require("../controllers/broadcastController");

const { protect, adminOnly } = require("../middleware/adminAuthMiddleware");

router.post("/email-broadcast", protect, adminOnly, sendBroadcastEmail);

module.exports = router;
