// src/components/halloffame/HallOfFameAdminPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../config";
import * as XLSX from "xlsx";

function HallOfFameAdminPage() {
  const [activeTab, setActiveTab] = useState("categories");

  // --- Award Category State ---
  const [categories, setCategories] = useState([]);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    coverImage: "",
    baseAcademicYear: "",
    subAwards: [],
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // State cho kiểu tạo subAward
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

  // --- Award Record State ---
  const [records, setRecords] = useState([]);
  const [recordFormData, setRecordFormData] = useState({
    awardCategory: "",
    awardClass: [], // Trường mới cho lớp học
    subAward: {},
    students: [], // [{ student: "", note: "" }]
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

  // ----------------- USEEFFECT -----------------
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
      setSchoolYears(res.data || []);
    } catch (error) {
      console.error("Error fetching school years:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`);
      setStudentsList(res.data || []);
      console.log(res.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudentsList([]);
    }
  };

  // Hàm fetch classes
  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API_URL}/classes`);
      setClassesList(res.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClassesList([]);
    }
  };

  // ----------------- CATEGORY UPLOAD -----------------
  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(
        `${API_URL}/award-categories/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setCategoryFormData({
        ...categoryFormData,
        coverImage: res.data.filePath,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // ----------------- SUBMIT CATEGORY -----------------
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
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
        await axios.post(`${API_URL}/award-categories`, dataToSend);
        alert("Tạo mới loại vinh danh thành công!");
      }
      // Reset
      setCategoryFormData({
        name: "",
        description: "",
        coverImage: "",
        baseAcademicYear: "",
        subAwards: [],
      });
      setSubAwardMode({ custom: false, schoolYear: false });
      setCustomSubAwards([]);
      setSelectedSchoolYears([]);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error("Error in category submit:", error);
    }
  };

  const handleCategoryEdit = (cat) => {
    setEditingCategory(cat._id);

    // Xác định các loại Sub Awards có trong category
    const hasCustomSubAwards = cat.subAwards.some(
      (sub) => sub.type === "custom"
    );
    const hasSchoolYearSubAwards = cat.subAwards.some(
      (sub) =>
        sub.type === "year" || sub.type === "semester" || sub.type === "month"
    );

    setCategoryFormData({
      name: cat.name,
      description: cat.description,
      coverImage: cat.coverImage,
      baseAcademicYear: cat.baseAcademicYear || "",
      subAwards: cat.subAwards || [], // Lưu Sub Awards để hiển thị đúng
    });

    // Cập nhật trạng thái của checkbox Sub Awards
    setSubAwardMode({
      custom: hasCustomSubAwards,
      schoolYear: hasSchoolYearSubAwards,
    });

    // Lưu danh sách Custom SubAwards riêng biệt
    const existingCustomSubs = cat.subAwards.filter(
      (sub) => sub.type === "custom"
    );
    setCustomSubAwards(existingCustomSubs);

    // Lưu danh sách School Years nếu có
    const existingSchoolYears = [
      ...new Set(
        cat.subAwards
          .filter((sub) => sub.schoolYear)
          .map((sub) => sub.schoolYear)
      ),
    ];
    setSelectedSchoolYears(existingSchoolYears);
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

  // ----------------- BULK STUDENTS -----------------
  // Hàm xử lý khi người dùng upload file Excel
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const binaryStr = evt.target.result;
      // Đọc file Excel
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rows.length < 2) {
        alert("File Excel không có dữ liệu hợp lệ.");
        return;
      }

      // rows[0] = header => Bắt đầu từ i=1
      const newStudents = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const code = row[0] ? row[0].toString().trim() : "";
        const note = row[1] ? row[1].toString().trim() : "";
        const noteEng = row[2] ? row[2].toString().trim() : "";

        if (!code) continue; // Bỏ qua dòng trống

        // Tìm student
        const foundStudent = studentsList.find(
          (s) => s.studentCode.toLowerCase() === code.toLowerCase()
        );
        if (!foundStudent) {
          console.warn(`Không tìm thấy sinh viên có mã: ${code}`);
          continue;
        }

        newStudents.push({ student: foundStudent._id, note, noteEng });
      }

      // Lưu vào state, hiển thị số lượng
      setExcelStudents(newStudents);
      setExcelRecordCount(newStudents.length);
    };

    reader.readAsBinaryString(file);
  };
  // ----------------- RECORD FORM -----------------
  // Khi chọn AwardCategory
  const handleAwardCategoryChange = (e) => {
    setRecordFormData({
      ...recordFormData,
      awardCategory: e.target.value,
      subAward: {},
      subAwardSelectedIndex: -1,
    });
  };

  // Khi user chọn 1 option subAward
  const handleRecordSubAwardChange = (indexString) => {
    const idx = parseInt(indexString, 10);

    // Sử dụng dạng callback để luôn lấy "prev" state mới nhất
    setRecordFormData((prev) => {
      const selectedCategory = categories.find(
        (cat) => cat._id === prev.awardCategory
      );

      let newSubAward = {};

      // Nếu idx hợp lệ => gán subAward
      if (
        selectedCategory &&
        selectedCategory.subAwards &&
        idx >= 0 &&
        idx < selectedCategory.subAwards.length
      ) {
        newSubAward = selectedCategory.subAwards[idx];
      }

      // Kiểm tra subAward có `type` hay không (để debug)
      if (!newSubAward.type) {
        console.warn("SubAward thiếu type => AwardRecord có thể bị lỗi!");
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

    // Gộp học sinh lẻ + Excel
    const finalStudents = [...recordFormData.students, ...excelStudents];

    // Parse lớp
    const classNames = classInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    // Tìm _id cho các lớp
    const matchedClassIds = [];
    for (let cname of classNames) {
      const foundCls = classesList.find((cl) => cl.className === cname);
      if (foundCls) {
        matchedClassIds.push(foundCls._id);
      } else {
        console.warn(`Không tìm thấy lớp: ${cname}`);
      }
    }

    if (finalStudents.length === 0 && matchedClassIds.length === 0) {
      alert("Vui lòng thêm ít nhất 1 học sinh hoặc 1 lớp");
      return;
    }

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

    const dataToSend = {
      ...recordFormData,
      awardClasses: matchedClassIds, // mảng _id lớp
      students: finalStudents, // mảng học sinh
    };

    // Xoá field subAwardSelectedIndex cho gọn
    delete dataToSend.subAwardSelectedIndex;

    try {
      if (!editingRecord) {
        await axios.post(`${API_URL}/award-records`, dataToSend);
        alert("Tạo mới record thành công!");
      } else {
        // updateRecord
        await axios.put(
          `${API_URL}/award-records/${editingRecord}`,
          dataToSend
        );
        alert("Cập nhật record thành công!");
      }

      // Reset form
      setRecordFormData({
        awardCategory: "",
        subAward: {},
        students: [],
        subAwardSelectedIndex: -1,
        reason: "",
      });
      setExcelStudents([]);
      setExcelRecordCount(0);
      setClassInput("");
      setEditingRecord(null);
      fetchRecords();
    } catch (error) {
      console.error("Error in record submit:", error);
    }
  };

  const handleRecordEdit = (record) => {
    setEditingRecord(record._id);

    // Tìm category
    const selectedCategory = categories.find(
      (cat) => cat._id === record.awardCategory?._id
    );
    let foundIndex = -1;

    // Tìm index subAward khớp
    if (selectedCategory && selectedCategory.subAwards) {
      foundIndex = selectedCategory.subAwards.findIndex((sa) => {
        // So sánh cứng: type, label, schoolYear, semester, month...
        // Hoặc so sánh "JSON.stringify"
        // Ở đây minh hoạ:
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
      awardCategory: record.awardCategory?._id || "",
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

  // ----------------- STUDENT TABLE -----------------
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
  // ----------------- RENDER -----------------
  return (
    <div className="p-6">
      <div className="mb-4 space-x-4">
        <button
          onClick={() => setActiveTab("categories")}
          disabled={activeTab === "categories"}
          className={`px-4 py-2 rounded ${
            activeTab === "categories"
              ? "bg-gray-400"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Quản lý Loại Vinh Danh
        </button>
        <button
          onClick={() => setActiveTab("records")}
          disabled={activeTab === "records"}
          className={`px-4 py-2 rounded ${
            activeTab === "records"
              ? "bg-gray-400"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Quản lý Ghi nhận Vinh Danh
        </button>
      </div>

      {activeTab === "categories" && (
        <div className="w-full rounded-2xl bg-white p-5 shadow-md mt-4">
          <div className="w-full flex items-center justify-between">
            <h1 className="text-2xl font-bold mb-4">Quản lý Hall of Fame</h1>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryFormData({
                  name: "",
                  description: "",
                  coverImage: "",
                  baseAcademicYear: "",
                  subAwards: [],
                });
                setSubAwardMode({ custom: false, schoolYear: false });
                setCustomSubAwards([]);
                setSelectedSchoolYears([]);
                setNewCustomSubAward("");
                setNewCustomSubAwardSchoolYear("");
                setShowCategoryModal(true);
              }}
              className="bg-[#002855] hover:bg-[#0d1d2f] text-white text-sm font-semibold px-3 py-1 rounded-lg mr-2"
            >
              Tạo mới
            </button>
          </div>
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
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">MÔ TẢ</p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">ẢNH</p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">SUB AWARD</p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">HÀNH ĐỘNG</p>
                </th>
              </tr>
            </thead>
            <tbody>
              {(categories || []).map((cat) => (
                <tr key={cat._id} className="border-b border-gray-200">
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">{cat._id}</p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">
                      {cat.name}
                    </p>
                  </td>
                  <td className="max-w-[1000px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700 line-clamp-2">
                      {cat.description}
                    </p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">
                      {cat.coverImage && (
                        <img
                          src={`${BASE_URL}/${cat.coverImage}`}
                          alt="Cover"
                          className="h-12 object-cover"
                        />
                      )}
                    </p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700 line-clamp-2">
                      {cat.subAwards && cat.subAwards.length > 0
                        ? cat.subAwards.map((sub, i) => (
                            <span key={i}>
                              {sub.type[0].toUpperCase()}:{sub.label}
                              {i < cat.subAwards.length - 1 && ", "}
                            </span>
                          ))
                        : "N/A"}
                    </p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <div className="text-sm font-semibold text-navy-700 space-x-2">
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-lg"
                        onClick={() => {
                          handleCategoryEdit(cat);
                          setShowCategoryModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg"
                        onClick={() => handleCategoryDelete(cat._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "records" && (
        <div className="border p-4">
          <h2 className="text-xl font-semibold mb-2">
            {editingRecord ? "Cập nhật Record" : "Tạo mới Record"}
          </h2>
          <form onSubmit={handleRecordSubmit} className="space-y-4">
            <div>
              <label className="block font-medium">Award Category:</label>
              <select
                className="border rounded p-1 w-full"
                value={recordFormData.awardCategory}
                onChange={handleAwardCategoryChange}
              >
                <option value="">--Chọn--</option>
                {(categories || []).map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {recordFormData.awardCategory && (
              <div>
                <label className="block font-medium">Chọn Sub Award:</label>
                {(() => {
                  // Tính selectedCategory trong scope này
                  const selectedCategory = categories.find(
                    (cat) => cat._id === recordFormData.awardCategory
                  );
                  return (
                    <select
                      className="border rounded p-1 w-full"
                      value={
                        recordFormData.subAwardSelectedIndex < 0
                          ? ""
                          : recordFormData.subAwardSelectedIndex
                      }
                      onChange={(e) =>
                        handleRecordSubAwardChange(e.target.value)
                      }
                    >
                      <option value="">--Chọn Sub Award--</option>
                      {selectedCategory?.subAwards?.map((sa, index) => (
                        <option key={index} value={index}>
                          {sa.label} ...
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>
            )}
            <div>
              <h4 className="font-medium mb-1">Danh sách học sinh</h4>
              <div>
                <label className="block mb-1 font-medium">
                  Upload file Excel (chỉ có Mã SV và Ghi chú):
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelUpload}
                  className="border rounded p-1 mb-2"
                />
                {excelRecordCount > 0 && (
                  <div className="text-sm text-green-600">
                    Số lượng record từ Excel: {excelRecordCount}
                  </div>
                )}
              </div>
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1">Sinh viên</th>
                    <th className="border px-2 py-1">Ghi chú</th>
                    <th className="border px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recordFormData.students.map((stu, index) => (
                    <tr key={index}>
                      <td className="border px-2 py-1">
                        <select
                          className="border rounded p-1 w-full"
                          value={stu.student}
                          onChange={(e) =>
                            handleStudentChange(
                              index,
                              "student",
                              e.target.value
                            )
                          }
                        >
                          <option value="">--Chọn sinh viên--</option>
                          {(studentsList || []).map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.studentCode} - {s.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          className="border rounded p-1 w-full"
                          type="text"
                          placeholder="Nhập ghi chú..."
                          value={stu.note}
                          onChange={(e) =>
                            handleStudentChange(index, "note", e.target.value)
                          }
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <button
                          type="button"
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                          onClick={() => handleRemoveStudent(index)}
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mt-2"
                onClick={handleAddStudent}
              >
                Thêm Học Sinh
              </button>
            </div>
            {/* Chọn Lớp (nếu vinh danh lớp) */}
            <div>
              <label className="block font-medium">
                Nhập tên lớp (có thể nhập nhiều, ngăn cách bởi dấu phẩy):
              </label>
              <input
                type="text"
                className="border rounded p-1 w-full"
                value={classInput}
                onChange={(e) => setClassInput(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Ví dụ: <em>1A1, 1A2, 2B1</em>
              </p>
            </div>

            <div>
              <label className="block font-medium">
                Reason (ghi chú tổng):
              </label>
              <input
                className="border rounded p-1 w-full"
                type="text"
                value={recordFormData.reason}
                onChange={(e) =>
                  setRecordFormData({
                    ...recordFormData,
                    reason: e.target.value,
                  })
                }
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              {editingRecord ? "Cập nhật" : "Tạo mới"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "records" && (
        <div className="mt-4">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">Sinh viên</th>
                <th className="border px-2 py-1">Lớp</th> {/* Cột mới */}
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
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                      onClick={() => handleRecordEdit(r)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                      onClick={() => handleRecordDelete(r._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showCategoryModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="bg-white p-6 rounded shadow-lg w-1/2 relative">
            <button
              onClick={() => setShowCategoryModal(false)}
              className="absolute top-2 right-2 text-xl"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-2">
              {editingCategory
                ? "Cập nhật Loại Vinh Danh"
                : "Tạo mới Loại Vinh Danh"}
            </h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block font-medium">Tên Loại:</label>
                <input
                  className="border rounded w-full p-2"
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block font-medium">Mô tả:</label>
                <textarea
                  className="border rounded w-full p-2"
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block font-medium">Ảnh Bìa:</label>
                <input
                  type="file"
                  onChange={handleCoverImageChange}
                  className="mb-2"
                />
                {categoryFormData.coverImage && (
                  <div>
                    <img
                      src={`${BASE_URL}/${categoryFormData.coverImage}`}
                      alt="Cover"
                      className="h-20 object-cover"
                    />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-1">Chọn kiểu Sub Award:</h4>
                <label className="inline-flex items-center space-x-2 mr-4">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={subAwardMode.custom}
                    onChange={(e) =>
                      setSubAwardMode({
                        ...subAwardMode,
                        custom: e.target.checked,
                      })
                    }
                  />
                  <span>Tuỳ chọn</span>
                </label>
                <label className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={subAwardMode.schoolYear}
                    onChange={(e) =>
                      setSubAwardMode({
                        ...subAwardMode,
                        schoolYear: e.target.checked,
                      })
                    }
                  />
                  <span>Năm học</span>
                </label>
              </div>
              {/* Sub Award: Custom */}
              {subAwardMode.custom && (
                <div className="border p-3 rounded">
                  <label className="block font-medium mb-2">
                    Thêm Sub Awards tùy chỉnh:
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      className="border rounded p-1"
                      value={newCustomSubAward}
                      onChange={(e) => setNewCustomSubAward(e.target.value)}
                      placeholder="Nhập label subAward..."
                    />
                    <select
                      className="border rounded p-1"
                      value={newCustomSubAwardSchoolYear}
                      onChange={(e) =>
                        setNewCustomSubAwardSchoolYear(e.target.value)
                      }
                    >
                      <option value="">--Chọn School Year--</option>
                      {(schoolYears || []).map((sy) => (
                        <option key={sy._id} value={sy._id}>
                          {sy.code || sy.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                      onClick={() => {
                        if (
                          newCustomSubAward.trim() !== "" &&
                          newCustomSubAwardSchoolYear !== ""
                        ) {
                          setCustomSubAwards([
                            ...customSubAwards,
                            {
                              type: "custom",
                              label: newCustomSubAward,
                              schoolYear: newCustomSubAwardSchoolYear,
                              awardCount: 0,
                            },
                          ]);
                          setNewCustomSubAward("");
                          setNewCustomSubAwardSchoolYear("");
                        } else {
                          alert(
                            "Vui lòng nhập label và chọn School Year cho subAward."
                          );
                        }
                      }}
                    >
                      Thêm
                    </button>
                  </div>
                  <ul className="list-disc pl-5">
                    {customSubAwards.map((sub, index) => (
                      <li key={index} className="mb-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            className="border rounded p-1 w-48"
                            value={sub.label}
                            onChange={(e) => {
                              const updated = [...customSubAwards];
                              updated[index].label = e.target.value;
                              setCustomSubAwards(updated);
                            }}
                          />
                          <select
                            className="border rounded p-1"
                            value={sub.schoolYear}
                            onChange={(e) => {
                              const updated = [...customSubAwards];
                              updated[index].schoolYear = e.target.value;
                              setCustomSubAwards(updated);
                            }}
                          >
                            <option value="">--Chọn--</option>
                            {(schoolYears || []).map((sy) => (
                              <option key={sy._id} value={sy._id}>
                                {sy.code || sy.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                            onClick={() =>
                              setCustomSubAwards(
                                customSubAwards.filter((_, i) => i !== index)
                              )
                            }
                          >
                            Xoá
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Sub Award: SchoolYear */}
              {subAwardMode.schoolYear && (
                <div className="border p-3 rounded">
                  <label className="block font-medium mb-2">
                    Chọn School Year:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {schoolYears.map((sy) => (
                      <label
                        key={sy._id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-blue-600"
                          value={sy._id}
                          checked={selectedSchoolYears.includes(sy._id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedSchoolYears((prev) =>
                              checked
                                ? [...prev, sy._id]
                                : prev.filter((id) => id !== sy._id)
                            );
                          }}
                        />
                        <span>{sy.code || sy.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {editingCategory ? "Cập nhật" : "Tạo mới"}
              </button>{" "}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HallOfFameAdminPage;
