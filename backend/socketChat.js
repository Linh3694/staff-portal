const jwt = require("jsonwebtoken");

// Lưu trạng thái online của user
const onlineUsers = {};

module.exports = function(io) {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    let currentUserId = null;
    // Join room by userId (for personal events)
    try {
      const token = socket.handshake.query.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded._id) {
          currentUserId = decoded._id.toString();
          socket.join(currentUserId);
          socket.data.userId = currentUserId;
          onlineUsers[currentUserId] = socket.id;
          // Thông báo tới tất cả client user này online
          io.emit("userOnline", { userId: currentUserId });
        }
      }
    } catch (err) {
      console.error('Token verify error:', err);
    }

    // Join vào phòng chat
    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat room ${chatId}`);
    });

    // Client‑side explicit join to personal room (fallback)
    socket.on("joinUserRoom", (uid) => {
      if (uid) {
        socket.join(uid.toString());
      }
    });

    // Typing indicator
    socket.on("typing", ({ chatId, userId }) => {
      socket.to(chatId).emit("userTyping", { userId });
    });
    socket.on("stopTyping", ({ chatId, userId }) => {
      socket.to(chatId).emit("userStopTyping", { userId });
    });

    // Thông báo trạng thái online (cũ, giữ lại nếu cần)
    socket.on("userOnline", ({ userId, chatId }) => {
      socket.to(chatId).emit("userStatus", { userId, status: "online" });
      socket.data.userId = userId;
      onlineUsers[userId] = socket.id;
      io.emit("userOnline", { userId });
    });

    // Xử lý thông báo tin nhắn đã đọc
    socket.on("messageRead", (data) => {
      socket.to(data.chatId).emit("messageRead", data);
    });

    // Rời phòng chat
    socket.on("leaveChat", (chatId) => {
      socket.leave(chatId);
    });

    // Xử lý khi ngắt kết nối
    socket.on("disconnecting", () => {
      const uid = socket.data.userId;
      if (uid) {
        delete onlineUsers[uid];
        // Thông báo tới tất cả client user này offline
        io.emit("userOffline", { userId: uid });
        socket.rooms.forEach((room) => {
          if (room !== socket.id) {
            socket.to(room).emit("userStatus", { userId: uid, status: "offline" });
          }
        });
      }
    });
  });
  // Hàm public để lấy danh sách user online (nếu cần)
  io.getOnlineUsers = () => Object.keys(onlineUsers);
}; 