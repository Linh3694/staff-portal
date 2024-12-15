const express = require("express");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/Users");
const authRoutes = require("./routes/auth");
const laptopRoutes = require("./routes/laptops");
const userRoutes = require("./routes/users");
const notificationRoutes = require('./routes/notifications');
const Notification = require('./models/notification'); // Adjust the path as necessary
const validateToken = require("./middleware/validateToken");
const clientsSync = require('./routes/clientsSync'); // Import the clientsSync router
const app = express();
const Laptop = require("./models/Laptop");
const { exec } = require('child_process');
const AcsEvent = require('./models/AcsEvent');

require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
connectDB();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/var/www/uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
// Loại bỏ ký tự đặc biệt và thay thế khoảng trắng bằng dấu gạch dưới
    const sanitizedFilename = file.originalname
      .replace(/[^a-zA-Z0-9.]/g, '_')  // Chỉ giữ lại ký tự chữ, số và dấu chấm
      .replace(/\s+/g, '_');           // Thay thế khoảng trắng bằng gạch dưới
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Tạo app Express

app.use(express.json());
app.use(cors());

app.use("/api/laptops", laptopRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes); // Route xác thực
app.use("/api/laptops", laptopRoutes); // Route laptops
app.use("/api/users", userRoutes); // Route users
app.use("/api/clients-sync", clientsSync.router); // Use the clientsSync router
app.use("/api/notifications", notificationRoutes); // Route notifications

const syncClientsFromAzure = require("./routes/clientsSync").syncClientsFromAzure;
app.get("/api/sync-clients", async (req, res) => {
  try {
    await syncClientsFromAzure();
    res.json({ message: "Clients synced successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error syncing clients" });
  }
});

app.post("/api/sync-clients", validateToken, async (req, res) => {
  try {
    await syncClientsFromAzure();
    res.json({ message: "Clients synced successfully!" });
  } catch (error) {
    console.error("Error syncing clients:", error.message);
    res.status(500).json({ error: "Error syncing clients" });
  }
});

app.post("/api/laptops/bulk-upload", async (req, res) => {
  try {
    const laptops = req.body.laptops;

    if (!laptops || !Array.isArray(laptops)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    const invalidLaptops = laptops.filter(
      (laptop) =>
        !laptop.name || !laptop.manufacturer || !laptop.serial || !laptop.status
    );

    if (invalidLaptops.length > 0) {
      return res.status(400).json({
        message: "Có laptop không hợp lệ, kiểm tra lại dữ liệu!",
        invalidLaptops,
      });
    }

    await Laptop.insertMany(laptops);
    res.status(201).json({ message: "Tải dữ liệu lên thành công!" });
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu lên:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

app.post('/api/attendances/save', async (req, res) => {
  try {
    const attendanceData = req.body;

    // Kiểm tra nếu không có dữ liệu
    if (!attendanceData || !attendanceData.name || !attendanceData.time) {
      return res.status(400).json({ message: 'Missing required fields: name or time.' });
    }

    // Tạo một sự kiện mới và lưu vào MongoDB
    const acsEvent = new AcsEvent(attendanceData);
    await acsEvent.save();

    res.status(200).json({ message: 'Attendance data saved successfully.' });
  } catch (error) {
    console.error('Error saving attendance data:', error);
    res.status(500).json({ message: 'Failed to save attendance data.', error });
  }
});

app.post('/api/sync-attendance', (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'hikcon.py');
  const venvPath = path.join(__dirname, 'venv', 'bin', 'python3'); // Adjust the path if necessary
  exec(`${venvPath} ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return res.status(500).json({ message: 'Đồng bộ thất bại.' });
    }
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
      return res.status(500).json({ message: 'Đồng bộ thất bại.' });
    }
    console.log(`Script stdout: ${stdout}`);
    res.status(200).json({ message: 'Đồng bộ thành công.' });
  });
});

app.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  console.log('File:', req.file);
  console.log('Body:', req.body);
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`; // Đường dẫn avatar
  const userId = req.body.userId; // Lấy userId từ request body

  try {
    // Tìm user theo ID
    const user = await User.findById(userId);
    console.log('User found:', user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cập nhật avatarUrl
    user.avatarUrl = avatarUrl;
    await user.save(); // Lưu lại vào database
    console.log('User updated:', user);

    res.json({ avatarUrl });
  } catch (error) {
    console.error('Error updating user avatar:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Endpoint to fetch unread notifications
app.get('/api/notifications/unread', async (req, res) => {
  try {
    const notifications = await Notification.find({ isRead: false });
    res.json({ notifications, count: notifications.length });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Endpoint to mark all notifications as read
app.post('/api/notifications/mark-all-as-read', async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Endpoint to mark a single notification as read
app.post('/api/notifications/:id/mark-as-read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Endpoint to fetch the latest 5 notifications
app.get('/api/notifications/latest', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ timestamp: -1 }).limit(5);
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
