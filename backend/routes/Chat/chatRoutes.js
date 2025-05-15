const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/Chat/chatController');
const authenticate = require('../../middleware/authMiddleware');
const Message = require('../../models/Message');
const uploadChat = require('../../middleware/uploadChat');
const Chat = require('../../models/Chat');

// Tạo hoặc lấy chat với người dùng khác
router.post('/create', authenticate, chatController.createOrGetChat);

// Lấy danh sách chat của user
router.get('/list', authenticate, chatController.getUserChats);

// Gửi tin nhắn
router.post('/message', authenticate, chatController.sendMessage);

// Lấy tin nhắn của một chat
router.get('/messages/:chatId', authenticate, chatController.getChatMessages);

// Đánh dấu tin nhắn đã đọc
router.put('/message/:messageId/read', authenticate, chatController.markMessageAsRead);

// Đánh dấu tất cả tin nhắn trong một chat là đã đọc
router.put('/read-all/:chatId', authenticate, async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        // Tìm tất cả tin nhắn chưa đọc trong chat
        const unreadMessages = await Message.find({
            chat: chatId,
            sender: { $ne: userId },
            readBy: { $nin: [userId] }
        });

        if (unreadMessages.length === 0) {
            return res.status(200).json({ message: 'Không có tin nhắn cần đánh dấu đã đọc' });
        }

        // Đánh dấu tất cả tin nhắn là đã đọc
        const updatePromises = unreadMessages.map(async (message) => {
            message.readBy.push(userId);
            return message.save();
        });

        await Promise.all(updatePromises);

        // Emit socket event thông báo tin nhắn đã được đọc
        const io = req.app.get('io');
        io.to(chatId).emit('messageRead', {
            userId: userId,
            chatId: chatId
        });

        res.status(200).json({ message: `Đã đánh dấu đọc ${unreadMessages.length} tin nhắn` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload file/ảnh cho chat
router.post('/upload-attachment', authenticate, uploadChat.single('file'), chatController.uploadChatAttachment);

// Upload nhiều ảnh cùng lúc
router.post('/upload-multiple', authenticate, uploadChat.array('files', 6), chatController.uploadMultipleImages);

// Lấy thông tin chi tiết của một chat
router.get('/:chatId', authenticate, async (req, res) => {
    try {
        const { chatId } = req.params;

        // Tìm chat và populate thông tin người tham gia
        const chat = await Chat.findById(chatId)
            .populate('participants', 'fullname avatarUrl email')
            .populate('lastMessage');

        if (!chat) {
            return res.status(404).json({ message: 'Không tìm thấy chat' });
        }

        // Kiểm tra xem người dùng hiện tại có phải là người tham gia vào chat không
        const isParticipant = chat.participants.some(
            participant => participant._id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập chat này' });
        }

        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 