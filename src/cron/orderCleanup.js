const cron = require("node-cron");
const Order = require("../models/Order");

// Runs every day at 2:00 AM
cron.schedule("0 2 * * *", async () => {
  try {
    console.log("🧹 Running order cleanup job...");

    const result = await Order.deleteMany({
      status: { $in: ["refunded", "waiting"] },
    });

    console.log(
      `✅ Cleanup complete. Deleted ${result.deletedCount} orders.`
    );
  } catch (error) {
    console.error("❌ Order cleanup failed:", error.message);
  }
});
