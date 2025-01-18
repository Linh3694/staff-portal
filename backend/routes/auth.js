const express = require("express");
const router = express.Router();
const User = require("../models/Users");
const Student = require("../models/Students");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");

// Route đăng nhập
router.post("/login",
  [
    check("email").isEmail().withMessage("Invalid email format"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log("User không tồn tại trong DB");
        return res.status(404).json({ message: "User not found" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log("Mật khẩu nhập:", password);
      console.log("Mật khẩu trong DB:", user.password);
      console.log("Mật khẩu hợp lệ:", isPasswordValid); 
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          fullname: user.fullname || "N/A",
          email: user.email || "N/A",
          role: user.role || "user",
          avatar: user.avatar || "https://via.placeholder.com/150",
        },
      });
    } catch (error) {
      console.error("Error logging in:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

router.post("/verify-id", async (req, res) => {
  const { id } = req.body;

  try {
    // Kiểm tra trong bảng Users
    let user = await User.findOne({ employeeCode: id });

    // Nếu không tìm thấy trong Users, kiểm tra trong Students
    if (!user) {
      user = await Student.findOne({ studentCode: id });
    }

    if (!user) {
      return res.status(404).json({ message: "ID không hợp lệ!" });
    }

    // Lấy tên đầy đủ, avatar, jobTitle, và Klass (nếu có)
    const userId = user._id
    const fullName = user.fullname || user.name || "N/A";
    const avatarUrl = user.avatar || "https://via.placeholder.com/150";
    const jobTitle = user.jobTitle || "N/A";
    const klass = user.klass || "N/A"; // Klass là lớp học (nếu có)

    // Tạo danh sách tùy chọn tên (đã có logic trước đó)
    const randomUsers = await User.aggregate([{ $sample: { size: 2 } }]);
    const randomStudents = await Student.aggregate([{ $sample: { size: 2 } }]);
    const randomNames = [
      ...randomUsers.map((u) => u.fullname || "Ẩn danh"),
      ...randomStudents.map((s) => s.name || "Ẩn danh"),
    ].filter((name) => name !== fullName);
    const uniqueRandomNames = randomNames.sort(() => 0.5 - Math.random()).slice(0, 2);

    const options = [...uniqueRandomNames, fullName].sort(() => 0.5 - Math.random());

    // Chuẩn bị dữ liệu trả về
    const responseData = {
      userId,
      fullName,
      options,
      employeeCode: user.employeeCode || null,
      studentCode: user.studentCode || null,
      department: user.department || null,
      role: user.role || null,
      avatarUrl,
      jobTitle,
      klass,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error verifying ID:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi!" });
  }
});

// API: Xác thực tên
router.post("/verify-name", async (req, res) => {
  const { userId, fullName, selectedName } = req.body;

  if (!userId || !fullName || !selectedName) {
    return res.status(400).json({ success: false, message: "Thiếu thông tin xác thực!" });
  }

  try {
    console.log("Đang xác thực tên với dữ liệu:", { userId, fullName, selectedName });

    // Tìm theo MongoDB `_id`
    let user = await User.findById(userId);

    // Nếu không tìm thấy, kiểm tra employeeCode/studentCode
    if (!user) {
      user = await User.findOne({ employeeCode: userId });
    }
    if (!user) {
      user = await Student.findOne({ studentCode: userId });
    }

    if (!user) {
      console.error("Không tìm thấy user với ID:", userId);
      return res.status(400).json({ success: false, message: "ID không hợp lệ!" });
    }

    console.log("Tìm thấy user:", user);

    // Kiểm tra tên có trùng khớp không
    if (user.fullname !== fullName || fullName !== selectedName) {
      return res.status(400).json({ success: false, message: "Tên không chính xác!" });
    }

    return res.status(200).json({ success: true, message: "Xác thực thành công!" });
  } catch (error) {
    console.error("Lỗi xác thực tên:", error);
    return res.status(500).json({ success: false, message: "Lỗi server!" });
  }
});


module.exports = router;