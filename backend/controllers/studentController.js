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
      const studentCode = row["ID"];
      const name = row["Student Name"];
      const email = row["Email"];
      const className = row[" Class"]?.trim(); // Loại bỏ dấu cách thừa
      const schoolYear = row["School Year"];
      const normalizeGender = (gender) => {
        if (!gender) return "Khác"; // Nếu trống, mặc định là "Khác"
        const genderMap = {
          "Nam": "Nam",
          "Nữ": "Nữ",
          "Nữ": "Nữ", // Chuyển "Nữ" thành "Nữ"
          "Khác": "Khác",
          "Other": "Khác",
          "Male": "Nam",
          "Female": "Nữ"
        };
        return genderMap[gender.trim()] || "Khác"; // Nếu không khớp, mặc định là "Khác"
      };
      
      // Trong vòng lặp đọc Excel, thay đổi đoạn này:
      const gender = normalizeGender(row["Gender"]); // Chuẩn hóa giá trị gender
      // Xử lý birthDate từ các cột _x001D_Day, Month, _x001D_Year
      let birthDate = null;
      if (row["_x001D_Day"] && row["Month"] && row["_x001D_Year"]) {
        birthDate = new Date(`${row["_x001D_Year"]}-${row["Month"]}-${row["_x001D_Day"]}`);
      }

      let parsedKlass = [];
      if (className) {
        parsedKlass = [{ year: new Date().getFullYear(), className }];
      }

      const existingStudent = await Student.findOne({ studentCode });

      if (existingStudent) {
        existingStudent.name = name || existingStudent.name;
        existingStudent.email = email || existingStudent.email;
        existingStudent.gender = gender || existingStudent.gender;
        existingStudent.birthDate = birthDate || existingStudent.birthDate;
        existingStudent.schoolYear = schoolYear || existingStudent.schoolYear;
        existingStudent.klass = [...existingStudent.klass, ...parsedKlass];
        await existingStudent.save();
      } else {
        const newStudent = new Student({
          studentCode,
          name,
          email,
          gender,
          birthDate,
          schoolYear,
          klass: parsedKlass,
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