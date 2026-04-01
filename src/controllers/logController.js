const Log = require("../models/Log");

// CREATE LOG
exports.createLog = async (req, res) => {
  try {
    const log = await Log.create(req.body);
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL LOGS
exports.getLogs = async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ DELETE LOG
exports.deleteLog = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await Log.findByIdAndDelete(id);

    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }

    res.json({ message: "Log deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ UPDATE LOG
exports.updateLog = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedLog = await Log.findByIdAndUpdate(
      id,
      {
        ...req.body,
        stock: req.body.details
          ? req.body.details.split("\n").length
          : req.body.stock,
      },
      { new: true }
    );

    if (!updatedLog) {
      return res.status(404).json({ message: "Log not found" });
    }

    res.json(updatedLog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// BUY LOG (DEDUCT STOCK + RETURN DETAILS)
exports.buyLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const log = await Log.findById(id);

    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }

    // Split available details
    let detailsArray = log.details
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d !== "");

    if (detailsArray.length < quantity) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    // Take requested quantity
    const purchased = detailsArray.slice(0, quantity);

    // Remaining stock
    const remaining = detailsArray.slice(quantity);

    // Update DB
    log.details = remaining.join("\n");
    log.stock = remaining.length;

    await log.save();

    res.json({
      success: true,
      purchased: purchased.join("\n"),
      remainingStock: log.stock,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
