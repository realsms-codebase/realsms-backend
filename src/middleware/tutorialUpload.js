const multer = require("multer");

const {
  CloudinaryStorage,
} = require(
  "multer-storage-cloudinary"
);

const cloudinary = require(
  "../utils/cloudinary"
);

const storage =
  new CloudinaryStorage({
    cloudinary,

    params: async (
      req,
      file
    ) => {

      // Thumbnail upload
      if (
        file.fieldname ===
        "thumbnail"
      ) {
        return {
          folder:
            "tutorial-thumbnails",
          resource_type:
            "image",

          allowed_formats: [
            "jpg",
            "jpeg",
            "png",
            "webp",
          ],
        };
      }

      // Video upload
      if (
        file.fieldname ===
        "video"
      ) {
        return {
          folder:
            "tutorial-videos",
          resource_type:
            "video",

          allowed_formats: [
            "mp4",
            "mov",
            "avi",
            "webm",
          ],
        };
      }

      throw new Error(
        "Unsupported file type"
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
        "Only image files allowed"
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
        "Only video files allowed"
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

  limits: {
    fileSize:
      1000 *
      1024 *
      1024,
  },
});

module.exports = upload;
