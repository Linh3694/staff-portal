const express = require("express");
const router = express.Router();
const {
  getTools,
  createTool,
  updateTool,
  deleteTool,
  assignTool,
  revokeTool,
  updateToolStatus,
} = require("../controllers/toolController");

const Tool = require("../models/Tool"); // Import model
const { bulkUploadTools } = require("../controllers/toolController");
const validateToken = require("../middleware/validateToken");
const multer = require('multer');
const path = require('path');

const fs = require("fs");

router.use(validateToken);

// Routes
router.get("/", getTools);
router.post("/", createTool);
router.put("/:id", updateTool);
router.delete("/:id", deleteTool);



// Route lấy thông tin chi tiết tool
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  console.log("Payload nhận được từ client:", updateData);
  try {
    const tool = await Tool.findById(id)
      .populate("assigned", "fullname email jobTitle avatarUrl")
      .populate("room", "name location status")
      .populate("assignmentHistory.user", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.assignedBy", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.revokedBy", "fullname email jobTitle avatarUrl");

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
    console.log("Payload nhận được từ frontend:", req.body);

    const { id } = req.params;
    const { specs = {}, releaseYear, manufacturer, type } = req.body;

    // Lấy tool hiện tại từ DB
    const currentTool = await Tool.findById(id);
    if (!currentTool) {
      return res.status(404).json({ message: "Tool không tồn tại." });
    }

    // Làm sạch dữ liệu specs
    const cleanedSpecs = {
     
    };

    // Cập nhật payload
    const updates = {
      specs: cleanedSpecs,
      releaseYear: releaseYear ?? currentTool.releaseYear,
      manufacturer: manufacturer ?? currentTool.manufacturer,
      type: type ?? currentTool.type,
    };

    console.log("Payload để cập nhật (sau khi làm sạch):", updates);

    const updatedTool = await Tool.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedTool) {
      return res.status(404).json({ message: "Không thể cập nhật tool." });
    }

    console.log("Tool sau khi cập nhật:", updatedTool);
    res.status(200).json(updatedTool);
  } catch (error) {
    console.error("Lỗi khi cập nhật specs:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/bulk-upload", bulkUploadTools);


// THÊM route cho bàn giao
router.post("/:id/assign", assignTool);

// THÊM route cho thu hồi
router.post("/:id/revoke", revokeTool);

router.put("/:id/status", updateToolStatus);



module.exports = router;