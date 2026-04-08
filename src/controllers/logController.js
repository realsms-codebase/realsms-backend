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

const Log = require("../models/Log");
const LogOrder = require("../models/LogOrder");

// =======================
// CREATE LOG
// =======================
exports.createLog = async (req, res) => {
  try {
    const log = await Log.create({
      ...req.body,
      stock: req.body.details
        ? req.body.details.split("\n").filter((d) => d.trim() !== "").length
        : req.body.stock,
    });

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// GET ALL LOGS
// =======================
exports.getLogs = async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// DELETE LOG
// =======================
exports.deleteLog = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await Log.findByIdAndDelete(id);

    if (!log) return res.status(404).json({ message: "Log not found" });

    res.json({ message: "Log deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// UPDATE LOG
// =======================
exports.updateLog = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedLog = await Log.findByIdAndUpdate(
      id,
      {
        ...req.body,
        stock: req.body.details
          ? req.body.details.split("\n").filter((d) => d.trim() !== "").length
          : req.body.stock,
      },
      { new: true }
    );

    if (!updatedLog) return res.status(404).json({ message: "Log not found" });

    res.json(updatedLog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// BUY LOG
// =======================
exports.buyLog = async (req, res) => {
  try {
    // ✅ Require user
    if (!req.user) return res.status(401).json({ message: "Login required" });

    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0)
      return res.status(400).json({ message: "Invalid quantity" });

    const log = await Log.findById(id);
    if (!log) return res.status(404).json({ message: "Log not found" });

    const detailsArray = log.details
      .split("\n")
      .map((d) => d.trim())
      .filter(Boolean);

    if (detailsArray.length < quantity)
      return res.status(400).json({ message: "Not enough stock" });

    const purchased = detailsArray.slice(0, quantity);
    const remaining = detailsArray.slice(quantity);

    log.details = remaining.join("\n");
    log.stock = remaining.length;
    await log.save();

    const totalCost = log.price * quantity;

    const order = await LogOrder.create({
      userId: req.user._id, // ✅ Always set
      productId: log._id,
      name: log.name,
      platform: log.platform,
      price: log.price,
      quantity,
      totalCost,
      details: purchased.join("\n"),
      status: "delivered",
    });

    res.json({
      success: true,
      purchased: purchased.join("\n"),
      remainingStock: log.stock,
      orderId: order._id,
    });
  } catch (err) {
    console.error("BUY LOG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// =======================
// GET ORDER HISTORY
// =======================
exports.getLogOrders = async (req, res) => {
  try {
    // Only get orders for the logged-in user
    if (!req.user) return res.status(401).json({ message: "Login required" });

    const orders = await LogOrder.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("GET ORDERS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
