// const express = require("express");
// const router = express.Router();
// const { initializePayment, verifyPayment } = require("../controllers/korapayController");
// const { protect } = require("../middleware/authMiddleware");

// // POST /api/korapay/init
// router.post("/init", protect, initializePayment);

// // // GET /api/korapay/verify?reference=...
// router.get("/verify", verifyPayment);

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  initializePayment,
  verifyPayment,
  korapayWebhook, // ✅ ADD THIS
} = require("../controllers/korapayController");

const { protect } = require("../middleware/authMiddleware");

// ✅ Initialize payment
router.post("/init", protect, initializePayment);

// ✅ Redirect verification (fallback)
router.get("/verify", verifyPayment);

// ✅ WEBHOOK (CRITICAL)
router.post("/webhook", express.json(), korapayWebhook);

module.exports = router;
