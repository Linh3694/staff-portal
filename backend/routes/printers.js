const express = require("express");
const router = express.Router();
const {
  getPrinters,
  createPrinter,
  updatePrinter,
  deletePrinter,
  assignPrinter,
  revokePrinter,
  updatePrinterStatus,
} = require("../controllers/printerController");

const Printer = require("../models/Printer"); // Import model
const { bulkUploadPrinters } = require("../controllers/printerController");
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
    // Đặt tên file theo định dạng: printerId-currentHolderId-timestamp.pdf
    const { printerId, userId } = req.body;
    const timestamp = Date.now();
    cb(null, `${printerId}-${userId}-${timestamp}.pdf`);
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
router.get("/", getPrinters);
router.post("/", createPrinter);
router.put("/:id", updatePrinter);
router.delete("/:id", deletePrinter);



// Route lấy thông tin chi tiết printer
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  console.log("Payload nhận được từ client:", updateData);
  try {
    const printer = await Printer.findById(id)
      .populate("assigned", "fullname email jobTitle avatarUrl")
      .populate("room", "name location status")
      .populate("assignmentHistory.user", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.assignedBy", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.revokedBy", "fullname email jobTitle avatarUrl");

    if (!printer) {
      return res.status(404).send({ message: 'Không tìm thấy printer' });
    }
    res.status(200).json(printer);
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

    // Lấy printer hiện tại từ DB
    const currentPrinter = await Printer.findById(id);
    if (!currentPrinter) {
      return res.status(404).json({ message: "Printer không tồn tại." });
    }

    // Làm sạch dữ liệu specs
    const cleanedSpecs = {
      ip: specs.ip ?? currentPrinter.specs.ip,
      ram: specs.ram ?? currentPrinter.specs.ram,
      storage: specs.storage ?? currentPrinter.specs.storage,
      display: specs.display ?? currentPrinter.specs.display,
    };

    // Cập nhật payload
    const updates = {
      specs: cleanedSpecs,
      releaseYear: releaseYear ?? currentPrinter.releaseYear,
      manufacturer: manufacturer ?? currentPrinter.manufacturer,
      type: type ?? currentPrinter.type,
    };

    console.log("Payload để cập nhật (sau khi làm sạch):", updates);

    const updatedPrinter = await Printer.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedPrinter) {
      return res.status(404).json({ message: "Không thể cập nhật printer." });
    }

    console.log("Printer sau khi cập nhật:", updatedPrinter);
    res.status(200).json(updatedPrinter);
  } catch (error) {
    console.error("Lỗi khi cập nhật specs:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/bulk-upload", bulkUploadPrinters);


// THÊM route cho bàn giao
router.post("/:id/assign", assignPrinter);

// THÊM route cho thu hồi
router.post("/:id/revoke", revokePrinter);

router.put("/:id/status", updatePrinterStatus);

// Endpoint upload tệp
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { printerId, userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File không được tải lên." });
    }

    const filePath = `/BBBG/${req.file.filename}`; // Đường dẫn file

    const printer = await Printer.findById(printerId);
    if (!printer) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị." });
    }

    // Tìm lịch sử bàn giao hiện tại (chưa có endDate)
    const currentAssignment = printer.assignmentHistory.find(
      (history) => history.user.toString() === userId && !history.endDate
    );

    if (!currentAssignment) {
      return res.status(404).json({ message: "Không tìm thấy lịch sử bàn giao hiện tại." });
    }

    // Cập nhật document cho lịch sử hiện tại
    currentAssignment.document = filePath;

    // Cập nhật trạng thái thiết bị (nếu cần)
    printer.status = "Active";

    // Lưu thay đổi
    await printer.save();

    return res.status(200).json({
      message: "Tải lên biên bản thành công!",
      printer,
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