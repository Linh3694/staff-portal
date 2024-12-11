const express = require("express");
const router = express.Router();
const {
  getLaptops,
  createLaptop,
  updateLaptop,
  deleteLaptop,
} = require("../controllers/laptopController");

const Laptop = require("../models/Laptop"); // Import model
const { bulkUploadLaptops } = require("../controllers/laptopController");
const validateToken = require("../middleware/validateToken");

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
    const laptop = await Laptop.findById(id);
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
    const { processor, ram, storage, display } = req.body;

    // Cập nhật chỉ mục `specs` của laptop
    const updatedLaptop = await Laptop.findByIdAndUpdate(
      id,
      { "specs.processor": processor, "specs.ram": ram, "specs.storage": storage, "specs.display": display },
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



router.get("/:id/repairs", async (req, res) => {
  try {
    const laptop = await Laptop.findById(req.params.id).populate("repairs.updatedBy", "name email");
    if (!laptop) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }
    res.status(200).json(laptop.repairs);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

router.post("/:id/repairs", async (req, res) => {
  const { description, date, updatedBy } = req.body;

  if (!description || !updatedBy) {
    return res.status(400).json({ message: "Thông tin không hợp lệ" });
  }

  try {
    const laptop = await Laptop.findById(req.params.id);
    if (!laptop) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const newRepair = { description, date: date || Date.now(), updatedBy };
    laptop.repairs.push(newRepair);
    await laptop.save();

    res.status(201).json(newRepair);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

router.put("/:id/repairs/:repairId", async (req, res) => {
  const { description, date, updatedBy } = req.body;

  try {
    const laptop = await Laptop.findById(req.params.id);
    if (!laptop) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const repair = laptop.repairs.id(req.params.repairId);
    if (!repair) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký sửa chữa" });
    }

    repair.description = description || repair.description;
    repair.date = date || repair.date;
    repair.updatedBy = updatedBy || repair.updatedBy;

    await laptop.save();

    res.status(200).json(repair);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

// router.delete("/:id/repairs/:repairId", async (req, res) => {
//   try {
//     const laptop = await Laptop.findById(req.params.id);
//     if (!laptop) {
//       return res.status(404).json({ message: "Không tìm thấy thiết bị" });
//     }

//     const repair = laptop.repairs.id(req.params.repairId);
//     if (!repair) {
//       return res.status(404).json({ message: "Không tìm thấy nhật ký sửa chữa" });
//     }

//     repair.remove();
//     await laptop.save();

//     res.status(200).json({ message: "Đã xóa nhật ký sửa chữa thành công" });
//   } catch (error) {
//     res.status(500).json({ message: "Lỗi máy chủ", error });
//   }
// });

router.delete("/:id/repairs/:repairId", async (req, res) => {
  const { id, repairId } = req.params;
  console.log("Laptop ID:", id);
  console.log("Repair ID:", repairId);

  try {
    const laptop = await Laptop.findById(id);
    if (!laptop) {
      console.error("Không tìm thấy laptop với ID:", id);
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    console.log("Laptop trước khi xóa:", laptop);

    // Lọc bỏ repair khỏi mảng repairs
    laptop.repairs = laptop.repairs.filter(
      (repair) => repair._id.toString() !== repairId
    );

    // Lưu lại laptop sau khi sửa đổi
    await laptop.save();

    console.log("Laptop sau khi xóa repair:", laptop);

    res.status(200).json({ message: "Đã xóa nhật ký sửa chữa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa repair log:", error.message);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

module.exports = router;