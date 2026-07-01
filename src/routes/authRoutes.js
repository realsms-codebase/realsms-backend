const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected
router.get("/me", protect, getMe);

// PROFILE ROUTES
router.get("/profile", protect, getProfile);

router.put("/profile", protect, updateProfile);

module.exports = router;

