// const mongoose = require("mongoose");

// const supportSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     message: {
//       type: String,
//       required: true,
//     },

//     sender: {
//       type: String,
//       enum: ["user", "admin"],
//       required: true,
//     },

//     read: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Support", supportSchema);

const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    sender: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Support", supportSchema);
