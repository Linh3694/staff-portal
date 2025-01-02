const express = require("express");
const router = express.Router();
const {
  getMonitors,
  createMonitor,
  updateMonitor,
  deleteMonitor,
  assignMonitor,
  revokeMonitor,
  updateMonitorStatus,
} = require("../controllers/monitorController");

const Monitor = require("../models/Monitor"); // Import model
const { bulkUploadMonitors } = require("../controllers/monitorController");
const validateToken = require("../middleware/validateToken");
const multer = require('multer');
const path = require('path');

// Cấu hình thư mục lưu trữ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'BBBG');
    cb(null, uploadDir); // Đường dẫn thư mục BBBG
  },
  filename: (req, file, cb) => {
    // Đặt tên file theo định dạng: monitorId-currentHolderId-timestamp.pdf
    const { monitorId, userId } = req.body;
    const timestamp = Date.now();
    cb(null, `${monitorId}-${userId}-${timestamp}.pdf`);
  },
});

const fs = require("fs");

const uploadPath = "./BBBG"; // Thư mục lưu file
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// Middleware multer
const upload = multer({ storage });


router.use(validateToken);

// Routes
router.get("/", getMonitors);
router.post("/", createMonitor);
router.put("/:id", updateMonitor);
router.delete("/:id", deleteMonitor);



// Route lấy thông tin chi tiết monitor
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  console.log("Payload nhận được từ client:", updateData);
  try {
    const monitor = await Monitor.findById(id)
      .populate("assigned", "fullname email jobTitle avatarUrl")
      .populate("room", "name location status")
      .populate("assignmentHistory.user", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.assignedBy", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.revokedBy", "fullname email jobTitle avatarUrl");

    if (!monitor) {
      return res.status(404).send({ message: 'Không tìm thấy monitor' });
    }
    res.status(200).json(monitor);
  } catch (error) {
    res.status(500).send({ message: 'Lỗi máy chủ', error });
  }
});


// Endpoint cập nhật thông tin specs
router.put("/:id/specs", async (req, res) => {
  try {
    console.log("Payload nhận được từ frontend:", req.body);

    const { id } = req.params;
    const { specs = {}, releaseYear, manufacturer, type } = req.body;

    // Lấy monitor hiện tại từ DB
    const currentMonitor = await Monitor.findById(id);
    if (!currentMonitor) {
      return res.status(404).json({ message: "Monitor không tồn tại." });
    }

    // Làm sạch dữ liệu specs
    const cleanedSpecs = {
      display: specs.display ?? currentMonitor.specs.display,
    };

    // Cập nhật payload
    const updates = {
      specs: cleanedSpecs,
      releaseYear: releaseYear ?? currentMonitor.releaseYear,
      manufacturer: manufacturer ?? currentMonitor.manufacturer,
      type: type ?? currentMonitor.type,
    };

    console.log("Payload để cập nhật (sau khi làm sạch):", updates);

    const updatedMonitor = await Monitor.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedMonitor) {
      return res.status(404).json({ message: "Không thể cập nhật monitor." });
    }

    console.log("Monitor sau khi cập nhật:", updatedMonitor);
    res.status(200).json(updatedMonitor);
  } catch (error) {
    console.error("Lỗi khi cập nhật specs:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/bulk-upload", bulkUploadMonitors);


// THÊM route cho bàn giao
router.post("/:id/assign", assignMonitor);

// THÊM route cho thu hồi
router.post("/:id/revoke", revokeMonitor);

router.put("/:id/status", updateMonitorStatus);

// Endpoint upload tệp
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { monitorId, userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File không được tải lên." });
    }

    const filePath = `/BBBG/${req.file.filename}`; // Đường dẫn file

    const monitor = await Monitor.findById(monitorId);
    if (!monitor) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị." });
    }

    // Tìm lịch sử bàn giao hiện tại (chưa có endDate)
  const currentAssignment = monitor.assignmentHistory.find(
    (history) => history.user && history.user.toString() === userId && !history.endDate
  );

  if (!currentAssignment) {
    return res.status(404).json({
      message: "Không tìm thấy lịch sử bàn giao hiện tại.",
      assignmentHistory: monitor.assignmentHistory, // In thêm dữ liệu để kiểm tra
    });
  }

    // Cập nhật document cho lịch sử hiện tại
    currentAssignment.document = filePath;

    // Cập nhật trạng thái thiết bị (nếu cần)
    monitor.status = "Active";

    // Lưu thay đổi
    await monitor.save();

    return res.status(200).json({
      message: "Tải lên biên bản thành công!",
      monitor,
    });
  } catch (error) {
    console.error("Lỗi khi tải lên biên bản:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi server." });
  }
});

// Endpoint để trả file PDF
router.get('/BBBG/:filename', async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', 'BBBG', filename);

  // Kiểm tra file có tồn tại không
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Không tìm thấy file.' });
  }

  // Gửi file PDF
  res.sendFile(filePath);
});

module.exports = router;