const multer = require('multer');
const path = require('path');

// Cấu hình nơi lưu trữ ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/Posts'); // Thư mục lưu file
  },
  filename: (req, file, cb) => {
    // Tạo tên file duy nhất: [tên field]-[timestamp]-[random].[ext]
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// Lọc file (chỉ chấp nhận ảnh jpg, png)
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/png'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh JPG/PNG'), false);
  }
};

// Giới hạn kích thước file, ví dụ 2MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = upload;