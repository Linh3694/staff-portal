const Chat = require('../../models/Chat');
const Message = require('../../models/Message');
const User = require('../../models/Users');

// Tạo chat mới hoặc lấy chat hiện có
exports.createOrGetChat = async (req, res) => {
    try {
        const { participantId } = req.body;
        const currentUserId = req.user._id;

        // Kiểm tra xem đã có chat giữa 2 người chưa
        let chat = await Chat.findOne({
            participants: {
                $all: [currentUserId, participantId],
                $size: 2
            }
        }).populate('participants', 'fullname avatarUrl email');

        if (!chat) {
            // Tạo chat mới nếu chưa có
            chat = await Chat.create({
                participants: [currentUserId, participantId]
            });
            chat = await chat.populate('participants', 'fullname avatarUrl email');
        }

        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy danh sách chat của user
exports.getUserChats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Chỉ lấy các cuộc trò chuyện có lastMessage (đã có tin nhắn)
        const chats = await Chat.find({
            participants: userId,
            lastMessage: { $exists: true, $ne: null }
        })
            .populate('participants', 'fullname avatarUrl email')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        res.status(200).json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Gửi tin nhắn
exports.sendMessage = async (req, res) => {
    try {
        const { chatId, content, type = 'text' } = req.body;
        const senderId = req.user._id;

        // Tạo tin nhắn mới
        const message = await Message.create({
            chat: chatId,
            sender: senderId,
            content,
            type,
            readBy: [senderId]
        });

        // Cập nhật lastMessage trong chat
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: message._id,
            updatedAt: Date.now()
        });

        // Populate thông tin người gửi
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'fullname avatarUrl email');

        // Emit socket event

        // Lấy lại chat đã cập nhật kèm populate
        const updatedChat = await Chat.findById(chatId)
            .populate('participants', 'fullname avatarUrl email')
            .populate('lastMessage');

        const io = req.app.get('io');

        // 1) Phát tới room chi tiết (ai đang mở ChatDetail)
        io.to(chatId).emit('receiveMessage', populatedMessage);

        // 2) Phát tới room user để ChatScreen refresh
        updatedChat.participants.forEach(p =>
            io.to(p._id.toString()).emit('newChat', updatedChat)
        );

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy tin nhắn của một chat
exports.getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await Message.find({ chat: chatId })
            .populate('sender', 'fullname avatarUrl email')
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Đánh dấu tin nhắn đã đọc
exports.markMessageAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });
        }

        if (!message.readBy.includes(userId)) {
            message.readBy.push(userId);
            await message.save();

            // Emit socket event thông báo tin nhắn đã được đọc
            const io = req.app.get('io');
            io.to(message.chat.toString()).emit('messageRead', {
                messageId: message._id,
                userId: userId,
                chatId: message.chat
            });
        }

        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Upload file/ảnh cho chat
exports.uploadChatAttachment = async (req, res) => {
    try {
        const { chatId } = req.body;
        const senderId = req.user._id;
        if (!req.file) {
            return res.status(400).json({ message: 'Không có file được upload' });
        }
        // Xác định loại file
        let type = 'file';
        if (req.file.mimetype.startsWith('image/')) {
            type = 'image';
        }
        // Đường dẫn file trả về cho client
        const fileUrl = `/uploads/Chat/${req.file.filename}`;
        // Tạo message
        const message = await Message.create({
            chat: chatId,
            sender: senderId,
            content: req.file.originalname,
            type,
            fileUrl,
            readBy: [senderId]
        });
        // Cập nhật lastMessage trong chat
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: message._id,
            updatedAt: Date.now()
        });
        // Populate sender
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'fullname avatarUrl email');
        // Emit socket event
        const io = req.app.get('io');
        io.to(chatId).emit('receiveMessage', populatedMessage);
        // Lấy lại chat đã cập nhật kèm populate
        const updatedChat = await Chat.findById(chatId)
            .populate('participants', 'fullname avatarUrl email')
            .populate('lastMessage');
        updatedChat.participants.forEach(p =>
            io.to(p._id.toString()).emit('newChat', updatedChat)
        );
        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 