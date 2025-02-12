const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    // Ví dụ: tên nhóm chat, type = "group" / "private"...
    chatName: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);