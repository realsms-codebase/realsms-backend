const Support = require("../models/Support");

// USER SEND MESSAGE
exports.sendMessage = async (req, res) => {
  try {
    const message = await Support.create({
      user: req.user._id,
      message: req.body.message,
      sender: "user",
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ADMIN REPLY
exports.adminReply = async (req, res) => {
  try {
    const message = await Support.create({
      user: req.body.userId,
      message: req.body.message,
      sender: "admin",
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET USER CHAT
exports.getUserMessages = async (req, res) => {
  try {
    const messages = await Support.find({
      user: req.user._id,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN GET ALL CONVERSATIONS
exports.getAdminMessages = async (req, res) => {
  try {
    const messages = await Support.find()
      .populate("user", "email")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET UNREAD SUPPORT MESSAGES
exports.getUnreadMessages = async (req, res) => {
  try {
    const unread = await Support.find({
      sender: "user",
      read: false,
    });

    res.json(unread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
