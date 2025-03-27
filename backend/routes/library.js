// routes/libraryRoutes.js

const express = require("express");
const router = express.Router();
const libraryController = require("../controllers/libraryController");
const uploadLibraryImage = require("../middleware/uploadLibraryImage");


// Document Type APIs
router.get("/document-types", libraryController.getAllDocumentTypes);
router.post("/document-types", libraryController.createDocumentType);
router.put("/document-types/:id", libraryController.updateDocumentType);
router.delete("/document-types/:id", libraryController.deleteDocumentType);

// --- Thêm SeriesName APIs ---
router.get("/series-names", libraryController.getAllSeriesNames);
router.post("/series-names", libraryController.createSeriesName);
router.put("/series-names/:id", libraryController.updateSeriesName);
router.delete("/series-names/:id", libraryController.deleteSeriesName);

// -------------------- Special Code APIs -------------------- //
router.get("/special-codes", libraryController.getAllSpecialCodes);
router.post("/special-codes", libraryController.createSpecialCode);
router.put("/special-codes/:id", libraryController.updateSpecialCode);
router.delete("/special-codes/:id", libraryController.deleteSpecialCode);



router.post("/", uploadLibraryImage.upload.single("file"), async (req, res) => {
  try {
    // Nếu có file được gửi, convert file sang WebP và gán đường dẫn vào req.body.coverImage
    if (req.file) {
      const filePath = await uploadLibraryImage.convertToWebp(req.file.buffer, req.file.originalname);
      req.body.coverImage = filePath;
    }
    // Gọi hàm tạo Library từ controller
    libraryController.createLibrary(req, res);
  } catch (error) {
    console.error("Error creating library:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
  
// Lấy tất cả Library
router.get("/", libraryController.getAllLibraries);

// Lấy chi tiết 1 Library
router.get("/:id", libraryController.getLibraryById);

// Cập nhật Library
router.put("/:id", libraryController.updateLibrary);

// Xóa Library
router.delete("/:id", libraryController.deleteLibrary);


module.exports = router;