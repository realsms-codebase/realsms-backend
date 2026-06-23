const express = require("express");
const router = express.Router();

const Transaction = require("../models/Transaction");
const Order = require("../models/Order");
const LogOrder = require("../models/LogOrder");
const auth = require("../middleware/auth");

router.get("/live", auth, async (req, res) => {
  try {
    // fetch latest records in parallel
    const [transactions, orders, logOrders] = await Promise.all([
      Transaction.find()
        .populate("user", "email")
        .sort({ createdAt: -1 })
        .limit(10),

      Order.find()
        .populate("user", "email")
        .sort({ createdAt: -1 })
        .limit(10),

      LogOrder.find()
        .populate("userId", "email")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // normalize transactions
    const transactionActivities = transactions.map((t) => ({
      type: "wallet",
      email: t.user?.email,
      action: `funded ₦${t.amount.toLocaleString()} successfully`,
      status: t.status,
      success: t.status === "SUCCESS",
      createdAt: t.createdAt,
    }));

    // normalize SMS orders
    const orderActivities = orders.map((o) => ({
      type: "sms",
      email: o.user?.email,
      action: `purchased ${o.country.code} ${o.service.name} Number`,
      status: o.status,
      success: ["received", "waiting"].includes(o.status),
      createdAt: o.createdAt,
    }));

    // normalize log orders
    const logActivities = logOrders.map((l) => ({
      type: "vpn",
      email: l.userId?.email,
      action: `purchased ${l.name}`,
      status: l.status,
      success: l.status === "delivered",
      createdAt: l.createdAt,
    }));

    // merge + sort latest
    const activities = [
      ...transactionActivities,
      ...orderActivities,
      ...logActivities,
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
      )
      .slice(0, 15);

    res.json(activities);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to fetch activities",
    });
  }
});

module.exports = router;
