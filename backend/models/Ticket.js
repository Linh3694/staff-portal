const mongoose = require("mongoose");


const ticketSchema = new mongoose.Schema(
    {
      ticketCode: {
        type: String,
        required: true,
        unique: true, // Đảm bảo không trùng lặp
      },
      title: String,
      description: String,
      priority: {
        type: String,
        enum: ["Low", "Medium", "High", "Urgent"],
        default: "Low",
      },
      status: {
        type: String,
        enum: ["Open", "Assigned", "Processing" , "Waiting for Customer", "Done", "Closed" , "Cancelled"],
        default: "Open",
      },
      creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Nhân viên hỗ trợ
      team: { type: mongoose.Schema.Types.ObjectId, ref: "SupportTeam" }, // Đội hỗ trợ (nếu có)
      sla: {
        type: Date, // Hạn chót (deadline) dựa trên priority
      },
      escalateLevel: {
        type: Number,
        default: 0,
      },
      feedback: {
        rating: { type: Number, min: 1, max: 5 }, // Đánh giá của user
        comment: String,
      },
      // Lưu nhật ký xử lý
      history: [
        {
          timestamp: Date,
          action: String, // "Ticket created", "Assigned to X", "Escalated", "Status changed to Resolved", ...
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      ],
      // Danh sách file đính kèm
      attachments: [
        {
          filename: { type: String },
          url: { type: String },
        },
      ],
    },
    { timestamps: true }
  );

  module.exports = mongoose.model("Ticket", ticketSchema);