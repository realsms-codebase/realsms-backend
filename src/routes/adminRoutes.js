const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/adminAuthMiddleware");
const adminController = require("../controllers/adminController");

// ==============================
// Admin dashboard stats
// ==============================
router.get("/stats", protect, adminOnly, adminController.getAdminStats);

// ==============================
// Users
// ==============================
router.get("/users", protect, adminOnly, adminController.getAllUsers);
router.put("/users/:userId", protect, adminOnly, adminController.editUser);
router.patch("/users/:userId/ban", protect, adminOnly, adminController.toggleBanUser);
router.delete("/users/:userId", protect, adminOnly, adminController.deleteUser);

// ==============================
// Transactions
// ==============================
router.get("/transactions", protect, adminOnly, adminController.getAllTransactions);
// Get pending transaction count
router.get(
  "/transactions/pending-count",
  protect,
  adminOnly,
  adminController.getPendingTransactionsCount
);

// Confirm pending transaction
router.patch("/transactions/:id/confirm", protect, adminOnly, adminController.confirmTransaction);

// Delete successful transaction
router.delete("/transactions/:id", protect, adminOnly, adminController.deleteTransaction);

// ==============================
// Orders
// ==============================
router.get("/orders", protect, adminOnly, adminController.getAllOrders);

// ==============================
// LOG ORDERS ✅ NEW
// ==============================
router.post("/log-order", protect, adminController.createLogOrder);
router.get("/log-orders", protect, adminOnly, adminController.getAllLogOrders);

module.exports = router;
