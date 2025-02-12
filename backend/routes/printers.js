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



module.exports = router;