const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String },
    gender: { type: String, enum: ["Nam", "Nữ", "Khác"] },  // Thêm giới tính
    klass: [
      {
        year: { type: Number, required: true },
        className: { type: String, required: true },
      },
    ],
    birthDate: { type: Date },  // Thay birthYear bằng birthDate đầy đủ
    schoolYear: { type: String },  // Thêm School Year
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);