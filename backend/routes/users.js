const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/Users");
const upload = require("../middleware/upload");
const validateToken = require("../middleware/validateToken");
const userController = require('../controllers/userController'); // Controller xử lý logic
const Notification = require('../models/notification'); // Model cho thông báo (cần tạo)



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
  const { fullname, email, password, role, avatar } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!fullname || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Kiểm tra email trùng lặp
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }

    // // Mã hóa mật khẩu
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const newUser = new User({ fullname, email, password, role, avatar });
    await newUser.save();

    // Trả về thông tin người dùng (không bao gồm password)
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error adding user:", error.message);
    res.status(500).json({ message: "Error adding user", error });
  }
});

router.post('/bulk-update', async (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({ message: 'Invalid data format. "users" should be an array.' });
    }

    // Tạo danh sách thao tác bulkWrite dựa trên fullname
    const bulkOps = users.map((user) => ({
      updateOne: {
        filter: { fullname: user.fullname }, // Tìm kiếm bằng fullname
        update: {
          department: user.department, // Cập nhật department
          jobTitle: user.title,
          employeeCode: user.employeeCode        // Cập nhật mã nhân viên
        },
        upsert: false, // Không tạo mới nếu không tìm thấy fullname
      },
    }));

    // Thực hiện cập nhật hàng loạt
    await User.bulkWrite(bulkOps);

    res.status(200).json({ message: 'Bulk update successful' });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

router.put("/:id", async (req, res) => {
  const { fullname, disabled, department, jobTitle, role, password, newPassword } = req.body; // Bao gồm tất cả các trường cần cập nhật
  const { id } = req.params;

  try {
    // Tìm người dùng theo ID
    const user = await User.findById(id);

    if (!user) {
      console.log("Không tìm thấy người dùng.");
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    // Cập nhật thông tin người dùng
    if (fullname) user.fullname = fullname;
    if (typeof disabled === "boolean") user.disabled = disabled; // Chỉ cập nhật nếu disabled được gửi
    if (department) user.department = department;
    if (jobTitle) user.jobTitle = jobTitle;
    if (role) user.role = role;


    console.log("Cập nhật thông tin người dùng:", {
      fullname: user.fullname,
      disabled: user.disabled,
      department: user.department,
      jobTitle: user.jobTitle,
      role: user.role,
    });

    // Xử lý cập nhật mật khẩu
    if (newPassword || password) {
      const isHashed = password && password.startsWith("$2");
      if (!isHashed) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword || password, salt);
      } else {
        user.password = password; // Nếu đã hash, giữ nguyên
      }
    }

    // Lưu thông tin người dùng vào cơ sở dữ liệu
    await user.save();
    console.log("Đã lưu thông tin người dùng thành công.");

    // Trả về thông tin người dùng đã cập nhật
    const { password: _, ...updatedUser } = user.toObject(); // Loại bỏ password khi trả về
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


// Cập nhật avatar người dùng
router.put('/:id/avatar', upload.single('avatar'), userController.updateAvatar);


module.exports = router;