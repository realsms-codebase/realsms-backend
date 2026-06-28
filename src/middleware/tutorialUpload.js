const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    if (file.fieldname === "thumbnail") {
      cb(null, "uploads/thumbnails");
    }

    if (file.fieldname === "video") {
      cb(null, "uploads/videos");
    }
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {

  if (
    file.fieldname === "thumbnail"
  ) {
    if (
      file.mimetype.startsWith(
        "image"
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only images allowed"
        )
      );
    }
  }

  if (
    file.fieldname === "video"
  ) {
    if (
      file.mimetype.startsWith(
        "video"
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only videos allowed"
        )
      );
    }
  }
};

const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;
