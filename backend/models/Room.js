const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: [
      {
        building: { type: String, required: true },
        floor: { type: Number ,required: true },
      },
    ],
    capacity: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Lớp học", "Phòng chức năng", "Phòng họp", "Phòng máy", "Phòng giáo viên", "Khác"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Room", RoomSchema);