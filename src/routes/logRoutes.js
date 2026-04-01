const express = require("express");
const router = express.Router();
const { createLog, getLogs, deleteLog, updateLog, buyLog } = require("../controllers/logController");

router.post("/", createLog);
router.get("/", getLogs);
router.delete("/:id", deleteLog); 
router.put("/:id", updateLog);
router.post("/buy/:id", buyLog);

module.exports = router;
