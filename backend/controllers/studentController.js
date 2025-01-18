const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const Student = require("../models/Students");

// Lấy danh sách students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    console.error("Error getting students:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Tạo mới student
exports.createStudent = async (req, res) => {
  try {
    const { studentCode, name, email, klass, birthYear } = req.body;

    // Kiểm tra trùng studentCode
    const existingStudent = await Student.findOne({ studentCode });
    if (existingStudent) {
      return res.status(400).json({ message: "Mã học sinh đã tồn tại!" });
    }

    // Parse `klass` nếu nó là chuỗi JSON
    let parsedKlass = [];
    if (typeof klass === "string") {
      try {
        parsedKlass = JSON.parse(klass);
      } catch (error) {
        return res.status(400).json({
          message: "Định dạng 'klass' không hợp lệ. Vui lòng truyền đúng định dạng JSON.",
        });
      }
    } else if (Array.isArray(klass)) {
      parsedKlass = klass;
    }

    const newStudent = new Student({
      studentCode,
      name,
      email,
      klass: parsedKlass,
      birthYear,
    });
    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lấy 1 student
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học sinh!" });
    }

    res.json({
      student,
      classHistory: student.klass, // Danh sách lớp theo từng năm học
    });
  } catch (error) {
    console.error("Error getting student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cập nhật student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentCode, name, email, klass,  birthYear } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { studentCode, name, email, klass, birthYear },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Không tìm thấy học sinh!" });
    }

    res.json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Xoá student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStudent = await Student.findByIdAndDelete(id);
    if (!deletedStudent) {
      return res.status(404).json({ message: "Không tìm thấy học sinh!" });
    }
    res.json({ message: "Xoá học sinh thành công" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.uploadExcel = async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    for (const row of sheetData) {
      const { studentCode, name, email, klass, birthYear } = row;

      // Parse `klass` nếu nó là chuỗi JSON
      let parsedKlass = [];
      try {
        parsedKlass = JSON.parse(klass);
      } catch (error) {
        return res.status(400).json({
          message: `Định dạng 'klass' không hợp lệ tại dòng dữ liệu với mã học sinh ${studentCode}.`,
        });
      }

      const existingStudent = await Student.findOne({ studentCode });

      if (existingStudent) {
        // Nếu tồn tại, cập nhật
        existingStudent.name = name || existingStudent.name;
        existingStudent.email = email || existingStudent.email;
        existingStudent.birthYear = birthYear || existingStudent.birthYear;
        existingStudent.klass = [...existingStudent.klass, ...parsedKlass];
        await existingStudent.save();
      } else {
        // Nếu không tồn tại, tạo mới
        const newStudent = new Student({
          studentCode,
          name,
          email,
          klass: parsedKlass,
          birthYear,
        });
        await newStudent.save();
      }
    }

    res.status(200).json({ message: "Upload và xử lý dữ liệu thành công!" });
  } catch (error) {
    console.error("Error processing Excel file:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi xử lý file Excel." });
  }
};


exports.updateStudentClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { className } = req.body;

    if (!className) {
      return res.status(400).json({ message: "Tên lớp không được để trống!" });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học sinh!" });
    }

    // Thêm lớp mới vào danh sách lớp
    student.klass.push({ year: new Date().getFullYear(), className });
    await student.save();

    res.json({ message: "Cập nhật lớp thành công!", student });
  } catch (error) {
    console.error("Error updating student class:", error);
    res.status(500).json({ message: "Server error" });
  }
};