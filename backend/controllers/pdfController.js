// controllers/pdfController.js
const Pdf = require("../models/Pdf");
const { convertPdfToImages } = require("../utils/convertPdfToImages");
const fs = require("fs");
const path = require("path");

exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded." });
    }

    // Đường dẫn file PDF lưu bởi multer
    const pdfFilePath = req.file.path;

    // folderName = tên file không gồm đuôi (.pdf, .docx.pdf, ...)
    const folderName = path.basename(pdfFilePath, path.extname(pdfFilePath));

    // customName lấy từ body (nếu có), format thành dạng-không-dấu-cách
    const customName = req.body.customName
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, "-") || folderName;

    // Gọi hàm convertPdfToImages với 3 tham số:
    // 1) pdfFilePath
    // 2) folderName => baseName
    // 3) 150 => dpi
    await convertPdfToImages(pdfFilePath, folderName, 150);

    // Lưu thông tin PDF vào MongoDB
    const newPdf = new Pdf({
      fileName: req.file.originalname,
      customName,
      folderName,
    });
    await newPdf.save();

    res.json({ folderName, customName });
  } catch (err) {
    console.error("❌ Error converting PDF:", err);
    res.status(500).json({ error: "Lỗi convert PDF" });
  }
};

exports.getImages = async (req, res) => {
  try {
    const { customName } = req.params;
    const pdfData = await Pdf.findOne({ customName });

    if (!pdfData) {
      return res.status(404).json({
        error: `Không tìm thấy PDF với customName: "${customName}"`,
      });
    }

    // Thư mục gốc đang lưu ảnh
    const imageDir = path.join(__dirname, "..", "public", "uploads", "pdf-images");

    if (!fs.existsSync(imageDir)) {
      return res.status(404).json({
        error: `Không tìm thấy thư mục ảnh cho PDF "${customName}"`,
      });
    }

    // Tìm các file .png bắt đầu với folderName
    const allFiles = fs.readdirSync(imageDir);
    const imageFiles = allFiles.filter(
      (file) =>
        file.startsWith(pdfData.folderName) && file.endsWith(".png")
    );

    if (imageFiles.length === 0) {
      return res
        .status(404)
        .json({ error: `Không tìm thấy ảnh cho PDF "${customName}"` });
    }

    // Tạo đường dẫn URL (host/uploads/pdf-images/<filename>)
    const imageUrls = imageFiles.map((file) => {
      return `${req.protocol}://${req.get("host")}/uploads/pdf-images/${file}`;
    });

    res.json({ images: imageUrls });
  } catch (err) {
    console.error("❌ Lỗi khi lấy ảnh:", err);
    res.status(500).json({ error: "Lỗi server khi lấy ảnh." });
  }
};

exports.getAllPdfs = async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ uploadDate: -1 });
    res.json(
      pdfs.map((pdf) => ({
        fileName: pdf.fileName,
        customName: pdf.customName,
        uploadDate: new Date(pdf.uploadDate).toLocaleString(),
      }))
    );
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách PDF:", err);
    res.status(500).json({ error: "Lỗi khi tải danh sách file." });
  }
};