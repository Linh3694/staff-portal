const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Danh sách accessories");
});

router.post("/", (req, res) => {
  res.send("Thêm accessories");
});

module.exports = router;