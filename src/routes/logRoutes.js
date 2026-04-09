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

const { protect } = require("../middleware/authMiddleware");
// =======================
// LOG CRUD
// =======================
router.post("/", protect, createLog);       // optional: only admin can create
router.get("/", getLogs);                   // public
router.put("/:id", protect, updateLog);     // optional: only admin
router.delete("/:id", protect, deleteLog);  // optional: only admin

// =======================
// BUY LOG
// =======================
router.post("/buy/:id", protect, buyLog);   // ✅ require login

// =======================
// ORDER HISTORY
// =======================
router.get("/orders", protect, getLogOrders); // ✅ require login

module.exports = router;
