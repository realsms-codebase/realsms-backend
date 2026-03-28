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
