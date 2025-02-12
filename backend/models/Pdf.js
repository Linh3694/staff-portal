// models/Pdf.js
const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema({
  fileName: { type: String },
  customName: { type: String },
  folderName: { type: String },
  uploadDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Pdf", pdfSchema);