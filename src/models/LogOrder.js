const mongoose = require("mongoose");

const logOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // works even without authentication
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Log",
      required: true, // must have a reference to the log
    },

    name: String,
    platform: String,

    price: Number,
    quantity: Number,
    totalCost: Number,

    details: String,

    status: {
      type: String,
      default: "delivered",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LogOrder", logOrderSchema);
