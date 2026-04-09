// const express = require("express");
// const router = express.Router();

// const {
//   createLog,
//   getLogs,
//   deleteLog,
//   updateLog,
//   buyLog,
//   getLogOrders, // ✅ ADD THIS
// } = require("../controllers/logController");

// // =======================
// // LOG CRUD
// // =======================
// router.post("/", createLog);
// router.get("/", getLogs);
// router.put("/:id", updateLog);
// router.delete("/:id", deleteLog);

// // =======================
// // BUY LOG
// // =======================
// router.post("/buy/:id", buyLog);

// // =======================
// // 🔥 ORDER HISTORY
// // =======================
// router.get("/orders", getLogOrders); // ✅ NEW ROUTE

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

const { protect } = require("../middleware/authMiddleware"); // your auth middleware

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
