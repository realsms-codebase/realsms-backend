// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     firstName: { type: String, required: true },
//     lastName: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     resetPasswordToken: String,
//     resetPasswordExpire: Date,

//     walletBalanceNGN: {
//       type: Number,
//       default: 0,
//     },

//     // ✅ ADD THIS
//     status: {
//       type: String,
//       enum: ["Active", "Banned"],
//       default: "Active",
//     },
//   },
//   { timestamps: true }
// );

// const User = mongoose.model("User", userSchema);

// module.exports = User;


const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // Email verification
    // Legacy users remain verified by default.
    // New registrations explicitly set this to false.
    emailVerified: {
      type: Boolean,
      default: true,
    },

    emailVerificationCode: {
      type: String,
      default: undefined,
      select: false,
    },

    emailVerificationExpire: {
      type: Date,
      default: undefined,
      select: false,
    },

    // Password reset
    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpire: {
      type: Date,
      select: false,
    },

    walletBalanceNGN: {
      type: Number,
      default: 0,
    },

    // Account status
    status: {
      type: String,
      enum: ["Active", "Banned"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
