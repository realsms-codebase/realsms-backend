// const express = require("express");
// const router = express.Router();

// const {
//   createLog,
//   getLogs,
//   deleteLog,
//   updateLog,
//   buyLog,
//   getLogOrders,
// } = require("../controllers/logController");

// const { protect } = require("../middleware/authMiddleware");
// // =======================
// // LOG CRUD
// // =======================
// router.post("/", protect, createLog);       // optional: only admin can create
// router.get("/", getLogs);                   // public
// router.put("/:id", protect, updateLog);     // optional: only admin
// router.delete("/:id", protect, deleteLog);  // optional: only admin

// // =======================
// // BUY LOG
// // =======================
// router.post("/buy/:id", protect, buyLog);   // ✅ require login

// // =======================
// // ORDER HISTORY
// // =======================
// router.get("/orders", protect, getLogOrders); // ✅ require login

// module.exports = router;

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
