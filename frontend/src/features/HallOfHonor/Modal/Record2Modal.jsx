import React, { useState, useEffect } from "react";
import { FaTrashCan } from "react-icons/fa6";
import axios from "axios";
import { API_URL } from "../../../core/config";

const RecordModal = ({ visible, onClose, categoryId }) => {
  const [categories, setCategories] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [records, setRecords] = useState([]);
  const anyRecordChanged = records.some((r) => r.isChanged);
  const [selectedCategory, setSelectedCategory] = useState(categoryId || "");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSubAwardLocal, setSelectedSubAwardLocal] = useState("");
  const [availableSubAwards, setAvailableSubAwards] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  // --- Local UI state (moved from parent) ---
  const [searchInput, setSearchInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordFormData, setRecordFormData] = useState({
    subAward: {},
    students: [],
    reason: "",
  });
  const [excelStudents, setExcelStudents] = useState([]);
  const [excelRecordCount, setExcelRecordCount] = useState(0);

  // Thay thế bằng các state mới
  const [tempExam, setTempExam] = useState("");
  const [tempScore, setTempScore] = useState("");

  const fetchData = async () => {
    // 🔄 Reset UI‑specific selections & records every time modal is (re)opened
    setSelectedYear("");
    setSelectedSubAwardLocal("");
    setAvailableSubAwards([]);
    setRecords([]);
    try {
      const [cRes, syRes, sRes] = await Promise.all([
        axios.get(`${API_URL}/award-categories`),
        axios.get(`${API_URL}/schoolyears`),
        axios.get(`${API_URL}/students`),
      ]);
      setCategories(cRes.data || []);
      setSchoolYears(syRes.data || []);
      setStudentsList(sRes.data || []);

      // Nếu có selectedSubAwardLocal, lấy records với đầy đủ tham số
      if (selectedSubAwardLocal) {
        const selectedSubAward = availableSubAwards.find(sa => sa._id === selectedSubAwardLocal);
        if (selectedSubAward) {
          const params = {
            awardCategory: categoryId,
            subAwardType: selectedSubAward.type,
            subAwardLabel: selectedSubAward.label,
            subAwardSchoolYear: selectedSubAward.schoolYear,
          };
          if (selectedSubAward.semester != null) params.subAwardSemester = selectedSubAward.semester;
          if (selectedSubAward.month != null) params.subAwardMonth = selectedSubAward.month;
          const rRes = await axios.get(`${API_URL}/award-records`, {
            params: params,
          });
          console.log("Initial records fetch:", rRes.data); // Thêm log để debug
          setRecords(rRes.data || []);
        }
      } else {
        // Chưa chọn SubAward thì không load record nào
        setRecords([]);
      }
    } catch (err) {
      console.error("Error loading modal data:", err);
    }
  };

  const handleDownloadSample = (type) => {
    const link = document.createElement("a");
    link.href =
      type === "classes"
        ? "/record-sample-classes.xlsx"
        : "/record-sample-students-02.xlsx";
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowSampleMenu(false);
  };

  const handleSaveAllChanges = async () => {
    try {
      // Lọc ra các record đã thay đổi
      const changedRecords = records.filter((r) => r.isChanged);

      // Cập nhật đồng thời
      await Promise.all(
        changedRecords.map((r) =>
          axios.put(`${API_URL}/award-records/${r._id}`, {
            ...r,
            students: r.students,
            awardClasses: r.awardClasses,
            reason: r.reason,
          })
        )
      );

      // Reset flag và cập nhật lại records
      setRecords((prev) => prev.map((r) => ({ ...r, isChanged: false })));

      alert("Cập nhật tất cả thành công!");
    } catch (error) {
      console.error("Error updating all changed records:", error);
      alert("Cập nhật tất cả thất bại!");
    }
  };

  const handleAddNewRecord = async (student) => {
    if (!selectedStudent) {
      alert("Vui lòng chọn học sinh trước!");
      return;
    }
    if (!tempExam.trim()) {
      alert("Vui lòng nhập bài thi!");
      return;
    }
    if (!tempScore.trim()) {
      alert("Vui lòng nhập điểm số!");
      return;
    }

    const studentId =
      typeof selectedStudent === "object" ? selectedStudent._id : selectedStudent;

    const body = {
      awardCategory: categoryId,
      subAward: availableSubAwards.find(
        (sa) => sa._id === selectedSubAwardLocal
      ),
      students: [
        {
          student: studentId,
          exam: tempExam,
          score: tempScore,
        },
      ],
    };

    try {
      const res = await axios.post(`${API_URL}/award-records`, body);
      setRecords((prev) => [res.data, ...prev]);
      setSelectedStudent(null);
      setSearchInput("");
      setTempExam("");
      setTempScore("");
      alert("Thêm mới thành công!");
    } catch (error) {
      console.error("Error adding new record:", error);
      alert(
        "Thêm mới thất bại! " + (error.response?.data?.message || error.message)
      );
    }
  };

  const handleRecordSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    // 1) Validate required selections
    if (!selectedCategory) {
      alert("Vui lòng chọn loại vinh danh");
      return;
    }
    if (!selectedSubAwardLocal) {
      alert("Vui lòng chọn loại vinh danh con");
      return;
    }

    // 2) Gather finalStudents
    const finalStudents = [];
    const seenStu = new Set();
    for (const stu of [...recordFormData.students, ...excelStudents]) {
      const sid =
        typeof stu.student === "object" ? stu.student._id : stu.student;
      if (!sid || seenStu.has(sid)) continue;
      seenStu.add(sid);
      finalStudents.push({
        student: sid,
        exam: stu.exam,
        score: stu.score,
      });
    }

    if (finalStudents.length === 0) {
      alert("Vui lòng thêm ít nhất 1 học sinh");
      return;
    }

    // 3) Build request body
    const body = {
      awardCategory: categoryId,
      subAward: availableSubAwards.find(
        (sa) => sa._id === selectedSubAwardLocal
      ),
      reason: recordFormData.reason || "",
      students: finalStudents,
    };

    try {
      // Nếu là thêm mới, gọi API tạo record cho từng học sinh
      for (const stu of finalStudents) {
        await axios.post(`${API_URL}/award-records`, {
          ...body,
          students: [stu],
        });
      }
      alert("Tạo mới record thành công!");
      // 4) Refresh data and reset form
      await fetchData();
      setRecordFormData({ subAward: {}, students: [], reason: "" });
      setExcelStudents([]);
      setEditingRecord(null);
    } catch (error) {
      console.error("Error submitting record:", error);
      alert(
        "Lỗi khi gửi dữ liệu: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDeleteAllRecords = async () => {
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa tất cả record cho loại vinh danh này?"
      )
    )
      return;
    try {
      // Delete each record by ID
      await Promise.all(
        records.map((rec) =>
          axios.delete(`${API_URL}/award-records/${rec._id}`)
        )
      );
      // Refresh list
      fetchData();
    } catch (error) {
      console.error("Error deleting all records:", error);
      alert("Xảy ra lỗi khi xóa toàn bộ record");
    }
  };

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible, categoryId]);


  useEffect(() => {
  if (selectedCategory && categories.length) {
    const category = categories.find(c => c._id === selectedCategory);
    if (category) {
      let subs = category.subAwards || [];

      // Nếu đã chọn năm học, giữ lại:
      //  • sub‑award gắn đúng schoolYear
      //  • HOẶC sub‑award không có schoolYear
      if (selectedYear) {
        subs = subs.filter(sa =>
          !sa.schoolYear || String(sa.schoolYear) === String(selectedYear)
        );
      }

      // Bổ sung _id tạm khi thiếu
      subs = subs.map(sa => ({
        ...sa,
        _id:
          sa._id ||
          `${sa.type}-${sa.label}-${sa.schoolYear || ""}-${sa.semester || ""}-${sa.month || ""}`,
      }));

      setAvailableSubAwards(subs);
    }
  } else {
    setAvailableSubAwards([]);
  }
}, [selectedCategory, selectedYear, categories]);

  useEffect(() => {
  if (categoryId) setSelectedCategory(categoryId);
}, [categoryId, categories]);

  // Khi thay đổi loại vinh danh con, tải (hoặc refetch) danh sách record
  const handleSubAwardChange = async (subAwardId) => {
    setSelectedSubAwardLocal(subAwardId);

    // Nếu bỏ chọn -> reset bảng
    if (!subAwardId) {
      setRecords([]);
      return;
    }

    // Xác định sub‑award đang chọn
    const selectedSubAward = availableSubAwards.find(
      (sa) => sa._id === subAwardId
    );
    if (!selectedSubAward) {
      setRecords([]);
      return;
    }

    // Hàm so khớp record với sub‑award
    const matchRecord = (rec) => {
      if (!rec || !rec.subAward) return false;
      return (
        rec.subAward.label === selectedSubAward.label &&
        rec.subAward.type === selectedSubAward.type &&
        String(rec.subAward.schoolYear || "") ===
          String(selectedSubAward.schoolYear || "") &&
        (rec.subAward.semester || 0) === (selectedSubAward.semester || 0) &&
        (rec.subAward.month || 0) === (selectedSubAward.month || 0)
      );
    };

    try {
      /* 1️⃣ Thử gọi API với bộ lọc chính xác */
      const params = {
        awardCategory: categoryId,
        subAwardType: selectedSubAward.type,
        subAwardLabel: selectedSubAward.label,
        subAwardSchoolYear: selectedSubAward.schoolYear,
      };
      if (selectedSubAward.semester != null)
        params.subAwardSemester = selectedSubAward.semester;
      if (selectedSubAward.month != null)
        params.subAwardMonth = selectedSubAward.month;

      let res = await axios.get(`${API_URL}/award-records`, { params });
      let fetched = res.data || [];

      /* 2️⃣ Nếu vẫn rỗng (có thể do backend chưa hỗ trợ full‑filter) 
            → fallback lấy toàn bộ trong category rồi lọc ở FE */
      if (fetched.length === 0) {
        const fallback = await axios.get(`${API_URL}/award-records`, {
          params: { awardCategory: categoryId },
        });
        fetched = (fallback.data || []).filter(matchRecord);
      }

      console.log(
        "Fetched records (after fallback if needed):",
        fetched.length
      );
      setRecords(fetched);
    } catch (error) {
      console.error("Error fetching records for sub‑award:", error);
      setRecords([]);
    }
  };

  const handleExcelUpload = async (e) => {
    // Kiểm tra điều kiện trước khi upload
    if (!categoryId) {
      alert("Vui lòng chọn loại vinh danh trước khi tải file");
      if (e.target) e.target.value = null;
      return;
    }

    // Lấy giá trị trực tiếp từ DOM thay vì dựa vào state
    const yearSelect = document.querySelector('select[name="schoolYear"]');
    const subAwardSelect = document.querySelector('select[name="subAward"]');

    if (
      !yearSelect ||
      !subAwardSelect ||
      !yearSelect.value ||
      !subAwardSelect.value
    ) {
      alert(
        "Vui lòng chọn đầy đủ Năm học và Loại vinh danh con trước khi tải file"
      );
      if (e.target) e.target.value = null;
      return;
    }

    const selectedYearValue = yearSelect.value;
    const selectedSubAwardValue = subAwardSelect.value;

    if (!selectedYearValue || !selectedSubAwardValue) {
      alert(
        "Vui lòng chọn đầy đủ Năm học và Loại vinh danh con trước khi tải file"
      );
      if (e.target) e.target.value = null;
      return;
    }

    // Tìm loại vinh danh con đã chọn
    const selectedSubAwardOption =
      subAwardSelect.options[subAwardSelect.selectedIndex];
    const subAwardLabel = selectedSubAwardOption
      ? selectedSubAwardOption.text
      : "";

    const file = e.target.files[0];
    if (!file) return;

    try {
      // Lấy danh sách học sinh hiện có trong subAward này
      const existingRecords = await axios.get(`${API_URL}/award-records`, {
        params: {
          awardCategory: categoryId,
          subAwardLabel: subAwardLabel,
          subAwardType: selectedSubAwardValue.split("-")[0],
          subAwardSchoolYear: selectedYearValue,
          subAwardSemester: selectedSubAwardValue.split("-")[3] || 0,
          subAwardMonth: selectedSubAwardValue.split("-")[4] || 0,
        },
      });

      const existingStudentIds = new Set();
      existingRecords.data.forEach((record) => {
        record.students?.forEach((student) => {
          if (student.student) {
            existingStudentIds.add(
              typeof student.student === "object"
                ? student.student._id
                : student.student
            );
          }
        });
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("awardCategory", categoryId);
      formData.append("subAwardId", selectedSubAwardValue);
      formData.append("schoolYear", selectedYearValue);
      formData.append("subAwardLabel", subAwardLabel);

      const response = await axios.post(
        `${API_URL}/award-records/upload-excel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.students) {
        const fileStudentIds = new Set(); // chống trùng ngay trong file
        const validStudents = [];

        response.data.students.forEach((stu) => {
          // Map row student code to actual ID
            let sid =
    typeof stu.student === "object" ? stu.student._id : stu.student;

  // Map StudentCode → ObjectId nếu còn ở dạng chuỗi
  if (typeof sid === "string" && !/^[0-9a-fA-F]{24}$/.test(sid)) {
    const found = studentsList.find(
      (s) =>
        s.studentCode.toLowerCase() === String(sid).toLowerCase() ||
        s._id === sid
    );
    if (found && found._id) {
      sid = found._id;
    } else {
      return; // bỏ qua nếu không map được
    }
  }

  // Bỏ qua trùng lặp ngay trong file
  if (fileStudentIds.has(sid)) return;
  fileStudentIds.add(sid);

  // Cần có Exam & Score
  if (!stu.exam || stu.score === undefined || stu.score === "") return;

  validStudents.push({
    student: sid,
    exam: stu.exam,
    score: stu.score,
  });
        });

        // Add category to each student
        const studentsWithCategory = validStudents.map((stu) => ({
          ...stu,
          awardCategory: categoryId,
        }));

        setExcelStudents(studentsWithCategory);
        setExcelRecordCount(studentsWithCategory.length);
        // Show preview
        setPreviewData({
          count: studentsWithCategory.length,
          totalInFile: response.data.students.length,
          duplicates:
            response.data.students.length - studentsWithCategory.length,
          type: "students",
        });
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Excel upload (students) error:", error.response || error);
      alert(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi tải file. Vui lòng thử lại!"
      );
      if (e.target) e.target.value = null;
      setShowPreview(false);
      setPreviewData(null);
    }
  };

  if (!visible) return null;

  if (!categories || categories.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="bg-white p-6 rounded-lg relative">
          <div className="text-red-500">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  // --- Local helpers ---
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (!value.trim()) {
      setFilteredStudents([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = studentsList.filter(
      (s) =>
        s.studentCode.toLowerCase().includes(value.toLowerCase()) ||
        s.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredStudents(filtered);
    setShowSuggestions(true);
  };

  const handleSelectStudent = (student) => {
    // Đảm bảo student có _id hợp lệ
    if (student && student._id) {
      // Kiểm tra nếu _id có định dạng đúng (24 ký tự hexa)
      if (
        typeof student._id === "string" &&
        /^[0-9a-fA-F]{24}$/.test(student._id)
      ) {
        setSelectedStudent(student);
        setSearchInput(student.studentCode);
        setFilteredStudents([]);
        setShowSuggestions(false);
      } else {
        console.error("Invalid student ID format:", student._id);
        alert(`ID học sinh không hợp lệ: ${student._id}`);
      }
    } else {
      console.error("Student object missing _id:", student);
      alert("Thông tin học sinh không hợp lệ");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div className="bg-white max-w-[90%] h-[90%] rounded-lg relative overflow-y-auto">
        <div className="bg-[#002855] py-4 px-10 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-medium text-white">
            Cập nhật học sinh vinh danh
          </h2>
          <button
            onClick={onClose}
            className="font-semibold bg-white hover:bg-white/20 transition-colors px-4 py-1 rounded-lg text-sm text-[#002855]"
          >
            Đóng
          </button>
        </div>

        <div className="h-full p-6">
          {/* Header Controls Section */}
          <div className="bg-white border-gray-200 p-6">
            <div className="flex justify-between items-center gap-6">
              {/* Select Boxes Group */}
              <div className="flex gap-4 flex-1">
                <div className="w-1/2">
                  <select
                    name="schoolYear"
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSelectedSubAwardLocal("");
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#002855] bg-white"
                  >
                    <option value="">Năm học</option>
                    {schoolYears.map((year) => (
                      <option key={year._id} value={year._id}>
                        {year.code || year.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-1/2">
                  <select
                    name="subAward"
                    value={selectedSubAwardLocal}
                    onChange={(e) => handleSubAwardChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#002855] bg-white"
                    disabled={availableSubAwards.length === 0}
                  >
                    <option value="">Loại vinh danh con</option>
                    {availableSubAwards.map((subAward) => (
                      <option key={subAward._id} value={subAward._id}>
                        {subAward.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons Group */}
              <div className="flex flex-wrap gap-3 justify-end">
                {/* File mẫu dropdown */}
                <div className="relative sample-menu-wrapper">
                  <button
                    onClick={() => setShowSampleMenu((p) => !p)}
                    className="inline-flex items-center px-4 py-2 bg-[#002855] text-white text-sm font-medium rounded-lg hover:bg-[#001f42] transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Tải file mẫu
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.75 7.5l4.25 4.25L14.25 7.5" />
                    </svg>
                  </button>

                  {showSampleMenu && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-20">
                      <button
                        onClick={() => handleDownloadSample("students")}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        File mẫu học sinh
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    className="hidden"
                    id="excel-students"
                  />
                  <label
                    htmlFor="excel-students"
                    className="inline-flex items-center px-4 py-2 bg-[#002855] text-white text-sm font-medium rounded-lg hover:bg-[#001f42] transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Thêm học sinh
                  </label>
                </div>

                {anyRecordChanged && (
                  <button
                    onClick={handleSaveAllChanges}
                    className="inline-flex items-center px-4 py-2 bg-[#009483] text-white text-sm font-medium rounded-lg hover:bg-[#007a6c] transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Cập nhật tất cả
                  </button>
                )}

                {records.length > 0 && (
                  <button
                    onClick={handleDeleteAllRecords}
                    className="inline-flex items-center px-4 py-2 bg-[#DC0909] text-white text-sm font-medium rounded-lg hover:bg-[#b30707] transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Xóa tất cả dữ liệu
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Rest of the content */}
          <div className="w-full pl-4 overflow-y-hidden hover:overflow-y-auto">
            <div className="mb-4">
              {showPreview && previewData && (
                <div className="flex items-center justify-end space-x-4">
                  <div className="bg-green-50 px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-medium text-green-700">
                      Trong file có {previewData.totalInFile} học sinh, có
                      thể thêm {previewData.count} học sinh mới
                      {previewData.duplicates > 0 && (
                        <> ({previewData.duplicates} trùng)</>
                      )}
                    </span>
                  </div>
                  {previewData.count > 0 && (
                    <button
                      onClick={handleRecordSubmit}
                      className="bg-[#009483] hover:bg-[#008577] text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
                    >
                      <span>Xác nhận thêm</span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                        {previewData.count} học sinh mới
                      </span>
                    </button>
                  )}
                </div>
              )}

              <div className="rounded-b">
                <table className="min-w-full min-h-full">
                  <thead>
                    <tr className="!border-px !border-gray-400">
                      <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500 uppercase">
                          Mã học sinh
                        </p>
                      </th>
                      <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-center">
                        <p className="text-sm font-bold text-gray-500 uppercase">
                          Bài thi
                        </p>
                      </th>
                      <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-center">
                        <p className="text-sm font-bold text-gray-500 uppercase">
                          Điểm số
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
                    <tr className="border-b">
                      <td className="py-3 pr-4">
                        <div className="relative">
                          <input
                            type="text"
                            value={searchInput}
                            onChange={handleSearchChange}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder="Nhập mã hoặc tên học sinh..."
                            className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md focus:z-10 focus:relative focus:scale-105 focus:border"
                          />
                          {showSuggestions &&
                            filteredStudents.length > 0 &&
                            !selectedStudent && (
                              <div
                                className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                                style={{ minWidth: 380 }}
                              >
                                {filteredStudents.map((student) => (
                                  <div
                                    key={student._id}
                                    className="px-5 py-3 hover:bg-gray-100 cursor-pointer whitespace-normal break-words text-base font-semibold"
                                    style={{ lineHeight: '1.5', wordBreak: 'break-word' }}
                                    onClick={() => handleSelectStudent(student)}
                                  >
                                    <div className="text-base font-bold">
                                      {student.studentCode ? student.studentCode : (student.name || 'Không rõ')} - {student.name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </td>

                      <td className="px-3 py-2 text-sm text-gray-900">
                        <input
                          type="text"
                          value={tempExam}
                          onChange={(e) => setTempExam(e.target.value)}
                          className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md"
                          placeholder="Nhập bài thi"
                          disabled={!selectedStudent}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <input
                          type="text"
                          value={tempScore}
                          onChange={(e) => setTempScore(e.target.value)}
                          className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full transition-all duration-200 focus:bg-white focus:shadow-md"
                          placeholder="Nhập điểm số"
                          disabled={!selectedStudent}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              let finalStudentId = null;
                              if (selectedStudent) {
                                if (
                                  typeof selectedStudent === "object" &&
                                  selectedStudent._id
                                ) {
                                  finalStudentId = selectedStudent._id;
                                } else {
                                  finalStudentId = selectedStudent;
                                }
                              }

                              if (!finalStudentId) {
                                alert("Vui lòng chọn học sinh");
                                return;
                              }

                              const existingIds = new Set(
                                records.flatMap((rec) =>
                                  (rec.students || []).map((stu) =>
                                    typeof stu.student === "object"
                                      ? stu.student._id
                                      : stu.student
                                  )
                                )
                              );
                              if (existingIds.has(finalStudentId)) {
                                alert(
                                  "Học sinh này đã được thêm rồi trong loại vinh danh này."
                                );
                                return;
                              }

                              handleAddNewRecord({
                                selectedStudent: {
                                  _id: finalStudentId,
                                  studentCode: selectedStudent.studentCode,
                                  name: selectedStudent.name,
                                },
                                tempExam,
                                tempScore,
                                selectedCategory,
                                selectedSubAwardLocal,
                                availableSubAwards,
                              });
                              
                              setSelectedStudent(null);
                              setSearchInput("");
                              setTempExam("");
                              setTempScore("");
                            }}
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
                                setTempExam("");
                                setTempScore("");
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
                    {records.map((record, index) => (
                      <React.Fragment key={record._id}>
                        {record.students?.map((student, studentIndex) => (
                          <tr key={`student-${studentIndex}`}>
                            <td className="py-3 pr-4">
                              <input
                                type="text"
                                value={
                                  typeof student.student === "object"
                                    ? (student.student.studentCode || student.student.name || 'Không rõ')
                                    : student.student
                                }
                                readOnly
                                className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={student.exam || ""}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setRecords((prevRecords) =>
                                      prevRecords.map((rec, idx) => {
                                        if (idx !== index) return rec;
                                        const updatedStudents =
                                          rec.students.map((stu, sIdx) => {
                                            if (sIdx !== studentIndex) return stu;
                                            return { ...stu, exam: newValue };
                                          });
                                        return {
                                          ...rec,
                                          isChanged: true,
                                          students: updatedStudents,
                                        };
                                      })
                                    );
                                  }}
                                  className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={student.score || ""}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setRecords((prevRecords) =>
                                      prevRecords.map((rec, idx) => {
                                        if (idx !== index) return rec;
                                        const updatedStudents =
                                          rec.students.map((stu, sIdx) => {
                                            if (sIdx !== studentIndex) return stu;
                                            return { ...stu, score: newValue };
                                          });
                                        return {
                                          ...rec,
                                          isChanged: true,
                                          students: updatedStudents,
                                        };
                                      })
                                    );
                                  }}
                                  className="border-none rounded-lg bg-gray-100 text-sm font-bold text-navy-700 w-full"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="flex space-x-2">
                                <button
                                  onClick={async () => {
                                    if (
                                      !window.confirm(
                                        "Bạn có chắc muốn xóa record này?"
                                      )
                                    )
                                      return;
                                    try {
                                      await axios.delete(
                                        `${API_URL}/award-records/${record._id}`
                                      );
                                      setRecords((prev) =>
                                        prev.filter((_, fIdx) => fIdx !== index)
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
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordModal;
