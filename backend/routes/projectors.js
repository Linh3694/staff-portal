const express = require("express");
const router = express.Router();
const {
  getProjectors,
  createProjector,
  updateProjector,
  deleteProjector,
  assignProjector,
  revokeProjector,
  updateProjectorStatus,
} = require("../controllers/projectorController");

const Projector = require("../models/Projector"); // Import model
const { bulkUploadProjectors } = require("../controllers/projectorController");
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
    // Đặt tên file theo định dạng: projectorId-currentHolderId-timestamp.pdf
    const { projectorId, userId } = req.body;
    const timestamp = Date.now();
    cb(null, `${projectorId}-${userId}-${timestamp}.pdf`);
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
router.get("/", getProjectors);
router.post("/", createProjector);
router.put("/:id", updateProjector);
router.delete("/:id", deleteProjector);



// Route lấy thông tin chi tiết projector
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  console.log("Payload nhận được từ client:", updateData);
  try {
    const projector = await Projector.findById(id)
      .populate("assigned", "fullname email jobTitle avatarUrl")
      .populate("room", "name location status")
      .populate("assignmentHistory.user", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.assignedBy", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.revokedBy", "fullname email jobTitle avatarUrl");

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
    console.log("Payload nhận được từ frontend:", req.body);

    const { id } = req.params;
    const { specs = {}, releaseYear, manufacturer, type } = req.body;

    // Lấy projector hiện tại từ DB
    const currentProjector = await Projector.findById(id);
    if (!currentProjector) {
      return res.status(404).json({ message: "Projector không tồn tại." });
    }

    // Làm sạch dữ liệu specs
    const cleanedSpecs = {
      display: specs.display ?? currentProjector.specs.display,
    };

    // Cập nhật payload
    const updates = {
      specs: cleanedSpecs,
      releaseYear: releaseYear ?? currentProjector.releaseYear,
      manufacturer: manufacturer ?? currentProjector.manufacturer,
      type: type ?? currentProjector.type,
    };

    console.log("Payload để cập nhật (sau khi làm sạch):", updates);

    const updatedProjector = await Projector.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedProjector) {
      return res.status(404).json({ message: "Không thể cập nhật projector." });
    }

    console.log("Projector sau khi cập nhật:", updatedProjector);
    res.status(200).json(updatedProjector);
  } catch (error) {
    console.error("Lỗi khi cập nhật specs:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/bulk-upload", bulkUploadProjectors);


// THÊM route cho bàn giao
router.post("/:id/assign", assignProjector);

// THÊM route cho thu hồi
router.post("/:id/revoke", revokeProjector);

router.put("/:id/status", updateProjectorStatus);

// Endpoint upload tệp
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { projectorId, userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File không được tải lên." });
    }

    const filePath = `/BBBG/${req.file.filename}`; // Đường dẫn file

    const projector = await Projector.findById(projectorId);
    if (!projector) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị." });
    }

    // Tìm lịch sử bàn giao hiện tại (chưa có endDate)
    const currentAssignment = projector.assignmentHistory.find(
      (history) => history.user.toString() === userId && !history.endDate
    );

    if (!currentAssignment) {
      return res.status(404).json({ message: "Không tìm thấy lịch sử bàn giao hiện tại." });
    }

    // Cập nhật document cho lịch sử hiện tại
    currentAssignment.document = filePath;

    // Cập nhật trạng thái thiết bị (nếu cần)
    projector.status = "Active";

    // Lưu thay đổi
    await projector.save();

    return res.status(200).json({
      message: "Tải lên biên bản thành công!",
      projector,
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