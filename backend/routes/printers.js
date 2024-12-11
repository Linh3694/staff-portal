const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Danh sách printers");
});

router.post("/", (req, res) => {
  res.send("Thêm printer");
});

module.exports = router;