const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    type: { type: String, default: "", },
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", logSchema);
