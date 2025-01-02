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

// Cấu hình thư mục lưu trữ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'BBBG');
    cb(null, uploadDir); // Đường dẫn thư mục BBBG
  },
  filename: (req, file, cb) => {
    // Đặt tên file theo định dạng: toolId-currentHolderId-timestamp.pdf
    const { toolId, userId } = req.body;
    const timestamp = Date.now();
    cb(null, `${toolId}-${userId}-${timestamp}.pdf`);
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

// Endpoint upload tệp
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { toolId, userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File không được tải lên." });
    }

    const filePath = `/BBBG/${req.file.filename}`; // Đường dẫn file

    const tool = await Tool.findById(toolId);
    if (!tool) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị." });
    }

    // Tìm lịch sử bàn giao hiện tại (chưa có endDate)
    // Tìm lịch sử bàn giao hiện tại (chưa có endDate)
    const currentAssignment = tool.assignmentHistory.find(
      (history) => history.user && history.user.toString() === userId && !history.endDate
    );

    if (!currentAssignment) {
      return res.status(404).json({
        message: "Không tìm thấy lịch sử bàn giao hiện tại.",
        assignmentHistory: tool.assignmentHistory, // In thêm dữ liệu để kiểm tra
      });
    }

    // Cập nhật document cho lịch sử hiện tại
    currentAssignment.document = filePath;

    // Cập nhật trạng thái thiết bị (nếu cần)
    tool.status = "Active";

    // Lưu thay đổi
    await tool.save();

    return res.status(200).json({
      message: "Tải lên biên bản thành công!",
      tool,
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