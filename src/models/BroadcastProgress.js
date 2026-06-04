// models/BroadcastProgress.js

import mongoose from "mongoose";

const broadcastProgressSchema = new mongoose.Schema(
  {
    name: { type: String, default: "default" },
    lastIndex: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("BroadcastProgress", broadcastProgressSchema);
