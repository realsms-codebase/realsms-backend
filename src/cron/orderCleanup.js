const cron = require("node-cron");
const Order = require("../models/Order");

// Runs every minute (safe + ensures cleanup is always checked)
cron.schedule("* * * * *", async () => {
  try {
    console.log("⏰ Refunded order cleanup running...");

    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    );

    // Optional: preview what will be deleted
    const expired = await Order.find({
      status: "refunded",
      createdAt: { $lt: twentyFourHoursAgo },
    });

    console.log("Expired refunded orders:", expired.length);

    const result = await Order.deleteMany({
      status: "refunded",
      createdAt: { $lt: twentyFourHoursAgo },
    });

    console.log("Deleted:", result.deletedCount);
  } catch (error) {
    console.error("Cron error:", error);
  }
});
