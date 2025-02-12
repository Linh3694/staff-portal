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



module.exports = router;