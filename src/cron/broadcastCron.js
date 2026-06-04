// cron/broadcastCron.js

import cron from "node-cron";
import { sendDailyBroadcast } from "../controllers/broadcastController.js";

// Runs every day at 9AM
cron.schedule("0 9 * * *", async () => {
  console.log("Running daily broadcast (50 emails)");

  await sendDailyBroadcast(
    {
      body: {
        subject: "Daily Update",
        message: "Hello from our platform",
      },
    },
    {
      json: console.log,
      status: () => ({ json: console.log }),
    }
  );
});
