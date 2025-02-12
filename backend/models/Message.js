const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    media: [
      {
        type: String, // link ảnh upload hoặc path local
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);