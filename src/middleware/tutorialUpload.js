const multer = require("multer");
const path = require("path");
const fs = require("fs");

// absolute upload paths
const thumbnailPath = path.join(
  __dirname,
  "../uploads/thumbnails"
);

const videoPath = path.join(
  __dirname,
  "../uploads/videos"
);

// create folders automatically
fs.mkdirSync(thumbnailPath, {
  recursive: true,
});

fs.mkdirSync(videoPath, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    if (file.fieldname === "thumbnail") {
      return cb(
        null,
        thumbnailPath
      );
    }

    if (file.fieldname === "video") {
      return cb(
        null,
        videoPath
      );
    }

    cb(
      new Error("Invalid file type"),
      null
    );
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(
        file.originalname
      )
    );
  },
});

const fileFilter = (
  req,
  file,
  cb
) => {

  if (
    file.fieldname ===
    "thumbnail"
  ) {

    if (
      file.mimetype.startsWith(
        "image/"
      )
    ) {
      return cb(
        null,
        true
      );
    }

    return cb(
      new Error(
        "Only images allowed"
      ),
      false
    );
  }

  if (
    file.fieldname ===
    "video"
  ) {

    if (
      file.mimetype.startsWith(
        "video/"
      )
    ) {
      return cb(
        null,
        true
      );
    }

    return cb(
      new Error(
        "Only videos allowed"
      ),
      false
    );
  }

  return cb(
    new Error(
      "Unsupported file"
    ),
    false
  );
};

const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;
