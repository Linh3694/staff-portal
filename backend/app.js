// app.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const Ticket = require("./models/Ticket");
require("dotenv").config();

// Import các route
const authRoutes = require("./routes/Auth/auth");
const authMicrosoftRoutes = require("./routes/Auth/authMicrosoft");
const roomRoutes = require("./routes/Management/room");
const userRoutes = require("./routes/Management/users");
const documentRoutes = require("./routes/Management/documents");
const pdfRoutes = require("./routes/Flippage/pdf");
const chatRoutes = require("./routes/Chat/chatRoutes");
const chatSocket = require('./socketChat');
const socketTicketChat = require('./socketTicketChat');
const notificationRoutes = require("./routes/Notification/notificationRoutes");
const emojiRoutes = require('./routes/Chat/emojiRoutes');

const app = express();
// Tạo HTTP server và tích hợp Socket.IO
const http = require('http');
const { Server } = require('socket.io');
const jwt = require("jsonwebtoken"); // ADD THIS import just above
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  allowRequest: (req, callback) => {
    const token = req._query.token;
    if (!token) return callback("unauthorized", false);
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return callback("unauthorized", false);
      req.user = decoded;           // attach for later use
      callback(null, true);
    });
  },
});

app.set("io", io); // expose socket.io instance to controllers

// Khởi tạo các socket handlers
socketTicketChat(io);
chatSocket(io);

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    process.exit(1);
  }
};
connectDB();

// Đảm bảo thư mục uploads tồn tại
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: "4096mb" }));
app.use(express.urlencoded({ limit: "4096mb", extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadPath));

// Cấu hình session và passport
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 1 ngày
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Định tuyến
app.use("/api/auth", authRoutes);
app.use("/api/auth", authMicrosoftRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/flippage", pdfRoutes);


// Khởi động server
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

require("./cronEmail");

module.exports = app;