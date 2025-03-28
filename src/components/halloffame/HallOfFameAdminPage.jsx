// src/components/halloffame/HallOfFameAdminPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../config";
import * as XLSX from "xlsx";
import { FaPen, FaTrashCan } from "react-icons/fa6";
import { FaSave } from "react-icons/fa";

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

  // Thêm state mới để lưu học sinh đang chọn
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tempNote, setTempNote] = useState("");
  const [tempNoteEng, setTempNoteEng] = useState("");
  const [tempClassNote, setTempClassNote] = useState("");
  const [tempClassNoteEng, setTempClassNoteEng] = useState("");

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
      console.log("School Years:", res.data);
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
      subAwards: computedSubAwards,
    };

    try {
      if (editingCategory) {
        await axios.put(
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
    const existingCustomSubs = cat.subAwards.filter(
      (sub) => sub.type === "custom"
    );
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
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rows.length < 2) {
        alert("File Excel không có dữ liệu hợp lệ.");
        return;
      }

      const newStudents = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const code = row[0] ? row[0].toString().trim() : "";
        const note = row[1] ? row[1].toString().trim() : "";
        const noteEng = row[2] ? row[2].toString().trim() : "";

        if (!code) continue;

        const foundStudent = studentsList.find(
          (s) => s.studentCode.toLowerCase() === code.toLowerCase()
        );
        if (!foundStudent) {
          console.warn(`Không tìm thấy sinh viên có mã: ${code}`);
          continue;
        }

        newStudents.push({ student: foundStudent._id, note, noteEng });
      }

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
        const note = row[1] ? row[1].toString().trim() : "";
        const noteEng = row[2] ? row[2].toString().trim() : "";

        if (!className) continue;

        const foundClass = classesList.find(
          (cl) => cl.className.toLowerCase() === className.toLowerCase()
        );
        if (!foundClass) {
          console.warn(`Không tìm thấy lớp có tên: ${className}`);
          continue;
        }

        newClasses.push({ class: foundClass._id, note, noteEng });
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

  const handleRecordSubAwardChange = (indexString) => {
    const idx = parseInt(indexString, 10);
    setRecordFormData((prev) => {
      const selectedCategory = categories.find(
        (cat) => cat._id === editingCategory
      );

      let newSubAward = {};
      if (
        selectedCategory &&
        selectedCategory.subAwards &&
        idx >= 0 &&
        idx < selectedCategory.subAwards.length
      ) {
        newSubAward = selectedCategory.subAwards[idx];
      }

      return {
        ...prev,
        subAwardSelectedIndex: idx,
        subAward: newSubAward,
      };
    });
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    // Gộp danh sách học sinh
    const finalStudents = [...recordFormData.students, ...excelStudents];

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

    const classRecords = [...manualClasses, ...excelClasses];

    if (finalStudents.length === 0 && classRecords.length === 0) {
      alert("Vui lòng thêm ít nhất 1 học sinh hoặc 1 lớp");
      return;
    }

    // Kiểm tra ghi chú của từng học sinh
    for (let i = 0; i < finalStudents.length; i++) {
      const stu = finalStudents[i];
      if (!stu.student) {
        alert(`Học sinh thứ ${i + 1}: Bạn chưa chọn sinh viên`);
        return;
      }
      if (!stu.note || stu.note.trim() === "") {
        alert(`Học sinh thứ ${i + 1}: Bạn chưa nhập ghi chú`);
        return;
      }
    }

    // Đảm bảo subAward có đầy đủ thông tin
    const selectedCategory = categories.find(
      (cat) => cat._id === editingCategory
    );
    const subAward = selectedCategory?.subAwards?.find(
      (sa) =>
        sa.label === recordFormData.subAward?.label &&
        sa.type === recordFormData.subAward?.type &&
        String(sa.schoolYear) === String(recordFormData.subAward?.schoolYear)
    );

    if (!subAward) {
      alert("Vui lòng chọn loại vinh danh");
      return;
    }

    const dataToSend = {
      awardCategory: editingCategory,
      subAward: {
        ...subAward,
        label: subAward.label,
        type: subAward.type || "custom", // Đảm bảo luôn có type
        schoolYear: subAward.schoolYear,
        semester: subAward.semester,
        month: subAward.month,
        awardCount: subAward.awardCount || 0,
      },
      reason: recordFormData.reason,
      awardClasses: classRecords,
      students: finalStudents,
    };

    try {
      if (!editingRecord) {
        // Tạo mới record
        await axios.post(`${API_URL}/award-records`, dataToSend);
        alert("Tạo mới record thành công!");
      } else {
        // Cập nhật record
        await axios.put(
          `${API_URL}/award-records/${editingRecord}`,
          dataToSend
        );
        alert("Cập nhật record thành công!");
        setEditingRecord(null);
      }
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

      // Gọi lại fetchRecordsBySubAward để cập nhật danh sách
      await fetchRecordsBySubAward(selectedSubAward);
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

  const handleAddStudent = () => {
    setRecordFormData({
      ...recordFormData,
      students: [...recordFormData.students, { student: "", note: "" }],
    });
  };

  const handleRemoveStudent = (index) => {
    const updated = recordFormData.students.filter((_, i) => i !== index);
    setRecordFormData({ ...recordFormData, students: updated });
  };

  const fetchRecordsBySubAward = async (subAward) => {
    if (!subAward || !editingCategory) return;

    try {
      const res = await axios.get(`${API_URL}/award-records`, {
        params: {
          awardCategory: editingCategory,
          subAwardLabel: subAward.label,
          subAwardType: subAward.type,
          subAwardSchoolYear: subAward.schoolYear,
          subAwardSemester: subAward.semester,
          subAwardMonth: subAward.month,
        },
      });

      // Lọc records theo sub-award được chọn và đảm bảo thông tin lớp được populate
      const filteredRecords = res.data
        .filter((record) => {
          return (
            // Thêm điều kiện awardCategory
            record.awardCategory &&
            record.awardCategory._id === editingCategory &&
            // Rồi mới xét tới subAward
            record.subAward.label === subAward.label &&
            record.subAward.type === subAward.type &&
            String(record.subAward.schoolYear) ===
              String(subAward.schoolYear) &&
            (record.subAward.semester || 0) === (subAward.semester || 0) &&
            (record.subAward.month || 0) === (subAward.month || 0)
          );
        })
        .map((record) => {
          // Nếu có awardClasses, populate thông tin lớp từ classesList
          if (record.awardClasses && record.awardClasses.length > 0) {
            return {
              ...record,
              awardClasses: record.awardClasses.map((awardClass) => ({
                ...awardClass,
                class:
                  classesList.find((c) => c._id === awardClass.class) ||
                  awardClass.class,
              })),
            };
          }
          return record;
        });

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
  const handleAddNewRecord = async () => {
    if (!selectedStudent) {
      alert("Vui lòng chọn học sinh trước!");
      return;
    }

    if (!tempNote.trim()) {
      alert("Vui lòng nhập ghi chú!");
      return;
    }

    try {
      // Tạo record mới
      const newRecord = {
        awardCategory: editingCategory,
        subAward: selectedSubAward,
        students: [
          {
            student: selectedStudent._id,
            note: tempNote,
            noteEng: tempNoteEng,
          },
        ],
      };

      // Gọi API để lưu record
      const res = await axios.post(`${API_URL}/award-records`, newRecord);

      // Thêm record mới vào đầu danh sách
      setSelectedSubAwardRecords((prevRecords) => [
        {
          ...res.data,
          students: [
            {
              ...res.data.students[0],
              student: selectedStudent,
            },
          ],
        },
        ...prevRecords,
      ]);

      // Reset các trường
      setSelectedStudent(null);
      setSearchInput("");
      setTempNote("");
      setTempNoteEng("");
    } catch (error) {
      console.error("Error creating record:", error);
      alert("Thêm mới thất bại!");
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

  const handleDeleteCustomSubAward = (index) => {
    setCustomSubAwards((prev) => prev.filter((_, i) => i !== index));
    // Nếu bạn muốn cập nhật cả trong categoryFormData.subAwards:
    setCategoryFormData((prev) => ({
      ...prev,
      subAwards: prev.subAwards.filter((_, i) => i !== index),
    }));
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
    <div className="p-6">
      {/* Tab Quản lý Category */}
      {activeTab === "categories" && (
        <div className="w-full rounded-2xl bg-white p-8 shadow-md mt-4">
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

      {/* Tab Quản lý Records */}
      {activeTab === "records" && (
        <div className="mt-4">
          {/* Bảng danh sách records */}
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">Sinh viên</th>
                <th className="border px-2 py-1">Lớp</th>
                <th className="border px-2 py-1">Ảnh</th>
                <th className="border px-2 py-1">Award Category</th>
                <th className="border px-2 py-1">Sub Award</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(records || []).map((r) => (
                <tr key={r._id}>
                  <td className="border px-2 py-1">{r._id}</td>
                  <td className="border px-2 py-1">
                    {r.students.map((stu, i) => (
                      <div key={i}>
                        {stu.student?.studentCode} - {stu.student?.name} -{" "}
                        {stu.currentClass?.className}
                      </div>
                    ))}
                  </td>
                  <td className="border px-2 py-1">
                    {r.awardClasses && r.awardClasses.length > 0
                      ? r.awardClasses.map((c) => c.className).join(", ")
                      : "—"}
                  </td>
                  <td className="border px-2 py-1">
                    {r.students.map((stu, i) => (
                      <div key={i}>
                        {stu.photo?.photoUrl ? (
                          <img
                            src={`${BASE_URL}/${stu.photo.photoUrl}`}
                            alt="Student"
                            className="w-24 object-cover"
                          />
                        ) : (
                          "Chưa có ảnh"
                        )}
                      </div>
                    ))}
                  </td>
                  <td className="border px-2 py-1">
                    {r.awardCategory?.name || r.awardCategory?._id}
                  </td>
                  <td className="border px-2 py-1">
                    {r.subAward ? r.subAward.label : ""}
                  </td>
                  <td className="border px-2 py-1 space-x-2">
                    <button
                      className="bg-[#EAA300] text-white px-2 py-1 rounded"
                      onClick={() => handleRecordEditOutside(r)}
                    >
                      Cập nhật
                    </button>
                    <button
                      className="bg-[#DC0909]  text-white px-2 py-1 rounded"
                      onClick={() => handleRecordDelete(r._id)}
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tạo/Sửa Category + Tạo Record */}
      {showCategoryModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="bg-white pt-16 px-10 pb-6 rounded-[20px] shadow-lg w-11/12 relative flex gap-6">
            <button
              onClick={resetModalState}
              className="absolute top-[2%] right-[1%] text-sm items-center justify-center px-3 py-1 font-bold text-white bg-orange-red rounded-lg transform transition-transform duration-300 hover:scale-105"
            >
              Đóng
            </button>

            {/* Nửa bên trái: Thông tin Category + Step subAward */}
            <div
              className="w-1/2 border-r pr-4 overflow-y-hidden hover:overflow-y-auto"
              style={{ maxHeight: "80vh" }}
            >
              <h2 className="text-xl font-semibold mb-2">
                {editingCategory
                  ? "Cập nhật Loại Vinh Danh"
                  : "Tạo mới Loại Vinh Danh"}
              </h2>
              <div className="relative group mb-2">
                <div>
                  {categoryFormData.coverImage ? (
                    <img
                      src={`${BASE_URL}/${categoryFormData.coverImage}`}
                      alt="Cover"
                      className="w-full h-48 rounded-2xl object-cover cursor-pointer"
                      onClick={() =>
                        document.getElementById("coverImageUpload").click()
                      }
                    />
                  ) : (
                    <div
                      className="w-full h-48 rounded-2xl bg-gray-100 flex items-center justify-center cursor-pointer border border-dashed border-gray-300 hover:bg-gray-200 transition"
                      onClick={() =>
                        document.getElementById("coverImageUpload").click()
                      }
                    >
                      <span className="text-gray-500">Chọn ảnh bìa</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  id="coverImageUpload"
                  onChange={handleCoverImageChange}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Form Category */}
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div className="w-full flex flex-row gap-4 mb-2">
                  <div className="w-full">
                    <label className="block font-medium">Tên:</label>
                    <input
                      className="w-full border border-gray-200 rounded-2xl p-2 text-[#282828]"
                      value={categoryFormData.name}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="w-full">
                    <label className="block font-medium">
                      Tên (Tiếng Anh):
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded-2xl p-2 text-[#282828]"
                      value={categoryFormData.nameEng}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          nameEng: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="w-full flex flex-row gap-4 mb-2">
                  <div className="w-full">
                    <label className="block font-medium">Mô tả:</label>
                    <textarea
                      className="w-full h-36 border border-gray-200 rounded-2xl p-2 text-[#282828] overflow-hidden hover:overflow-auto"
                      value={categoryFormData.description}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="w-full">
                    <label className="block font-medium">
                      Mô tả (Tiếng Anh):
                    </label>
                    <textarea
                      className="w-full h-36 border border-gray-200 rounded-2xl p-2 text-[#282828] overflow-hidden hover:overflow-auto"
                      value={categoryFormData.descriptionEng}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          descriptionEng: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Bước 1 và 2 gộp lại */}
                <div className="border rounded-2xl p-4">
                  <h4 className="font-medium mb-4">
                    Bước 1: Chọn và thiết lập loại Vinh danh
                  </h4>
                  <div className="space-y-6">
                    {/* Vinh danh tùy chọn */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-[#002147] rounded-[4px]"
                          checked={subAwardMode.custom}
                          onChange={(e) =>
                            setSubAwardMode({
                              ...subAwardMode,
                              custom: e.target.checked,
                            })
                          }
                        />
                        <span>
                          Vinh danh tùy chọn <br />
                          <span className="text-xs text-gray-500 italic">
                            Chọn mode này khi bạn muốn tạo các loại vinh danh
                            nhỏ hơn không có thời gian định kỳ năm, tháng, học
                            kì.
                          </span>
                        </span>
                      </div>
                      {subAwardMode.custom && (
                        <div className=" ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              className="w-48 border rounded-lg p-1.5 text-xs"
                              value={newCustomSubAward}
                              onChange={(e) =>
                                setNewCustomSubAward(e.target.value)
                              }
                              placeholder="Nhập tên vinh danh"
                            />
                            <select
                              className="border rounded-lg p-2 text-xs"
                              value={newCustomSubAwardSchoolYear}
                              onChange={(e) =>
                                setNewCustomSubAwardSchoolYear(e.target.value)
                              }
                            >
                              <option value="">--Chọn năm học--</option>
                              {(schoolYears || []).map((sy) => (
                                <option key={sy._id} value={sy._id}>
                                  {sy.code || sy.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="bg-[#009483] text-white px-2 py-1 rounded-lg text-sm font-semibold"
                              onClick={() => {
                                if (
                                  newCustomSubAward.trim() !== "" &&
                                  newCustomSubAwardSchoolYear !== ""
                                ) {
                                  const newSubAward = {
                                    type: "custom",
                                    label: newCustomSubAward,
                                    schoolYear: newCustomSubAwardSchoolYear,
                                    awardCount: 0,
                                  };
                                  setCustomSubAwards([
                                    ...customSubAwards,
                                    newSubAward,
                                  ]);

                                  setCategoryFormData((prev) => ({
                                    ...prev,
                                    subAwards: [...prev.subAwards, newSubAward],
                                  }));

                                  setNewCustomSubAward("");
                                  setNewCustomSubAwardSchoolYear("");
                                } else {
                                  alert(
                                    "Vui lòng nhập label và chọn School Year cho subAward."
                                  );
                                }
                              }}
                            >
                              +
                            </button>
                          </div>
                          <ul className="list-disc pl-5 space-y-1">
                            {customSubAwards.map((sub, index) => {
                              const schoolYear = schoolYears.find(
                                (sy) => sy._id === sub.schoolYear
                              );
                              return (
                                <li
                                  key={index}
                                  className="text-sm flex items-center gap-2"
                                >
                                  <span>
                                    {sub.label} (
                                    {schoolYear
                                      ? `Năm học ${schoolYear.code}`
                                      : sub.schoolYear}
                                    )
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleDeleteCustomSubAward(index)
                                    }
                                    className="text-white font-semibold hover:text-red-700 rounded-lg bg-orange-red-dark px-2"
                                    title="Xoá"
                                  >
                                    X
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Vinh danh định kỳ */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-[#002147] rounded-[4px]"
                          checked={subAwardMode.schoolYear}
                          onChange={(e) =>
                            setSubAwardMode({
                              ...subAwardMode,
                              schoolYear: e.target.checked,
                            })
                          }
                        />
                        <span>
                          Vinh danh định kì <br />
                          <span className="text-xs text-gray-500 italic">
                            Chọn mode này khi bạn muốn tạo các loại vinh danh có
                            thời gian định kỳ năm, tháng, học kì.
                          </span>
                        </span>
                      </div>
                      {subAwardMode.schoolYear && (
                        <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                          <label className="text-sm">Chọn Năm học:</label>
                          <div className="w-72 grid grid-cols-2 gap-2">
                            {schoolYears.map((sy) => (
                              <label
                                key={sy._id}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-4 w-4 text-[#002147] rounded-[4px]"
                                  value={sy._id}
                                  checked={selectedSchoolYears.includes(sy._id)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedSchoolYears((prev) => {
                                      if (checked) {
                                        return [...prev, sy._id];
                                      } else {
                                        return prev.filter(
                                          (id) => id !== sy._id
                                        );
                                      }
                                    });
                                  }}
                                />
                                <span>{sy.code || sy.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className="bg-[#002855]  text-white px-3 py-1 rounded-lg text-sm font-bold"
                        onClick={async () => {
                          try {
                            await handleCategorySubmit();
                            alert("Đã lưu Category và Sub-Award thành công!");
                            setSubAwardStep(3);
                          } catch (error) {
                            console.error(error);
                            alert("Lưu Category thất bại!");
                          }
                        }}
                      >
                        Cập nhật
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 3: Xác nhận & Quản lý Sub Award */}
                <div className="border rounded-2xl p-4">
                  <h4 className="font-medium mb-4">
                    Bước 2: Thêm học sinh và lớp
                  </h4>
                  {(() => {
                    const cat = categories.find(
                      (c) => c._id === editingCategory
                    );
                    if (!cat || !cat.subAwards || cat.subAwards.length === 0) {
                      return (
                        <p className="text-gray-500 italic">
                          Không có Sub Award nào.
                        </p>
                      );
                    }

                    // Filter sub-awards based on the selected school year
                    const filteredSubAwards = selectedSubAwardSchoolYear
                      ? cat.subAwards.filter(
                          (sub) =>
                            String(sub.schoolYear) ===
                            String(selectedSubAwardSchoolYear)
                        )
                      : [];

                    return (
                      <div className="mb-4">
                        <label>Chọn Năm Học:</label>
                        <select
                          className="border border-gray-300 rounded-3xl mr-4 ml-2"
                          value={selectedSubAwardSchoolYear}
                          onChange={(e) =>
                            setSelectedSubAwardSchoolYear(e.target.value)
                          }
                        >
                          <option>Chọn Năm Học</option>
                          {(schoolYears || []).map((sy) => (
                            <option key={sy._id} value={sy._id}>
                              {sy.code || sy.name}
                            </option>
                          ))}
                        </select>
                        <label>Chọn mục:</label>
                        <select
                          className="border border-gray-300 rounded-3xl ml-2"
                          value={selectedSubAward ? selectedSubAward.label : ""}
                          onChange={(e) => {
                            const chosen = filteredSubAwards.find(
                              (sub) => sub.label === e.target.value
                            );
                            if (chosen) {
                              handleSubAwardSelect(chosen);
                            }
                          }}
                        >
                          <option>Chọn mục</option>
                          {filteredSubAwards.map((sub, idx) => (
                            <option key={idx} value={sub.label}>
                              {sub.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </div>
              </form>
            </div>

            {/* Nửa bên phải: Form Tạo Record */}
            <div
              className="w-1/2 pl-4 overflow-y-hidden hover:overflow-y-auto"
              style={{ maxHeight: "80vh" }}
            >
              {/* Nếu chưa có editingCategory => disable form */}
              {!editingCategory && (
                <div className="text-red-500">
                  Vui lòng tạo & lưu Category trước khi thêm Record.
                </div>
              )}

              {/* Hiển thị thông tin Sub Award đang chọn */}
              {selectedSubAward && (
                <div className="mb-4">
                  <div className="p-3 rounded-t">
                    <div className="flex justify-between items-center">
                      <a
                        href="/record-sample.xlsx"
                        download
                        className="bg-[#002855] text-white font-semibold px-3 py-1 rounded cursor-pointer text-sm"
                      >
                        Tải file mẫu
                      </a>
                      <div className="space-x-2">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleExcelUpload}
                          className="hidden"
                          id="excel-students"
                        />
                        <label
                          htmlFor="excel-students"
                          className="bg-[#002855] text-white font-semibold px-3 py-1 rounded cursor-pointer text-sm"
                        >
                          Thêm học sinh
                        </label>

                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleExcelClassUpload}
                          className="hidden"
                          id="excel-classes"
                        />
                        <label
                          htmlFor="excel-classes"
                          className="bg-[#002855] text-white font-semibold px-3 py-1 rounded cursor-pointer text-sm"
                        >
                          Thêm lớp
                        </label>
                        {/* Nút “Cập nhật tất cả” -> chỉ hiện khi anyRecordChanged = true */}
                        {anyRecordChanged && (
                          <button
                            onClick={handleSaveAllChanges}
                            className="bg-[#009483] text-white font-semibold px-3 py-1 rounded cursor-pointer text-sm"
                          >
                            Cập nhật tất cả
                          </button>
                        )}
                        {selectedSubAwardRecords.length > 0 && (
                          <button
                            onClick={handleDeleteAllRecords}
                            className="bg-[#DC0909] text-white font-semibold px-3 py-1 rounded cursor-pointer text-sm"
                          >
                            Xóa tất cả dữ liệu
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Thêm các nút xác nhận và xóa */}
                  <div className="mt-4 flex justify-end items-center space-x-4">
                    {/* Hiển thị số lượng học sinh và lớp từ Excel */}
                    {(excelRecordCount > 0 || excelClassCount > 0) && (
                      <div className="flex items-center space-x-4">
                        {excelRecordCount > 0 && (
                          <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-lg">
                            <span className="text-sm font-medium text-green-700">
                              Trong file có {excelRecordCount} học sinh
                            </span>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Bạn có chắc chắn muốn xóa file học sinh đã tải lên?"
                                  )
                                ) {
                                  setExcelStudents([]);
                                  setExcelRecordCount(0);
                                }
                              }}
                              className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                              title="Xóa file học sinh"
                            >
                              <FaTrashCan size={12} />
                            </button>
                          </div>
                        )}
                        {excelClassCount > 0 && (
                          <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1.5 rounded-lg">
                            <span className="text-sm font-medium text-yellow-700">
                              Trong file có {excelClassCount} lớp
                            </span>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Bạn có chắc chắn muốn xóa file lớp đã tải lên?"
                                  )
                                ) {
                                  setExcelClasses([]);
                                  setExcelClassCount(0);
                                }
                              }}
                              className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                              title="Xóa file lớp"
                            >
                              <FaTrashCan size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      {(excelRecordCount > 0 || excelClassCount > 0) && (
                        <button
                          onClick={handleRecordSubmit}
                          className="bg-[#009483] hover:bg-[#008577] text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
                        >
                          <span>Xác nhận thêm</span>
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                            {excelRecordCount + excelClassCount} đối tượng
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bảng hiển thị dữ liệu */}
                  <div className="rounded-b">
                    <table className="min-w-full">
                      <thead>
                        <tr className="!border-px !border-gray-400">
                          <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                            <p className="text-sm font-bold text-gray-500 uppercase">
                              Mã học sinh/ Lớp
                            </p>
                          </th>
                          <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                            <p className="text-sm font-bold text-gray-500 uppercase">
                              Ghi chú
                            </p>
                          </th>
                          <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                            <p className="text-sm font-bold text-gray-500 uppercase">
                              Ghi chú (EN)
                            </p>
                          </th>
                          <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                            <p className="text-sm font-bold text-gray-500 uppercase">
                              Hành động
                            </p>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {/* Dòng thêm mới bằng tay */}
                        {selectedSubAward && (
                          <>
                            {/* Phần thêm học sinh */}
                            <tr className="border-b">
                              <td className="py-3 pr-4">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={searchInput}
                                    onChange={handleSearchChange}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() =>
                                      setTimeout(
                                        () => setShowSuggestions(false),
                                        200
                                      )
                                    }
                                    placeholder="Nhập mã hoặc tên học sinh..."
                                    className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                                  />
                                  {showSuggestions &&
                                    filteredStudents.length > 0 &&
                                    !selectedStudent && (
                                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredStudents.map((student) => (
                                          <div
                                            key={student._id}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() =>
                                              handleSelectStudent(student)
                                            }
                                          >
                                            <div className="text-sm font-bold">
                                              {student.studentCode} -{" "}
                                              {student.name}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={tempNote}
                                    onChange={(e) =>
                                      setTempNote(e.target.value)
                                    }
                                    className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                                    placeholder="Nhập ghi chú tiếng việt"
                                    disabled={!selectedStudent}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={tempNoteEng}
                                    onChange={(e) =>
                                      setTempNoteEng(e.target.value)
                                    }
                                    className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                                    placeholder="Nhập ghi chú tiếng anh"
                                    disabled={!selectedStudent}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleAddNewRecord}
                                    className="text-white bg-[#002855] p-1 rounded-[8px]"
                                    title="Thêm mới"
                                    disabled={!selectedStudent}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                  {selectedStudent && (
                                    <button
                                      onClick={() => {
                                        setSelectedStudent(null);
                                        setSearchInput("");
                                        setTempNote("");
                                        setTempNoteEng("");
                                      }}
                                      className="text-red-500 hover:text-red-600 p-1 rounded-[8px] hover:bg-red-50"
                                      title="Hủy"
                                    ></button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Phần thêm lớp */}
                            <tr className="border-b">
                              <td className="py-3 pr-4">
                                <div className="relative">
                                  <select
                                    value={classInput}
                                    onChange={(e) =>
                                      setClassInput(e.target.value)
                                    }
                                    className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                                  >
                                    <option value="">Chọn lớp...</option>
                                    {classesList.map((cls) => (
                                      <option key={cls._id} value={cls._id}>
                                        {cls.className}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={tempClassNote}
                                    onChange={(e) =>
                                      setTempClassNote(e.target.value)
                                    }
                                    className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                                    placeholder="Nhập ghi chú tiếng việt"
                                    disabled={!classInput}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={tempClassNoteEng}
                                    onChange={(e) =>
                                      setTempClassNoteEng(e.target.value)
                                    }
                                    className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                                    placeholder="Nhập ghi chú tiếng anh"
                                    disabled={!classInput}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleAddNewClassRecord}
                                    className="text-white bg-[#002855]  p-1 rounded-[8px]"
                                    title="Thêm mới"
                                    disabled={!classInput}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                  {classInput && (
                                    <button
                                      onClick={() => {
                                        setClassInput("");
                                        setTempClassNote("");
                                        setTempClassNoteEng("");
                                      }}
                                      className="text-red-500 hover:text-red-600 p-1 rounded-[8px] hover:bg-red-50"
                                      title="Hủy"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          </>
                        )}

                        {/* Hiển thị records đã lưu */}
                        {selectedSubAwardRecords.map((record, recordIndex) => (
                          <React.Fragment key={`record-${recordIndex}`}>
                            {/* 3.1) Nếu record có student(s) */}
                            {record.students?.map((student, studentIndex) => (
                              <tr
                                key={`record-${recordIndex}-student-${studentIndex}`}
                                className="border-b border-gray-200"
                              >
                                {/* Mã học sinh */}
                                <td className="py-3 pr-4">
                                  <input
                                    type="text"
                                    value={student.student?.studentCode || ""}
                                    readOnly
                                    className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full"
                                  />
                                </td>

                                {/* Ghi chú tiếng Việt (note) */}
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  <div className="relative">
                                    {/* Input hiển thị để click vào chuyển sang textarea */}
                                    <input
                                      type="text"
                                      value={student.note || ""}
                                      onFocus={(e) => {
                                        e.target.style.display = "none";
                                        e.target.nextElementSibling.style.display =
                                          "block";
                                        e.target.nextElementSibling.focus();
                                      }}
                                      onChange={() => {
                                        /* Để tránh warning của React, không làm gì trong đây */
                                      }}
                                      className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full cursor-pointer"
                                    />

                                    {/* Textarea ẩn, hiển thị khi focus */}
                                    <textarea
                                      rows={3}
                                      style={{ display: "none" }}
                                      value={student.note || ""}
                                      onChange={(e) => {
                                        const newValue = e.target.value;

                                        // Chỉ cập nhật record tương ứng
                                        setSelectedSubAwardRecords(
                                          (prevRecords) =>
                                            prevRecords.map((rec, idx) => {
                                              if (idx !== recordIndex) {
                                                return rec; // giữ nguyên các record khác
                                              }
                                              // nếu là recordIndex này, ta clone students
                                              const updatedStudents =
                                                rec.students.map(
                                                  (stu, sIdx) => {
                                                    if (sIdx !== studentIndex) {
                                                      return stu; // giữ nguyên student khác
                                                    }
                                                    return {
                                                      ...stu,
                                                      note: newValue,
                                                    };
                                                  }
                                                );
                                              return {
                                                ...rec,
                                                isChanged: true, // đánh dấu record này
                                                students: updatedStudents,
                                              };
                                            })
                                        );
                                      }}
                                      onBlur={(e) => {
                                        e.target.style.display = "none";
                                        e.target.previousElementSibling.style.display =
                                          "block";
                                      }}
                                      className="absolute left-0 w-full min-h-[80px] rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none"
                                    />
                                  </div>
                                </td>

                                {/* Ghi chú tiếng Anh (noteEng) */}
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  <div className="relative">
                                    {/* Input */}
                                    <input
                                      type="text"
                                      value={student.noteEng || ""}
                                      onFocus={(e) => {
                                        e.target.style.display = "none";
                                        e.target.nextElementSibling.style.display =
                                          "block";
                                        e.target.nextElementSibling.focus();
                                      }}
                                      onChange={() => {}}
                                      className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full cursor-pointer"
                                    />
                                    {/* Textarea */}
                                    <textarea
                                      rows={3}
                                      style={{ display: "none" }}
                                      value={student.noteEng || ""}
                                      onChange={(e) => {
                                        const newValue = e.target.value;
                                        setSelectedSubAwardRecords(
                                          (prevRecords) =>
                                            prevRecords.map((rec, idx) => {
                                              if (idx !== recordIndex) {
                                                return rec;
                                              }
                                              const updatedStudents =
                                                rec.students.map(
                                                  (stu, sIdx) => {
                                                    if (sIdx !== studentIndex)
                                                      return stu;
                                                    return {
                                                      ...stu,
                                                      noteEng: newValue,
                                                    };
                                                  }
                                                );
                                              return {
                                                ...rec,
                                                isChanged: true,
                                                students: updatedStudents,
                                              };
                                            })
                                        );
                                      }}
                                      onBlur={(e) => {
                                        e.target.style.display = "none";
                                        e.target.previousElementSibling.style.display =
                                          "block";
                                      }}
                                      className="absolute left-0 w-full min-h-[80px] rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none"
                                    />
                                  </div>
                                </td>

                                {/* Cột thao tác */}
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  <div className="flex space-x-2">
                                    {/* Nút Xóa */}
                                    <button
                                      onClick={async () => {
                                        if (
                                          !window.confirm(
                                            "Bạn có chắc muốn xóa record này?"
                                          )
                                        ) {
                                          return;
                                        }
                                        try {
                                          await axios.delete(
                                            `${API_URL}/award-records/${record._id}`
                                          );
                                          // Xoá record khỏi state
                                          setSelectedSubAwardRecords((prev) =>
                                            prev.filter(
                                              (_, fIdx) => fIdx !== recordIndex
                                            )
                                          );
                                          alert("Đã xóa thành công!");
                                        } catch (err) {
                                          console.error(err);
                                          alert("Xóa thất bại!");
                                        }
                                      }}
                                      className="text-[#DC0909] hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                                      title="Xóa record"
                                    >
                                      <FaTrashCan size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}

                            {/* 3.2) Nếu record có awardClasses */}
                            {record.awardClasses?.map(
                              (awardClass, classIndex) => (
                                <tr
                                  key={`record-${recordIndex}-class-${classIndex}`}
                                  className="border-b border-gray-200"
                                >
                                  {/* Tên lớp */}
                                  <td className="py-3 pr-4">
                                    <input
                                      type="text"
                                      value={awardClass.class?.className || ""}
                                      readOnly
                                      className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full"
                                    />
                                  </td>

                                  {/* Ghi chú tiếng Việt (note) */}
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={awardClass.note || ""}
                                        onFocus={(e) => {
                                          e.target.style.display = "none";
                                          e.target.nextElementSibling.style.display =
                                            "block";
                                          e.target.nextElementSibling.focus();
                                        }}
                                        onChange={() => {}}
                                        className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full cursor-pointer"
                                      />
                                      <textarea
                                        rows={3}
                                        style={{ display: "none" }}
                                        value={awardClass.note || ""}
                                        onChange={(e) => {
                                          const newValue = e.target.value;
                                          setSelectedSubAwardRecords(
                                            (prevRecords) =>
                                              prevRecords.map((rec, idx) => {
                                                if (idx !== recordIndex)
                                                  return rec;
                                                const updatedClasses =
                                                  rec.awardClasses.map(
                                                    (ac, cIdx) => {
                                                      if (cIdx !== classIndex)
                                                        return ac;
                                                      return {
                                                        ...ac,
                                                        note: newValue,
                                                      };
                                                    }
                                                  );
                                                return {
                                                  ...rec,
                                                  isChanged: true,
                                                  awardClasses: updatedClasses,
                                                };
                                              })
                                          );
                                        }}
                                        onBlur={(e) => {
                                          e.target.style.display = "none";
                                          e.target.previousElementSibling.style.display =
                                            "block";
                                        }}
                                        className="absolute left-0 w-full min-h-[80px] rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none"
                                      />
                                    </div>
                                  </td>

                                  {/* Ghi chú tiếng Anh (noteEng) */}
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={awardClass.noteEng || ""}
                                        onFocus={(e) => {
                                          e.target.style.display = "none";
                                          e.target.nextElementSibling.style.display =
                                            "block";
                                          e.target.nextElementSibling.focus();
                                        }}
                                        onChange={() => {}}
                                        className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full cursor-pointer"
                                      />
                                      <textarea
                                        rows={3}
                                        style={{ display: "none" }}
                                        value={awardClass.noteEng || ""}
                                        onChange={(e) => {
                                          const newValue = e.target.value;
                                          setSelectedSubAwardRecords(
                                            (prevRecords) =>
                                              prevRecords.map((rec, idx) => {
                                                if (idx !== recordIndex)
                                                  return rec;
                                                const updatedClasses =
                                                  rec.awardClasses.map(
                                                    (ac, cIdx) => {
                                                      if (cIdx !== classIndex)
                                                        return ac;
                                                      return {
                                                        ...ac,
                                                        noteEng: newValue,
                                                      };
                                                    }
                                                  );
                                                return {
                                                  ...rec,
                                                  isChanged: true,
                                                  awardClasses: updatedClasses,
                                                };
                                              })
                                          );
                                        }}
                                        onBlur={(e) => {
                                          e.target.style.display = "none";
                                          e.target.previousElementSibling.style.display =
                                            "block";
                                        }}
                                        className="absolute left-0 w-full min-h-[80px] rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none"
                                      />
                                    </div>
                                  </td>

                                  {/* Cột thao tác cho lớp */}
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    <div className="flex space-x-2">
                                      {/* Nút Xoá */}
                                      <button
                                        onClick={async () => {
                                          if (
                                            !window.confirm(
                                              "Bạn có chắc muốn xóa record này?"
                                            )
                                          ) {
                                            return;
                                          }
                                          try {
                                            await axios.delete(
                                              `${API_URL}/award-records/${record._id}`
                                            );
                                            setSelectedSubAwardRecords((prev) =>
                                              prev.filter(
                                                (_, fIdx) =>
                                                  fIdx !== recordIndex
                                              )
                                            );
                                            alert("Đã xóa thành công!");
                                          } catch (err) {
                                            console.error(err);
                                            alert("Xóa thất bại!");
                                          }
                                        }}
                                        className="text-[#DC0909] hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                                        title="Xóa record"
                                      >
                                        <FaTrashCan size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            )}
                          </React.Fragment>
                        ))}

                        {/* Hiển thị records đang thêm mới */}
                        {recordFormData.students.map((student, index) => (
                          <tr
                            key={`new-student-${index}`}
                            className="border-b border-gray-200"
                          >
                            <td className="py-3 pr-4">
                              <select
                                value={student.student || ""}
                                onChange={(e) =>
                                  handleStudentChange(
                                    index,
                                    "student",
                                    e.target.value
                                  )
                                }
                                className="w-full border rounded-lg p-2 text-sm"
                              >
                                <option value="">Chọn học sinh</option>
                                {studentsList.map((s) => (
                                  <option key={s._id} value={s._id}>
                                    {s.studentCode} - {s.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={student.note || ""}
                                  onChange={(e) =>
                                    handleStudentChange(
                                      index,
                                      "note",
                                      e.target.value
                                    )
                                  }
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display =
                                      "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                                />
                                <textarea
                                  value={student.note || ""}
                                  onChange={(e) =>
                                    handleStudentChange(
                                      index,
                                      "note",
                                      e.target.value
                                    )
                                  }
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display =
                                      "block";
                                  }}
                                  className="hidden absolute -top-[20px] left-0 w-full min-h-[100px] border-none rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none transition-all duration-200"
                                  rows="4"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={student.noteEng || ""}
                                  onChange={(e) =>
                                    handleStudentChange(
                                      index,
                                      "noteEng",
                                      e.target.value
                                    )
                                  }
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display =
                                      "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                                />
                                <textarea
                                  value={student.noteEng || ""}
                                  onChange={(e) =>
                                    handleStudentChange(
                                      index,
                                      "noteEng",
                                      e.target.value
                                    )
                                  }
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display =
                                      "block";
                                  }}
                                  className="hidden absolute -top-[20px] left-0 w-full min-h-[100px] border-none rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none transition-all duration-200"
                                  rows="4"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <button
                                onClick={() => handleRemoveStudent(index)}
                                className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                                title="Xóa"
                              >
                                <FaTrashCan size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {/* Hiển thị học sinh từ Excel */}
                        {excelStudents.map((student, index) => (
                          <tr
                            key={`excel-student-${index}`}
                            className="border-b "
                          >
                            <td className="py-3 pr-4">
                              <input
                                type="text"
                                value={
                                  studentsList.find(
                                    (s) => s._id === student.student
                                  )?.studentCode || ""
                                }
                                readOnly
                                className="border-none rounded-lg bg-transparent text-sm font-bold text-navy-700 w-full"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={student.note || ""}
                                  onChange={(e) => {
                                    const updatedStudents = [...excelStudents];
                                    updatedStudents[index].note =
                                      e.target.value;
                                    setExcelStudents(updatedStudents);
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display =
                                      "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  className="border-none rounded-lg bg-transparent text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                                />
                                <textarea
                                  value={student.note || ""}
                                  onChange={(e) => {
                                    const updatedStudents = [...excelStudents];
                                    updatedStudents[index].note =
                                      e.target.value;
                                    setExcelStudents(updatedStudents);
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display =
                                      "block";
                                  }}
                                  className="hidden absolute -top-[20px] left-0 w-full min-h-[100px] border-none rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none transition-all duration-200"
                                  rows="4"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={student.noteEng || ""}
                                  onChange={(e) => {
                                    const updatedStudents = [...excelStudents];
                                    updatedStudents[index].noteEng =
                                      e.target.value;
                                    setExcelStudents(updatedStudents);
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display =
                                      "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  className="border-none rounded-lg bg-transparent text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                                />
                                <textarea
                                  value={student.noteEng || ""}
                                  onChange={(e) => {
                                    const updatedStudents = [...excelStudents];
                                    updatedStudents[index].noteEng =
                                      e.target.value;
                                    setExcelStudents(updatedStudents);
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display =
                                      "block";
                                  }}
                                  className="hidden absolute -top-[20px] left-0 w-full min-h-[100px] border-none rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none transition-all duration-200"
                                  rows="4"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <button
                                onClick={() => {
                                  const updatedStudents = excelStudents.filter(
                                    (_, i) => i !== index
                                  );
                                  setExcelStudents(updatedStudents);
                                  setExcelRecordCount(updatedStudents.length);
                                }}
                                className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                                title="Xóa"
                              >
                                <FaTrashCan size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {/* Hiển thị lớp từ Excel */}
                        {excelClasses.map((awardClass, index) => (
                          <tr key={`excel-class-${index}`} className="border-b">
                            <td className="py-3 pr-4">
                              <input
                                type="text"
                                value={
                                  classesList.find(
                                    (c) => c._id === awardClass.class
                                  )?.className || ""
                                }
                                readOnly
                                className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={awardClass.note || ""}
                                  onChange={(e) => {
                                    const updatedClasses = [...excelClasses];
                                    updatedClasses[index].note = e.target.value;
                                    setExcelClasses(updatedClasses);
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display =
                                      "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  className="border-none rounded-lg bg-gray-100  text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                                />
                                <textarea
                                  value={awardClass.note || ""}
                                  onChange={(e) => {
                                    const updatedClasses = [...excelClasses];
                                    updatedClasses[index].note = e.target.value;
                                    setExcelClasses(updatedClasses);
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display =
                                      "block";
                                  }}
                                  className="hidden absolute -top-[20px] left-0 w-full min-h-[100px] border-none rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none transition-all duration-200"
                                  rows="4"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={awardClass.noteEng || ""}
                                  onChange={(e) => {
                                    const updatedClasses = [...excelClasses];
                                    updatedClasses[index].noteEng =
                                      e.target.value;
                                    setExcelClasses(updatedClasses);
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display =
                                      "block";
                                    e.target.nextElementSibling.focus();
                                  }}
                                  className="border-none rounded-lg bg-gray-100  text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                                />
                                <textarea
                                  value={awardClass.noteEng || ""}
                                  onChange={(e) => {
                                    const updatedClasses = [...excelClasses];
                                    updatedClasses[index].noteEng =
                                      e.target.value;
                                    setExcelClasses(updatedClasses);
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.display = "none";
                                    e.target.previousElementSibling.style.display =
                                      "block";
                                  }}
                                  className="hidden absolute -top-[20px] left-0 w-full min-h-[100px] border-none rounded-lg bg-white text-sm font-bold text-navy-700 shadow-md z-20 border border-blue-200 p-2 resize-none transition-all duration-200"
                                  rows="4"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <button
                                onClick={() => {
                                  const updatedClasses = excelClasses.filter(
                                    (_, i) => i !== index
                                  );
                                  setExcelClasses(updatedClasses);
                                  setExcelClassCount(updatedClasses.length);
                                }}
                                className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                                title="Xóa"
                              >
                                <FaTrashCan size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {/* Hiển thị thông báo khi không có dữ liệu */}
                        {selectedSubAwardRecords.length === 0 &&
                          recordFormData.students.length === 0 &&
                          excelStudents.length === 0 &&
                          excelClasses.length === 0 && (
                            <tr>
                              <td
                                colSpan="4"
                                className="text-center py-4 text-gray-500"
                              >
                                Chưa có dữ liệu. Vui lòng thêm học sinh hoặc
                                lớp.
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HallOfFameAdminPage;
