const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ["Nam", "Nữ", "Khác"] },
    birthDate: { type: Date },
    email: { type: String },
    // Tham chiếu đến Family (một chiều)
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);