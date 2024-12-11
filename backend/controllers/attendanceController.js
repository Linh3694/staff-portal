// const Attendance = require("../models/Attendance");

// // Lưu dữ liệu chấm công
// const saveAttendance = async (req, res) => {
//   try {
//     const attendanceData = req.body; // Nhận dữ liệu từ request

//     // Thêm từng bản ghi
//     const records = await Attendance.insertMany(attendanceData, { ordered: false });
//     res.status(200).json({ message: "Attendance records saved successfully", records });
//   } catch (error) {
//     console.error("Error saving attendance:", error);
//     res.status(500).json({ message: "Failed to save attendance", error });
//   }
// };

// // Lấy danh sách chấm công
// const getAttendances = async (req, res) => {
//   try {
//     const records = await Attendance.find({});
//     res.status(200).json(records);
//   } catch (error) {
//     console.error("Error fetching attendances:", error);
//     res.status(500).json({ message: "Failed to fetch attendances" });
//   }
// };

// module.exports = { saveAttendance, getAttendances };