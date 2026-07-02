// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     // ✅ UPDATED SERVICE STRUCTURE
//     service: {
//       id: {
//         type: String,
//         required: true,
//       },
//       name: {
//         type: String,
//         required: true,
//       },
//     },

//     country: {
//       id: {
//         type: String,
//         required: true,
//       },
//       code: {
//         type: String,
//         required: true,
//       },
//     },

//     orderid: {
//       type: String,
//       required: true,
//       unique: true,
//     },

//     number: {
//       type: String,
//       required: true,
//     },

//     baseCost: {
//       type: Number,
//       required: true,
//     },

//     priceCharged: {
//       type: Number,
//       required: true,
//     },

//     profit: {
//       type: Number,
//       default: 0,
//     },

//     status: {
//       type: String,
//       enum: ["waiting", "received", "refunded", "cancelled"],
//       default: "waiting",
//     },

//     otp: {
//       type: String,
//     },

//     refunded: {
//       type: Boolean,
//       default: false,
//     },

//     refundedAt: {
//       type: Date,
//     },

//     resendRequested: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Order", orderSchema);

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service: {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },

    country: {
      id: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        required: true,
      },
    },

    orderid: {
      type: String,
      required: true,
      unique: true,
    },

    number: {
      type: String,
      required: true,
    },

    baseCost: {
      type: Number,
      required: true,
    },

    priceCharged: {
      type: Number,
      required: true,
    },

    profit: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["waiting", "received", "refunded", "cancelled"],
      default: "waiting",
    },

    otp: {
      type: String,
      default: "",
    },

    refunded: {
      type: Boolean,
      default: false,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    // Waiting for a new OTP after user clicks Resend
    awaitingResend: {
      type: Boolean,
      default: false,
    },

    // Prevent users from spamming resend
    lastResendAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
