const express = require("express");
const router = express.Router();
const {
  getTools,
  createTools,
  updateTools,
  deleteTools,
} = require("../controllers/toolController");

const Tool = require("../models/Tool"); // Import model
const { bulkUploadTools } = require("../controllers/toolController");
const validateToken = require("../middleware/validateToken");

router.use(validateToken);
router.get("/", getTools);
router.post("/", createTools);
router.put("/:id", updateTools);
router.delete("/:id", deleteTools);



// Route lấy thông tin chi tiết Tool
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  console.log("Payload nhận được từ client:", updateData);
  try {
    const tool = await Tool.findById(id);
    if (!tool) {
      return res.status(404).send({ message: 'Không tìm thấy tool' });
    }
    res.status(200).json(tool);
  } catch (error) {
    res.status(500).send({ message: 'Lỗi máy chủ', error });
  }
});

// Endpoint cập nhật thông tin specs
router.put("/:id/specs", async (req, res) => {
  try {
    const { id } = req.params;

    // Cập nhật chỉ mục `specs` của tool
    const updatedTool = await Tool.findByIdAndUpdate(
      id,
      { new: true }
    );

    if (!updatedTool) {
      return res.status(404).json({ message: "Tool không tồn tại" });
    }
    console.log("Payload nhận được:", req.body);

    res.status(200).json(updatedTool);
  } catch (error) {
    console.error("Lỗi khi cập nhật specs:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// router.post("/bulk-upload", bulkUploadTools);



router.get("/:id/repairs", async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id).populate("repairs.updatedBy", "name email");
    if (!tool) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }
    res.status(200).json(tool.repairs);
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
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const newRepair = { description, date: date || Date.now(), updatedBy, details };
    tool.repairs.push(newRepair);
    await tool.save();

    res.status(201).json(newRepair);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

router.put("/:id/repairs/:repairId", async (req, res) => {
  const { description, date, updatedBy, details } = req.body;

  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const repair = tool.repairs.id(req.params.repairId);
    if (!repair) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký sửa chữa" });
    }

    repair.description = description || repair.description;
    repair.date = date || repair.date;
    repair.updatedBy = updatedBy || repair.updatedBy;
    repair.details = details || repair.details;

    await tool.save();

    res.status(200).json(repair);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});


router.delete("/:id/repairs/:repairId", async (req, res) => {
  const { id, repairId } = req.params;
  console.log("tool ID:", id);
  console.log("Repair ID:", repairId);

  try {
    const tool = await Tool.findById(id);
    if (!tool) {
      console.error("Không tìm thấy tool với ID:", id);
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    console.log("tool trước khi xóa:", tool);

    // Lọc bỏ repair khỏi mảng repairs
    tool.repairs = tool.repairs.filter(
      (repair) => repair._id.toString() !== repairId
    );

    // Lưu lại tool sau khi sửa đổi
    await tool.save();

    console.log("tool sau khi xóa repair:", tool);

    res.status(200).json({ message: "Đã xóa nhật ký sửa chữa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa repair log:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

module.exports = router;