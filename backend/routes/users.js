const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/Users");
const upload = require("../middleware/upload");
const validateToken = require("../middleware/validateToken");
const userController = require('../controllers/userController'); // Controller xử lý logic
const Notification = require('../models/notification'); // Model cho thông báo (cần tạo)
const Laptop = require("../models/Laptop"); // Model Laptop




// Lấy danh sách người dùng
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // Loại bỏ password khỏi kết quả trả về
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Error fetching users", error });
  }
});

router.get('/:id', validateToken, async (req, res) => {
  try {
    const userId = req.params.id === 'me' ? req.user.id : req.params.id; // Handle 'me' as a special case
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put("/attendance", async (req, res) => {
  const { employeeCode, attendanceLog } = req.body;

  if (!employeeCode || !attendanceLog || !attendanceLog.length) {
    return res.status(400).json({ message: "Thiếu dữ liệu đầu vào" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { employeeCode },
      { $push: { attendanceLog: { $each: attendanceLog } } }, // Thêm log mới
      { new: true, upsert: false }
    );

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    return res.status(200).json({ message: "Cập nhật thành công", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// Endpoint cập nhật thông tin người dùng
router.put('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const updatedFields = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Lưu lịch sử cập nhật (nếu cần)
    const originalData = user.toObject();
    Object.keys(updatedFields).forEach((field) => {
      user[field] = updatedFields[field];
    });
    await user.save();

    // Gửi thông báo nếu có thay đổi
    const updatedFieldsList = Object.keys(updatedFields).join(', ');
    const notification = new Notification({
      message: `User ${user.fullname} (ID: ${userId}) updated fields: ${updatedFieldsList}`,
      type: 'info',
      timestamp: new Date(),
      updatedBy: req.user._id, // Lấy ID người cập nhật
    });
    await notification.save();

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;

// Thêm người dùng mới
router.post("/", async (req, res) => {
  const { fullname, email, password, role, avatar, active = false, employeeCode } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!fullname || !email || !role || !employeeCode) {
    return res.status(400).json({ message: "Fullname, email, role, và mã nhân viên là bắt buộc." });
  }

  if (active && !password) {
    return res.status(400).json({ message: "Password là bắt buộc khi người dùng được kích hoạt." });
  }

  try {
    console.log("Payload nhận được:", req.body);

    // Kiểm tra email trùng lặp
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại." });
    }

    // Kiểm tra mã nhân viên trùng lặp
    const existingCode = await User.findOne({ employeeCode });
    if (existingCode) {
      return res.status(400).json({ message: "Mã nhân viên đã tồn tại." });
    }
    
    console.log("Hashing password...");

    let hashedPassword = null;
    if (password && typeof password === "string") {
      console.log("Hashing password...");

      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    console.log("Creating new user...");

    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      role,
      avatar,
      active,
      employeeCode,
    });

    await newUser.save();

    // Trả về thông tin người dùng (không bao gồm password)
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error adding user:", error.message);
    res.status(500).json({ message: "Error adding user", error });
  }
});

router.put("/bulk-update", async (req, res) => {
  try {
    const { users } = req.body;

    console.log("Dữ liệu nhận được từ frontend:", req.body);

    // Validate dữ liệu
    if (!Array.isArray(users)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ: users phải là mảng" });
    }

    // Lặp qua danh sách người dùng và kiểm tra email
    const updatePromises = users.map(async (user) => {
      if (!user.email) throw new Error("Email là bắt buộc");

      return User.findOneAndUpdate(
        { email: user.email },
        { $set: user },
        { new: true, upsert: false }
      );
    });

    await Promise.all(updatePromises);

    res.json({ message: "Cập nhật thành công!" });
  } catch (error) {
    console.error("Lỗi khi cập nhật:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  const { fullname, disabled, department, jobTitle, role, password, newPassword, employeeCode, active } = req.body;
  const { id } = req.params;

  try {
    // Tìm người dùng theo ID
    const user = await User.findById(id);

    if (!user) {
      console.log("Không tìm thấy người dùng.");
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    // Cập nhật thông tin cơ bản
    if (fullname) user.fullname = fullname;
    if (typeof disabled === "boolean") user.disabled = disabled;
    if (department) user.department = department;
    if (jobTitle) user.jobTitle = jobTitle;
    if (role) user.role = role;
    if (employeeCode) user.employeeCode = employeeCode;

    // Xử lý trạng thái active/inactive
    if (typeof active === "boolean") {
      if (!user.active && active && (!password || !newPassword)) {
        return res.status(400).json({
          message: "Password là bắt buộc khi chuyển từ inactive sang active.",
        });
      }
      user.active = active;
    }

    // Xử lý cập nhật mật khẩu
    if ((newPassword || password) && user.active) {
      const passwordToHash = newPassword || password;

      // Kiểm tra mật khẩu có phải đã hash chưa
      const isHashed = typeof passwordToHash === "string" && passwordToHash.startsWith("$2");
      if (!isHashed) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(passwordToHash, salt);
      } else {
        user.password = passwordToHash; // Giữ nguyên nếu mật khẩu đã được hash
      }
    }

    // Lưu lại người dùng
    await user.save();
    console.log("Đã lưu thông tin người dùng thành công.");

    // Loại bỏ password khi trả về
    const { password: _, ...updatedUser } = user.toObject();
    res.status(200).json({ message: "Cập nhật thành công.", user: updatedUser });
  } catch (error) {
    console.error("Lỗi khi cập nhật người dùng:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
});

// Xóa người dùng
router.delete("/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: "Error deleting user", error });
  }
});

router.put("/:id", async (req, res) => {
  const { fullname, disabled, department, jobTitle,  password, newPassword } = req.body; // Bao gồm cả password và newPassword
  const { id } = req.params;

  try {
    // Tìm người dùng theo ID
    const user = await User.findById(id);

    if (!user) {
      console.log("Không tìm thấy người dùng.");
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    // Cập nhật thông tin người dùng
    user.fullname = fullname || user.fullname;
    console.log("Cập nhật fullname:", user.fullname);
    user.disabled = disabled;
    user.department = department || user.department;
    console.log("Cập nhật department:", user.department);
    user.jobTitle = jobTitle || user.jobTitle;


     // Xử lý mật khẩu
     if (newPassword || password) {
      // Kiểm tra mật khẩu đã hash chưa
      const isHashed = password && password.startsWith("$2");
      if (!isHashed) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword || password, salt);
      } else {
        user.password = password; // Giữ nguyên nếu mật khẩu đã được hash
      }
    }
    // Lưu lại người dùng
    await user.save();
    console.log("Đã lưu thành công.");

    res.status(200).json({ message: "Cập nhật thành công.", user });
  } catch (error) {
    console.error("Lỗi khi cập nhật người dùng:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
  }
});

router.post("/attendance", userController.updateAttendance);

// Lấy attendanceLog theo employeeCode
router.get("/attendance/:employeeCode", async (req, res) => {
  try {
    const { employeeCode } = req.params;

    // Tìm user có employeeCode tương ứng
    const user = await User.findOne({ employeeCode }, "attendanceLog");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên này" });
    }

    // Trả về danh sách "time" từ attendanceLog
    const attendanceTimes = user.attendanceLog.map((log) => log.time);

    return res.status(200).json({
      employeeCode: employeeCode,
      attendanceTimes: attendanceTimes,
    });
  } catch (error) {
    console.error("Error fetching attendance log:", error.message);
    return res.status(500).json({ message: "Lỗi server" });
  }
});


// Cập nhật avatar người dùng
router.put('/:id/avatar', upload.single('avatar'), userController.updateAvatar);

router.post("/assign-device", userController.assignDeviceToUser);

router.get("/:userId/assigned-items", async (req, res) => {
  try {
    const { userId } = req.params;

    // Kiểm tra user có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Lấy danh sách thiết bị (ví dụ: Laptop) được gán cho user
    const assignedItems = await Laptop.find({ assigned: userId });

    // Trả về kết quả
    res.status(200).json(assignedItems);
  } catch (error) {
    console.error("Error fetching assigned items:", error.message);
    res.status(500).json({ message: "Lỗi khi lấy danh sách thiết bị." });
  }
});

module.exports = router;