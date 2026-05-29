const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reference: {
      type: String,
      required: true,
      unique: true,
    },

    // ✅ Korapay reference (CRITICAL FIX)
    korapayReference: {
      type: String,
      index: true,
    },

    // Amount paid (NGN or converted amount)
    amount: {
      type: Number,
      required: true,
    },

    // Currency type (NGN or USDT)
    currency: {
      type: String,
      enum: ["NGN", "USDT"],
      required: true,
    },

    // Only used for USDT payments
    exchangeRate: {
      type: Number,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    provider: {
      type: String,
      enum: ["PAYSTACK", "NOWPAYMENTS", "KORAPAY", "FLUTTERWAVE"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
