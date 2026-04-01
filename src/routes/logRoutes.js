// const express = require("express");
// const router = express.Router();
// const { createLog, getLogs, deleteLog, updateLog, buyLog } = require("../controllers/logController");

// router.post("/", createLog);
// router.get("/", getLogs);
// router.delete("/:id", deleteLog); 
// router.put("/:id", updateLog);
// router.post("/buy/:id", buyLog);

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  createLog,
  getLogs,
  deleteLog,
  updateLog,
  buyLog,
  getLogOrders, // ✅ ADD THIS
} = require("../controllers/logController");

// =======================
// LOG CRUD
// =======================
router.post("/", createLog);
router.get("/", getLogs);
router.put("/:id", updateLog);
router.delete("/:id", deleteLog);

// =======================
// BUY LOG
// =======================
router.post("/buy/:id", buyLog);

// =======================
// 🔥 ORDER HISTORY
// =======================
router.get("/orders", getLogOrders); // ✅ NEW ROUTE

module.exports = router;
