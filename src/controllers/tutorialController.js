const Tutorial = require(
  "../models/Tutorial"
);


// =======================
// GET ALL TUTORIALS
// =======================

const getTutorials = async (
  req,
  res
) => {
  try {
    const tutorials =
      await Tutorial.find()
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      tutorials,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};


// =======================
// CREATE TUTORIAL
// =======================

const createTutorial = async (
  req,
  res
) => {
  try {
    const {
      title,
      description,
      category,
      duration,
    } = req.body;

    const thumbnail =
      req.files?.thumbnail?.[0]
        ?.filename;

    const video =
      req.files?.video?.[0]
        ?.filename;

    const tutorial =
      await Tutorial.create({
        title,
        description,
        category,
        duration,

        thumbnail: thumbnail
          ? `${req.protocol}://${req.get(
              "host"
            )}/uploads/thumbnails/${thumbnail}`
          : "",

        video: video
          ? `${req.protocol}://${req.get(
              "host"
            )}/uploads/videos/${video}`
          : "",
      });

    res.status(201).json({
      success: true,
      tutorial,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message:
        error.message,
    });

  }
};


// =======================
// UPDATE TUTORIAL
// =======================

const updateTutorial = async (
  req,
  res
) => {
  try {

    const tutorial =
      await Tutorial.findById(
        req.params.id
      );

    if (!tutorial) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Tutorial not found",
        });
    }

    tutorial.title =
      req.body.title ||
      tutorial.title;

    tutorial.description =
      req.body.description ||
      tutorial.description;

    tutorial.category =
      req.body.category ||
      tutorial.category;

    tutorial.duration =
      req.body.duration ||
      tutorial.duration;

    if (
      req.files?.thumbnail?.[0]
    ) {
      tutorial.thumbnail =
        `${req.protocol}://${req.get(
          "host"
        )}/uploads/thumbnails/${
          req.files
            .thumbnail[0]
            .filename
        }`;
    }

    if (
      req.files?.video?.[0]
    ) {
      tutorial.video =
        `${req.protocol}://${req.get(
          "host"
        )}/uploads/videos/${
          req.files
            .video[0]
            .filename
        }`;
    }

    await tutorial.save();

    res.status(200).json({
      success: true,
      tutorial,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message:
        error.message,
    });

  }
};


// =======================
// DELETE TUTORIAL
// =======================

const deleteTutorial =
  async (req, res) => {
    try {

      const tutorial =
        await Tutorial.findById(
          req.params.id
        );

      if (!tutorial) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Tutorial not found",
          });
      }

      await tutorial.deleteOne();

      res.status(200).json({
        success: true,
        message:
          "Tutorial deleted",
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message:
          error.message,
      });

    }
  };

module.exports = {
  getTutorials,
  createTutorial,
  updateTutorial,
  deleteTutorial,
};
