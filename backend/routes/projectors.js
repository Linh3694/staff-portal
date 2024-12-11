const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Danh sách projectors");
});

router.post("/", (req, res) => {
  res.send("Thêm projector");
});


module.exports = { router };