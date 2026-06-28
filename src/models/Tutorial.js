const mongoose = require("mongoose");

const tutorialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    category: {
      type: String,
      default: "SMS",
    },

    duration: {
      type: String,
    },

    thumbnail: {
      type: String,
    },

    video: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Tutorial",
  tutorialSchema
);
