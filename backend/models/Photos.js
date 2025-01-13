const mongoose = require("mongoose");

const PhotoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  message: { type: String, required: true },
  votes: { type: Number, default: 0 },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  createdAt: { type: Date, default: Date.now },
  uploaderName: { type: String }, // Thêm tên người upload
  comments: [
    {
      text: { type: String, required: true },
      user: { type: String, required: true }, // Người gửi bình luận
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Photo", PhotoSchema);