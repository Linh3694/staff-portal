const express = require("express");
const router = express.Router();
const {
  getProjectors,
  createProjector,
  updateProjector,
  deleteProjector,
} = require("../controllers/projectorController");

const Projector = require("../models/Projector"); // Import model
const { bulkUploadProjectors } = require("../controllers/projectorController");
const validateToken = require("../middleware/validateToken");

router.use(validateToken);

// Routes
router.get("/", getProjectors);
router.post("/", createProjector);
router.put("/:id", updateProjector);
router.delete("/:id", deleteProjector);



// Route lấy thông tin chi tiết Projector
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  console.log("Payload nhận được từ client:", updateData);
  try {
    const projector = await Projector.findById(id);
    if (!projector) {
      return res.status(404).send({ message: 'Không tìm thấy projector' });
    }
    res.status(200).json(projector);
  } catch (error) {
    res.status(500).send({ message: 'Lỗi máy chủ', error });
  }
});

// Endpoint cập nhật thông tin specs
router.put("/:id/specs", async (req, res) => {
  try {
    const { id } = req.params;
    const { processor, ram, storage, display } = req.body;

    // Cập nhật chỉ mục `specs` của projector
    const updatedProjector = await Projector.findByIdAndUpdate(
      id,
      { "specs.processor": processor, "specs.ram": ram, "specs.storage": storage, "specs.display": display },
      { new: true }
    );

    if (!updatedProjector) {
      return res.status(404).json({ message: "Projector không tồn tại" });
    }
    console.log("Payload nhận được:", req.body);

    res.status(200).json(updatedProjector);
  } catch (error) {
    console.error("Lỗi khi cập nhật specs:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/bulk-upload", bulkUploadProjectors);



router.get("/:id/repairs", async (req, res) => {
  try {
    const projector = await Projector.findById(req.params.id).populate("repairs.updatedBy", "name email");
    if (!projector) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }
    res.status(200).json(projector.repairs);
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
    const projector = await Projector.findById(req.params.id);
    if (!projector) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const newRepair = { description, date: date || Date.now(), updatedBy, details };
    projector.repairs.push(newRepair);
    await projector.save();

    res.status(201).json(newRepair);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

router.put("/:id/repairs/:repairId", async (req, res) => {
  const { description, date, updatedBy, details } = req.body;

  try {
    const projector = await Projector.findById(req.params.id);
    if (!projector) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const repair = projector.repairs.id(req.params.repairId);
    if (!repair) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký sửa chữa" });
    }

    repair.description = description || repair.description;
    repair.date = date || repair.date;
    repair.updatedBy = updatedBy || repair.updatedBy;
    repair.details = details || repair.details;

    await projector.save();

    res.status(200).json(repair);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});


router.delete("/:id/repairs/:repairId", async (req, res) => {
  const { id, repairId } = req.params;
  console.log("projector ID:", id);
  console.log("Repair ID:", repairId);

  try {
    const projector = await Projector.findById(id);
    if (!projector) {
      console.error("Không tìm thấy projector với ID:", id);
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    console.log("projector trước khi xóa:", projector);

    // Lọc bỏ repair khỏi mảng repairs
    projector.repairs = projector.repairs.filter(
      (repair) => repair._id.toString() !== repairId
    );

    // Lưu lại projector sau khi sửa đổi
    await projector.save();

    console.log("projector sau khi xóa repair:", projector);

    res.status(200).json({ message: "Đã xóa nhật ký sửa chữa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa repair log:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

module.exports = router;