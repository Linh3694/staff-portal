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

    const pdfFilePath = req.file.path;
    const folderName = path.basename(pdfFilePath, path.extname(pdfFilePath));

    // Chuẩn hóa `customName`
    let customName = req.body.customName
      ?.trim()
      .toLowerCase()
      .normalize("NFD") // Loại bỏ dấu Tiếng Việt
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-") || folderName;

    // 📌 **KIỂM TRA TRÙNG `customName`**
    const existingPdf = await Pdf.findOne({ customName });

    if (existingPdf) {
      return res.status(400).json({ 
        error: `File với customName "${customName}" đã tồn tại! Hãy chọn tên khác.` 
      });
    }

    // Convert PDF -> Ảnh
    await convertPdfToImages(pdfFilePath, folderName, 150);

    // Lưu vào MongoDB
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
    console.log("🔍 API nhận customName:", customName);
    const pdfData = await Pdf.findOne({ customName });
   
    if (!pdfData) {
      return res.status(404).json({
        error: `Không tìm thấy PDF với customName: "${customName}"`,
      });
    }
    console.log("📂 Folder name trong DB:", pdfData.folderName);

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
    console.log("📂 Dữ liệu từ MongoDB:", pdfs); // Kiểm tra dữ liệu trả về
    res.json(
      pdfs.map((pdf) => ({
        _id: pdf._id,
        fileName: pdf.fileName,
        customName: pdf.customName,
        folderName: pdf.folderName, // ✅ THÊM `folderName` NẾU CẦN
        uploadDate: new Date(pdf.uploadDate).toLocaleString(),
      }))
    );
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách PDF:", err);
    res.status(500).json({ error: "Lỗi khi tải danh sách file." });
  }
};

exports.updateCustomName = async (req, res) => {
  try {
    const { id } = req.params;
    const { newCustomName } = req.body;

    if (!newCustomName || newCustomName.trim() === "") {
      return res.status(400).json({ error: "Tên mới không được để trống." });
    }

    // Chuẩn hóa `customName`
    const sanitizedCustomName = newCustomName
      .trim()
      .toLowerCase()
      .normalize("NFD") // Loại bỏ dấu Tiếng Việt
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

    // Kiểm tra trùng lặp
    const existingPdf = await Pdf.findOne({ customName: sanitizedCustomName });
    if (existingPdf) {
      return res.status(400).json({ error: `CustomName "${sanitizedCustomName}" đã tồn tại!` });
    }

    // Cập nhật vào database
    const updatedPdf = await Pdf.findByIdAndUpdate(
      id,
      { customName: sanitizedCustomName },
      { new: true }
    );

    if (!updatedPdf) {
      return res.status(404).json({ error: "Không tìm thấy tài liệu để cập nhật." });
    }

    res.json({ message: "Cập nhật thành công!", updatedPdf });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật customName:", err);
    res.status(500).json({ error: "Lỗi server khi cập nhật customName." });
  }
};

exports.deletePdf = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem tài liệu có tồn tại không
    const pdfData = await Pdf.findById(id);
    if (!pdfData) {
      return res.status(404).json({ error: "Không tìm thấy tài liệu." });
    }

    // Xóa tài liệu khỏi DB
    await Pdf.findByIdAndDelete(id);

    res.json({ message: "Xóa tài liệu thành công!" });
  } catch (err) {
    console.error("❌ Lỗi khi xóa tài liệu:", err);
    res.status(500).json({ error: "Lỗi server khi xóa tài liệu." });
  }
};