const User = require("../models/User");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const LogOrder = require("../models/LogOrder");

/* ============================== 
   ADMIN STATS
============================== */
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalTransactions = await Transaction.countDocuments();

    const revenueResult = await Transaction.aggregate([
      { $match: { status: { $regex: /^SUCCESS$/i } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const now = new Date();
    const thisWeekStart = new Date();
    thisWeekStart.setDate(now.getDate() - 7);
    const previousWeekStart = new Date();
    previousWeekStart.setDate(now.getDate() - 14);

    const thisWeekRevenueAgg = await Transaction.aggregate([
      { $match: { status: { $regex: /^SUCCESS$/i }, createdAt: { $gte: thisWeekStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const thisWeekRevenue = thisWeekRevenueAgg[0]?.total || 0;

    const thisWeekUsers = await User.countDocuments({ createdAt: { $gte: thisWeekStart } });
    const thisWeekOrders = await Order.countDocuments({ createdAt: { $gte: thisWeekStart } });
    const thisWeekTransactions = await Transaction.countDocuments({ createdAt: { $gte: thisWeekStart } });

    const previousWeekRevenueAgg = await Transaction.aggregate([
      { $match: { status: { $regex: /^SUCCESS$/i }, createdAt: { $gte: previousWeekStart, $lt: thisWeekStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const previousWeekRevenue = previousWeekRevenueAgg[0]?.total || 0;

    const previousWeekUsers = await User.countDocuments({ createdAt: { $gte: previousWeekStart, $lt: thisWeekStart } });
    const previousWeekOrders = await Order.countDocuments({ createdAt: { $gte: previousWeekStart, $lt: thisWeekStart } });
    const previousWeekTransactions = await Transaction.countDocuments({ createdAt: { $gte: previousWeekStart, $lt: thisWeekStart } });

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(2);
    };

    res.json({
      totalUsers,
      totalOrders,
      totalTransactions,
      totalRevenue,
      weeklyRevenueChange: calculateChange(thisWeekRevenue, previousWeekRevenue),
      weeklyUsersChange: calculateChange(thisWeekUsers, previousWeekUsers),
      weeklyOrdersChange: calculateChange(thisWeekOrders, previousWeekOrders),
      weeklyTransactionsChange: calculateChange(thisWeekTransactions, previousWeekTransactions),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin stats" });
  }
};

/* ==============================
   GET ALL USERS (WITH SEARCH & PAGINATION)
============================== */
exports.getAllUsers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = { email: { $regex: search, $options: "i" } };

    const total = await User.countDocuments(query);

    const users = await User.find(query, "email walletBalanceNGN createdAt status")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // 👉 GET USER IDS
    const userIds = users.map((u) => u._id);

    // 👉 AGGREGATE TOTAL DEPOSITS
    const deposits = await Transaction.aggregate([
      {
        $match: {
          user: { $in: userIds },
          status: { $regex: /^SUCCESS$/i }, // only successful deposits
        },
      },
      {
        $group: {
          _id: "$user",
          totalDeposits: { $sum: "$amount" },
        },
      },
    ]);

    // 👉 CONVERT TO MAP FOR FAST LOOKUP
    const depositMap = {};
    deposits.forEach((d) => {
      depositMap[d._id.toString()] = d.totalDeposits;
    });

    // 👉 MERGE WITH USERS
    const mappedUsers = users.map((u) => ({
      _id: u._id,
      email: u.email,
      balance: u.walletBalanceNGN,
      status: u.status || "Active",
      dateJoined: u.createdAt,
      totalDeposits: depositMap[u._id.toString()] || 0, // ✅ NEW FIELD
    }));

    res.json({ data: mappedUsers, total });
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/* ==============================
   EDIT USER
============================== */
exports.editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, walletBalanceNGN } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.email = email || user.email;
    user.walletBalanceNGN = walletBalanceNGN ?? user.walletBalanceNGN;

    await user.save();
    res.json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    console.error("Edit user error:", error);
    res.status(500).json({ success: false, message: "Failed to edit user" });
  }
};

/* ==============================
   BAN / UNBAN USER
============================== */
exports.toggleBanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === "Active" ? "Banned" : "Active";

    await user.save();
    res.json({ success: true, message: `User is now ${user.status}`, user });
  } catch (error) {
    console.error("Toggle ban user error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle user ban status" });
  }
};

/* ==============================
   DELETE USER
============================== */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

/* ==============================
   GET ALL TRANSACTIONS (WITH SEARCH & PAGINATION)
============================== */
exports.getAllTransactions = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    // Convert page & limit to numbers
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // Build search query
    let query = {};

    if (search) {
      // Find users matching email search
      const matchedUsers = await User.find(
        { email: { $regex: search, $options: "i" } },
        "_id"
      );
      const userIds = matchedUsers.map((u) => u._id);

      query = {
        $or: [
          { reference: { $regex: search, $options: "i" } },
          { user: { $in: userIds } },
        ],
      };
    }

    const total = await Transaction.countDocuments(query);

    const transactions = await Transaction.find(query)
      .populate("user", "email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Map to frontend-friendly format
    const mappedTransactions = transactions.map((t) => ({
      _id: t._id,
      ref: t.reference,
      user: t.user?.email || "Unknown",
      amount: t.amount,
      status: t.status,
      method: t.provider,
      date: t.createdAt,
    }));

    res.json({
      success: true,
      data: mappedTransactions,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Fetch transactions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
};

exports.getPendingTransactionsCount = async (req, res) => {
  try {
    const count = await Transaction.countDocuments({ status: "PENDING" });
    res.json({ success: true, pendingCount: count });
  } catch (error) {
    console.error("Fetch pending count error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch pending count" });
  }
};

/* ==============================
   CONFIRM PENDING TRANSACTION
============================== */
exports.confirmTransaction = async (req, res) => {
  try {
    const { id } = req.params; // transaction _id

    // Find the transaction
    const transaction = await Transaction.findById(id).populate("user");
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    if (transaction.status === "SUCCESS") {
      return res.status(400).json({ success: false, message: "Transaction already confirmed" });
    }

    // Update transaction status
    transaction.status = "SUCCESS";
    await transaction.save();

    // Optionally, update user's wallet balance
    if (transaction.user) {
      transaction.user.walletBalanceNGN += transaction.amount;
      await transaction.user.save();
    }

    res.json({ success: true, message: "Transaction confirmed successfully" });
  } catch (error) {
    console.error("Confirm transaction error:", error);
    res.status(500).json({ success: false, message: "Failed to confirm transaction" });
  }
};

/* ==============================
   DELETE TRANSACTION
============================== */
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    // Only allow deleting successful transactions (optional safety)
    if (transaction.status !== "SUCCESS") {
      return res.status(400).json({
        success: false,
        message: "Only successful transactions can be deleted",
      });
    }

    await Transaction.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  }
};

/* ==============================
   GET ALL ORDERS (WITH SEARCH & PAGINATION)
============================== */
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const search = req.query.search || "";

    const pageNum = page;
    const limitNum = limit;

    let query = {};

    if (search) {
      // Find users whose email matches the search term
      const matchedUsers = await User.find(
        { email: { $regex: search, $options: "i" } },
        "_id"
      );
      const userIds = matchedUsers.map((u) => u._id);

      // Search in OTP or user email
      query.$or = [
        { otp: { $regex: search, $options: "i" } },
        { user: { $in: userIds } },
      ];
    }

    // Count total orders matching query
    const total = await Order.countDocuments(query);

    // Fetch orders with pagination and populate user email
    const orders = await Order.find(query)
      .populate("user", "email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Map to frontend-friendly format
    const mappedOrders = orders.map((o) => ({
      _id: o._id,
      user: o.user?.email || "Unknown",
      otp: o.otp || "",
      service: o.service?.name || "",
      country: o.country?.code || "",
      number: o.number,
      priceCharged: o.priceCharged,
      status: o.status,
      createdAt: o.createdAt,
    }));

    res.json({
      data: mappedOrders,
      page: pageNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


/* ==============================
   GET ALL LOG ORDERS (WITH SEARCH & PAGINATION)
============================== */
exports.getAllLogOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const search = req.query.search || "";

    const pageNum = page;
    const limitNum = limit;

    let query = {};

    if (search) {
      // Find users matching search (email)
      const matchedUsers = await User.find(
        { email: { $regex: search, $options: "i" } },
        "_id"
      );
      const userIds = matchedUsers.map((u) => u._id);

      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { platform: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
        { userId: { $in: userIds } },
      ];
    }

    // total count
    const total = await LogOrder.countDocuments(query);

    // fetch logs
    const logs = await LogOrder.find(query)
      .populate("userId", "email")
      .populate("productId", "name platform")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // map to frontend format
    const mappedLogs = logs.map((log) => ({
      _id: log._id,
      user: log.userId?.email || "Guest",
      platform: log.platform || log.productId?.platform || "",
      product: log.name || log.productId?.name || "",
      price: log.price,
      quantity: log.quantity,
      totalCost: log.totalCost,
      details: log.details,
      status: log.status,
      createdAt: log.createdAt,
    }));

    res.json({
      data: mappedLogs,
      page: pageNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("Fetch log orders error:", err);
    res.status(500).json({ message: "Failed to fetch log orders" });
  }
};
