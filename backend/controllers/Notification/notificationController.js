const Ticket = require("../../models/Ticket");
const User = require("../../models/Users");
const Notification = require("../../models/Notification");
const { Expo } = require('expo-server-sdk');

// Khởi tạo instance của Expo
let expo = new Expo();

/**
 * Hàm dịch trạng thái sang tiếng Việt
 */
function translateStatus(status) {
  const statusMap = {
    "Assigned": "Đã nhận",
    "Processing": "Đang xử lý",
    "In Progress": "Đang xử lý",
    "Completed": "Hoàn thành",
    "Done": "Hoàn thành",
    "Cancelled": "Đã huỷ",
    "Waiting for Customer": "Chờ phản hồi",
    "Closed": "Đã đóng",
  };

  return statusMap[status] || status;
}

/**
 * Gửi thông báo đến các thiết bị theo danh sách token
 * @param {Array} pushTokens - Danh sách token thiết bị
 * @param {String} title - Tiêu đề thông báo
 * @param {String} body - Nội dung thông báo
 * @param {Object} data - Dữ liệu bổ sung gửi kèm thông báo
 */
const sendPushNotifications = async (pushTokens, title, body, data = {}) => {
    try {
        // Tạo danh sách messages để gửi
        let messages = [];

        // Kiểm tra và lọc các token hợp lệ
        for (let pushToken of pushTokens) {
            if (!Expo.isExpoPushToken(pushToken)) {
                console.error(`Push token ${pushToken} không phải là token Expo hợp lệ`);
                continue;
            }

            // Thêm thông báo vào danh sách
            messages.push({
                to: pushToken,
                sound: 'default',
                title,
                body,
                data,
            });
        }

        // Chia thành chunks để tránh vượt quá giới hạn của Expo
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];

        // Gửi từng chunk
        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Lỗi khi gửi thông báo:', error);
            }
        }

        return tickets;
    } catch (error) {
        console.error('Lỗi trong quá trình gửi thông báo:', error);
        return [];
    }
};

/**
 * Lưu thông báo vào cơ sở dữ liệu
 * @param {Array} recipients - Danh sách ID người nhận
 * @param {String} title - Tiêu đề thông báo
 * @param {String} body - Nội dung thông báo
 * @param {Object} data - Dữ liệu bổ sung
 * @param {String} type - Loại thông báo
 */
const saveNotificationToDatabase = async (recipients, title, body, data = {}, type = "system") => {
    try {
        // Tạo các đối tượng thông báo cho từng người nhận
        const notifications = recipients.map(recipient => ({
            recipient,
            title,
            body,
            data,
            type,
            read: false
        }));

        // Lưu vào cơ sở dữ liệu
        await Notification.insertMany(notifications);
    } catch (error) {
        console.error('Lỗi khi lưu thông báo vào cơ sở dữ liệu:', error);
    }
};

/**
 * Gửi thông báo khi ticket mới được tạo
 */
exports.sendNewTicketNotification = async (ticket) => {
    try {
        // Tìm tất cả các admin và technical để gửi thông báo
        const admins = await User.find({
            role: { $in: ['admin', 'superadmin', 'technical'] },
        });

        if (!admins || admins.length === 0) {
            console.log('Không tìm thấy admin nào để gửi thông báo');
            return;
        }

        // Lấy danh sách ID người nhận
        const recipientIds = admins.map(admin => admin._id);

        // Tạo nội dung thông báo
        const title = 'Ticket mới';
        const body = `Ticket #${ticket.ticketCode} đã được tạo và đang chờ xử lý`;
        const data = {
            ticketId: ticket._id.toString(),
            ticketCode: ticket.ticketCode,
            type: 'new_ticket'
        };

        // Lưu thông báo vào cơ sở dữ liệu
        await saveNotificationToDatabase(recipientIds, title, body, data, "ticket");

        // Lấy danh sách token từ các admin
        const adminTokens = admins
            .filter(admin => admin.deviceToken)
            .map(admin => admin.deviceToken);

        if (adminTokens.length === 0) {
            console.log('Không có admin nào đăng ký nhận thông báo');
            return;
        }

        // Gửi thông báo đẩy
        await sendPushNotifications(adminTokens, title, body, data);
        console.log(`Đã gửi thông báo ticket mới #${ticket.ticketCode} đến ${adminTokens.length} admin`);
    } catch (error) {
        console.error('Lỗi khi gửi thông báo ticket mới:', error);
    }
};

/**
 * Gửi thông báo khi có đánh giá mới từ khách hàng
 */
exports.sendFeedbackNotification = async (ticket) => {
    try {
        const recipientsList = [];

        // Thêm người tạo ticket vào danh sách (nếu là admin/staff)
        if (ticket.creator) {
            const creator = await User.findById(ticket.creator);
            if (creator && (creator.role === 'admin' || creator.role === 'technical' || creator.role === 'superadmin')) {
                recipientsList.push(creator);
            }
        }

        // Thêm người được gán ticket
        if (ticket.assignedTo) {
            const assignedUser = await User.findById(ticket.assignedTo);
            if (assignedUser &&
                !recipientsList.some(user => user._id.toString() === assignedUser._id.toString())) {
                recipientsList.push(assignedUser);
            }
        }

        // Thêm tất cả admin và superadmin
        const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } });
        for (const admin of admins) {
            if (!recipientsList.some(user => user._id.toString() === admin._id.toString())) {
                recipientsList.push(admin);
            }
        }

        if (recipientsList.length === 0) {
            console.log('Không có người nhận thông báo đánh giá cho ticket:', ticket.ticketCode);
            return;
        }

        // Lấy danh sách ID người nhận
        const recipientIds = recipientsList.map(user => user._id);

        // Tạo nội dung thông báo
        let title = `Ticket #${ticket.ticketCode} đã được đánh giá`;
        let body;
        
        if (ticket.feedback && ticket.feedback.rating) {
            body = `Khách hàng đã đánh giá ${ticket.feedback.rating}/5 sao`;
        } else {
            body = `Khách hàng đã từ chối xác nhận hoàn thành`;
        }

        const data = {
            ticketId: ticket._id.toString(),
            ticketCode: ticket.ticketCode,
            type: 'ticket_feedback',
        };

        // Lưu thông báo vào cơ sở dữ liệu
        await saveNotificationToDatabase(recipientIds, title, body, data, "ticket");

        // Lấy danh sách token từ những người dùng có đăng ký thiết bị
        const tokens = recipientsList
            .filter(user => user.deviceToken)
            .map(user => user.deviceToken);

        console.log('Tokens to send notification:', tokens);

        // Gửi thông báo
        if (tokens.length > 0) {
            await sendPushNotifications(tokens, title, body, data);
            console.log(`Đã gửi thông báo đánh giá cho ticket #${ticket.ticketCode} đến ${tokens.length} người`);
        }
    } catch (error) {
        console.error('Lỗi khi gửi thông báo đánh giá ticket:', error);
    }
};

/**
 * Gửi thông báo khi ticket được cập nhật
 * @param {Object} ticket - Ticket object
 * @param {String} action - Loại hành động (assigned, status_updated, comment_added, etc)
 * @param {String} excludeUserId - ID của người dùng sẽ không nhận thông báo (người gửi tin nhắn)
 */
exports.sendTicketUpdateNotification = async (ticket, action, excludeUserId = null) => {
    try {
        const recipientsList = [];

        // Luôn thêm người tạo ticket vào danh sách nhận thông báo (trừ khi là người bị loại trừ)
        if (ticket.creator && (!excludeUserId || ticket.creator.toString() !== excludeUserId.toString())) {
            const creator = await User.findById(ticket.creator);
            if (creator) {
                recipientsList.push(creator);
            }
        }

        // Nếu ticket được gán cho ai đó, thêm họ vào danh sách (trừ khi là người bị loại trừ)
        if (ticket.assignedTo && (!excludeUserId || ticket.assignedTo.toString() !== excludeUserId.toString())) {
            const assignedUser = await User.findById(ticket.assignedTo);
            if (assignedUser &&
                !recipientsList.some(user => user._id.toString() === assignedUser._id.toString())) {
                recipientsList.push(assignedUser);
            }
        }

        // Nếu action là status_updated (cập nhật trạng thái), thêm tất cả superadmin vào danh sách nhận thông báo
        if (action === 'status_updated') {
            const superAdmins = await User.find({ role: "superadmin" });
            for (const admin of superAdmins) {
                // Kiểm tra xem admin đã có trong danh sách chưa và không phải là người bị loại trừ
                if (!recipientsList.some(user => user._id.toString() === admin._id.toString()) && 
                    (!excludeUserId || admin._id.toString() !== excludeUserId.toString())) {
                    recipientsList.push(admin);
                }
            }
        }

        // Nếu trạng thái là Closed hoặc chuyển từ Done sang Processing (mở lại ticket),
        // thêm tất cả admin và người được gán vào danh sách
        if (ticket.status === 'Closed' || 
            (ticket.status === 'Processing' && action === 'status_updated')) {
            const admins = await User.find({ role: { $in: ['admin', 'technical'] } });
            for (const admin of admins) {
                if (!recipientsList.some(user => user._id.toString() === admin._id.toString()) && 
                    (!excludeUserId || admin._id.toString() !== excludeUserId.toString())) {
                    recipientsList.push(admin);
                }
            }
        }

        if (recipientsList.length === 0) {
            console.log('Không có người nhận thông báo cho ticket:', ticket.ticketCode);
            return;
        }

        // Lấy danh sách ID người nhận
        const recipientIds = recipientsList.map(user => user._id);

        // Tạo nội dung thông báo dựa trên hành động
        let title, body;

        switch (action) {
            case 'assigned':
                title = `Ticket #${ticket.ticketCode} đã được gán`;
                body = `Ticket đã được gán cho nhân viên hỗ trợ`;
                break;
            case 'status_updated':
                title = `Ticket #${ticket.ticketCode} đã cập nhật trạng thái`;
                // Nếu trạng thái từ Done sang Processing, đó là khách hàng mở lại ticket
                if (ticket.status === 'Processing') {
                    body = `Khách hàng đã yêu cầu xử lý lại ticket`;
                } else {
                    body = `Trạng thái mới: ${translateStatus(ticket.status)}`;
                }
                break;
            case 'comment_added':
                title = `Ticket #${ticket.ticketCode} có tin nhắn mới`;
                body = `Có tin nhắn mới trong ticket của bạn`;
                break;
            case 'feedback_added':
                title = `Ticket #${ticket.ticketCode} đã nhận đánh giá`;
                body = ticket.feedback && ticket.feedback.rating 
                    ? `Khách hàng đã đánh giá ${ticket.feedback.rating}/5 sao` 
                    : `Khách hàng đã gửi đánh giá`;
                break;
            default:
                title = `Ticket #${ticket.ticketCode} đã cập nhật`;
                body = `Ticket của bạn đã được cập nhật`;
        }

        const data = {
            ticketId: ticket._id.toString(),
            ticketCode: ticket.ticketCode,
            type: 'ticket_update',
            action: action
        };

        // Lưu thông báo vào cơ sở dữ liệu
        await saveNotificationToDatabase(recipientIds, title, body, data, "ticket");

        // Lấy danh sách token từ những người dùng có đăng ký thiết bị
        const tokens = recipientsList
            .filter(user => {
                // Kiểm tra xem user có phải là người gửi không
                const isSender = excludeUserId && user._id.toString() === excludeUserId.toString();
                console.log('Checking user:', {
                    userId: user._id.toString(),
                    excludeUserId: excludeUserId?.toString(),
                    isSender,
                    hasDeviceToken: !!user.deviceToken,
                    deviceToken: user.deviceToken
                });
                // Chỉ lấy token của người không phải là người gửi và có device token
                return !isSender && user.deviceToken;
            })
            .map(user => user.deviceToken);

        console.log('Final tokens to send:', tokens);
        console.log('excludeUserId:', excludeUserId);
        console.log('recipientsList:', recipientsList.map(u => ({
            id: u._id.toString(),
            deviceToken: u.deviceToken
        })));

        // Gửi thông báo
        if (tokens.length > 0) {
            await sendPushNotifications(tokens, title, body, data);
            console.log(`Đã gửi thông báo cập nhật cho ticket #${ticket.ticketCode} đến ${tokens.length} người`);
        }
    } catch (error) {
        console.error('Lỗi khi gửi thông báo cập nhật ticket:', error);
    }
};

/**
 * Đăng ký thiết bị để nhận thông báo
 */
exports.registerDevice = async (req, res) => {
    try {
        const { deviceToken } = req.body;
        const userId = req.user._id;

        if (!deviceToken) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu token thiết bị'
            });
        }

        // Kiểm tra token có hợp lệ không
        if (!Expo.isExpoPushToken(deviceToken)) {
            return res.status(400).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }

        // Cập nhật token vào tài khoản người dùng
        await User.findByIdAndUpdate(userId, { deviceToken });

        return res.status(200).json({
            success: true,
            message: 'Đăng ký thiết bị thành công'
        });
    } catch (error) {
        console.error('Lỗi khi đăng ký thiết bị:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi đăng ký thiết bị'
        });
    }
};

/**
 * Hủy đăng ký thiết bị
 */
exports.unregisterDevice = async (req, res) => {
    try {
        const userId = req.user._id;

        // Xóa token khỏi tài khoản người dùng
        await User.findByIdAndUpdate(userId, { $unset: { deviceToken: 1 } });

        return res.status(200).json({
            success: true,
            message: 'Hủy đăng ký thiết bị thành công'
        });
    } catch (error) {
        console.error('Lỗi khi hủy đăng ký thiết bị:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi hủy đăng ký thiết bị'
        });
    }
};

/**
 * Lấy danh sách thông báo của người dùng
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Lấy danh sách thông báo
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Đếm tổng số thông báo và số thông báo chưa đọc
        const total = await Notification.countDocuments({ recipient: userId });
        const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });

        return res.status(200).json({
            success: true,
            notifications,
            pagination: {
                total,
                unreadCount,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách thông báo:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách thông báo'
        });
    }
};

/**
 * Đánh dấu thông báo đã đọc
 */
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOne({
            _id: notificationId,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        notification.read = true;
        await notification.save();

        return res.status(200).json({
            success: true,
            message: 'Đã đánh dấu thông báo là đã đọc'
        });
    } catch (error) {
        console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi đánh dấu thông báo'
        });
    }
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { recipient: userId, read: false },
            { $set: { read: true } }
        );

        return res.status(200).json({
            success: true,
            message: 'Đã đánh dấu tất cả thông báo là đã đọc'
        });
    } catch (error) {
        console.error('Lỗi khi đánh dấu tất cả thông báo đã đọc:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi đánh dấu tất cả thông báo'
        });
    }
};

/**
 * Xóa thông báo
 */
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOne({
            _id: notificationId,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        await notification.deleteOne();

        return res.status(200).json({
            success: true,
            message: 'Đã xóa thông báo'
        });
    } catch (error) {
        console.error('Lỗi khi xóa thông báo:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa thông báo'
        });
    }
};

/**
 * Xóa tất cả thông báo
 */
exports.deleteAllNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.deleteMany({ recipient: userId });

        return res.status(200).json({
            success: true,
            message: 'Đã xóa tất cả thông báo'
        });
    } catch (error) {
        console.error('Lỗi khi xóa tất cả thông báo:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa tất cả thông báo'
        });
    }
};

/**
 * Gửi thông báo khi có tin nhắn chat mới
 */
exports.sendNewChatMessageNotification = async (message, senderName, chat) => {
    try {
        // Lấy thông tin người gửi và người nhận
        const senderId = message.sender.toString();

        // Lọc ra các người dùng trong cuộc trò chuyện trừ người gửi
        const recipientIds = chat.participants
            .filter(participantId => participantId.toString() !== senderId)
            .map(participantId => participantId.toString());

        if (recipientIds.length === 0) {
            console.log('Không có người nhận thông báo cho tin nhắn');
            return;
        }

        // Tìm thông tin chi tiết của người nhận
        const recipients = await User.find({ _id: { $in: recipientIds } });

        if (recipients.length === 0) {
            console.log('Không tìm thấy thông tin người nhận');
            return;
        }

        // Tạo nội dung thông báo
        let title = `${senderName}`;
        let body = '';

        // Tùy chỉnh nội dung tùy theo loại tin nhắn
        if (message.type === 'text') {
            body = message.content.length > 30
                ? `${message.content.substring(0, 30)}...`
                : message.content;
        } else if (message.type === 'image') {
            body = 'Đã gửi một hình ảnh';
        } else if (message.type === 'multiple-images') {
            body = `Đã gửi ${message.fileUrls.length} hình ảnh`;
        } else if (message.type === 'file') {
            body = 'Đã gửi một tệp đính kèm';
        }

        const data = {
            chatId: chat._id.toString(),
            messageId: message._id.toString(),
            senderId: senderId,
            type: 'new_chat_message'
        };

        // Lưu thông báo vào cơ sở dữ liệu
        await saveNotificationToDatabase(recipientIds, title, body, data, "chat");

        // Lấy danh sách token thiết bị từ người nhận
        const recipientTokens = recipients
            .filter(user => user.deviceToken)
            .map(user => user.deviceToken);

        if (recipientTokens.length === 0) {
            console.log('Không có người nhận nào đăng ký thiết bị nhận thông báo');
            return;
        }

        // Gửi thông báo đẩy
        await sendPushNotifications(recipientTokens, title, body, data);
        console.log(`Đã gửi thông báo tin nhắn mới đến ${recipientTokens.length} người nhận`);
    } catch (error) {
        console.error('Lỗi khi gửi thông báo tin nhắn chat mới:', error);
    }
}; 