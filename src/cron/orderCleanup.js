// const cron = require("node-cron");
// const Order = require("../models/Order");

// // Runs every minute (safe + ensures cleanup is always checked)
// cron.schedule("* * * * *", async () => {
//   try {
//     console.log("⏰ Refunded order cleanup running...");

//     const twentyFourHoursAgo = new Date(
//       Date.now() - 24 * 60 * 60 * 1000
//     );

//     // Optional: preview what will be deleted
//     const expired = await Order.find({
//       status: "refunded",
//       createdAt: { $lt: twentyFourHoursAgo },
//     });

//     console.log("Expired refunded orders:", expired.length);

//     const result = await Order.deleteMany({
//       status: "refunded",
//       createdAt: { $lt: twentyFourHoursAgo },
//     });

//     console.log("Deleted:", result.deletedCount);
//   } catch (error) {
//     console.error("Cron error:", error);
//   }
// });

const cron = require("node-cron");
const Order = require("../models/Order");

let isRunning = false;

// Runs every hour at minute 0
cron.schedule("0 * * * *", async () => {
  if (isRunning) {
    console.log("⏳ Refunded order cleanup already running. Skipping...");
    return;
  }

  isRunning = true;

  try {
    console.log("🧹 Starting refunded order cleanup...");

    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    );

    const result = await Order.deleteMany({
      status: "refunded",
      createdAt: { $lt: twentyFourHoursAgo },
    });

    console.log(
      `✅ Refunded order cleanup completed. Deleted ${result.deletedCount} expired refunded order(s).`
    );
  } catch (error) {
    console.error("❌ Refunded order cleanup failed:", error);
  } finally {
    isRunning = false;
  }
});

console.log("✅ Refunded order cleanup cron initialized.");
