const Chat = require("../models/Chat");
const User = require("../models/Users");

// Tạo phòng chat mới
exports.createChat = async (req, res) => {
  try {
    const { members, chatName } = req.body;
    const newChat = await Chat.create({ members, chatName });
    return res.status(201).json(newChat);
  } catch (error) {
    console.error("createChat error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Lấy danh sách chat của user
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const chats = await Chat.find({ members: userId })
      .populate("members", "username avatar")
      .sort({ updatedAt: -1 });
    return res.json(chats);
  } catch (error) {
    console.error("getUserChats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ... Thêm các hàm updateChat, deleteChat nếu cần