const mongoose = require("mongoose");

const PhotoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  votes: { type: Number, default: 0 },
  votedUsers: { type: [String], default: [] }, // Đảm bảo là mảng rỗng khi khởi tạo
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  createdAt: { type: Date, default: Date.now },
  uploaderName: { type: String }, // Thêm tên người upload
  approved: { type: Boolean, default: false }, // Thêm trường phê duyệt
  comments: [
    {
      text: { type: String, required: true },
      user: { type: String, required: true }, // Người gửi bình luận
      createdAt: { type: Date, default: Date.now },
    },
  ],
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Danh sách người đã vote

});

module.exports = mongoose.model("Photo", PhotoSchema);