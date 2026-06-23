// // const Transaction = require("../models/Transaction");
// // const Order = require("../models/Order");
// // const LogOrder = require("../models/LogOrder");

// // /**
// //  * GET LIVE ACTIVITIES
// //  */
// // const getLiveActivities = async (req, res) => {
// //   try {
// //     const [transactions, orders, logOrders] = await Promise.all([
// //       Transaction.find()
// //         .populate("user", "email")
// //         .sort({ createdAt: -1 })
// //         .limit(10),

// //       Order.find()
// //         .populate("user", "email")
// //         .sort({ createdAt: -1 })
// //         .limit(10),

// //       LogOrder.find()
// //         .populate("userId", "email")
// //         .sort({ createdAt: -1 })
// //         .limit(10),
// //     ]);

// //     const transactionActivities = transactions.map((t) => ({
// //       type: "wallet",
// //       email: t.user?.email,
// //       action: `funded ₦${t.amount.toLocaleString()} successfully`,
// //       status: t.status,
// //       success: t.status === "SUCCESS",
// //       createdAt: t.createdAt,
// //     }));

// //     const orderActivities = orders.map((o) => ({
// //       type: "sms",
// //       email: o.user?.email,
// //       action: `purchased ${o.country?.code} ${o.service?.name} Number`,
// //       status: o.status,
// //       success: ["received", "waiting"].includes(o.status),
// //       createdAt: o.createdAt,
// //     }));

// //     const logActivities = logOrders.map((l) => ({
// //       type: "vpn",
// //       email: l.userId?.email,
// //       action: `purchased ${l.name}`,
// //       status: l.status,
// //       success: l.status === "delivered",
// //       createdAt: l.createdAt,
// //     }));

// //     const activities = [
// //       ...transactionActivities,
// //       ...orderActivities,
// //       ...logActivities,
// //     ]
// //       .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
// //       .slice(0, 15);

// //     return res.json(activities);
// //   } catch (err) {
// //     console.error("Live activity error:", err);
// //     return res.status(500).json({
// //       message: "Failed to fetch activities",
// //     });
// //   }
// // };

// // module.exports = {
// //   getLiveActivities,
// // };

// const Transaction = require("../models/Transaction");
// const Order = require("../models/Order");
// const LogOrder = require("../models/LogOrder");

// /**
//  * GET LIVE ACTIVITIES (SUCCESS ONLY + TRUE CHRONOLOGICAL ORDER)
//  */
// const getLiveActivities = async (req, res) => {
//   try {
//     const [transactions, orders, logOrders] = await Promise.all([
//       Transaction.find()
//         .populate("user", "email")
//         .sort({ createdAt: -1 })
//         .limit(10),

//       Order.find()
//         .populate("user", "email")
//         .sort({ createdAt: -1 })
//         .limit(10),

//       LogOrder.find()
//         .populate("userId", "email")
//         .sort({ createdAt: -1 })
//         .limit(10),
//     ]);

//     // =========================
//     // WALLET (SUCCESS ONLY)
//     // =========================
//     const transactionActivities = transactions
//       .filter((t) => t.status === "SUCCESS")
//       .map((t) => ({
//         type: "wallet",
//         email: t.user?.email,
//         action: `funded ₦${t.amount.toLocaleString()} successfully`,
//         status: t.status,
//         success: true,
//         createdAt: t.createdAt,
//       }));

//     // =========================
//     // SMS ORDERS (SUCCESS ONLY)
//     // =========================
//     const orderActivities = orders
//       .filter((o) => o.status === "delivered" || o.status === "received")
//       .map((o) => ({
//         type: "sms",
//         email: o.user?.email,
//         action: `purchased ${o.country?.code} ${o.service?.name} Number`,
//         status: o.status,
//         success: true,
//         createdAt: o.createdAt,
//       }));

//     // =========================
//     // LOG ORDERS (SUCCESS ONLY)
//     // =========================
//     const logActivities = logOrders
//       .filter((l) => l.status === "delivered")
//       .map((l) => ({
//         type: "vpn",
//         email: l.userId?.email,
//         action: `purchased ${l.name}`,
//         status: l.status,
//         success: true,
//         createdAt: l.createdAt,
//       }));

//     // =========================
//     // MERGE + TRUE TIME SORT
//     // =========================
//     const activities = [
//       ...transactionActivities,
//       ...orderActivities,
//       ...logActivities,
//     ]
//       // remove invalid timestamps
//       .filter((a) => a.createdAt)
//       // normalize timestamps
//       .map((a) => ({
//         ...a,
//         createdAt: new Date(a.createdAt).getTime(),
//       }))
//       // strict chronological order (NEWEST FIRST)
//       .sort((a, b) => b.createdAt - a.createdAt)
//       .slice(0, 15);

//     return res.json(activities);
//   } catch (err) {
//     console.error("Live activity error:", err);
//     return res.status(500).json({
//       message: "Failed to fetch activities",
//     });
//   }
// };

// module.exports = {
//   getLiveActivities,
// };

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
