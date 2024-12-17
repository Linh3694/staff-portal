const User = require("../models/Users"); // Correct import path for User model
const Laptop = require("../models/Laptop"); // Import model Laptop
const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing

// Gán thiết bị cho người dùng
exports.assignDeviceToUser = async (req, res) => {
  try {
    const { laptopId, userId } = req.body;

    // Kiểm tra input
    if (!laptopId || !userId) {
      return res.status(400).json({ message: "Thiếu thông tin gán thiết bị." });
    }

    // Tìm thiết bị và người dùng
    const laptop = await Laptop.findById(laptopId);
    const user = await User.findById(userId);

    if (!laptop) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị." });
    }
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    // Cập nhật thông tin thiết bị
    laptop.assignedTo = { userId: user._id, fullname: user.fullname };
    await laptop.save();

    // Cập nhật danh sách thiết bị được gán trong User
    user.assignedDevices = user.assignedDevices || [];
    if (!user.assignedDevices.includes(laptop._id)) {
      user.assignedDevices.push(laptop._id);
      await user.save();
    }

    res.status(200).json({
      message: "Gán thiết bị cho người dùng thành công.",
      laptop,
      user,
    });
  } catch (error) {
    console.error("Error assigning device to user:", error.message);
    res.status(500).json({ message: "Lỗi khi gán thiết bị.", error: error.message });
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
    user.avatar = `/uploads/${req.file.filename}`;
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
    const { fullname, email, password, role, employeeCode } = req.body;

    // Kiểm tra nếu mã nhân viên đã tồn tại
    const existingCode = await User.findOne({ employeeCode });
    if (existingCode) {
      return res.status(400).json({ message: "Mã nhân viên đã tồn tại." });
    }

    const newUser = new User({
      fullname,
      email,
      password, // Nên hash mật khẩu trước khi lưu
      role,
      employeeCode, // Lưu mã nhân viên
    });

    await newUser.save();
    res.status(201).json({ message: "Tạo người dùng thành công", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, role, status, password, employeeCode } = req.body;
    const updates = { fullname, email, role, status, employeeCode };

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