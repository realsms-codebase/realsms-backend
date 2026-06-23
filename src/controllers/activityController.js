const Transaction = require("../models/Transaction");
const Order = require("../models/Order");
const LogOrder = require("../models/LogOrder");

const getLiveActivities = async (req, res) => {
  try {
    // ❗ Fetch more raw data (no per-model bias limit)
    const [transactions, orders, logOrders] = await Promise.all([
      Transaction.find()
        .populate("user", "email")
        .sort({ createdAt: -1 })
        .limit(30),

      Order.find()
        .populate("user", "email")
        .sort({ createdAt: -1 })
        .limit(30),

      LogOrder.find()
        .populate("userId", "email")
        .sort({ createdAt: -1 })
        .limit(30),
    ]);

    const transactionActivities = transactions
      .filter((t) => t.status === "SUCCESS")
      .map((t) => ({
        type: "wallet",
        email: t.user?.email,
        action: `funded ₦${t.amount.toLocaleString()} successfully`,
        status: t.status,
        success: true,
        createdAt: new Date(t.createdAt).getTime(),
      }));

    const orderActivities = orders
      .filter((o) => o.status === "delivered" || o.status === "received")
      .map((o) => ({
        type: "sms",
        email: o.user?.email,
        action: `purchased ${o.country?.code} ${o.service?.name} Number`,
        status: o.status,
        success: true,
        createdAt: new Date(o.createdAt).getTime(),
      }));

    const logActivities = logOrders
      .filter((l) => l.status === "delivered")
      .map((l) => ({
        type: "vpn",
        email: l.userId?.email,
        action: `purchased ${l.name}`,
        status: l.status,
        success: true,
        createdAt: new Date(l.createdAt).getTime(),
      }));

    // 🔥 REAL MIXED TIMELINE (NO GROUPING)
    const activities = [
      ...transactionActivities,
      ...orderActivities,
      ...logActivities,
    ]
      .filter((a) => a.createdAt)
      .sort((a, b) => b.createdAt - a.createdAt) // ✅ PURE TIME ORDER
      .slice(0, 20);

    return res.json(activities);
  } catch (err) {
    console.error("Live activity error:", err);
    return res.status(500).json({
      message: "Failed to fetch activities",
    });
  }
};

module.exports = {
  getLiveActivities,
};
