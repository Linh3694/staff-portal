// routes/libraryRoutes.js

const express = require("express");
const router = express.Router();
const libraryController = require("../controllers/libraryController");

// Document Type APIs
router.get("/document-types", libraryController.getAllDocumentTypes);
router.post("/document-types", libraryController.createDocumentType);
router.delete("/document-types/:id", libraryController.deleteDocumentType);


// Tạo mới Library
router.post("/", libraryController.createLibrary);

// Lấy tất cả Library
router.get("/", libraryController.getAllLibraries);

// Lấy chi tiết 1 Library
router.get("/:id", libraryController.getLibraryById);

// Cập nhật Library
router.put("/:id", libraryController.updateLibrary);

// Xóa Library
router.delete("/:id", libraryController.deleteLibrary);


module.exports = router;