const express = require("express");
const router = express.Router();
const { 
  getUserTransactionStats, 
  getUserTransactions, 
  getDepositNotifications, 
} = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");

// GET /api/transactions/stats - get stats for logged-in user
router.get("/stats", protect, getUserTransactionStats);

// ===============================
// GET USER TRANSACTION HISTORY
// GET /api/transactions
// ===============================
router.get("/", protect, getUserTransactions);

router.get("/notifications", protect, getDepositNotifications);

module.exports = router;
