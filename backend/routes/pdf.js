const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadPdf"); // Import middleware mới
const pdfController = require("../controllers/pdfController");

// Endpoint upload PDF
router.post("/upload-pdf", upload.single("pdfFile"), pdfController.uploadPdf);
router.get("/get-images/:customName", pdfController.getImages);
router.get("/get-all-pdfs", pdfController.getAllPdfs);
router.put("/update-customname/:id", pdfController.updateCustomName )
router.delete("/delete-pdf/:id", pdfController.deletePdf);

module.exports = router;