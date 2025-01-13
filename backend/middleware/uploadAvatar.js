const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Đảm bảo thư mục `/uploads/Avatar` tồn tại
const uploadPath = path.join(__dirname, "../uploads/Avatar");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Cấu hình Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath); // Đặt đường dẫn lưu file
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Tên file có timestamp
  },
});

const upload = multer({ storage });
module.exports = upload;