const express = require("express");
const router = express.Router();
const { createChat, getUserChats } = require("../controllers/chatController");

router.post("/", createChat);
router.get("/user/:userId", getUserChats);
// ... router.put(...) updateChat, router.delete(...) deleteChat

module.exports = router;