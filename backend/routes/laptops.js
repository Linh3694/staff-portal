const express = require("express");
const router = express.Router();
const {
  getLaptops,
  createLaptop,
  updateLaptop,
  deleteLaptop,
  assignLaptop,
  revokeLaptop,
  updateLaptopStatus,
} = require("../controllers/laptopController");

const Laptop = require("../models/Laptop"); // Import model
const { bulkUploadLaptops } = require("../controllers/laptopController");
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
    // Đặt tên file theo định dạng: laptopId-currentHolderId-timestamp.pdf
    const { laptopId, userId } = req.body;
    const timestamp = Date.now();
    cb(null, `${laptopId}-${userId}-${timestamp}.pdf`);
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
router.get("/", getLaptops);
router.post("/", createLaptop);
router.put("/:id", updateLaptop);
router.delete("/:id", deleteLaptop);



// Route lấy thông tin chi tiết laptop
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  console.log("Payload nhận được từ client:", updateData);
  try {
    const laptop = await Laptop.findById(id)
      .populate("assigned", "fullname email jobTitle avatarUrl")
      .populate("room", "name location status")
      .populate("assignmentHistory.user", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.assignedBy", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.revokedBy", "fullname email jobTitle avatarUrl");

    if (!laptop) {
      return res.status(404).send({ message: 'Không tìm thấy laptop' });
    }
    res.status(200).json(laptop);
  } catch (error) {
    res.status(500).send({ message: 'Lỗi máy chủ', error });
  }
});


// Endpoint cập nhật thông tin specs
router.put("/:id/specs", async (req, res) => {
  try {
    const { id } = req.params;
    const { processor, ram, storage, display, releaseYear } = req.body;

    // Cập nhật chỉ mục `specs` của laptop
    const updatedLaptop = await Laptop.findByIdAndUpdate(
      id,
      { "specs.processor": processor, "specs.ram": ram, "specs.storage": storage, "specs.display": display, "releaseYear": releaseYear, },
      { new: true }
    );

    if (!updatedLaptop) {
      return res.status(404).json({ message: "Laptop không tồn tại" });
    }
    console.log("Payload nhận được:", req.body);

    res.status(200).json(updatedLaptop);
  } catch (error) {
    console.error("Lỗi khi cập nhật specs:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/bulk-upload", bulkUploadLaptops);


// THÊM route cho bàn giao
router.post("/:id/assign", assignLaptop);

// THÊM route cho thu hồi
router.post("/:id/revoke", revokeLaptop);

router.put("/:id/status", updateLaptopStatus);

// Endpoint upload tệp
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { laptopId, userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File không được tải lên." });
    }

    const filePath = `/BBBG/${req.file.filename}`; // Đường dẫn file

    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị." });
    }

    // Tìm lịch sử bàn giao hiện tại (chưa có endDate)
    const currentAssignment = laptop.assignmentHistory.find(
      (history) => history.user.toString() === userId && !history.endDate
    );

    if (!currentAssignment) {
      return res.status(404).json({ message: "Không tìm thấy lịch sử bàn giao hiện tại." });
    }

    // Cập nhật document cho lịch sử hiện tại
    currentAssignment.document = filePath;

    // Cập nhật trạng thái thiết bị (nếu cần)
    laptop.status = "Active";

    // Lưu thay đổi
    await laptop.save();

    return res.status(200).json({
      message: "Tải lên biên bản thành công!",
      laptop,
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