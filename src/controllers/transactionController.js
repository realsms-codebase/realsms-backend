const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

exports.getUserTransactionStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const result = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          status: "SUCCESS",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    const stats = result[0] || {
      totalAmount: 0,
      totalTransactions: 0,
    };

    res.json(stats);
  } catch (err) {
    console.error("Error fetching transaction stats:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================
   TRANSACTION HISTORY
========================= */

// exports.getUserTransactions = async (req, res) => {
//   try {
//     const userId = new mongoose.Types.ObjectId(req.user._id);

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;

//     const filter = { user: userId };

//     /* Optional filter by type */
//     if (req.query.type && req.query.type !== "all") {
//       filter.type = req.query.type;
//     }

//     const transactions = await Transaction.find(filter)
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(limit);

//     const total = await Transaction.countDocuments(filter);

//     res.json({
//       success: true,
//       data: transactions,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         totalTransactions: total,
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching transactions:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };


/* =========================
   DEPOSIT NOTIFICATION 
========================= */
exports.getDepositNotifications = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
      status: "SUCCESS",
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const notifications = transactions.map((tx) => ({
      id: tx._id,
      text: `Deposit of ₦${tx.amount.toLocaleString()} successful`,
      time: tx.createdAt,
      read: false,
      provider: tx.provider,
    }));

    res.json({
      success: true,
      notifications,
    });
  } catch (err) {
    console.error("Deposit notification error:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
