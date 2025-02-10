const multer = require("multer");
const path = require("path");

// Định nghĩa nơi lưu file và tên file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/Document"); // Thư mục lưu file
  },
  filename: (req, file, cb) => {
    // Đổi tên file để tránh trùng
    const ext = path.extname(file.originalname);
    const fileName = Date.now() + "_" + file.originalname;
    cb(null, fileName);
  },
});

// Khởi tạo middleware
const uploadDocument = multer({ storage });

module.exports = { uploadDocument };