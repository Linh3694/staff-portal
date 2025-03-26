import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../../config";
import { toast } from "react-toastify";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { FaUserXmark, FaUserPlus } from "react-icons/fa6";

const StudentClass = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // Form lớp (chứa danh sách nhiều GVCN)
  const [formData, setFormData] = useState({
    className: "",
    schoolYear: "",
    homeroomTeachers: [],
  });

  const [schoolYears, setSchoolYears] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSchoolYearFilter, setSelectedSchoolYearFilter] = useState("");
  const [classExcelFile, setClassExcelFile] = useState(null);
  const fileInputRef = useRef(null);
  const [classZipUploadResult, setClassZipUploadResult] = useState("");
  const [uploadingZip, setUploadingZip] = useState(false);
  const [classPhotos, setClassPhotos] = useState({});

  // Quản lý gợi ý giáo viên
  const [teacherQuery, setTeacherQuery] = useState("");
  const [teacherSuggestions, setTeacherSuggestions] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);

  // Dữ liệu ảnh học sinh
  const [photos, setPhotos] = useState([]);

  // Quản lý enroll modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedClassForEnroll, setSelectedClassForEnroll] = useState(null);

  // Modal “Thêm học sinh” vào lớp
  const [showEnrollStudentModal, setShowEnrollStudentModal] = useState(false);
  const [enrollStudentInput, setEnrollStudentInput] = useState("");
  const [enrollStudentSuggestions, setEnrollStudentSuggestions] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const initialFormData = {
    className: "",
    schoolYear: "",
    homeroomTeachers: [],
  };

  // -----------------------------------
  // FETCH DATA
  // -----------------------------------
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/classes`);
      const data = await res.json();
      setClasses(data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu lớp!");
    }
    setLoading(false);
  };

  const fetchClassPhotos = async () => {
    try {
      const res = await fetch(`${API_URL}/photos`);
      if (!res.ok) throw new Error("Failed to get class photos");
      const data = await res.json();
      const classPhotosMap = {};
      data.forEach((photo) => {
        if (photo.class) {
          classPhotosMap[photo.class._id] = photo.photoUrl;
        }
      });
      setClassPhotos(classPhotosMap);
    } catch (error) {
      console.error("Lỗi khi tải ảnh lớp:", error);
    }
  };

  const fetchSchoolYears = async () => {
    try {
      const res = await fetch(`${API_URL}/schoolyears`);
      const data = await res.json();
      setSchoolYears(data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu năm học!");
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();
      setAllTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const res = await fetch(`${API_URL}/enrollments`);
      if (!res.ok) throw new Error("Failed to get enrollments");
      const data = await res.json();
      setEnrollments(data);
    } catch (error) {
      toast.error("Lỗi tải enrollment!");
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/students`);
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu học sinh!");
    }
    setLoading(false);
  };

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`${API_URL}/photos`);
      if (!res.ok) throw new Error("Failed to get photos");
      const data = await res.json();
      setPhotos(data);
    } catch (error) {
      toast.error("Lỗi tải ảnh học sinh!");
    }
  };

  // -----------------------------------
  // USE EFFECT
  // -----------------------------------
  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchSchoolYears();
    fetchClassPhotos();
    fetchTeachers();
    fetchEnrollments();
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (schoolYears.length > 0) {
      // Tự động chọn năm học hiện tại nếu có
      const today = new Date();
      const currentSY = schoolYears.find((sy) => {
        const startDate = new Date(sy.startDate);
        const endDate = new Date(sy.endDate);
        return startDate <= today && today <= endDate;
      });
      if (currentSY) {
        setSelectedSchoolYearFilter(currentSY._id);
      } else {
        // Nếu không tìm thấy, chọn năm học đầu tiên
        setSelectedSchoolYearFilter(schoolYears[0]._id);
      }
    }
  }, [schoolYears]);

  // -----------------------------------
  // RESET FORM
  // -----------------------------------
  const resetForm = () => {
    setFormData(initialFormData);
    setTeacherQuery("");
    setTeacherSuggestions([]);
  };

  // -----------------------------------
  // CRUD CLASS
  // -----------------------------------
  const handleCreate = async () => {
    try {
      const res = await fetch(`${API_URL}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Tạo Lớp thành công!");
      setShowCreateModal(false);
      resetForm();
      fetchClasses();
    } catch (error) {
      toast.error("Lỗi khi tạo Lớp");
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API_URL}/classes/${selectedClass._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update class");
      toast.success("Cập nhật Lớp thành công!");
      setShowEditModal(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (error) {
      toast.error("Lỗi cập nhật Lớp!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Chắc chắn xoá?")) return;
    try {
      const res = await fetch(`${API_URL}/classes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete class");
      toast.success("Đã xoá Lớp!");
      fetchClasses();
    } catch (error) {
      toast.error("Lỗi xoá Lớp!");
    }
  };

  // -----------------------------------
  // ENROLL EXCEL / UPLOAD
  // -----------------------------------
  const handleClassExcelUpload = async () => {
    if (!classExcelFile) {
      toast.warning("Bạn chưa chọn file Excel!");
      return;
    }
    try {
      const formD = new FormData();
      formD.append("excelFile", classExcelFile);
      const res = await fetch(`${API_URL}/classes/bulk`, {
        method: "POST",
        body: formD,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Upload Excel lớp thành công!");
      setClassExcelFile(null);
      fetchClasses();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi upload Excel lớp!");
    }
  };

  const handleBulkClassPhotoZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingZip(true); // Bật loading
      const formDataZip = new FormData();
      formDataZip.append("file", file);
      const res = await axios.post(
        `${API_URL}/photos/bulk-upload-class`,
        formDataZip,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setClassZipUploadResult(
        `Upload thành công! Đã xử lý: ${res.data.total || 0} file.`
      );
      await fetchClassPhotos();
    } catch (error) {
      console.error("Error uploading class photos:", error);
      setClassZipUploadResult("Upload thất bại! " + error.message);
    } finally {
      setUploadingZip(false); // Tắt loading
    }
  };

  // -----------------------------------
  // EDITING CLASS
  // -----------------------------------
  const openEditModal = (cls) => {
    setSelectedClass(cls);
    setFormData({
      className: cls.className,
      schoolYear: cls.schoolYear?._id || cls.schoolYear,
      homeroomTeachers: Array.isArray(cls.homeroomTeachers)
        ? cls.homeroomTeachers.map((t) => t._id)
        : [],
    });
    setTeacherQuery("");
    setTeacherSuggestions([]);
    setShowEditModal(true);
  };

  // -----------------------------------
  // ENROLL STUDENT (THÊM / XOÁ)
  // -----------------------------------
  const handleRemoveEnrollment = async (enrollmentId) => {
    if (!window.confirm("Bạn có chắc muốn xoá học sinh khỏi lớp không?"))
      return;
    try {
      const res = await fetch(`${API_URL}/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove enrollment");
      toast.success("Đã xoá học sinh khỏi lớp!");
      // Cập nhật lại danh sách enrollment
      fetchEnrollments();
    } catch (error) {
      toast.error("Lỗi xoá học sinh khỏi lớp!");
    }
  };

  const handleOpenEnrollModal = (cls) => {
    setSelectedClassForEnroll(cls);
    setShowEnrollModal(true);
  };

  // -----------------------------------
  // “Thêm học sinh” Modal (sử dụng suggestions)
  // -----------------------------------
  const handleEnrollStudent = async () => {
    if (!selectedClassForEnroll) {
      toast.error("Chưa có thông tin lớp để thêm học sinh");
      return;
    }
    if (!selectedStudentId) {
      toast.error("Chưa chọn học sinh!");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student: selectedStudentId,
          class: selectedClassForEnroll._id,
          // Lấy schoolYear giống lớp (nếu backend logic yêu cầu),
          // còn nếu user tự chọn year thì thay đổi logic tuỳ bạn
          schoolYear:
            selectedClassForEnroll.schoolYear?._id ||
            selectedClassForEnroll.schoolYear,
        }),
      });
      if (!res.ok) throw new Error("Failed to enroll student");
      toast.success("Thêm học sinh vào lớp thành công!");
      setShowEnrollStudentModal(false);
      setEnrollStudentInput("");
      setSelectedStudentId("");
      // Cập nhật enrollment
      fetchEnrollments();
    } catch (error) {
      toast.error("Lỗi khi enroll học sinh!");
    }
  };

  // -----------------------------------
  // RENDER UI
  // -----------------------------------
  return (
    <div className="p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-6">Quản lý Lớp</h1>
        <div className="flex flex-row items-center">
          {/* Tạo mới lớp */}
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
          >
            Thêm Lớp
          </button>
          {/* Chỉ để mở modal enroll, user chọn lớp */}
          <button
            onClick={() => setShowEnrollStudentModal(true)}
            className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
          >
            Enroll
          </button>
          {/* Upload Excel */}
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
          >
            Upload Excel
          </button>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files[0]) {
                setClassExcelFile(e.target.files[0]);
                handleClassExcelUpload();
              }
            }}
          />
          {/* Upload Ảnh ZIP */}
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".zip";
              input.onchange = handleBulkClassPhotoZip;
              input.click();
            }}
            disabled={uploadingZip}
            className={`mr-2 px-3 py-2 text-sm font-bold rounded-lg shadow-2xl transform transition-transform duration-300 ${
              uploadingZip
                ? "bg-orange-red text-white cursor-not-allowed"
                : "bg-[#002147] text-white hover:bg-[#001635] hover:scale-105"
            }`}
          >
            {uploadingZip ? "Đang xử lý..." : "Upload Ảnh"}
          </button>
        </div>
      </div>

      {/* FILTER NĂM HỌC */}
      <div className="flex items-center gap-2 mb-4">
        <label className="font-bold text-sm">Chọn Năm học:</label>
        <select
          className="border-none rounded-2xl text-sm"
          value={selectedSchoolYearFilter}
          onChange={(e) => setSelectedSchoolYearFilter(e.target.value)}
        >
          {schoolYears.map((sy) => (
            <option key={sy._id} value={sy._id}>
              {sy.code}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE HIỂN THỊ LỚP */}
      {loading ? (
        <div>Đang tải dữ liệu...</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="!border-px !border-gray-400">
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">STT</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">LỚP</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">NĂM HỌC</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">GIÁO VIÊN</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">ẢNH TẬP THỂ</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">HÀNH ĐỘNG</p>
              </th>
            </tr>
          </thead>
          <tbody>
            {(selectedSchoolYearFilter
              ? classes.filter(
                  (cls) => cls.schoolYear?._id === selectedSchoolYearFilter
                )
              : classes
            ).map((cls, idx) => (
              <tr key={cls._id} className="border-b border-gray-200">
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">{idx + 1}</p>
                </td>
                <td
                  className="min-w-[150px] border-white/0 py-3 pr-4 cursor-pointer"
                  onClick={() => handleOpenEnrollModal(cls)}
                >
                  <p className="text-sm font-bold text-navy-700">
                    {cls.className}
                  </p>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">
                    {cls.schoolYear?.code}
                  </p>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  {Array.isArray(cls.homeroomTeachers) &&
                  cls.homeroomTeachers.length > 0 ? (
                    cls.homeroomTeachers.map((teacher) => (
                      <div
                        key={teacher._id}
                        className="flex items-center gap-2 mb-1"
                      >
                        {teacher.avatarUrl ? (
                          <img
                            src={`${BASE_URL}/uploads/Avatar/${teacher.avatarUrl}`}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                            N/A
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-navy-700">
                            {teacher.fullname || teacher.email}
                          </p>
                          <p className="text-xs italic text-gray-600">
                            {teacher.email}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-bold text-navy-700">
                      Chưa có GVCN
                    </p>
                  )}
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  {classPhotos[cls._id] ? (
                    <img
                      src={`${API_URL.replace("/api", "")}/${
                        classPhotos[cls._id]
                      }`}
                      alt="Class Photo"
                      className="w-20 h-auto object-cover rounded-md"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm italic">
                      Chưa có ảnh
                    </span>
                  )}
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(cls)}
                      className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                    >
                      <FiEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cls._id)}
                      className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg transform transition-transform duration-300 hover:scale-105"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL TẠO LỚP */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-[20px] w-96">
            <h2 className="text-xl font-bold mb-4">Tạo Lớp mới</h2>

            <label className="font-semibold ml-2 text-base">Tên lớp</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập tên lớp..."
              value={formData.className}
              onChange={(e) =>
                setFormData({ ...formData, className: e.target.value })
              }
            />

            <label className="font-semibold ml-2 text-base mt-4">Năm học</label>
            <select
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              value={formData.schoolYear}
              onChange={(e) =>
                setFormData({ ...formData, schoolYear: e.target.value })
              }
            >
              <option value="">--Chọn năm học--</option>
              {schoolYears.map((sy) => (
                <option key={sy._id} value={sy._id}>
                  {sy.code}
                </option>
              ))}
            </select>

            <label className="font-semibold ml-2 text-base mt-4">GVCN</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Tìm GVCN..."
              value={teacherQuery}
              onChange={(e) => {
                const query = e.target.value;
                setTeacherQuery(query);
                if (!query.trim()) {
                  setTeacherSuggestions([]);
                  return;
                }
                const filtered = allTeachers.filter(
                  (teacher) =>
                    teacher.fullname &&
                    teacher.fullname.toLowerCase().includes(query.toLowerCase())
                );
                setTeacherSuggestions(filtered.slice(0, 5));
              }}
            />
            {teacherSuggestions.length > 0 && (
              <div className="border border-gray-300 bg-white shadow-md mt-1 rounded-xl">
                {teacherSuggestions.map((teacher) => (
                  <div
                    key={teacher._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer rounded-xl flex items-center gap-2"
                    onClick={() => {
                      if (!formData.homeroomTeachers.includes(teacher._id)) {
                        setFormData({
                          ...formData,
                          homeroomTeachers: [
                            ...formData.homeroomTeachers,
                            teacher._id,
                          ],
                        });
                      }
                      setTeacherQuery("");
                      setTeacherSuggestions([]);
                    }}
                  >
                    <img
                      src={`${BASE_URL}/uploads/Avatar/${teacher.avatarUrl}`}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover object-top"
                    />
                    <div>
                      <div className="text-base font-semibold">
                        {teacher.fullname}
                      </div>
                      <div className="text-sm italic text-gray-600">
                        {teacher.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Danh sách GVCN đã chọn */}
            {formData.homeroomTeachers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.homeroomTeachers.map((teacherId) => {
                  const teacher = allTeachers.find((t) => t._id === teacherId);
                  if (!teacher) return null;
                  return (
                    <div
                      key={teacherId}
                      className="flex items-center bg-gray-200 px-2 py-1 rounded-full text-sm"
                    >
                      {teacher.fullname}
                      <button
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            homeroomTeachers: formData.homeroomTeachers.filter(
                              (id) => id !== teacherId
                            ),
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(false);
                }}
                className="px-3 py-2 bg-orange-red text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#ff6b3a] transform transition-transform duration-300 hover:scale-105 "
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA LỚP */}
      {showEditModal && selectedClass && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-[20px] w-96">
            <h2 className="text-xl font-bold mb-4">Chỉnh sửa Lớp</h2>
            <label className="font-semibold ml-2 text-base">Tên lớp</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              value={formData.className}
              onChange={(e) =>
                setFormData({ ...formData, className: e.target.value })
              }
            />
            <label className="font-semibold ml-2 text-base mt-4">Năm học</label>
            <select
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              value={formData.schoolYear}
              onChange={(e) =>
                setFormData({ ...formData, schoolYear: e.target.value })
              }
            >
              <option value="">--Chọn năm học--</option>
              {schoolYears.map((sy) => (
                <option key={sy._id} value={sy._id}>
                  {sy.code}
                </option>
              ))}
            </select>

            <label className="font-semibold ml-2 text-base mt-4">GVCN</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Tìm GVCN..."
              value={teacherQuery}
              onChange={(e) => {
                const query = e.target.value;
                setTeacherQuery(query);
                if (!query.trim()) {
                  setTeacherSuggestions([]);
                  return;
                }
                const filtered = allTeachers.filter(
                  (teacher) =>
                    teacher.fullname &&
                    teacher.fullname.toLowerCase().includes(query.toLowerCase())
                );
                setTeacherSuggestions(filtered.slice(0, 5));
              }}
            />

            {teacherSuggestions.length > 0 && (
              <div className="border border-gray-300 bg-white shadow-md mt-1 rounded-xl">
                {teacherSuggestions.map((teacher) => (
                  <div
                    key={teacher._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer rounded-xl flex items-center gap-2"
                    onClick={() => {
                      if (!formData.homeroomTeachers.includes(teacher._id)) {
                        setFormData({
                          ...formData,
                          homeroomTeachers: [
                            ...formData.homeroomTeachers,
                            teacher._id,
                          ],
                        });
                      }
                      setTeacherQuery("");
                      setTeacherSuggestions([]);
                    }}
                  >
                    <img
                      src={`${BASE_URL}/uploads/Avatar/${teacher.avatarUrl}`}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover object-top"
                    />
                    <div>
                      <div className="text-base font-semibold">
                        {teacher.fullname}
                      </div>
                      <div className="text-sm italic text-gray-600">
                        {teacher.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Danh sách GVCN đã chọn */}
            {formData.homeroomTeachers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.homeroomTeachers.map((teacherId) => {
                  const teacher = allTeachers.find((t) => t._id === teacherId);
                  if (!teacher) return null;
                  return (
                    <div
                      key={teacherId}
                      className="flex items-center bg-gray-200 px-2 py-1 rounded-full text-sm"
                    >
                      {teacher.fullname}
                      <button
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            homeroomTeachers: formData.homeroomTeachers.filter(
                              (id) => id !== teacherId
                            ),
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  resetForm();
                  setShowEditModal(false);
                  setSelectedClass(null);
                }}
                className="px-3 py-2 bg-orange-red text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#ff6b3a] transform transition-transform duration-300 hover:scale-105 "
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT LỚP: Xem GVCN + Danh sách học sinh + Xoá học sinh */}
      {showEnrollModal && selectedClassForEnroll && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-[20px] w-[60%]">
            <div className="w-full flex flex-row items-center justify-between ">
              <h2 className="text-xl font-bold mb-4">
                Lớp {selectedClassForEnroll.className}
              </h2>
              <button
                onClick={() => setShowEnrollStudentModal(true)}
                className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transition-transform duration-300"
              >
                <FaUserPlus size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {/* GVCN Section */}
              <div className="flex-1">
                <h3 className="font-bold mb-5 uppercase">Giáo viên</h3>
                {Array.isArray(selectedClassForEnroll.homeroomTeachers) &&
                selectedClassForEnroll.homeroomTeachers.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {selectedClassForEnroll.homeroomTeachers.map((teacher) => (
                      <div
                        key={teacher._id}
                        className="flex flex-col items-center"
                      >
                        {teacher.avatarUrl ? (
                          <img
                            src={`${BASE_URL}/uploads/Avatar/${teacher.avatarUrl}`}
                            alt="GVCN Avatar"
                            className="w-20 h-20 rounded-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                            N/A
                          </div>
                        )}
                        <div className="text-center mt-1">
                          <p className="text-sm font-bold">
                            {teacher.fullname || teacher.email}
                          </p>
                          <p className="text-xs italic text-gray-600">
                            {teacher.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-gray-600">Chưa có GVCN</p>
                )}
              </div>

              {/* Học sinh Section */}
              <div className="w-full">
                <h3 className="font-bold mb-5 uppercase">Học sinh</h3>
                <div className="max-h-[300px] overflow-y-hidden hover:overflow-y-auto">
                  {(() => {
                    // Lấy danh sách enrollment của lớp này
                    const classEnrollments = enrollments.filter((e) => {
                      const enrollmentClassId =
                        typeof e.class === "object"
                          ? String(e.class._id)
                          : String(e.class);
                      return (
                        enrollmentClassId === String(selectedClassForEnroll._id)
                      );
                    });
                    return classEnrollments.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {classEnrollments.map((enrollment) => {
                          const student = enrollment.student;
                          const photo = photos.find((p) => {
                            if (!p.student || !student) return false;
                            const studentId =
                              typeof p.student === "object" && p.student._id
                                ? String(p.student._id)
                                : String(p.student);
                            const currentId =
                              typeof student === "object" && student._id
                                ? String(student._id)
                                : String(student);
                            return studentId === currentId;
                          });
                          return (
                            <div
                              key={enrollment._id}
                              className="flex flex-col items-center p-2 relative "
                            >
                              {/* Nút xóa */}
                              <button
                                className="absolute top-1 right-9 text-red-600 px-2 py-0.5 "
                                onClick={() =>
                                  handleRemoveEnrollment(enrollment._id)
                                }
                              >
                                <FaUserXmark />
                              </button>

                              {photo && photo.photoUrl ? (
                                <img
                                  src={`${BASE_URL}/${photo.photoUrl}`}
                                  alt="Avatar"
                                  className="w-20 h-20 rounded-full object-cover object-top mb-2"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600 mb-2">
                                  N/A
                                </div>
                              )}
                              <p className="text-sm font-bold text-center">
                                {student?.name || "No name"}
                              </p>
                              <p className="text-xs italic text-gray-500 text-center">
                                {student?.studentCode || "No code"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm italic text-gray-600">
                        Chưa có học sinh
                      </p>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setSelectedClassForEnroll(null);
                }}
                className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL “THÊM HỌC SINH” VÀO LỚP (ENROLL) */}
      {showEnrollStudentModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-[20px] w-96">
            <h2 className="text-xl font-bold mb-4">Enroll Học sinh</h2>
            {selectedClassForEnroll ? (
              <p className="text-sm italic text-gray-700 mb-2">
                Thêm học sinh vào lớp:{" "}
                <span className="font-bold">
                  {selectedClassForEnroll.className}
                </span>
              </p>
            ) : (
              <p className="text-sm italic text-red-500 mb-2">
                Bạn chưa chọn lớp
              </p>
            )}

            <label className="block font-semibold text-sm mb-1">
              Nhập mã/ tên học sinh
            </label>
            <input
              type="text"
              placeholder="VD: WS12401..."
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              value={enrollStudentInput}
              onChange={(e) => {
                const q = e.target.value;
                setEnrollStudentInput(q);
                if (!q.trim()) {
                  setEnrollStudentSuggestions([]);
                  setSelectedStudentId("");
                  return;
                }
                // Lọc theo studentCode hoặc name
                const filtered = students.filter(
                  (s) =>
                    s.studentCode?.toLowerCase().includes(q.toLowerCase()) ||
                    s.name?.toLowerCase().includes(q.toLowerCase())
                );
                setEnrollStudentSuggestions(filtered.slice(0, 5));
              }}
            />
            {enrollStudentSuggestions.length > 0 && (
              <div className="border border-gray-300 bg-white shadow-md rounded-xl mb-2">
                {enrollStudentSuggestions.map((s) => (
                  <div
                    key={s._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex flex-col"
                    onClick={() => {
                      setEnrollStudentInput(`${s.studentCode} - ${s.name}`);
                      setSelectedStudentId(s._id);
                      setEnrollStudentSuggestions([]);
                    }}
                  >
                    <span className="font-bold text-sm">{s.studentCode}</span>
                    <span className="text-xs text-gray-500">{s.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setShowEnrollStudentModal(false);
                  setEnrollStudentInput("");
                  setSelectedStudentId("");
                }}
                className="px-3 py-2 bg-orange-red text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#ff6b3a] transition-transform duration-300"
              >
                Huỷ
              </button>
              <button
                onClick={handleEnrollStudent}
                disabled={!selectedClassForEnroll}
                className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enroll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentClass;
