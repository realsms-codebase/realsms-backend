const express = require("express");
const router = express.Router();

const {
  sendBroadcastEmail,
} = require("../controllers/broadcastController");

router.post(
  "/email-broadcast",
  sendBroadcastEmail
);

module.exports = router;
