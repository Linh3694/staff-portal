const mongoose = require("mongoose");

const repairSchema = new mongoose.Schema({
  description: { type: String, required: true },
  date: { type: Date, default: Date.now }, // Gán mặc định
  updatedBy: {
    type: mongoose.Schema.Types.ObjectID, // Hoặc ObjectId nếu liên kết với User
    required: true,
  },
});

const desktopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  manufacturer: { type: String, required: true },
  serial: { type: String, required: true },
  releaseYear: { type: Number },
  assigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Clients" }], // Liên kết với bảng "Clients"
  status: { type: String, required: true },
  specs: {
    processor: { type: String },
    ram: { type: String },
    storage: { type: String },
    gpu: { type: String }, // Desktop có thể cần thêm GPU
    powerSupply: { type: String }, // Thêm thông tin về nguồn
    motherboard: { type: String }, // Thêm thông tin về bo mạch chủ
  },
  repairs: [repairSchema],
  updates: [
    {
      date: { type: Date, default: Date.now },
      version: { type: String },
      description: { type: String },
    },
  ],
});

module.exports = mongoose.model("Desktop", desktopSchema);