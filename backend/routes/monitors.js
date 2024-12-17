const express = require("express");
const router = express.Router();
const {
  getMonitors,
  createMonitor,
  updateMonitor,
  deleteMonitor,
} = require("../controllers/monitorController");
const Monitor = require("../models/Monitor"); // Import model
const validateToken = require("../middleware/validateToken");
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
    const monitor = await Monitor.findById(id);
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
    const { id } = req.params;
    const { display } = req.body;

    // Cập nhật chỉ mục `specs` của monitor
    const updatedmonitor = await Monitor.findByIdAndUpdate(
      id,
      {"specs.display": display },
      { new: true }
    );

    if (!updatedmonitor) {
      return res.status(404).json({ message: "monitor không tồn tại" });
    }
    console.log("Payload nhận được:", req.body);

    res.status(200).json(updatedmonitor);
  } catch (error) {
    console.error("Lỗi khi cập nhật specs:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/:id/repairs", async (req, res) => {
  try {
    const monitor = await Monitor.findById(req.params.id).populate("repairs.updatedBy", "name email");
    if (!monitor) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }
    res.status(200).json(monitor.repairs);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

router.post("/:id/repairs", async (req, res) => {
  const { description, date, updatedBy, details } = req.body;

  if (!description || !updatedBy) {
    return res.status(400).json({ message: "Thông tin không hợp lệ" });
  }

  try {
    const monitor = await Monitor.findById(req.params.id);
    if (!monitor) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const newRepair = { description, date: date || Date.now(), updatedBy, details };
    monitor.repairs.push(newRepair);
    await monitor.save();

    res.status(201).json(newRepair);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

router.put("/:id/repairs/:repairId", async (req, res) => {
  const { description, date, updatedBy, details } = req.body;

  try {
    const monitor = await Monitor.findById(req.params.id);
    if (!monitor) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const repair = monitor.repairs.id(req.params.repairId);
    if (!repair) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký sửa chữa" });
    }

    repair.description = description || repair.description;
    repair.date = date || repair.date;
    repair.updatedBy = updatedBy || repair.updatedBy;
    repair.details = details || repair.details;

    await monitor.save();

    res.status(200).json(repair);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});


router.delete("/:id/repairs/:repairId", async (req, res) => {
  const { id, repairId } = req.params;
  console.log("monitor ID:", id);
  console.log("Repair ID:", repairId);

  try {
    const monitor = await Monitor.findById(id);
    if (!monitor) {
      console.error("Không tìm thấy monitor với ID:", id);
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    console.log("monitor trước khi xóa:", monitor);

    // Lọc bỏ repair khỏi mảng repairs
    monitor.repairs = monitor.repairs.filter(
      (repair) => repair._id.toString() !== repairId
    );

    // Lưu lại monitor sau khi sửa đổi
    await monitor.save();

    console.log("monitor sau khi xóa repair:", monitor);

    res.status(200).json({ message: "Đã xóa nhật ký sửa chữa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa repair log:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

module.exports = router;