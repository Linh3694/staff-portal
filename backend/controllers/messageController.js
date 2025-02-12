const Message = require("../models/Message");
const Chat = require("../models/Chat");

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, sender, text, media } = req.body;

    // Tạo message
    const newMessage = await Message.create({
      chatId,
      sender,
      text,
      media
    });

    // Cập nhật updatedAt của chat để sắp xếp chat mới nhất
    await Chat.findByIdAndUpdate(chatId, { updatedAt: Date.now() });

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getMessagesByChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 }); // sắp xếp tin nhắn cũ -> mới
    return res.json(messages);
  } catch (error) {
    console.error("getMessagesByChat error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};