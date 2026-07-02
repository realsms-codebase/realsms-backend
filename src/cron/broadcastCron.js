import cron from "node-cron";
import { sendBroadcastEmail } from "../controllers/broadcastController.js";

// runs every day at 9am
cron.schedule("0 9 * * *", async () => {
  await sendBroadcastEmail();
});
