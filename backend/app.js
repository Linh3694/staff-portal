const express = require("express");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const User = require("./models/Users");
const authRoutes = require("./routes/auth");
const authMicrosoftRoutes = require("./routes/authMicrosoft"); // Đăng nhập Microsoft
const laptopRoutes = require("./routes/laptops");
const monitorRoutes = require("./routes/monitors");
const printerRoutes = require("./routes/printers");
const projectorRoutes = require("./routes/projectors");
const toolRoutes = require("./routes/tool");
const roomRoutes = require("./routes/room");
const userRoutes = require("./routes/users");
const notificationRoutes = require('./routes/notifications');
const Notification = require('./models/notification'); // Adjust the path as necessary
const validateToken = require("./middleware/validateToken");
const clientsSync = require('./routes/clientsSync'); // Import the clientsSync router
const app = express();
const Laptop = require("./models/Laptop");
const Monitor = require("./models/Monitor");
const Printer = require("./models/Printer");
const Projector = require("./models/Projector");
const Tool = require("./models/Tool");
const Room = require("./models/Room");
const Inspect = require("./models/Inspect");
const { exec } = require('child_process');
const AcsEvent = require('./models/AcsEvent');
const attendanceRoutes = require("./routes/users");
const activityRoutes = require('./routes/activityRoutes');
const ticketRoutes = require("./routes/tickets");
const eventRoutes = require("./routes/eventRoutes");
const photoRoutes = require("./routes/photoRoutes");
const inspectRoutes = require("./routes/inspect")
const studentRoutes = require("./routes/students");
const uploadReport = require("./middleware/uploadReport");
const session = require("express-session");
const documentRoutes = require("./routes/documents");
const newsfeedRoutes = require("./routes/newsfeed");
const pdfRoutes = require("./routes/pdf");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");



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

// Đảm bảo thư mục tồn tại
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Cấu hình multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath); // Đặt file tại `backend/uploads/reports`
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage });

module.exports = upload;

// Sử dụng session middleware
app.use(
  session({
    secret: process.env.JWT_SECRET, // hoặc một secret khác an toàn
    resave: false,
    saveUninitialized: true,
    cookie: {
      // Bạn có thể cấu hình thời gian sống của cookie ở đây
      maxAge: 30 * 24 * 60 * 60 * 1000, // 1 ngày
    },
  })
);

// Tạo app Express

// Middlewares
app.use(cors());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/laptops", laptopRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Phục vụ thư mục uploads
app.use("/api/auth", authRoutes);
app.use("/api/auth", authMicrosoftRoutes);
app.use("/api/monitors", monitorRoutes); // Route laptops
app.use("/api/users", userRoutes); // Route users
app.use("/api/clients-sync", clientsSync.router); // Use the clientsSync router
app.use("/api/notifications", notificationRoutes); // Route notifications
app.use("/api/printers", printerRoutes); // Route printers
app.use("/api/projectors", projectorRoutes); // Route projectors
app.use("/api/rooms", roomRoutes);
app.use("/api/users", attendanceRoutes);
app.use("/api/tools", toolRoutes);
app.use('/api/activities', activityRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/inspects", inspectRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/newsfeed", newsfeedRoutes);  // Thêm dòng này
app.use("/api/flippage", pdfRoutes);



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

app.post("/api/monitors/bulk-upload", async (req, res) => {
  const { monitors } = req.body;

  try {
    // Lấy danh sách các serial gửi lên
    const serials = monitors.map((monitor) => monitor.serial);

    // Kiểm tra serial nào đã tồn tại trong database
    const existingMonitors = await Monitor.find({ serial: { $in: serials } });
    const existingSerials = existingMonitors.map((monitor) => monitor.serial);

    if (existingSerials.length > 0) {
      return res.status(400).json({
        message: "Các serial đã tồn tại.",
        errors: existingSerials.map((serial) => ({ serial })),
      });
    }

    // Thêm mới monitors vào database
    await Monitor.insertMany(monitors);
    res.status(201).json({ addedMonitors: monitors.length });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ message: "Có lỗi xảy ra khi thêm Monitor!" });
  }
});
app.post("/api/printers/bulk-upload", async (req, res) => {
  try {
    const printers = req.body.monitors;

    if (!printers || !Array.isArray(printers)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    const invalidPrinters = printers.filter(
      (printer) =>
        !printer.name || !printer.manufacturer || !printer.serial || !printer.status
    );

    if (invalidPrinters.length > 0) {
      return res.status(400).json({
        message: "Có máy in không hợp lệ, kiểm tra lại dữ liệu!",
        invalidPrinters,
      });
    }

    await Printer.insertMany(printers);
    res.status(201).json({ message: "Tải dữ liệu lên thành công!" });
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu lên:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

app.post("/api/projectors/bulk-upload", async (req, res) => {
  try {
    const projectors = req.body.projectors;

    if (!projectors || !Array.isArray(projectors)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    const validProjectors = [];
    const errors = [];

    for (const projector of projectors) {
      try {
        // Kiểm tra và chuyển đổi `room`
        if (typeof projector.room === 'object' && projector.room.value) {
          projector.room = projector.room.value; // Lấy ObjectId từ `value`
        }

        if (!mongoose.Types.ObjectId.isValid(projector.room)) {
          throw new Error(`Room ID không hợp lệ: ${projector.room}`);
        }

        // Kiểm tra dữ liệu cần thiết
        if (!projector.name || !projector.serial || !projector.status) {
          throw new Error(`Thông tin không hợp lệ cho projector: ${projector.serial}`);
        }

        validProjectors.push(projector);
      } catch (error) {
        errors.push({ serial: projector.serial, message: error.message });
      }
    }

    if (validProjectors.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để thêm mới.", errors });
    }

    // Lưu các projector hợp lệ vào database
    await Projector.insertMany(validProjectors);

    res.status(201).json({
      message: `${validProjectors.length} projector(s) đã được thêm thành công.`,
      errors,
    });
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu lên:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

// Endpoint để upload bulk dữ liệu Tool
app.post("/api/tool/bulk-upload", async (req, res) => {
  try {
    const tools = req.body.tools;

    if (!tools || !Array.isArray(tools)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    const invalidTools = tools.filter(
      (tool) =>
        !tool.name || !tool.serial || !tool.status
    );

    if (invalidTools.length > 0) {
      return res.status(400).json({
        message: "Có công cụ không hợp lệ, kiểm tra lại dữ liệu!",
        invalidTools,
      });
    }

    await Tool.insertMany(tools);
    res.status(201).json({ message: "Tải dữ liệu công cụ lên thành công!" });
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu công cụ lên:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

// API lưu danh sách phòng từ Excel
app.post("/api/rooms/bulk", async (req, res) => {
  try {
    const { rooms } = req.body;

    if (!rooms || !Array.isArray(rooms)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    // Thực hiện lưu từng phòng vào database
    const savedRooms = await Room.insertMany(rooms, { ordered: false });
    res.status(201).json({ message: "Danh sách phòng đã được lưu.", rooms: savedRooms });
  } catch (error) {
    console.error("Lỗi khi lưu danh sách phòng:", error.message);
    res.status(500).json({ message: "Có lỗi xảy ra khi lưu danh sách phòng.", error: error.message });
  }
});

app.post('/api/attendances/save', async (req, res) => {
  try {
    console.log('Received data:', req.body);
    const { fingerprintCode, dateTime } = req.body;
    // Chuyển đổi dateTime về dạng Date
    const parsedDateTime = new Date(dateTime);
    console.log("Parsed DateTime:", parsedDateTime); // Log để kiểm tra
    if (isNaN(parsedDateTime.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
    }
    const attendanceData = {
      employeeNoString: fingerprintCode,
      dateTime: parsedDateTime, // Chuyển thành ISODate nếu cần
    };
    const acsEvent = new AcsEvent(attendanceData);
    await acsEvent.save();
    console.log('Saved attendance:', attendanceData);

    res.status(200).json({ message: 'Attendance data saved successfully.' });
  } catch (error) {
    console.error('Error saving attendance data:', error);
    res.status(500).json({ message: 'Failed to save attendance data.', error });
  }
});

app.post('/api/sync-attendance', (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'hikcon.py');
  const venvPath = path.join(__dirname, 'venv', 'bin', 'python3'); // Adjust the path if necessary
  exec(`${venvPath} ${scriptPath}`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
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

app.post("/api/reports", uploadReport.single("file"), async (req, res) => {
  console.log("Report file:", req.file); // Kiểm tra file được upload
  console.log("Inspect ID:", req.body.inspectId); // Kiểm tra ID truyền vào

  try {
    const { inspectId } = req.body;
    const reportFile = req.file;

    if (!reportFile) {
      return res.status(400).json({ message: "Không có file được tải lên" });
    }

    // Tìm và cập nhật Inspect record
    const updatedInspect = await Inspect.findByIdAndUpdate(
      inspectId,
      {
        report: {
          fileName: reportFile.filename,
          filePath: `/uploads/reports/${reportFile.filename}`,
        },
      },
      { new: true }
    );

    if (!updatedInspect) {
      return res.status(404).json({ message: "Dữ liệu kiểm tra không tìm thấy" });
    }

    res.status(201).json({
      message: "Biên bản đã được lưu",
      data: updatedInspect,
    });
  } catch (error) {
    console.error("Lỗi khi lưu biên bản:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});