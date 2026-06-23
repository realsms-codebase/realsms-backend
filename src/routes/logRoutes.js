const express = require("express");
const router = express.Router();

const {
  createLog,
  getLogs,
  deleteLog,
  updateLog,
  buyLog,
  getLogOrders,
} = require("../controllers/logController");

// Middlewares
const { protect } = require("../middleware/authMiddleware");          // for regular users
const { protect: adminProtect, adminOnly } = require("../middleware/adminAuthMiddleware");  // for admin

// =======================
// ADMIN LOG CRUD
// =======================

// Create a new log (admin only)
router.post("/", adminProtect, adminOnly, createLog);

// Update log by ID (admin only)
router.put("/:id", adminProtect, adminOnly, updateLog);

// Delete log by ID (admin only)
router.delete("/:id", adminProtect, adminOnly, deleteLog);

// =======================
// PUBLIC LOGS
// =======================

// Get all logs (public)
router.get("/", getLogs);

// =======================
// USER ACTIONS
// =======================

// Buy a log (requires user login)
router.post("/buy/:id", protect, buyLog);

// Get log orders (requires user login)
router.get("/orders", protect, getLogOrders);

module.exports = router;
