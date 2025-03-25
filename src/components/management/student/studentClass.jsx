import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../../config";
import { toast } from "react-toastify";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const StudentClass = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    className: "",
    schoolYear: "",
    homeroomTeacher: "",
  });
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYearFilter, setSelectedSchoolYearFilter] = useState("");
  const [classExcelFile, setClassExcelFile] = useState(null);
  const fileInputRef = useRef(null);
  const [classZipUploadResult, setClassZipUploadResult] = useState("");
  const [uploadingZip, setUploadingZip] = useState(false);
  const [classPhotos, setClassPhotos] = useState({});
  const [teacherQuery, setTeacherQuery] = useState("");
  const [teacherSuggestions, setTeacherSuggestions] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const initialFormData = {
    className: "",
    schoolYear: "",
    homeroomTeacher: "",
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setTeacherQuery("");
    setTeacherSuggestions([]);
  };

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
      console.log("Teachers:", data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchSchoolYears();
    fetchClassPhotos();
    fetchTeachers();
  }, []);

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
      setFormData({ className: "", schoolYear: "", homeroomTeacher: "" });
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
  const handleClassExcelUpload = async () => {
    if (!classExcelFile) {
      toast.warning("Bạn chưa chọn file Excel!");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("excelFile", classExcelFile);
      const res = await fetch(`${API_URL}/classes/bulk`, {
        method: "POST",
        body: formData,
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
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(
        `${API_URL}/photos/bulk-upload-class`,
        formData,
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

  const openEditModal = (cls) => {
    setSelectedClass(cls);
    setFormData({
      className: cls.className,
      schoolYear: cls.schoolYear?._id || cls.schoolYear,
      homeroomTeacher: cls.homeroomTeacher,
    });
    setTeacherQuery(
      cls.homeroomTeacher && typeof cls.homeroomTeacher === "object"
        ? cls.homeroomTeacher.fullname || cls.homeroomTeacher.email
        : ""
    );
    setShowEditModal(true);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-6">Quản lý Lớp</h1>
        <div className="flex flex-row items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
          >
            Thêm Lớp
          </button>
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
      <div className="flex items-center gap-2 mb-4">
        <label className="font-bold text-sm">Chọn Năm học:</label>
        <select
          className="border-none rounded-2xl text-sm"
          value={selectedSchoolYearFilter}
          onChange={(e) => setSelectedSchoolYearFilter(e.target.value)}
        >
          <option value="">Tất cả</option>
          {schoolYears.map((sy) => (
            <option key={sy._id} value={sy._id}>
              {sy.code}
            </option>
          ))}
        </select>
      </div>
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
                  <p className="text-sm font-bold text-navy-700"> {idx + 1}</p>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
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
                  {cls.homeroomTeacher &&
                  typeof cls.homeroomTeacher === "object" ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={`${BASE_URL}/uploads/Avatar/${cls.homeroomTeacher.avatarUrl}`}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover object-top"
                      />
                      <div>
                        <p className="text-sm font-bold text-navy-700">
                          {cls.homeroomTeacher.fullname ||
                            cls.homeroomTeacher.email}
                        </p>
                        <p className="text-xs italic text-gray-600">
                          {cls.homeroomTeacher.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-navy-700">
                      {cls.homeroomTeacher}
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
                      className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg  transform transition-transform duration-300 hover:scale-105"
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
              <option value="">Chọn năm học</option>
              {schoolYears.map((sy) => (
                <option key={sy._id} value={sy._id}>
                  {sy.code}
                </option>
              ))}
            </select>
            <label className="font-semibold ml-2 text-base mt-4">
              Giáo viên chủ nhiệm
            </label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập tên giáo viên..."
              value={teacherQuery}
              onChange={(e) => {
                const query = e.target.value;
                setTeacherQuery(query);

                if (!query || formData.homeroomTeacher) {
                  setTeacherSuggestions([]);
                  return;
                }

                const filtered = allTeachers.filter(
                  (teacher) =>
                    teacher &&
                    teacher.fullname &&
                    typeof teacher.fullname === "string" &&
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
                    className="p-2 hover:bg-gray-200 cursor-pointer rounded-xl"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        homeroomTeacher: teacher._id,
                      });
                      setTeacherQuery(teacher.fullname);
                      setTeacherSuggestions([]);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={`${BASE_URL}/uploads/Avatar/${teacher.avatarUrl}`}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover object-top"
                      />
                      <div className="flex items-center gap-2">
                        <img
                          src={`${BASE_URL}/uploads/Avatar/${teacher.avatarUrl}`}
                          alt="avatar"
                          className="w-8 h-8 rounded-full object-cover"
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
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  resetForm(); // Xoá dữ liệu trong form
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

      {showEditModal && (
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
            <label className="font-semibold ml-2 text-base mt-4">
              Giáo viên chủ nhiệm
            </label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập tên giáo viên..."
              value={teacherQuery}
              onChange={(e) => {
                const query = e.target.value;
                setTeacherQuery(query);

                if (!query || formData.homeroomTeacher) {
                  setTeacherSuggestions([]);
                  return;
                }

                const filtered = allTeachers.filter(
                  (teacher) =>
                    teacher &&
                    teacher.fullname &&
                    typeof teacher.fullname === "string" &&
                    teacher.fullname.toLowerCase().includes(query.toLowerCase())
                );
                setTeacherSuggestions(filtered.slice(0, 5));
              }}
            />

            {teacherSuggestions.length > 0 && (
              <div className="border border-gray-300 bg-white shadow-md mt-1">
                {teacherSuggestions.map((teacher) => (
                  <div
                    key={teacher._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        homeroomTeacher: teacher._id,
                      });
                      setTeacherQuery(teacher.fullname);
                      setTeacherSuggestions([]);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={`${BASE_URL}/uploads/Avatar/${teacher.avatarUrl}`}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover"
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
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-2">
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
    </div>
  );
};

export default StudentClass;
