const mongoose = require("mongoose");

const familySchema = new mongoose.Schema(
  {
    familyName: { type: String, required: true },
    fatherName: { type: String },
    motherName: { type: String },
    address: { type: String },
    phoneNumber: { type: String },
    // Nếu muốn tham chiếu hai chiều: Lưu luôn danh sách students
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Family", familySchema);