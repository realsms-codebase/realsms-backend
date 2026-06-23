const express = require("express");
const router = express.Router();
const {
  getServers,
  getServices,
  buyNumber,
  getOtp,
  cancelOrder,
  getUserOrders,
  resendOtp, 
  getSmsStats,
} = require("../controllers/smsController");
const { protect } = require("../middleware/authMiddleware");

// ---------------- ROUTES ----------------

// Get all countries/servers
router.get("/servers", protect, getServers);

// Get all services (no serverId needed)
router.get("/services", protect, getServices);

// Buy number
router.post("/buy", protect, buyNumber);

// Get OTP for a purchased number (POST with body)
router.post("/otp", protect, getOtp);

// Resend OTP for a purchased number
router.post("/resend", protect, resendOtp); // ✅ new endpoint

// Get orders for a user
router.get("/orders", protect, getUserOrders);

// Cancel / refund order
router.post("/cancel", protect, cancelOrder);

// Sms Stats for a user
router.get("/stats", protect, getSmsStats);

module.exports = router;
