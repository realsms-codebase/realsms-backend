// const Log = require("../models/Log");
// const LogOrder = require("../models/LogOrder"); // ✅ NEW

// // =======================
// // CREATE LOG
// // =======================
// exports.createLog = async (req, res) => {
//   try {
//     const log = await Log.create({
//       ...req.body,
//       stock: req.body.details
//         ? req.body.details.split("\n").filter((d) => d.trim() !== "").length
//         : req.body.stock,
//     });

//     res.status(201).json(log);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // =======================
// // GET ALL LOGS
// // =======================
// exports.getLogs = async (req, res) => {
//   try {
//     const logs = await Log.find().sort({ createdAt: -1 });
//     res.json(logs);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // =======================
// // DELETE LOG
// // =======================
// exports.deleteLog = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const log = await Log.findByIdAndDelete(id);

//     if (!log) {
//       return res.status(404).json({ message: "Log not found" });
//     }

//     res.json({ message: "Log deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // =======================
// // UPDATE LOG
// // =======================
// exports.updateLog = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const updatedLog = await Log.findByIdAndUpdate(
//       id,
//       {
//         ...req.body,
//         stock: req.body.details
//           ? req.body.details
//               .split("\n")
//               .filter((d) => d.trim() !== "").length
//           : req.body.stock,
//       },
//       { new: true }
//     );

//     if (!updatedLog) {
//       return res.status(404).json({ message: "Log not found" });
//     }

//     res.json(updatedLog);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


// // =======================
// // BUY LOG (MAIN LOGIC)
// // =======================
// exports.buyLog = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { quantity } = req.body;

//     if (!quantity || quantity <= 0) {
//       return res.status(400).json({ message: "Invalid quantity" });
//     }

//     const log = await Log.findById(id);
//     if (!log) {
//       return res.status(404).json({ message: "Log not found" });
//     }

//     // Split details
//     const detailsArray = log.details
//       .split("\n")
//       .map((d) => d.trim())
//       .filter((d) => d !== "");

//     if (detailsArray.length < quantity) {
//       return res.status(400).json({ message: "Not enough stock" });
//     }

//     const purchased = detailsArray.slice(0, quantity);
//     const remaining = detailsArray.slice(quantity);

//     // Update stock in log
//     log.details = remaining.join("\n");
//     log.stock = remaining.length;
//     await log.save();

//     const purchasedText = purchased.join("\n");
//     const totalCost = log.price * quantity;

//     // =======================
//     // ✅ SAVE ORDER HISTORY
//     // =======================
//     await LogOrder.create({
//       userId: req.user?.id || null, // works without auth
//       productId: log._id,           // ✅ must match schema
//       name: log.name,
//       platform: log.platform,
//       price: log.price,
//       quantity,
//       totalCost,
//       details: purchasedText,
//       status: "delivered",
//     });

//     res.json({
//       success: true,
//       purchased: purchasedText,
//       remainingStock: log.stock,
//     });
//   } catch (err) {
//     console.error("BUY LOG ERROR:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// // =======================
// // GET ORDER HISTORY
// // =======================
// exports.getLogOrders = async (req, res) => {
//   try {
//     // 👉 change to { userId: req.user.id } if auth enabled
//     const orders = await LogOrder.find().sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       data: orders,
//     });
//   } catch (err) {
//     console.error("GET ORDERS ERROR:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// controllers/logController.js
const Log = require("../models/Log");
const LogOrder = require("../models/LogOrder");
const User = require("../models/User");

// =======================
// BUY LOG
// =======================
exports.buyLog = async (req, res) => {
  try {
    const { id } = req.params;           // log/product id
    const { quantity } = req.body;       // quantity from frontend

    if (!quantity || quantity <= 0)
      return res.status(400).json({ message: "Invalid quantity" });

    const log = await Log.findById(id);
    if (!log) return res.status(404).json({ message: "Log not found" });

    // Split accounts
    const detailsArray = log.details
      .split("\n")
      .map(d => d.trim())
      .filter(d => d !== "");

    if (detailsArray.length < quantity)
      return res.status(400).json({ message: "Not enough stock" });

    const purchased = detailsArray.slice(0, quantity);
    const remaining = detailsArray.slice(quantity);

    // Update log stock
    log.details = remaining.join("\n");
    log.stock = remaining.length;
    await log.save();

    const totalCost = log.price * quantity;
    const purchasedText = purchased.join("\n");

    // ✅ Auth required, get userId
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.walletBalanceNGN < totalCost)
      return res.status(400).json({ message: "Insufficient balance" });

    // Deduct wallet
    user.walletBalanceNGN -= totalCost;
    await user.save();

    // Save order history
    await LogOrder.create({
      userId: user._id,         // ✅ required
      productId: log._id,
      name: log.name,
      platform: log.platform,
      price: log.price,
      quantity,
      totalCost,
      details: purchasedText,
      status: "delivered",
    });

    res.json({
      success: true,
      purchased: purchasedText,
      remainingStock: log.stock,
      newBalance: user.walletBalanceNGN,
    });
  } catch (err) {
    console.error("BUY LOG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
