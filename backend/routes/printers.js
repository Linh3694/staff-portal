const express = require("express");
const router = express.Router();
const {
  getPrinters,
  createPrinter,
  updatePrinter,
  deletePrinter,
} = require("../controllers/printerController");

const Printer = require("../models/Printer"); // Import model
const { bulkUploadPrinters } = require("../controllers/printerController");
const validateToken = require("../middleware/validateToken");

router.use(validateToken);

// Routes
router.get("/", getPrinters);
router.post("/", createPrinter);
router.put("/:id", updatePrinter);
router.delete("/:id", deletePrinter);



// Route lấy thông tin chi tiết Printer
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  console.log("Payload nhận được từ client:", updateData);
  try {
    const printer = await Printer.findById(id);
    if (!printer) {
      return res.status(404).send({ message: 'Không tìm thấy printer' });
    }
    res.status(200).json(printer);
  } catch (error) {
    res.status(500).send({ message: 'Lỗi máy chủ', error });
  }
});


router.post("/bulk-upload", bulkUploadPrinters);



router.get("/:id/repairs", async (req, res) => {
  try {
    const printer = await Printer.findById(req.params.id).populate("repairs.updatedBy", "name email");
    if (!printer) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }
    res.status(200).json(printer.repairs);
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
    const printer = await Printer.findById(req.params.id);
    if (!printer) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const newRepair = { description, date: date || Date.now(), updatedBy, details };
    printer.repairs.push(newRepair);
    await printer.save();

    res.status(201).json(newRepair);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

router.put("/:id/repairs/:repairId", async (req, res) => {
  const { description, date, updatedBy, details } = req.body;

  try {
    const printer = await Printer.findById(req.params.id);
    if (!printer) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const repair = printer.repairs.id(req.params.repairId);
    if (!repair) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký sửa chữa" });
    }

    repair.description = description || repair.description;
    repair.date = date || repair.date;
    repair.updatedBy = updatedBy || repair.updatedBy;
    repair.details = details || repair.details;

    await printer.save();

    res.status(200).json(repair);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});


router.delete("/:id/repairs/:repairId", async (req, res) => {
  const { id, repairId } = req.params;
  console.log("printer ID:", id);
  console.log("Repair ID:", repairId);

  try {
    const printer = await Printer.findById(id);
    if (!printer) {
      console.error("Không tìm thấy printer với ID:", id);
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    console.log("printer trước khi xóa:", printer);

    // Lọc bỏ repair khỏi mảng repairs
    printer.repairs = printer.repairs.filter(
      (repair) => repair._id.toString() !== repairId
    );

    // Lưu lại printer sau khi sửa đổi
    await printer.save();

    console.log("printer sau khi xóa repair:", printer);

    res.status(200).json({ message: "Đã xóa nhật ký sửa chữa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa repair log:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

module.exports = router;