// src/components/halloffame/HallOfFameAdminPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../core/config";
import * as XLSX from "xlsx";
import CategoryModal from "./Modal/CategoryModal";
import RecordModal from "./Modal/RecordModal";
import Record2Modal from "./Modal/Record2Modal";

function HallOfFameAdminPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [showCreateModal, setShowCreateModal] = useState(false); 
  const [newCategoryName, setNewCategoryName] = useState(""); 
  const [newCategoryNameEng, setNewCategoryNameEng] = useState(""); 
  const [selectedSubAwardSchoolYear, setSelectedSubAwardSchoolYear] =
    useState("");
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
    customWithDescription: false,
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
  const [newCustomSubAwardDescription, setNewCustomSubAwardDescription] = useState("");
  const [newCustomSubAwardDescriptionEng, setNewCustomSubAwardDescriptionEng] = useState("");

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

  // Danh sách lớp
  const [classesList, setClassesList] = useState([]);

  const [selectedSubAward, setSelectedSubAward] = useState(null);
  const [selectedSubAwardRecords, setSelectedSubAwardRecords] = useState([]);

  // Thêm các state mới
  const [searchInput, setSearchInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showRecordModal2, setShowRecordModal2] = useState(false);
  const [selectedCategoryForRecord, setSelectedCategoryForRecord] = useState(null);

  // Thêm hàm xử lý tìm kiếm

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
    if (
      selectedSubAward &&
      editingCategory &&
      (studentsList.length > 0 || classesList.length > 0)
    ) {
      console.log("Students or Classes list updated, refreshing records...");
      fetchRecordsBySubAward(selectedSubAward);
    }
  }, [studentsList, classesList]);

  // Thêm useEffect mới để theo dõi selectedCategoryForRecord
  useEffect(() => {
    if (selectedCategoryForRecord) {
      console.log("Selected category for record:", selectedCategoryForRecord);
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

    const computedSubAwards = [];

    // Gom cả custom và custom_with_description
    if (customSubAwards.length > 0) {
      computedSubAwards.push(
        ...customSubAwards.filter(
          sub => sub.type === "custom" || sub.type === "custom_with_description"
        )
      );
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
    const hasCustomWithDescSubAwards = cat.subAwards.some(
      (sub) => sub.type === "custom_with_description"
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
      customWithDescription: hasCustomWithDescSubAwards,
      schoolYear: hasSchoolYearSubAwards,
    });

    // Lưu danh sách Custom SubAwards (bao gồm cả custom và custom_with_description)
    const existingCustomSubs = cat.subAwards
      .filter((sub) => sub.type === "custom" || sub.type === "custom_with_description")
      .map((sub, idx) => ({
        ...sub,
        priority: sub.priority != null && sub.priority > 0 ? sub.priority : idx + 1,
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
  // ----------------- STUDENT TABLE (Trong Record Form) -----------------

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
      const processedRecords = (res.data || [])
        .map((record) => {
          if (!record) return null;

          try {
            // Populate thông tin học sinh
            const populatedStudents = (record.students || [])
              .map((student) => {
                if (!student || !student.student) return null;
                const foundStudent = studentsList.find(
                  (s) =>
                    s._id ===
                    (typeof student.student === "object"
                      ? student.student._id
                      : student.student)
                );
                return {
                  ...student,
                  student: foundStudent || student.student,
                  keyword: Array.isArray(student.keyword)
                    ? student.keyword
                    : [],
                  keywordEng: Array.isArray(student.keywordEng)
                    ? student.keywordEng
                    : [],
                  activity: Array.isArray(student.activity)
                    ? student.activity
                    : [],
                  activityEng: Array.isArray(student.activityEng)
                    ? student.activityEng
                    : [],
                };
              })
              .filter(Boolean);

            // Populate thông tin lớp
            const populatedClasses = (record.awardClasses || [])
              .map((awardClass) => {
                if (!awardClass || !awardClass.class) return null;
                return {
                  ...awardClass,
                  class:
                    classesList.find(
                      (c) =>
                        c._id ===
                        (typeof awardClass.class === "object"
                          ? awardClass.class._id
                          : awardClass.class)
                    ) || awardClass.class,
                };
              })
              .filter(Boolean);

            return {
              ...record,
              students: populatedStudents,
              awardClasses: populatedClasses,
              awardCategory: {
                _id: editingCategory,
                ...(record.awardCategory || {}),
              },
            };
          } catch (err) {
            console.error("Error processing record:", err, record);
            return null;
          }
        })
        .filter(Boolean);

      // Lọc records theo điều kiện chính xác
      const filteredRecords = processedRecords.filter((record) => {
        if (!record || !record.awardCategory || !record.subAward) return false;

        const match =
          record.awardCategory._id === editingCategory &&
          record.subAward.label === subAward.label &&
          record.subAward.type === subAward.type &&
          String(record.subAward.schoolYear || "") ===
            String(subAward.schoolYear || "") &&
          (record.subAward.semester || 0) === (subAward.semester || 0) &&
          (record.subAward.month || 0) === (subAward.month || 0);

        console.log("Record match check:", {
          recordId: record._id,
          match,
          conditions: {
            categoryMatch: record.awardCategory._id === editingCategory,
            labelMatch: record.subAward.label === subAward.label,
            typeMatch: record.subAward.type === subAward.type,
            yearMatch:
              String(record.subAward.schoolYear || "") ===
              String(subAward.schoolYear || ""),
            semesterMatch:
              (record.subAward.semester || 0) === (subAward.semester || 0),
            monthMatch: (record.subAward.month || 0) === (subAward.month || 0),
          },
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

  // Thêm hàm xử lý khi ấn nút thêm mới

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
        // Gọi API mới xoá sub‑award + mọi record liên quan
        await axios.delete(
          `${API_URL}/award-categories/${editingCategory}/sub-awards`,
          {
            params: {
              label: subAwardToDelete.label,
              schoolYear: subAwardToDelete.schoolYear || "",
            },
          }
        );

        // Refresh lại danh sách
        await fetchCategories();
        await fetchRecords();
      }

      alert("Xóa sub-award thành công!");
      // Thông báo cho các component khác refetch dữ liệu
      window.dispatchEvent(new Event("hallOfFameDataUpdated"));
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
    setSelectedSubAward(null);
    setSelectedSubAwardRecords([]);
    setSearchInput("");
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
                          // Kiểm tra loại subAward
                          const hasCustomWithDesc = (cat.subAwards || []).some(
                            (sub) => sub.type === "custom_with_description"
                          );
                          if (hasCustomWithDesc) {
                            setShowRecordModal2(true);
                          } else {
                            setShowRecordModal(true);
                          }
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
        newCustomSubAwardDescription={newCustomSubAwardDescription}
        setNewCustomSubAwardDescription={setNewCustomSubAwardDescription}
        newCustomSubAwardDescriptionEng={newCustomSubAwardDescriptionEng}
        setNewCustomSubAwardDescriptionEng={setNewCustomSubAwardDescriptionEng}
      />

      {showRecordModal && (
        <RecordModal
          visible={showRecordModal}
          onClose={() => setShowRecordModal(false)}
          categoryId={selectedCategoryForRecord?._id}
        />
      )}
      {showRecordModal2 && (
        <Record2Modal
          visible={showRecordModal2}
          onClose={() => setShowRecordModal2(false)}
          categoryId={selectedCategoryForRecord?._id}
        />
      )}
    </div>
  );
}

export default HallOfFameAdminPage;
