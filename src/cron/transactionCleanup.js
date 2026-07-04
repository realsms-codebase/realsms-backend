// const cron = require("node-cron");
// const Transaction = require("../models/Transaction");

// cron.schedule("* * * * *", async () => {
//   try {
//     console.log("⏰ Cron running...");

//     const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

//     const expired = await Transaction.find({
//       status: "PENDING",
//       createdAt: { $lt: twentyFourHoursAgo },
//     });

//     console.log("Expired transactions:", expired.length);

//     const result = await Transaction.deleteMany({
//       status: "PENDING",
//       createdAt: { $lt: twentyFourHoursAgo },
//     });

//     console.log("Deleted:", result.deletedCount);

//   } catch (error) {
//     console.error("Cron error:", error);
//   }
// });

const cron = require("node-cron");
const Transaction = require("../models/Transaction");

let isRunning = false;

// Runs every hour at minute 0
cron.schedule("0 * * * *", async () => {
  if (isRunning) {
    console.log("⏳ Transaction cleanup already running. Skipping...");
    return;
  }

  isRunning = true;

  try {
    console.log("🧹 Starting transaction cleanup...");

    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    );

    const result = await Transaction.deleteMany({
      status: "PENDING",
      createdAt: { $lt: twentyFourHoursAgo },
    });

    console.log(
      `✅ Transaction cleanup completed. Deleted ${result.deletedCount} expired transaction(s).`
    );
  } catch (error) {
    console.error("❌ Transaction cleanup failed:", error);
  } finally {
    isRunning = false;
  }
});

console.log("✅ Transaction cleanup cron initialized.");
