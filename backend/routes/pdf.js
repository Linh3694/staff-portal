const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadPdf"); // Import middleware mới
const pdfController = require("../controllers/pdfController");
const authenticate = require("../middleware/authMiddleware");


// Endpoint upload PDF
router.post("/upload-pdf", authenticate, upload.single("pdfFile"), pdfController.uploadPdf);
router.get("/get-images/:customName", authenticate, pdfController.getImages);
router.get("/get-all-pdfs", authenticate, pdfController.getAllPdfs);
router.put("/update-customname/:id", authenticate, pdfController.updateCustomName )
router.delete("/delete-pdf/:id", authenticate, pdfController.deletePdf);
router.put("/toggle-active/:id", authenticate, pdfController.toggleActiveStatus);

module.exports = router;