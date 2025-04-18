// src/components/halloffame/HallOfFameAdminPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../config";
import * as XLSX from "xlsx";
import CategoryModal from './Modal/CategoryModal';
import RecordModal from './Modal/RecordModal';

function HallOfFameAdminPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [showCreateModal, setShowCreateModal] = useState(false); // Thêm state mới
  const [newCategoryName, setNewCategoryName] = useState(""); // Thêm state cho tên mới
  const [newCategoryNameEng, setNewCategoryNameEng] = useState(""); // Thêm state cho tên tiếng Anh
  const [selectedSubAwardSchoolYear, setSelectedSubAwardSchoolYear] =
    useState("");
  // Thêm useEffect để thay đổi title
  useEffect(() => {
    document.title = "Quản lý Hall of Fame | Wellspring";
    // Cleanup function để reset title khi unmount
    return () => {
      document.title = "Wellspring";
    };
  }, []);

  // --- Award Category State ---
  const [categories, setCategories] = useState([]);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    nameEng: "",
    description: "",
    descriptionEng: "",
    coverImage: "",
    baseAcademicYear: "",
    subAwards: [],
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Điều khiển từng bước cho SubAwards
  const [subAwardStep, setSubAwardStep] = useState(1);
  // Chọn kiểu sub award
  const [subAwardMode, setSubAwardMode] = useState({
    custom: false,
    schoolYear: false,
  });
  const [customSubAwards, setCustomSubAwards] = useState([]);
  const [selectedSchoolYears, setSelectedSchoolYears] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [newCustomSubAward, setNewCustomSubAward] = useState("");
  const [newCustomSubAwardSchoolYear, setNewCustomSubAwardSchoolYear] =
    useState("");
  const [newCustomSubAwardPriority, setNewCustomSubAwardPriority] = useState(1); // Thêm state mới
  const [newCustomSubAwardEng, setNewCustomSubAwardEng] = useState("");

  // --- Award Record State (để tạo record ngay trong modal) ---
  const [records, setRecords] = useState([]);
  // Form tạo record, sẽ dùng chung để tạo record cho category đang được edit
  const [recordFormData, setRecordFormData] = useState({
    subAward: {},
    students: [],
    subAwardSelectedIndex: -1,
    reason: "",
  });
  const [editingRecord, setEditingRecord] = useState(null);

  // Danh sách sinh viên
  const [studentsList, setStudentsList] = useState([]);
  const [excelStudents, setExcelStudents] = useState([]);
  const [excelRecordCount, setExcelRecordCount] = useState(0);

  // Danh sách lớp
  const [classesList, setClassesList] = useState([]);
  const [classInput, setClassInput] = useState("");
  const [excelClasses, setExcelClasses] = useState([]);
  const [excelClassCount, setExcelClassCount] = useState(0);

  const [selectedSubAward, setSelectedSubAward] = useState(null);
  const [selectedSubAwardRecords, setSelectedSubAwardRecords] = useState([]);

  // Thêm các state mới
  const [searchInput, setSearchInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  // Thêm state mới để lưu học sinh đang chọn
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tempNote, setTempNote] = useState("");
  const [tempNoteEng, setTempNoteEng] = useState("");
  const [tempClassNote, setTempClassNote] = useState("");
  const [tempClassNoteEng, setTempClassNoteEng] = useState("");
  const [tempKeyword, setTempKeyword] = useState("");
  const [tempKeywordEng, setTempKeywordEng] = useState("");
  const [tempActivity, setTempActivity] = useState("");
  const [tempActivityEng, setTempActivityEng] = useState("");

  const [showRecordModalDirect, setShowRecordModalDirect] = useState(false);
  const [selectedCategoryForRecord, setSelectedCategoryForRecord] = useState(null);

  // Thêm hàm xử lý tìm kiếm
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.trim() === "") {
      setFilteredStudents([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = studentsList.filter(
      (student) =>
        student.studentCode.toLowerCase().includes(value.toLowerCase()) ||
        student.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredStudents(filtered);
    setShowSuggestions(true);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchInput(student.studentCode); // Chỉ hiển thị mã học sinh
    setFilteredStudents([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    fetchCategories();
    fetchRecords();
    fetchSchoolYears();
    fetchStudents();
    fetchClasses();
  }, []);

  // Thêm useEffect mới để fetch lại records khi selectedSubAward thay đổi
  useEffect(() => {
    if (selectedSubAward && editingCategory) {
      console.log("Selected subAward changed, fetching records...");
      fetchRecordsBySubAward(selectedSubAward);
    }
  }, [selectedSubAward, editingCategory]);

  // Thêm useEffect để fetch lại records khi studentsList hoặc classesList thay đổi
  useEffect(() => {
    if (selectedSubAward && editingCategory && (studentsList.length > 0 || classesList.length > 0)) {
      console.log("Students or Classes list updated, refreshing records...");
      fetchRecordsBySubAward(selectedSubAward);
    }
  }, [studentsList, classesList]);

  // Thêm useEffect mới để theo dõi selectedCategoryForRecord
  useEffect(() => {
    if (selectedCategoryForRecord) {
      console.log('Selected category for record:', selectedCategoryForRecord);
      setEditingCategory(selectedCategoryForRecord._id);
    }
  }, [selectedCategoryForRecord]);

  // ----------------- FETCH DATA -----------------
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/award-categories`);
      setCategories(res.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await axios.get(`${API_URL}/award-records`);
      setRecords(res.data || []);
    } catch (error) {
      console.error("Error fetching records:", error);
      setRecords([]);
    }
  };

  const fetchSchoolYears = async () => {
    try {
      const res = await axios.get(`${API_URL}/schoolyears`);
      setSchoolYears(res.data || []);
    } catch (error) {
      console.error("Error fetching school years:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`);
      setStudentsList(res.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudentsList([]);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API_URL}/classes`);
      setClassesList(res.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClassesList([]);
    }
  };

  // ----------------- CATEGORY UPLOAD (Ảnh) -----------------
  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Upload ảnh
      const uploadRes = await axios.post(
        `${API_URL}/award-categories/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Cập nhật state local
      setCategoryFormData({
        ...categoryFormData,
        coverImage: uploadRes.data.filePath,
      });

      // Nếu đang edit category thì update luôn vào DB
      if (editingCategory) {
        await axios.put(`${API_URL}/award-categories/${editingCategory}`, {
          ...categoryFormData,
          coverImage: uploadRes.data.filePath,
        });

        // Refresh lại danh sách để cập nhật UI
        await fetchCategories();
      }

      alert("Cập nhật ảnh thành công!");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Cập nhật ảnh thất bại!");
    }
  };

  // ----------------- SUBMIT CATEGORY -----------------
  const handleCategorySubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Gom subAwards
    const computedSubAwards = [];

    // SubAward custom
    if (subAwardMode.custom && customSubAwards.length > 0) {
      computedSubAwards.push(...customSubAwards);
    }

    // SubAward year-based
    if (subAwardMode.schoolYear && selectedSchoolYears.length > 0) {
      selectedSchoolYears.forEach((syId) => {
        const sy = schoolYears.find((s) => s._id === syId);
        if (sy) {
          computedSubAwards.push({
            type: "year",
            label: "Năm học " + (sy.code || sy.name),
            year: sy.year || null,
            schoolYear: sy._id,
            awardCount: 0,
          });
          computedSubAwards.push({
            schoolYear: sy._id,
            type: "semester",
            label: "Học kì 1",
            semester: 1,
            awardCount: 0,
          });
          computedSubAwards.push({
            schoolYear: sy._id,
            type: "semester",
            label: "Học kì 2",
            semester: 2,
            awardCount: 0,
          });
          computedSubAwards.push({
            schoolYear: sy._id,
            type: "month",
            label: "Tháng 9",
            month: 9,
            awardCount: 0,
          });
          computedSubAwards.push({
            schoolYear: sy._id,
            type: "month",
            label: "Tháng 10",
            month: 10,
            awardCount: 0,
          });
          computedSubAwards.push({
            schoolYear: sy._id,
            type: "month",
            label: "Tháng 11",
            month: 11,
            awardCount: 0,
          });
          computedSubAwards.push({
            schoolYear: sy._id,
            type: "month",
            label: "Tháng 1+2",
            awardCount: 0,
          });
          computedSubAwards.push({
            schoolYear: sy._id,
            type: "month",
            label: "Tháng 3",
            month: 3,
            awardCount: 0,
          });
          computedSubAwards.push({
            schoolYear: sy._id,
            type: "month",
            label: "Tháng 4",
            month: 4,
            awardCount: 0,
          });
        }
      });
    }

    const dataToSend = {
      ...categoryFormData,
      subAwards: computedSubAwards.map((sub, idx) => ({
        ...sub,
        priority: sub.priority != null ? sub.priority : idx + 1,
      })),
    };

    try {
      if (editingCategory) {
        const updateRes = await axios.put(
          `${API_URL}/award-categories/${editingCategory}`,
          dataToSend
        );
        alert("Cập nhật loại vinh danh thành công!");
      } else {
        const resp = await axios.post(
          `${API_URL}/award-categories`,
          dataToSend
        );
        alert("Tạo mới loại vinh danh thành công!");

        // Nếu vừa tạo mới, lưu ID này vào editingCategory để có thể thao tác thêm record
        if (resp && resp.data && resp.data._id) {
          setEditingCategory(resp.data._id);
        }
      }

      // Reset step (nếu muốn quay lại step 1) hoặc tùy logic
      setSubAwardStep(1);
      fetchCategories();
    } catch (error) {
      console.error("Error in category submit:", error);
    }
  };

  const handleCategoryEdit = (cat) => {
    setEditingCategory(cat._id);
    setSelectedCategoryForRecord(cat);
    setShowCategoryModal(true);

    // Xác định các loại Sub Awards trong category
    const hasCustomSubAwards = cat.subAwards.some(
      (sub) => sub.type === "custom"
    );
    const hasSchoolYearSubAwards = cat.subAwards.some(
      (sub) =>
        sub.type === "year" || sub.type === "semester" || sub.type === "month"
    );

    setCategoryFormData({
      name: cat.name,
      nameEng: cat.nameEng || "",
      description: cat.description || "",
      descriptionEng: cat.descriptionEng || "",
      coverImage: cat.coverImage || "",
      baseAcademicYear: cat.baseAcademicYear || "",
      subAwards: cat.subAwards || [],
    });

    setSubAwardMode({
      custom: hasCustomSubAwards,
      schoolYear: hasSchoolYearSubAwards,
    });

    // Lưu danh sách Custom SubAwards
    const existingCustomSubs = cat.subAwards
      .filter((sub) => sub.type === "custom")
      .map((sub, idx) => ({
        ...sub,
        priority:
          sub.priority != null && sub.priority > 0 ? sub.priority : idx + 1,
      }));
    setCustomSubAwards(existingCustomSubs);

    // Lưu danh sách School Years
    const existingSchoolYears = [
      ...new Set(
        cat.subAwards
          .filter((sub) => sub.schoolYear)
          .map((sub) => sub.schoolYear)
      ),
    ];
    setSelectedSchoolYears(existingSchoolYears);

    // Reset form tạo record
    setRecordFormData({
      subAward: {},
      students: [],
      subAwardSelectedIndex: -1,
      reason: "",
    });
  };

  const handleCategoryDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá loại này?")) return;
    try {
      await axios.delete(`${API_URL}/award-categories/${id}`);
      alert("Xoá thành công!");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  // ----------------- EXCEL UPLOAD (Students & Classes) -----------------
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const binaryStr = evt.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Đọc dữ liệu dưới dạng mảng với header
      const rows = XLSX.utils.sheet_to_json(worksheet, { 
        header: ["studentCode", "keyword", "keywordEng", "activity", "activityEng", "note", "noteEng"],
        range: 1 // Bỏ qua dòng header
      });

      console.log("Excel rows:", rows);

      if (rows.length === 0) {
        alert("File Excel không có dữ liệu hợp lệ.");
        return;
      }

      const newStudents = [];
      for (const row of rows) {
        if (!row.studentCode) continue;

        const code = String(row.studentCode).trim();
        const foundStudent = studentsList.find(
          (s) => s.studentCode.toLowerCase() === code.toLowerCase()
        );

        if (!foundStudent) {
          console.warn(`Không tìm thấy sinh viên có mã: ${code}`);
          continue;
        }

        // Xử lý các trường dữ liệu
        const processField = (field) => {
          if (!field) return [];
          const value = String(field).trim();
          if (!value) return [];
          return value.split(",").map(item => item.trim()).filter(Boolean);
        };

        const studentData = {
          student: foundStudent._id,
          keyword: processField(row.keyword),
          keywordEng: processField(row.keywordEng),
          activity: processField(row.activity),
          activityEng: processField(row.activityEng),
          note: row.note ? String(row.note).trim() : "",
          noteEng: row.noteEng ? String(row.noteEng).trim() : ""
        };

        console.log("Processing student data:", {
          code,
          studentData
        });

        newStudents.push(studentData);
      }

      console.log("Final processed students:", newStudents);
      setExcelStudents(newStudents);
      setExcelRecordCount(newStudents.length);
    };

    reader.readAsBinaryString(file);
  };

  const handleExcelClassUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const binaryStr = evt.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rows.length < 2) {
        alert("File Excel không có dữ liệu hợp lệ.");
        return;
      }

      const newClasses = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const className = row[0] ? row[0].toString().trim() : "";
        const keyword = row[1] ? row[1].toString().trim() : "";
        const keywordEng = row[2] ? row[2].toString().trim() : "";
        const activity = row[3] ? row[3].toString().trim() : "";
        const activityEng = row[4] ? row[4].toString().trim() : "";
        const note = row[5] ? row[5].toString().trim() : "";
        const noteEng = row[6] ? row[6].toString().trim() : "";

        if (!className) continue;

        const foundClass = classesList.find(
          (cl) => cl.className.toLowerCase() === className.toLowerCase()
        );
        if (!foundClass) {
          console.warn(`Không tìm thấy lớp có tên: ${className}`);
          continue;
        }

        newClasses.push({ 
          class: foundClass._id,
          keyword: keyword ? keyword.split(",").map(k => k.trim()).filter(Boolean) : [],
          keywordEng: keywordEng ? keywordEng.split(",").map(k => k.trim()).filter(Boolean) : [],
          activity: activity ? activity.split(",").map(a => a.trim()).filter(Boolean) : [],
          activityEng: activityEng ? activityEng.split(",").map(a => a.trim()).filter(Boolean) : [],
          note, 
          noteEng 
        });
      }

      setExcelClasses(newClasses);
      setExcelClassCount(newClasses.length);
    };

    reader.readAsBinaryString(file);
  };

  // ----------------- RECORD FORM (Trong Modal) -----------------
  const anyRecordChanged = selectedSubAwardRecords.some((r) => r.isChanged);

  const handleSaveAllChanges = async () => {
    try {
      // Lọc ra các record đã thay đổi
      const changedRecords = selectedSubAwardRecords.filter((r) => r.isChanged);

      for (const record of changedRecords) {
        // Gọi API cập nhật từng record
        await axios.put(`${API_URL}/award-records/${record._id}`, record);
      }

      // Khi cập nhật xong, đặt lại isChanged = false cho tất cả
      setSelectedSubAwardRecords((prevRecords) =>
        prevRecords.map((r) => ({ ...r, isChanged: false }))
      );

      alert("Cập nhật tất cả thành công!");
    } catch (error) {
      console.error("Error updating all changed records:", error);
      alert("Cập nhật tất cả thất bại!");
    }
  };

  const handleRecordSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    try {
      // Kiểm tra editingCategory
      if (!editingCategory) {
        console.error("Missing editingCategory");
        alert("Vui lòng chọn loại vinh danh");
        return;
      }

      console.log("Current editingCategory:", editingCategory);
      
      /* ---- Determine current sub‑award for duplicate check ---- */
      const activeSubAward =
        recordFormData.subAward && recordFormData.subAward.label
          ? recordFormData.subAward
          : selectedSubAward;         // fallback to selectedSubAward

      if (!activeSubAward) {
        alert("Vui lòng chọn loại vinh danh");
        return;
      }

      // Lấy danh sách học sinh hiện có trong subAward này
      const existingRecords = await axios.get(`${API_URL}/award-records`, {
        params: {
          awardCategory: editingCategory,
          subAwardLabel: activeSubAward.label,
          subAwardType: activeSubAward.type,
          subAwardSchoolYear: activeSubAward.schoolYear,
          subAwardSemester: activeSubAward.semester || 0,
          subAwardMonth: activeSubAward.month || 0,
        },
      });

      const existingStudentIds = new Set();
      existingRecords.data.forEach(record => {
        record.students?.forEach(student => {
          if (student.student) {
            existingStudentIds.add(typeof student.student === 'object' ? student.student._id : student.student);
          }
        });
      });

      // Xử lý dữ liệu học sinh từ form và file Excel
      const finalStudents = [];
      const processedStudentIds = new Set();
      
      // Xử lý từng học sinh trong danh sách
      for (const student of [...recordFormData.students, ...excelStudents]) {
        console.log("Processing student record:", student);
        
        // Kiểm tra nếu student là hợp lệ
        if (!student.student) {
          console.error("Missing student data:", student);
          continue; // Bỏ qua học sinh không hợp lệ
        }
        
        let studentId = null;
        
        // Xử lý trường hợp student.student là object
        if (typeof student.student === 'object' && student.student._id) {
          studentId = student.student._id;
        } 
        // Xử lý trường hợp student.student là string không phải ObjectId
        else if (typeof student.student === 'string' && !/^[0-9a-fA-F]{24}$/.test(student.student)) {
          // Tìm kiếm học sinh theo mã số học sinh
          const foundStudent = studentsList.find(s => 
            s.studentCode === student.student || 
            s._id === student.student
          );
          
          if (foundStudent && foundStudent._id) {
            studentId = foundStudent._id;
          } else {
            console.error("Invalid student ID and not found in studentsList:", student.student);
            continue; // Bỏ qua học sinh không tìm thấy
          }
        }
        // Nếu là string hợp lệ, sử dụng trực tiếp
        else {
          studentId = student.student;
        }

        // Kiểm tra trùng lặp
        if (processedStudentIds.has(studentId) || existingStudentIds.has(studentId)) {
          console.log(`Skipping duplicate student: ${studentId}`);
          continue; // Bỏ qua học sinh trùng lặp
        }
        
        // Kiểm tra mã ghi chú
        if (!student.note || student.note.trim() === "") {
          console.log(`Skipping student ${studentId}: missing note`);
          continue; // Bỏ qua học sinh thiếu ghi chú
        }

        // Thêm vào Set để theo dõi
        processedStudentIds.add(studentId);
        
        // Thêm vào danh sách với ID đã chuẩn hóa và đảm bảo các trường array được xử lý đúng
        finalStudents.push({
          student: studentId,
          keyword: Array.isArray(student.keyword) ? student.keyword : (student.keyword || "").split(",").map(k => k.trim()).filter(Boolean),
          keywordEng: Array.isArray(student.keywordEng) ? student.keywordEng : (student.keywordEng || "").split(",").map(k => k.trim()).filter(Boolean),
          activity: Array.isArray(student.activity) ? student.activity : (student.activity || "").split(",").map(a => a.trim()).filter(Boolean),
          activityEng: Array.isArray(student.activityEng) ? student.activityEng : (student.activityEng || "").split(",").map(a => a.trim()).filter(Boolean),
          note: student.note || "",
          noteEng: student.noteEng || ""
        });
      }

      if (finalStudents.length === 0) {
        alert("Không có học sinh hợp lệ để thêm");
        return;
      }

      console.log("Final students to submit:", finalStudents);
      
      // Gộp danh sách lớp
      const classNames = classInput
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const manualClasses = [];
      for (let cname of classNames) {
        const foundCls = classesList.find(
          (cl) => cl.className.toLowerCase() === cname.toLowerCase()
        );
        if (foundCls) {
          manualClasses.push({ class: foundCls._id, note: "", noteEng: "" });
        } else {
          console.warn(`Không tìm thấy lớp: ${cname}`);
        }
      }

      // Đảm bảo dữ liệu class cũng đúng định dạng
      const classRecords = [];
      
      // Xử lý từng class record
      for (const classRecord of [...manualClasses, ...excelClasses]) {
        let classId = null;
        
        if (typeof classRecord.class === 'object' && classRecord.class._id) {
          classId = classRecord.class._id;
        } else if (typeof classRecord.class === 'string') {
          if (!/^[0-9a-fA-F]{24}$/.test(classRecord.class)) {
            console.error("Invalid class ID format:", classRecord.class);
            alert(`ID lớp không hợp lệ: ${classRecord.class}`);
            return;
          }
          classId = classRecord.class;
        } else {
          console.error("Missing class ID:", classRecord);
          alert("Thông tin lớp bị thiếu");
          return;
        }
        
        classRecords.push({
          ...classRecord,
          class: classId
        });
      }

      console.log("Data to submit:", {
        students: finalStudents,
        classes: classRecords
      });

      if (finalStudents.length === 0 && classRecords.length === 0) {
        alert("Vui lòng thêm ít nhất 1 học sinh hoặc 1 lớp");
        return;
      }

      // Đảm bảo subAward có đầy đủ thông tin
      const selectedCategory = categories.find(
        (cat) => cat._id === editingCategory
      );

      if (!selectedCategory) {
        console.error("Selected category not found:", editingCategory);
        alert("Không tìm thấy thông tin loại vinh danh");
        return;
      }

      console.log("Selected category:", selectedCategory);
      
      // Tìm subAward với điều kiện linh hoạt hơn
      const subAward = selectedCategory?.subAwards?.find(
        (sa) => {
          const labelMatch = sa.label === recordFormData.subAward?.label;
          const typeMatch = sa.type === recordFormData.subAward?.type;
          const yearMatch = String(sa.schoolYear) === String(recordFormData.subAward?.schoolYear);
          
          console.log("Matching subAward:", { sa, labelMatch, typeMatch, yearMatch });
          return labelMatch && (typeMatch || !recordFormData.subAward?.type) && 
                 (yearMatch || !recordFormData.subAward?.schoolYear);
        }
      );

      // Tạo subAward nếu không tìm thấy
      let finalSubAward = subAward;
      if (!finalSubAward && recordFormData.subAward) {
        console.log("Creating new subAward from recordFormData:", recordFormData.subAward);
        finalSubAward = {
          label: recordFormData.subAward.label || "",
          type: recordFormData.subAward.type || "custom",
          schoolYear: recordFormData.subAward.schoolYear || "",
          semester: recordFormData.subAward.semester || 0,
          month: recordFormData.subAward.month || 0,
          awardCount: 0
        };
      }

      if (!finalSubAward) {
        alert("Vui lòng chọn loại vinh danh");
        return;
      }

      const dataToSend = {
        awardCategory: editingCategory, // Đảm bảo gán giá trị editingCategory
        subAward: {
          ...finalSubAward,
          label: finalSubAward.label,
          type: finalSubAward.type || "custom",
          schoolYear: finalSubAward.schoolYear,
          semester: finalSubAward.semester,
          month: finalSubAward.month,
          awardCount: finalSubAward.awardCount || 0,
        },
        reason: recordFormData.reason,
        awardClasses: classRecords,
        students: finalStudents,
      };

      console.log("Final data to send:", dataToSend);

      let response;
      if (!editingRecord) {
        // Tạo mới record
        response = await axios.post(`${API_URL}/award-records`, dataToSend);
        console.log("Created new record:", response.data);
      } else {
        // Cập nhật record
        response = await axios.put(
          `${API_URL}/award-records/${editingRecord}`,
          dataToSend
        );
        console.log("Updated record:", response.data);
      }

      // Kiểm tra response
      if (!response.data.awardCategory) {
        console.error("Response missing awardCategory:", response.data);
        // Thử cập nhật lại record với awardCategory
        const updateResponse = await axios.put(
          `${API_URL}/award-records/${response.data._id}`,
          {
            ...response.data,
            awardCategory: editingCategory
          }
        );
        response.data = updateResponse.data;
      }

      // Cập nhật UI với dữ liệu mới
      if (response && response.data) {
        // Populate thông tin học sinh trong record mới
        const populatedRecord = {
          ...response.data,
          awardCategory: selectedCategory, // Thêm thông tin category đầy đủ
          students: response.data.students.map(student => {
            const foundStudent = studentsList.find(s => s._id === student.student);
            return {
              ...student,
              student: foundStudent || student.student,
              keyword: Array.isArray(student.keyword) ? student.keyword : [],
              keywordEng: Array.isArray(student.keywordEng) ? student.keywordEng : [],
              activity: Array.isArray(student.activity) ? student.activity : [],
              activityEng: Array.isArray(student.activityEng) ? student.activityEng : []
            };
          }),
          awardClasses: response.data.awardClasses?.map(awardClass => ({
            ...awardClass,
            class: classesList.find(c => c._id === awardClass.class) || awardClass.class
          }))
        };
        
        // Cập nhật state với record mới
        setSelectedSubAwardRecords(prev => {
          // Nếu đang edit thì thay thế record cũ
          if (editingRecord) {
            return prev.map(r => r._id === editingRecord ? populatedRecord : r);
          }
          // Nếu tạo mới thì thêm vào đầu danh sách
          return [populatedRecord, ...prev];
        });
      }

      alert(editingRecord ? "Cập nhật record thành công!" : "Tạo mới record thành công!");
      
      // Reset form
      setRecordFormData({
        subAward: {},
        students: [],
        subAwardSelectedIndex: -1,
        reason: "",
      });
      setExcelStudents([]);
      setExcelRecordCount(0);
      setClassInput("");
      setExcelClasses([]);
      setExcelClassCount(0);
      setEditingRecord(null);

      // Gọi lại fetchRecordsBySubAward để cập nhật danh sách
      if (selectedSubAward) {
        await fetchRecordsBySubAward(selectedSubAward);
      }
    } catch (error) {
      console.error("Error in record submit:", error);
      alert("Lỗi: " + (error.response?.data?.error || error.message));
    }
  };

  // Hàm để edit record từ tab records (ngoài modal)
  const handleRecordEditOutside = (record) => {
    // Khi user bấm Edit trong bảng records, ta cũng mở modal hiển thị 2 cột
    if (record.awardCategory && record.awardCategory._id) {
      // load category
      handleCategoryEdit(record.awardCategory);
    }
    setEditingRecord(record._id);

    // Tìm index subAward
    const selectedCategory = categories.find(
      (cat) => cat._id === record.awardCategory?._id
    );
    let foundIndex = -1;

    if (selectedCategory && selectedCategory.subAwards) {
      foundIndex = selectedCategory.subAwards.findIndex((sa) => {
        // So sánh cứng
        return (
          sa.label === record.subAward?.label &&
          sa.type === record.subAward?.type &&
          String(sa.schoolYear) === String(record.subAward?.schoolYear) &&
          (sa.semester || 0) === (record.subAward?.semester || 0) &&
          (sa.month || 0) === (record.subAward?.month || 0)
        );
      });
    }

    setRecordFormData({
      subAward: record.subAward || {},
      students: record.students || [],
      subAwardSelectedIndex: foundIndex,
      reason: record.reason || "",
    });
  };

  const handleRecordDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá record này?")) return;
    try {
      await axios.delete(`${API_URL}/award-records/${id}`);
      alert("Xoá thành công!");
      fetchRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  // ----------------- STUDENT TABLE (Trong Record Form) -----------------
  const handleStudentChange = (index, field, value) => {
    const updated = [...recordFormData.students];
    updated[index] = { ...updated[index], [field]: value };
    setRecordFormData({ ...recordFormData, students: updated });
  };

  const handleRemoveStudent = (index) => {
    const updated = recordFormData.students.filter((_, i) => i !== index);
    setRecordFormData({ ...recordFormData, students: updated });
  };

  const fetchRecordsBySubAward = async (subAward) => {
    if (!subAward || !editingCategory) return;

    try {
      console.log("Fetching records for:", { subAward, editingCategory });
      
      // Fetch records với params đầy đủ
      const res = await axios.get(`${API_URL}/award-records`, {
        params: {
          awardCategory: editingCategory,
          subAwardLabel: subAward.label,
          subAwardType: subAward.type,
          subAwardSchoolYear: subAward.schoolYear,
          subAwardSemester: subAward.semester || 0,
          subAwardMonth: subAward.month || 0,
        },
      });

      console.log("Received records:", res.data);

      // Xử lý và populate dữ liệu
      const processedRecords = (res.data || []).map((record) => {
        if (!record) return null;

        try {
          // Populate thông tin học sinh
          const populatedStudents = (record.students || []).map(student => {
            if (!student || !student.student) return null;
            const foundStudent = studentsList.find(s => s._id === (typeof student.student === 'object' ? student.student._id : student.student));
            return {
              ...student,
              student: foundStudent || student.student,
              keyword: Array.isArray(student.keyword) ? student.keyword : [],
              keywordEng: Array.isArray(student.keywordEng) ? student.keywordEng : [],
              activity: Array.isArray(student.activity) ? student.activity : [],
              activityEng: Array.isArray(student.activityEng) ? student.activityEng : []
            };
          }).filter(Boolean);

          // Populate thông tin lớp
          const populatedClasses = (record.awardClasses || []).map(awardClass => {
            if (!awardClass || !awardClass.class) return null;
            return {
              ...awardClass,
              class: classesList.find(c => c._id === (typeof awardClass.class === 'object' ? awardClass.class._id : awardClass.class)) || awardClass.class
            };
          }).filter(Boolean);

          return {
            ...record,
            students: populatedStudents,
            awardClasses: populatedClasses,
            awardCategory: {
              _id: editingCategory,
              ...(record.awardCategory || {})
            }
          };
        } catch (err) {
          console.error("Error processing record:", err, record);
          return null;
        }
      }).filter(Boolean);

      // Lọc records theo điều kiện chính xác
      const filteredRecords = processedRecords.filter((record) => {
        if (!record || !record.awardCategory || !record.subAward) return false;

        const match = record.awardCategory._id === editingCategory &&
          record.subAward.label === subAward.label &&
          record.subAward.type === subAward.type &&
          String(record.subAward.schoolYear || '') === String(subAward.schoolYear || '') &&
          (record.subAward.semester || 0) === (subAward.semester || 0) &&
          (record.subAward.month || 0) === (subAward.month || 0);
        
        console.log("Record match check:", { 
          recordId: record._id,
          match,
          conditions: {
            categoryMatch: record.awardCategory._id === editingCategory,
            labelMatch: record.subAward.label === subAward.label,
            typeMatch: record.subAward.type === subAward.type,
            yearMatch: String(record.subAward.schoolYear || '') === String(subAward.schoolYear || ''),
            semesterMatch: (record.subAward.semester || 0) === (subAward.semester || 0),
            monthMatch: (record.subAward.month || 0) === (subAward.month || 0)
          }
        });
        
        return match;
      });

      console.log("Final filtered records:", filteredRecords);
      setSelectedSubAwardRecords(filteredRecords);
    } catch (error) {
      console.error("Error fetching records by sub-award:", error);
      setSelectedSubAwardRecords([]);
    }
  };

  const handleSubAwardSelect = (subAward) => {
    setSelectedSubAward(subAward);
    setRecordFormData({ ...recordFormData, subAward });
    fetchRecordsBySubAward(subAward);
  };

  const handleDeleteAllRecords = async () => {
    if (
      window.confirm("Bạn có chắc chắn muốn xóa tất cả dữ liệu vinh danh này?")
    ) {
      try {
        // Xóa tất cả records của sub-award này
        const deletePromises = selectedSubAwardRecords.map((record) =>
          axios.delete(`${API_URL}/award-records/${record._id}`)
        );
        await Promise.all(deletePromises);

        // Reset form data
        setRecordFormData({
          subAward: selectedSubAward, // Giữ lại selectedSubAward hiện tại
          students: [],
          subAwardSelectedIndex: -1,
          reason: "",
        });
        setExcelStudents([]);
        setExcelRecordCount(0);
        setClassInput("");
        setExcelClasses([]);
        setExcelClassCount(0);

        // Cập nhật lại danh sách
        await fetchRecordsBySubAward(selectedSubAward);
        alert("Đã xóa tất cả dữ liệu vinh danh!");
      } catch (error) {
        console.error("Error deleting records:", error);
        alert("Xóa dữ liệu thất bại!");
      }
    }
  };

  // Thêm hàm xử lý khi ấn nút thêm mới
  const handleAddNewRecord = async ({
    selectedStudent,
    tempNote,
    tempNoteEng,
    tempKeyword,
    tempKeywordEng,
    tempActivity,
    tempActivityEng,
    selectedCategory,
    selectedSubAwardLocal,
    availableSubAwards
  }) => {
    if (!selectedStudent) {
      alert("Vui lòng chọn học sinh trước!");
      return;
    }

    if (!tempNote.trim()) {
      alert("Vui lòng nhập ghi chú!");
      return;
    }

    try {
      const subAward = availableSubAwards.find(sa => 
        sa._id === selectedSubAwardLocal || 
        `${sa.type}-${sa.label}-${sa.schoolYear}-${sa.semester || ''}-${sa.month || ''}` === selectedSubAwardLocal
      );
      
      if (!subAward) {
        alert("Vui lòng chọn loại vinh danh con!");
        return;
      }

      // Xác định ID học sinh đúng định dạng
      let studentId = selectedStudent;
      // Nếu là object thì lấy _id
      if (typeof selectedStudent === 'object' && selectedStudent._id) {
        studentId = selectedStudent._id;
      }
      
      // Kiểm tra nếu ID không phải định dạng MongoDB ObjectId hợp lệ
      if (typeof studentId === 'string' && !/^[0-9a-fA-F]{24}$/.test(studentId)) {
        console.error("Invalid student ID format:", studentId);
        alert(`ID học sinh không hợp lệ: ${studentId}`);
        return;
      }

      console.log("Sending student ID:", studentId);

      // Tạo record mới với format đúng
      const newRecord = {
        awardCategory: selectedCategory,
        subAward: {
          type: subAward.type,
          label: subAward.label,
          schoolYear: subAward.schoolYear,
          semester: subAward.semester,
          month: subAward.month
        },
        students: [
          {
            student: studentId,
            note: tempNote,
            noteEng: tempNoteEng,
            keyword: tempKeyword.split(",").map(k => k.trim()).filter(Boolean),
            keywordEng: tempKeywordEng.split(",").map(k => k.trim()).filter(Boolean),
            activity: tempActivity.split(",").map(a => a.trim()).filter(Boolean),
            activityEng: tempActivityEng.split(",").map(a => a.trim()).filter(Boolean)
          }
        ]
      };
      // Gọi API để lưu record
      const res = await axios.post(`${API_URL}/award-records`, newRecord);
      // Thêm record mới vào đầu danh sách
      setSelectedSubAwardRecords(prevRecords => [
        {
          ...res.data,
          students: [
            {
              ...res.data.students[0],
              student: selectedStudent
            }
          ]
        },
        ...prevRecords
      ]);

      // Reset các trường
      setSelectedStudent(null);
      setSearchInput("");
      setTempNote("");
      setTempNoteEng("");
      setTempKeyword("");
      setTempKeywordEng("");
      setTempActivity("");
      setTempActivityEng("");

      alert("Thêm mới thành công!");
    } catch (error) {
      console.error("Error creating record:", error);
      alert("Thêm mới thất bại! " + (error.response?.data?.message || error.message));
    }
  };

  const handleAddNewClassRecord = async () => {
    if (!classInput || !selectedSubAward) {
      alert("Vui lòng chọn lớp và loại vinh danh!");
      return;
    }

    try {
      const selectedClass = classesList.find((c) => c._id === classInput);
      if (!selectedClass) {
        alert("Không tìm thấy thông tin lớp!");
        return;
      }

      // Tạo record mới với format đúng
      const newRecord = {
        awardCategory: editingCategory,
        subAward: selectedSubAward,
        awardClasses: [
          {
            class: classInput,
            note: tempClassNote,
            noteEng: tempClassNoteEng,
          },
        ],
      };

      const response = await axios.post(`${API_URL}/award-records`, newRecord);

      // Thêm thông tin lớp vào response data để hiển thị
      const recordWithClassInfo = {
        ...response.data,
        awardClasses: [
          {
            ...response.data.awardClasses[0],
            class: selectedClass,
          },
        ],
      };

      setSelectedSubAwardRecords((prev) => [recordWithClassInfo, ...prev]);

      // Reset form
      setClassInput("");
      setTempClassNote("");
      setTempClassNoteEng("");
    } catch (error) {
      console.error("Error adding new class record:", error);
      alert(
        "Thêm mới thất bại! " + error.response?.data?.message || error.message
      );
    }
  };

  const handleDeleteCustomSubAward = async (index) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sub-award này?")) return;

    try {
      const subAwardToDelete = customSubAwards[index];

      // Xóa khỏi state local
      setCustomSubAwards((prev) => prev.filter((_, i) => i !== index));
      setCategoryFormData((prev) => ({
        ...prev,
        subAwards: prev.subAwards.filter(
          (sub) =>
            !(
              sub.type === "custom" &&
              sub.label === subAwardToDelete.label &&
              sub.schoolYear === subAwardToDelete.schoolYear
            )
        ),
      }));

      // Xóa khỏi database
      if (editingCategory) {
        const updatedCategory = {
          ...categoryFormData,
          subAwards: categoryFormData.subAwards.filter(
            (sub) =>
              !(
                sub.type === "custom" &&
                sub.label === subAwardToDelete.label &&
                sub.schoolYear === subAwardToDelete.schoolYear
              )
          ),
        };

        await axios.put(
          `${API_URL}/award-categories/${editingCategory}`,
          updatedCategory
        );

        // Xóa tất cả records liên quan đến subAward này
        const relatedRecords = records.filter(
          (record) =>
            record.awardCategory._id === editingCategory &&
            record.subAward.type === "custom" &&
            record.subAward.label === subAwardToDelete.label &&
            record.subAward.schoolYear === subAwardToDelete.schoolYear
        );

        // Xóa từng record liên quan
        for (const record of relatedRecords) {
          await axios.delete(`${API_URL}/award-records/${record._id}`);
        }

        // Refresh lại danh sách
        await fetchCategories();
        await fetchRecords();
      }

      alert("Xóa sub-award thành công!");
    } catch (error) {
      console.error("Error deleting sub-award:", error);
      alert("Xóa sub-award thất bại: " + error.message);

      // Rollback state nếu có lỗi
      await fetchCategories();
      if (editingCategory) {
        const currentCategory = categories.find(
          (cat) => cat._id === editingCategory
        );
        if (currentCategory) {
          setCustomSubAwards(
            currentCategory.subAwards.filter((sub) => sub.type === "custom")
          );
          setCategoryFormData(currentCategory);
        }
      }
    }
  };

  // Reset tất cả state khi đóng modal
  const resetModalState = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setRecordFormData({
      subAward: {},
      students: [],
      subAwardSelectedIndex: -1,
      reason: "",
    });
    setExcelStudents([]);
    setExcelRecordCount(0);
    setClassInput("");
    setExcelClasses([]);
    setExcelClassCount(0);
    setSelectedSubAward(null);
    setSelectedSubAwardRecords([]);
    setTempNote("");
    setTempNoteEng("");
    setTempClassNote("");
    setTempClassNoteEng("");
    setSearchInput("");
    setSelectedStudent(null);
    setShowSuggestions(false);
    setFilteredStudents([]);
  };

  // Thêm hàm xử lý tạo mới đơn giản
  const handleQuickCreate = async () => {
    if (!newCategoryName.trim()) {
      alert("Vui lòng nhập tên vinh danh!");
      return;
    }

    try {
      const dataToSend = {
        name: newCategoryName,
        nameEng: newCategoryNameEng,
        description: "",
        descriptionEng: "",
        coverImage: "",
        baseAcademicYear: "",
        subAwards: [],
      };

      await axios.post(`${API_URL}/award-categories`, dataToSend);
      alert("Tạo mới loại vinh danh thành công!");
      fetchCategories();
      setShowCreateModal(false);
      setNewCategoryName("");
      setNewCategoryNameEng("");
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Tạo mới thất bại!");
    }
  };

  // ----------------- RENDER -----------------
  return (
    <div className="p-8">
      {/* Tab Quản lý Category */}
      {activeTab === "categories" && (
        <div className="w-full rounded-2xl bg-white p-8 shadow-md mt-4 border">
          <div className="w-full flex items-center justify-between">
            <h1 className="text-xl font-bold mb-4">Quản lý Hall of Fame</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#002855] hover:bg-[#0d1d2f] text-white text-sm font-bold px-3 py-2 rounded-xl"
              >
                Tạo mới
              </button>
            </div>
          </div>

          {/* Modal tạo mới đơn giản */}
          {showCreateModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">
                  Tạo mới Loại Vinh Danh
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium mb-1">
                      Tên vinh danh:
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2"
                      placeholder="Nhập tên vinh danh..."
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">
                      Tên vinh danh (Tiếng Anh):
                    </label>
                    <input
                      type="text"
                      value={newCategoryNameEng}
                      onChange={(e) => setNewCategoryNameEng(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2"
                      placeholder="Enter award name in English..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setNewCategoryName("");
                        setNewCategoryNameEng("");
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleQuickCreate}
                      className="bg-[#002855] hover:bg-[#0d1d2f] text-white px-4 py-2 rounded-lg"
                    >
                      Tạo mới
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <table className="w-full">
            <thead>
              <tr className="!border-px !border-gray-400">
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">ID</p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">
                    TÊN VINH DANH
                  </p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-end">
                  <p className="text-sm font-bold text-gray-500">HÀNH ĐỘNG</p>
                </th>
              </tr>
            </thead>
            <tbody>
              {(categories || []).map((cat) => (
                <tr key={cat._id} className="border-b border-gray-200">
                  <td className="w-[350px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">{cat._id}</p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">
                      {cat.name}
                    </p>
                  </td>

                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <div className="text-sm font-semibold text-navy-700 space-x-2 text-end">
                      <button
                        className="bg-[#002855] text-white font-semibold px-3 py-1 rounded-lg"
                        onClick={() => {
                          handleCategoryEdit(cat);
                        }}
                      >
                        Cập nhật
                      </button>
                      <button
                        className="bg-[#009483] text-white font-semibold px-3 py-1 rounded-lg"
                        onClick={() => {
                          setSelectedCategoryForRecord(cat);
                          setShowRecordModalDirect(true);
                        }}
                      >
                        Record
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1 rounded-lg"
                        onClick={() => handleCategoryDelete(cat._id)}
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tạo/Sửa Category + Tạo Record */}
      <CategoryModal 
        showCategoryModal={showCategoryModal}
        resetModalState={resetModalState}
        editingCategory={editingCategory}
        categoryFormData={categoryFormData}
        setCategoryFormData={setCategoryFormData}
        handleCoverImageChange={handleCoverImageChange}
        handleCategorySubmit={handleCategorySubmit}
        subAwardMode={subAwardMode}
        setSubAwardMode={setSubAwardMode}
        newCustomSubAward={newCustomSubAward}
        setNewCustomSubAward={setNewCustomSubAward}
        newCustomSubAwardEng={newCustomSubAwardEng}
        setNewCustomSubAwardEng={setNewCustomSubAwardEng}
        newCustomSubAwardSchoolYear={newCustomSubAwardSchoolYear}
        setNewCustomSubAwardSchoolYear={setNewCustomSubAwardSchoolYear}
        newCustomSubAwardPriority={newCustomSubAwardPriority}
        setNewCustomSubAwardPriority={setNewCustomSubAwardPriority}
        customSubAwards={customSubAwards}
        setCustomSubAwards={setCustomSubAwards}
        schoolYears={schoolYears}
        handleDeleteCustomSubAward={handleDeleteCustomSubAward}
        selectedSchoolYears={selectedSchoolYears}
        setSelectedSchoolYears={setSelectedSchoolYears}
        setSubAwardStep={setSubAwardStep}
        categories={categories}
        selectedSubAwardSchoolYear={selectedSubAwardSchoolYear}
        setSelectedSubAwardSchoolYear={setSelectedSubAwardSchoolYear}
        selectedSubAward={selectedSubAward}
        handleSubAwardSelect={handleSubAwardSelect}
        setShowRecordModal={setShowRecordModal}
        BASE_URL={BASE_URL}
      />

      {showRecordModalDirect && (
        <RecordModal
          showRecordModal={showRecordModalDirect}
          setShowRecordModal={setShowRecordModalDirect}
          editingCategory={selectedCategoryForRecord?._id}
          selectedSubAward={null}
          onSubAwardSelect={handleSubAwardSelect}
          handleExcelUpload={handleExcelUpload}
          handleExcelClassUpload={handleExcelClassUpload}
          anyRecordChanged={anyRecordChanged}
          handleSaveAllChanges={handleSaveAllChanges}
          selectedSubAwardRecords={selectedSubAwardRecords}
          handleDeleteAllRecords={handleDeleteAllRecords}
          excelRecordCount={excelRecordCount}
          excelClassCount={excelClassCount}
          setExcelStudents={setExcelStudents}
          setExcelClasses={setExcelClasses}
          setExcelRecordCount={setExcelRecordCount}
          setExcelClassCount={setExcelClassCount}
          handleRecordSubmit={handleRecordSubmit}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleSearchChange={handleSearchChange}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          filteredStudents={filteredStudents}
          selectedStudent={selectedStudent}
          handleSelectStudent={handleSelectStudent}
          tempKeyword={tempKeyword}
          setTempKeyword={setTempKeyword}
          tempKeywordEng={tempKeywordEng}
          setTempKeywordEng={setTempKeywordEng}
          tempActivity={tempActivity}
          setTempActivity={setTempActivity}
          tempActivityEng={tempActivityEng}
          setTempActivityEng={setTempActivityEng}
          tempNote={tempNote}
          setTempNote={setTempNote}
          tempNoteEng={tempNoteEng}
          setTempNoteEng={setTempNoteEng}
          handleAddNewRecord={handleAddNewRecord}
          classInput={classInput}
          setClassInput={setClassInput}
          tempClassNote={tempClassNote}
          setTempClassNote={setTempClassNote}
          tempClassNoteEng={tempClassNoteEng}
          setTempClassNoteEng={setTempClassNoteEng}
          handleAddNewClassRecord={handleAddNewClassRecord}
          classesList={classesList}
          setSelectedStudent={setSelectedStudent}
          setSelectedSubAwardRecords={setSelectedSubAwardRecords}
          API_URL={API_URL}
          categories={categories || []}
          schoolYears={schoolYears || []}
          studentsList={studentsList || []}
        />
      )}
    </div>
  );
}

export default HallOfFameAdminPage;
