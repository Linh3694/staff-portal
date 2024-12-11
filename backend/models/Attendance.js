// const mongoose = require("mongoose");

// const attendanceSchema = new mongoose.Schema(
//   {
//     fingerprintCode: {
//       type: String,
//       required: true,
//     },
//     dateTime: {
//       type: Date,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ["Present", "Absent", "Late", "Early"],
//       default: "Present",
//     },
//     location: {
//       type: String,
//       default: "Unknown",
//     },
//   },
//   { timestamps: true }
// );

// const Attendance = mongoose.model("Attendance", attendanceSchema);

// module.exports = Attendance;