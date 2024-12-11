const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Email là ID chính và duy nhất
    trim: true,
  },
  password: {
    type: String,
    required: true, // Yêu cầu bắt buộc mật khẩu
    minlength: 8, // Đảm bảo mật khẩu có độ dài tối thiểu
  },
  fullname: {
    type: String,
    required: true,
  },
  jobTitle: {
    type: String,
    default: "User",
  },
  department: {
    type: String,
    default: "Unknown",
  },
  role: {
    type: String,
    enum: ["superadmin", "admin", "technical", "bod", "user"],
    default: "user",
  },
  disabled: {
    type: Boolean,
    default: false, // Tài khoản có thể bị vô hiệu hóa bởi admin
  },
  avatar: {
    type: String,
    default: "https://via.placeholder.com/150",
  },
  lastLogin: {
    type: Date,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});



// Middleware: Hash mật khẩu trước khi lưu

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  // Kiểm tra mật khẩu đã được hash chưa
  const isHashed = this.password.startsWith('$2b$');
  if (!isHashed) {
    this.password = await bcrypt.hash(this.password, 10); // Chỉ hash nếu chưa hash
  }

  next();
});

// Phương thức kiểm tra mật khẩu
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Middleware: Cập nhật updatedAt mỗi khi lưu
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", userSchema);