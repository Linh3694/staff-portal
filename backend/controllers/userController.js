const User = require("../models/Users"); // Correct import path for User model
const Laptop = require("../models/Laptop"); // Import model Laptop
const Monitor = require("../models/Monitor");
const Projector = require("../models/Projector");
const Printer = require("../models/Printer");
const Tool = require("../models/Tool");
const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing

// Gán thiết bị cho người dùng
exports.getAssignedItems = async (req, res) => {
  try {
    // Kiểm tra nguồn dữ liệu: từ URL (GET) hoặc body (POST)
    const userId = req.params.userId || req.body.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Chuyển userId sang ObjectId
    const mongoose = require("mongoose");
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Kiểm tra user có tồn tại không
    const user = await User.findById(userObjectId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Truy vấn danh sách thiết bị
    const laptops = await Laptop.find({ assigned: userObjectId }).lean();
    const monitors = await Monitor.find({ assigned: userObjectId }).lean();
    const projectors = await Projector.find({ assigned: userObjectId }).lean();
    const printers = await Printer.find({ assigned: userObjectId }).lean();
    const tools = await Tool.find({ assigned: userObjectId }).lean();

    // Log kết quả để kiểm tra
    console.log("Assigned laptops:", laptops);

    // Trả về kết quả
    res.status(200).json({
      message: "Assigned items fetched successfully.",
      items: { laptops, monitors, projectors, printers, tools },
    });
  } catch (error) {
    console.error("Error fetching assigned items:", error.message);
    res.status(500).json({ message: "Error fetching assigned items.", error });
  }
};

exports.updateAvatar = async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cập nhật avatar
    user.avatarUrl = `/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      message: "Avatar updated successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Get Users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // Exclude password for security
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    console.log("Payload nhận được:", req.body);

    const { fullname, email, password, role, employeeCode, avatar, active = false } = req.body;

    // Hash mật khẩu nếu được cung cấp
    let hashedPassword = null;
    if (password) {
      console.log("Hashing password...");
      hashedPassword = await bcrypt.hash(password, 10);
    }

    console.log("Creating new user...");
    const newUser = new User({
      fullname,
      email,
      password: hashedPassword, // Chỉ lưu nếu password được cung cấp
      role,
      employeeCode,
      avatarUrl: avatar,
      active,
    });

    await newUser.save();
    res.status(201).json({ message: "Tạo người dùng thành công", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ message: "Server error", error });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, department, jobTitle, role, status, password, employeeCode } = req.body;
    const updates = { fullname, email, department, jobTitle, role, status, employeeCode };


    if (employeeCode) {
      updates.employeeCode = employeeCode;
    }
    
    // Validate required fields
    if (!fullname || !email) {
      return res.status(400).json({ message: "Missing required information." });
    }

      // Kiểm tra mã nhân viên đã tồn tại với người dùng khác
    const existingUser = await User.findOne({ employeeCode, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: "Mã nhân viên đã tồn tại với người dùng khác." });
      }

    // Hash new password if provided
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User deleted successfully!" });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(400).json({ message: "Error deleting user", error: error.message });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const { employeeCode, attendanceLog } = req.body;

    if (!employeeCode || !attendanceLog || !attendanceLog.length) {
      return res.status(400).json({ message: "Thiếu dữ liệu đầu vào" });
    }

    // Tìm user bằng employeeCode và cập nhật attendanceLog
    const user = await User.findOneAndUpdate(
      { employeeCode }, // Bộ lọc sử dụng employeeCode
      { $push: { attendanceLog: { $each: attendanceLog } } }, // Thêm attendanceLog mới
      { new: true, upsert: false }
    );

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    return res.status(200).json({ message: "Cập nhật thành công", user });
  } catch (error) {
    console.error("Error updating attendance:", error.message);
    return res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
};