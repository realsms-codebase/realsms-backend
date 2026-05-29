const cron = require("node-cron");
const Transaction = require("../models/Transaction");

cron.schedule("* * * * *", async () => {
  try {
    console.log("⏰ Cron running...");

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expired = await Transaction.find({
      status: "PENDING",
      createdAt: { $lt: twentyFourHoursAgo },
    });

    console.log("Expired transactions:", expired.length);

    const result = await Transaction.deleteMany({
      status: "PENDING",
      createdAt: { $lt: twentyFourHoursAgo },
    });

    console.log("Deleted:", result.deletedCount);

  } catch (error) {
    console.error("Cron error:", error);
  }
});
