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


module.exports = router;