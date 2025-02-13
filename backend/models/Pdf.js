// models/Pdf.js
const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema({
  fileName: { type: String },
  customName: { type: String },
  folderName: { type: String },
  uploadDate: { type: Date, default: Date.now },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 🔥 Tham chiếu đến bảng Users
  active: {
    type: Boolean,
    default: true, // Tài khoản có thể bị vô hiệu hóa bởi admin
  },
});

module.exports = mongoose.model("Pdf", pdfSchema);