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

const { protect, adminOnly } = require("../middleware/adminAuthMiddleware");
// =======================
// LOG CRUD
// =======================
router.post("/", protect, adminOnly, createLog);       // optional: only admin can create
router.get("/", getLogs);                   // public
router.put("/:id", protect, adminOnly, updateLog);     // optional: only admin
router.delete("/:id", protect, adminOnly, deleteLog);  // optional: only admin

// =======================
// BUY LOG
// =======================
router.post("/buy/:id", protect, buyLog);   // ✅ require login

// =======================
// ORDER HISTORY
// =======================
router.get("/orders", protect, getLogOrders); // ✅ require login

module.exports = router;
