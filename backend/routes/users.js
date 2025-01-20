const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/Users");
const upload = require("../middleware/upload");
const validateToken = require("../middleware/validateToken");
const userController = require('../controllers/userController'); // Controller xử lý logic
const Notification = require('../models/notification'); // Model cho thông báo (cần tạo)
const uploadAvatar = require("../middleware/uploadAvatar");


// Lấy danh sách người dùng
router.get("/", async (req, res) => {
  try {
      const { search } = req.query;
      let query = {};
      if (search) {
        query = {
          $or: [
            { fullname: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        };
      }
    const users = await User.find({}, "-password"); // Loại bỏ password khỏi kết quả trả về
    res.status(200).json(users.map(user => ({
      ...user.toObject(),
      avatarUrl: user.avatarUrl,
    })));
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Error fetching users", error });
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

router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;

    // Kiểm tra query có hợp lệ hay không
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Query không hợp lệ." });
    }

    // Tạo điều kiện tìm kiếm với regex
    const condition = {
      $or: [
        { fullname: { $regex: query, $options: "i" } }, // Tìm kiếm không phân biệt chữ hoa/thường
        { email: { $regex: query, $options: "i" } },    // Tìm kiếm không phân biệt chữ hoa/thường
      ],
    };

    // Tìm kiếm trong cơ sở dữ liệu
    const users = await User.find(condition, "-password"); // Loại bỏ trường password khỏi kết quả trả về

    // Nếu không tìm thấy kết quả
    if (users.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy kết quả nào." });
    }

    // Trả về kết quả tìm kiếm
    res.json(users);
  } catch (err) {
    console.error("Error in search API:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
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
router.put("/:id", uploadAvatar.single("avatar"), async (req, res) => {
  console.log("PUT /users/:id =>", req.params.id);
  console.log(req.params)
  try {
    const { id } = req.params;
    const { fullname, disabled, department, jobTitle, role, employeeCode, password, newPassword } = req.body;

    // Tìm user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Nếu có file avatar -> cập nhật avatarUrl
    if (req.file) {
      // Giả sử middleware uploadAvatar lưu file vào /uploads/Avatar/<filename>
      user.avatarUrl = `/uploads/Avatar/${req.file.filename}`;
    }

    // Cập nhật các field khác
    if (fullname)   user.fullname = fullname;
    if (department) user.department = department;
    if (jobTitle)   user.jobTitle = jobTitle;
    if (role)       user.role = role;
    if (employeeCode) user.employeeCode = employeeCode;

    // disabled là boolean
    if (typeof disabled === "string") {
      user.disabled = disabled === "true";
    } else if (typeof disabled === "boolean") {
      user.disabled = disabled;
    }

    // Nếu có newPassword -> hash lại
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    } else if (password) {
      // Trường hợp API vẫn gửi "password" cũ, hoặc rename
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    console.log("Đã cập nhật user thành công:", user.fullname);

    // Ẩn password trước khi trả response
    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json(userObj);
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

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
router.post("/assign-device", userController.getAssignedItems);

router.get("/:userId/assigned-items", userController.getAssignedItems);


module.exports = router;