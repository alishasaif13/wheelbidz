import cron from "node-cron";
import { bidStartEnds } from "./controllers/biddingController.js";

cron.schedule("* * * * *", async () => {
  console.log("Running scheduled bidstartends...");
  await bidStartEnds(); 
});