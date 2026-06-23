const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Order = require("../models/Order");

/**
 * OVERVIEW - total platform stats
 */
exports.getOverviewAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalTransactions = await Transaction.countDocuments({
      status: "SUCCESS", // Updated status
    });

    const revenueAgg = await Transaction.aggregate([
      { $match: { status: "SUCCESS" } }, // Updated status
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    res.json({
      totalUsers,
      totalOrders,
      totalTransactions,
      totalRevenue,
    });
  } catch (error) {
    console.error("Overview analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DAILY ANALYTICS
 */
exports.getDailyAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const stats = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(startDate.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const newUsers = await User.countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd },
      });

      const transactions = await Transaction.find({
        createdAt: { $gte: dayStart, $lte: dayEnd },
        status: "SUCCESS", // Updated status
      });

      const orders = await Order.countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd },
      });

      const revenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);

      stats.push({
        date: dayStart.toISOString().split("T")[0],
        newUsers,
        transactions: transactions.length,
        orders,
        revenue,
      });
    }

    res.json(stats);
  } catch (error) {
    console.error("Daily analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * MONTHLY ANALYTICS
 */
exports.getMonthlyAnalytics = async (req, res) => {
  try {
    const monthlyRevenue = await Transaction.aggregate([
      { $match: { status: "SUCCESS" } }, // Updated status
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$amount" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    res.json(monthlyRevenue);
  } catch (error) {
    console.error("Monthly analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
