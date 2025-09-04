// app.js - Phiên bản tối giản chỉ cho authentication và flippage
const express = require("express");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
require("dotenv").config();

// Import các route cần thiết
const authRoutes = require("./routes/Auth/auth");
const authMicrosoftRoutes = require("./routes/Auth/authMicrosoft");
const pdfRoutes = require("./routes/Flippage/pdf");

const app = express();

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
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
    secret: process.env.JWT_SECRET || "default-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Định tuyến - chỉ giữ lại authentication và flippage
app.use("/api/auth", authRoutes);
app.use("/api/auth", authMicrosoftRoutes);
app.use("/api/flippage", pdfRoutes);

// Route mặc định
app.get("/", (req, res) => {
  res.json({ message: "Staff Portal API - Minimal Version" });
});

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 Only authentication and flippage features available`);
});

module.exports = app;
