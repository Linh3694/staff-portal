// backend/models/AwardCategory.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SubAwardSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["month", "semester", "year", "custom"],
      required: true,
    },
    schoolYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolYear",
    },
    // Nếu kiểu là "month": lưu số tháng (1-12)
    month: { type: Number },
    // Nếu kiểu là "semester": lưu học kỳ (ví dụ 1 hoặc 2)
    semester: { type: Number },
    // Nếu kiểu là "year": lưu năm học (có thể dùng cho năm học riêng)
    year: { type: Number },
    // Nếu kiểu là "custom": lưu nhãn (ví dụ: "Tiêu biểu")
    label: { type: String },
    // Số lượng học sinh được vinh danh theo mục này
    awardCount: { type: Number, required: true, default: 0 }
  },
  { _id: false }
);

const AwardCategorySchema = new Schema({
  name: { type: String, required: true },      // Ví dụ: "Học bổng Tài năng"
  description: { type: String },               // Mô tả chung
  coverImage: { type: String },                // Đường dẫn ảnh cover (upload qua middleware)
  subAwards: [SubAwardSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AwardCategory", AwardCategorySchema);