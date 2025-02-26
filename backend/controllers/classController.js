// controllers/classController.js
const ClassModel = require("../models/Class");
const xlsx = require("xlsx"); // hoặc exceljs

exports.createClass = async (req, res) => {
  try {
    const newClass = await ClassModel.create(req.body);
    return res.status(201).json(newClass);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find().populate("schoolYear");
    return res.json(classes);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const found = await ClassModel.findById(id).populate("schoolYear");
    if (!found) {
      return res.status(404).json({ message: "Class not found" });
    }
    return res.json(found);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ClassModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Class not found" });
    }
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ClassModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Class not found" });
    }
    return res.json({ message: "Class deleted successfully" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Bulk upload Classes qua file Excel/CSV
 * File gồm các cột ví dụ: "ClassName", "SchoolYearCode", "HomeroomTeacher"
 */
// controllers/classController.js
exports.bulkUploadClasses = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No Excel file uploaded" });
    }
    
    // Đọc file Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const ws = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws); // Mỗi row là 1 object

    // Lấy tất cả SchoolYear và tạo map: { code: _id }
    const schoolYears = await SchoolYear.find({});
    const schoolYearMap = {};
    schoolYears.forEach(sy => {
      if (sy.code) schoolYearMap[sy.code.trim()] = sy._id;
    });

    // Tạo mảng đối tượng lớp cần insert
    const classesToInsert = [];
    rows.forEach(row => {
      if (!row.ClassName || !row.SchoolYearCode) return; // bỏ qua nếu thiếu thông tin bắt buộc
      const schoolYearId = schoolYearMap[row.SchoolYearCode.trim()];
      if (!schoolYearId) return; // bỏ qua nếu không tìm thấy SchoolYear tương ứng
      classesToInsert.push({
        className: row.ClassName.trim(),
        schoolYear: schoolYearId,
        homeroomTeacher: row.HomeroomTeacher ? row.HomeroomTeacher.trim() : "",
      });
    });

    if (classesToInsert.length > 0) {
      await ClassModel.insertMany(classesToInsert);
    }
    return res.json({ message: "Bulk upload Classes success!", count: classesToInsert.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  } finally {
    // Optionally: fs.unlinkSync(req.file.path);
  }
};

/** 
 * Ví dụ dummy function để tìm schoolYear theo code 
 * -> trả về _id
 */
const SchoolYear = require("../models/SchoolYear"); // import model
async function findSchoolYearIdByCode(code) {
  if (!code) return null;
  const sy = await SchoolYear.findOne({ code });
  return sy ? sy._id : null;
}