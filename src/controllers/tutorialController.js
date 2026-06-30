// const Tutorial = require(
//   "../models/Tutorial"
// );

// // =======================
// // GET ALL TUTORIALS
// // =======================

// const getTutorials = async (
//   req,
//   res
// ) => {
//   try {
//     const tutorials =
//       await Tutorial.find()
//         .sort({
//           createdAt: -1,
//         });

//     res.status(200).json({
//       success: true,
//       tutorials,
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message:
//         error.message,
//     });

//   }
// };


// // =======================
// // CREATE TUTORIAL
// // =======================

// const createTutorial = async (
//   req,
//   res
// ) => {
//   try {

//     const {
//       title,
//       description,
//       category,
//       duration,
//     } = req.body;

//     const thumbnail =
//       req.files?.thumbnail?.[0]
//         ?.path || "";

//     const video =
//       req.files?.video?.[0]
//         ?.path || "";

//     const tutorial =
//       await Tutorial.create({
//         title,
//         description,
//         category,
//         duration,
//         thumbnail,
//         video,
//       });

//     res.status(201).json({
//       success: true,
//       tutorial,
//     });

//   } catch (error) {

//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message:
//         error.message,
//     });

//   }
// };


// // =======================
// // UPDATE TUTORIAL
// // =======================

// const updateTutorial = async (
//   req,
//   res
// ) => {
//   try {

//     const tutorial =
//       await Tutorial.findById(
//         req.params.id
//       );

//     if (!tutorial) {
//       return res
//         .status(404)
//         .json({
//           success: false,
//           message:
//             "Tutorial not found",
//         });
//     }

//     tutorial.title =
//       req.body.title ||
//       tutorial.title;

//     tutorial.description =
//       req.body.description ||
//       tutorial.description;

//     tutorial.category =
//       req.body.category ||
//       tutorial.category;

//     tutorial.duration =
//       req.body.duration ||
//       tutorial.duration;

//     if (
//       req.files?.thumbnail?.[0]
//     ) {
//       tutorial.thumbnail =
//         req.files
//           .thumbnail[0]
//           .path;
//     }

//     if (
//       req.files?.video?.[0]
//     ) {
//       tutorial.video =
//         req.files
//           .video[0]
//           .path;
//     }

//     await tutorial.save();

//     res.status(200).json({
//       success: true,
//       tutorial,
//     });

//   } catch (error) {

//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message:
//         error.message,
//     });

//   }
// };


// // =======================
// // DELETE TUTORIAL
// // =======================

// const deleteTutorial =
//   async (
//     req,
//     res
//   ) => {
//     try {

//       const tutorial =
//         await Tutorial.findById(
//           req.params.id
//         );

//       if (!tutorial) {
//         return res
//           .status(404)
//           .json({
//             success: false,
//             message:
//               "Tutorial not found",
//           });
//       }

//       await tutorial.deleteOne();

//       res.status(200).json({
//         success: true,
//         message:
//           "Tutorial deleted",
//       });

//     } catch (error) {

//       console.log(error);

//       res.status(500).json({
//         success: false,
//         message:
//           error.message,
//       });

//     }
//   };

// module.exports = {
//   getTutorials,
//   createTutorial,
//   updateTutorial,
//   deleteTutorial,
// };

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

    console.log(error);

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
      thumbnail,
      video,
    } = req.body;

    if (
      !title ||
      !video
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Title and video are required",
        });
    }

    const tutorial =
      await Tutorial.create({
        title,
        description,
        category,
        duration,
        thumbnail,
        video,
      });

    res.status(201).json({
      success: true,
      tutorial,
    });

  } catch (error) {

    console.log(error);

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

    tutorial.thumbnail =
      req.body.thumbnail ||
      tutorial.thumbnail;

    tutorial.video =
      req.body.video ||
      tutorial.video;

    await tutorial.save();

    res.status(200).json({
      success: true,
      tutorial,
    });

  } catch (error) {

    console.log(error);

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
async (
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

    await tutorial.deleteOne();

    res.status(200).json({
      success: true,
      message:
        "Tutorial deleted",
    });

  } catch (error) {

    console.log(error);

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
