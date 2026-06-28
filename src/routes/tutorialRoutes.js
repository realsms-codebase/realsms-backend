const express = require(
  "express"
);

const router =
  express.Router();

const upload = require(
  "../middleware/tutorialUpload"
);

const {
  getTutorials,
  createTutorial,
  updateTutorial,
  deleteTutorial,
} = require(
  "../controllers/tutorialController"
);


// Get tutorials
router.get(
  "/",
  getTutorials
);


// Create tutorial
router.post(
  "/",
  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
    {
      name: "video",
      maxCount: 1,
    },
  ]),
  createTutorial
);


// Update tutorial
router.put(
  "/:id",
  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
    {
      name: "video",
      maxCount: 1,
    },
  ]),
  updateTutorial
);


// Delete tutorial
router.delete(
  "/:id",
  deleteTutorial
);

module.exports =
  router;
