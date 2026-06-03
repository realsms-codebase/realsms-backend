// controllers/adminController.js

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const sendBroadcastEmail = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    // Get all users with email addresses
    const users = await User.find({
      email: { $exists: true, $ne: "" },
    }).select("email");

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    const emailPromises = users.map((user) =>
      sendEmail({
        to: user.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>${subject}</h2>
            <p>${message.replace(/\n/g, "<br/>")}</p>
          </div>
        `,
      })
    );

    await Promise.all(emailPromises);

    res.status(200).json({
      success: true,
      message: `Broadcast email sent to ${users.length} users`,
      totalRecipients: users.length,
    });
  } catch (error) {
    console.error("Broadcast Email Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send broadcast email",
    });
  }
};

module.exports = {
  sendBroadcastEmail,
};
