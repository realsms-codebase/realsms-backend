const Support = require("../models/Support");

// USER SEND MESSAGE
exports.sendMessage = async (req, res) => {
  try {
    const message = await Support.create({
      user: req.user._id,
      message: req.body.message,
      sender: "user",
      read: false,
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
      read: false,
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


// ADMIN GET ALL MESSAGES
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


// GET UNREAD MESSAGES (ADMIN)
exports.getUnreadMessages = async (req, res) => {
  try {
    const unread = await Support.find({
      sender: "user",
      read: false,
    }).populate("user", "email");

    res.json(unread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// MARK USER MESSAGES AS READ
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await Support.updateMany(
      {
        user: userId,
        sender: "user",
        read: false,
      },
      { read: true }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// MARK ADMIN MESSAGES AS READ (USER SIDE)
exports.markAdminMessagesAsRead = async (req, res) => {
  try {
    await Support.updateMany(
      {
        user: req.user._id,
        sender: "admin",
        read: false,
      },
      { read: true }
    );

    res.json({ message: "Admin messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
