const express = require("express");
const router = express.Router();
const {
  getDesktops,
  createDesktop,
  updateDesktop,
  deleteDesktop,
  bulkUploadDesktops,
  addRepairLog,
} = require("../controllers/desktopController");

const Desktop = require("../models/Desktop"); // Import model
const validateToken = require("../middleware/validateToken");

router.use(validateToken);

// Routes
router.get("/", getDesktops); // Lấy danh sách desktops
router.post("/", createDesktop); // Tạo desktop mới
router.put("/:id", updateDesktop); // Cập nhật desktop
router.delete("/:id", deleteDesktop); // Xóa desktop

// Route lấy thông tin chi tiết desktop
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const desktop = await Desktop.findById(id);
    if (!desktop) {
      return res.status(404).send({ message: "Không tìm thấy desktop" });
    }
    res.status(200).json(desktop);
  } catch (error) {
    res.status(500).send({ message: "Lỗi máy chủ", error });
  }
});

// Endpoint cập nhật thông tin specs của desktop
router.put("/:id/specs", async (req, res) => {
  try {
    const { id } = req.params;
    const { processor, ram, storage, gpu, powerSupply, motherboard } = req.body;

    // Cập nhật chỉ mục `specs` của desktop
    const updatedDesktop = await Desktop.findByIdAndUpdate(
      id,
      {
        "specs.processor": processor,
        "specs.ram": ram,
        "specs.storage": storage,
        "specs.gpu": gpu,
        "specs.powerSupply": powerSupply,
        "specs.motherboard": motherboard,
      },
      { new: true }
    );

    if (!updatedDesktop) {
      return res.status(404).json({ message: "Desktop không tồn tại" });
    }

    res.status(200).json(updatedDesktop);
  } catch (error) {
    console.error("Lỗi khi cập nhật specs:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Endpoint tải lên hàng loạt desktops
router.post("/bulk-upload", bulkUploadDesktops); // Bulk upload desktops

// Route lấy danh sách nhật ký sửa chữa
router.get("/:id/repairs", async (req, res) => {
  try {
    const desktop = await Desktop.findById(req.params.id).populate("repairs.updatedBy", "name email");
    if (!desktop) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }
    res.status(200).json(desktop.repairs);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

// Route thêm nhật ký sửa chữa
router.post("/:id/repairs", async (req, res) => {
  const { description, date, updatedBy } = req.body;

  if (!description || !updatedBy) {
    return res.status(400).json({ message: "Thông tin không hợp lệ" });
  }

  try {
    const desktop = await Desktop.findById(req.params.id);
    if (!desktop) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const newRepair = { description, date: date || Date.now(), updatedBy };
    desktop.repairs.push(newRepair);
    await desktop.save();

    res.status(201).json(newRepair);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

// Route cập nhật nhật ký sửa chữa
router.put("/:id/repairs/:repairId", async (req, res) => {
  const { description, date, updatedBy } = req.body;

  try {
    const desktop = await Desktop.findById(req.params.id);
    if (!desktop) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const repair = desktop.repairs.id(req.params.repairId);
    if (!repair) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký sửa chữa" });
    }

    repair.description = description || repair.description;
    repair.date = date || repair.date;
    repair.updatedBy = updatedBy || repair.updatedBy;

    await desktop.save();

    res.status(200).json(repair);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

// Route xóa nhật ký sửa chữa
router.delete("/:id/repairs/:repairId", async (req, res) => {
  const { id, repairId } = req.params;

  try {
    const desktop = await Desktop.findById(id);
    if (!desktop) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    // Lọc bỏ repair khỏi mảng repairs
    desktop.repairs = desktop.repairs.filter((repair) => repair._id.toString() !== repairId);

    // Lưu lại desktop sau khi sửa đổi
    await desktop.save();

    res.status(200).json({ message: "Đã xóa nhật ký sửa chữa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

module.exports = router;