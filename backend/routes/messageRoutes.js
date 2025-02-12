const express = require("express");
const router = express.Router();
const { sendMessage, getMessagesByChat } = require("../controllers/messageController");

// Tạo message
router.post("/", sendMessage);

// Lấy tất cả message từ 1 chat
router.get("/:chatId", getMessagesByChat);

module.exports = router;