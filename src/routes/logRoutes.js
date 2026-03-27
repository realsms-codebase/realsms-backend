const express = require("express");
const router = express.Router();
const { createLog, getLogs, deleteLog, } = require("../controllers/logController");

router.post("/", createLog);
router.get("/", getLogs);
router.delete("/log/:id", deleteLog); 

module.exports = router;
