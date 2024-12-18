const mongoose = require("mongoose");


const repairSchema = new mongoose.Schema({
  description: { type: String, required: true },
  date: { type: Date, default: Date.now }, // Gán mặc định
  details: { type: String }, // Thêm trường nội dung chi tiết
  updatedBy: {
    type: mongoose.Schema.Types.String, // Hoặc ObjectId nếu liên kết với User
    required: true,
  },
});

const laptopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Laptop', 'Desktop'], default: 'Laptop' }, // Thêm trường phân loại
  manufacturer: { type: String, required: true },
  serial: { type: String, required: true },
  releaseYear: { type: Number },
  assigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" }, // Gán phòng
  status: { type: String, required: true },
  specs: {
    processor: { type: String },
    ram: { type: String },
    storage: { type: String },
    display: { type: String }
  },
  repairs: [repairSchema],
  updates: [
    {
      date: { type: Date, default: Date.now },
      version: { type: String },
      description: { type: String }
    }
  ]
});


module.exports = mongoose.model("Laptop", laptopSchema);