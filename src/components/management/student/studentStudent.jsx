import React, { useEffect, useState, useRef } from "react";
import { API_URL, BASE_URL } from "../../../config";
import { toast } from "react-toastify";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import * as XLSX from "xlsx";

const StudentStudent = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [studentExcelFile, setStudentExcelFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    studentCode: "",
    name: "",
    birthDate: "",
    email: "",
  });
  // State cho Enrollment
  const [classes, setClasses] = useState([]);

  // State cho upload ảnh học sinh
  const [newPhoto, setNewPhoto] = useState({
    student: "",
    schoolYear: "",
    file: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchoolYearFilter, setSelectedSchoolYearFilter] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [photoZipUploading, setPhotoZipUploading] = useState(false);
  const [photoZipStats, setPhotoZipStats] = useState(null);
  const [photoZipFile, setPhotoZipFile] = useState(null);
  const indexOfLastRecord = currentPage * pageSize;
  const indexOfFirstRecord = indexOfLastRecord - pageSize;
  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const currentStudents = filteredStudents.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const [schoolYears, setSchoolYears] = useState([]);
  const excelInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const zipInputRef = useRef(null);
  const [excelScanResult, setExcelScanResult] = useState(null);
  const [photos, setPhotos] = useState([]);

  // 3. Thêm hàm fetchClasses (tương tự fetchStudents)
  const fetchClasses = async () => {
    try {
      const res = await fetch(`${API_URL}/classes`);
      const data = await res.json();
      setClasses(data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu lớp!");
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

  const fetchSchoolYears = async () => {
    try {
      const res = await fetch(`${API_URL}/schoolYears`);
      const data = await res.json();
      setSchoolYears(data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu năm học!");
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/students`);
      const data = await res.json();
      setStudents(data);
      console.log(data);
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
      console.log(data);
    } catch (error) {
      toast.error("Lỗi tải ảnh học sinh!");
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchSchoolYears();
    fetchPhotos();
    fetchEnrollments();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch(`${API_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Tạo học sinh thành công!");
      setShowCreateModal(false);
      setFormData({ studentCode: "", name: "", birthDate: "", email: "" });
      fetchStudents();
    } catch (error) {
      toast.error("Lỗi khi tạo học sinh");
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API_URL}/students/${selectedStudent._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update student");
      toast.success("Cập nhật học sinh thành công!");
      setShowEditModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      toast.error("Lỗi khi cập nhật học sinh!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Chắc chắn xoá?")) return;
    try {
      const res = await fetch(`${API_URL}/students/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete student");
      toast.success("Đã xoá học sinh!");
      fetchStudents();
    } catch (error) {
      toast.error("Lỗi xoá học sinh!");
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      studentCode: student.studentCode,
      name: student.name,
      birthDate: student.birthDate ? student.birthDate.substring(0, 10) : "",
      email: student.email,
    });
    setShowEditModal(true);
  };

  // 5. Hàm upload Excel học sinh
  const handleStudentExcelUpload = async () => {
    if (!studentExcelFile) {
      toast.warning("Bạn chưa chọn file Excel!");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("excelFile", studentExcelFile);
      const res = await fetch(`${API_URL}/students/bulk`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Upload Excel học sinh thành công!");
      setStudentExcelFile(null);
      fetchStudents();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi upload Excel học sinh!");
    }
  };
  /// Check file excel
  const handleExcelFileCheck = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      let countNew = 0;
      // Duyệt từng dòng và kiểm tra xem mã học sinh đã tồn tại trong db (state students) chưa
      rows.forEach((row) => {
        const studentCode = row["ID học sinh"]?.toString().trim();
        if (studentCode) {
          // Kiểm tra với danh sách học sinh hiện có trong state\n
          const exists = students.some((s) => s.studentCode === studentCode);
          if (!exists) countNew++;
        }
      });
      setExcelScanResult(countNew);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleStudentPhotoUpload = async () => {
    if (!newPhoto.student || !newPhoto.schoolYear || !newPhoto.file) {
      toast.warning("Vui lòng chọn học sinh, năm học và file ảnh!");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("student", newPhoto.student);
      formData.append("schoolYear", newPhoto.schoolYear);
      formData.append("photo", newPhoto.file);
      const res = await fetch(`${API_URL}/photos/student`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Upload ảnh học sinh thành công!");
      setNewPhoto({ student: "", schoolYear: "", file: null });
      fetchPhotos();
      setShowPhotoModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi upload ảnh học sinh!");
    }
  };

  const handleStudentPhotoZipUpload = () => {
    const file = zipInputRef.current.files[0];
    if (!file) return;

    setPhotoZipUploading(true); // Bắt đầu upload => đang xử lý
    setPhotoZipStats(null); // Reset kết quả cũ (nếu có)

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/photos/bulk-zip`);

    xhr.onload = function () {
      setPhotoZipUploading(false); // Kết thúc upload (dù thành công hay lỗi)
      if (xhr.status === 200) {
        // Không hiển thị toast cho thống kê nữa, chỉ hiển thị success ngắn gọn
        toast.success("Upload ZIP ảnh học sinh thành công!");

        const response = JSON.parse(xhr.responseText);
        // Lưu kết quả vào state để hiển thị trên modal
        setPhotoZipStats(response);
      } else {
        toast.error("Lỗi upload ZIP ảnh học sinh!");
      }
    };

    xhr.onerror = function () {
      setPhotoZipUploading(false);
      toast.error("Lỗi upload ZIP ảnh học sinh!");
    };

    const formData = new FormData();
    formData.append("zipFile", file);
    xhr.send(formData);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Quản lý Học sinh</h1>
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
      <div className="flex items-center justify-between">
        <div className="w-full flex flex-row items-center justify-between">
          <div className="w-1/4 flex flex-col">
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên học sinh..."
              className="border border-gray-300 py-2 rounded-md text-sm focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <button
              onClick={() => {
                setFormData({
                  studentCode: "",
                  name: "",
                  birthDate: "",
                  email: "",
                });
                setShowCreateModal(true);
              }}
              className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
            >
              Thêm
            </button>

            <button
              onClick={() => setShowPhotoModal(true)}
              className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
            >
              Upload Ảnh
            </button>
          </div>
        </div>
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
                <p className="text-sm font-bold text-gray-500">MÃ HỌC SINH</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">HỌ VÀ TÊN</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">LỚP</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">NGÀY SINH</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">EMAIL</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">HÀNH ĐỘNG</p>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((student, idx) => (
              <tr key={student._id} className="border-b border-gray-200">
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700"> {idx + 1}</p>
                </td>
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">
                    {" "}
                    {student.studentCode}
                  </p>
                </td>
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const photo = photos.find((p) => {
                        if (!p.student) return false;
                        const studentId =
                          typeof p.student === "object" && p.student._id
                            ? String(p.student._id)
                            : String(p.student);
                        if (studentId !== String(student._id)) return false;
                        if (selectedSchoolYearFilter) {
                          if (!p.schoolYear) return false;
                          const photoSchoolYear =
                            typeof p.schoolYear === "object" && p.schoolYear._id
                              ? String(p.schoolYear._id)
                              : String(p.schoolYear);
                          return photoSchoolYear === selectedSchoolYearFilter;
                        }
                        return true;
                      });
                      return photo && photo.photoUrl ? (
                        <img
                          src={`${BASE_URL}/${photo.photoUrl}`}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                          N/A
                        </div>
                      );
                    })()}
                    <p className="text-sm font-bold text-navy-700">
                      {student.name}
                    </p>
                  </div>
                </td>
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">
                    {(() => {
                      const enrollment = enrollments.find((e) => {
                        if (!e.student) return false;
                        const studentId =
                          typeof e.student === "object" && e.student._id
                            ? String(e.student._id)
                            : String(e.student);
                        if (studentId !== String(student._id)) return false;
                        if (selectedSchoolYearFilter) {
                          if (!e.schoolYear) return false;
                          const enrollmentSchoolYear =
                            typeof e.schoolYear === "object" && e.schoolYear._id
                              ? String(e.schoolYear._id)
                              : String(e.schoolYear);
                          return (
                            enrollmentSchoolYear === selectedSchoolYearFilter
                          );
                        }
                        return true;
                      });
                      return enrollment &&
                        enrollment.class &&
                        enrollment.class.className
                        ? enrollment.class.className
                        : "N/A";
                    })()}
                  </p>
                </td>
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">
                    {" "}
                    {student.birthDate
                      ? student.birthDate.substring(0, 10)
                      : ""}
                  </p>
                </td>
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">
                    {student.email}
                  </p>
                </td>
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(student)}
                      className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                    >
                      <FiEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(student._id)}
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
      <div className="flex items-center justify-between mt-4">
        <div>
          <select
            className="border-none rounded-2xl text-sm bg-gray-200 mr-2 font-bold "
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <label className="font-bold text-sm">Học sinh/ Trang</label>
        </div>
        <div>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3 py-1 bg-gray-200 rounded-xl mr-2 font-bold text-sm "
          >
            Trước
          </button>
          <span className="font-bold text-sm">
            {currentPage} / {Math.ceil(filteredStudents.length / pageSize)}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(
                  prev + 1,
                  Math.ceil(filteredStudents.length / pageSize)
                )
              )
            }
            className="px-3 py-1 bg-gray-200 rounded-xl ml-2 font-bold text-sm"
          >
            Sau
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-[20px] w-[800px] flex gap-4">
            {/* Cột trái - Form thêm học sinh */}
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold mb-4">Tạo Học sinh mới</h2>
              <label className="font-semibold ml-2 text-base">
                Mã học sinh
              </label>
              <input
                type="text"
                className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
                placeholder="Nhập mã học sinh..."
                value={formData.studentCode}
                onChange={(e) =>
                  setFormData({ ...formData, studentCode: e.target.value })
                }
              />
              <label className="font-semibold ml-2 text-base">Họ và tên</label>
              <input
                type="text"
                className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
                placeholder="Nhập tên học sinh..."
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <label className="font-semibold ml-2 text-base">Ngày sinh</label>
              <input
                type="date"
                className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
                placeholder="Nhập ngày sinh..."
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
              />
              <label className="font-semibold ml-2 text-base">Email</label>
              <input
                type="text"
                className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
                placeholder="Nhập email..."
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
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

            {/* Gạch dọc ngăn cách */}
            <div className="w-px bg-gray-300" />

            {/* Cột phải - Upload Excel */}
            <div className="flex-1 flex-col pl-4">
              <h2 className="text-xl font-bold mb-4">
                Upload danh sách học sinh
              </h2>
              <label className="block font-semibold text-base mb-3">
                File Excel *
              </label>
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 bg-gray-50 text-center text-gray-500 cursor-pointer hover:border-[#002147] transition"
                onClick={() =>
                  excelInputRef.current && excelInputRef.current.click()
                }
              >
                <p className="text-sm font-medium">
                  Kéo thả hoặc chọn tệp từ máy tính
                </p>
                <p className="text-xs italic mt-1">
                  Định dạng hỗ trợ: <b>.xlsx</b> &bull; Dung lượng tối đa: 5MB
                </p>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setStudentExcelFile(file);
                    handleExcelFileCheck(file);
                  }}
                />
              </div>

              {studentExcelFile && (
                <div className="mt-2">
                  <div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {studentExcelFile.name}
                    </span>
                    <button
                      onClick={() => {
                        setStudentExcelFile(null);
                        setExcelScanResult(null);
                      }}
                      className="ml-2 text-red-500 font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  {excelScanResult !== null ? (
                    <div className="mt-1 text-xs text-gray-600 italic">
                      Có thể thêm: {excelScanResult} học sinh mới.
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-gray-600 italic">
                      Đang kiểm tra file...
                    </div>
                  )}
                </div>
              )}
              <a
                href="/students-sample.xlsx"
                download
                className="text-[#002855] underline text-sm my-4 inline-block"
              >
                Tải file mẫu tại đây
              </a>
              <div className="flex justify-end gap-2">
                <button
                  onClick={async () => {
                    await handleStudentExcelUpload();
                    setShowCreateModal(false);
                  }}
                  className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg hover:bg-[#001635] transition-transform duration-300 hover:scale-105"
                >
                  Tải lên
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-[20px] w-96">
            <h2 className="text-xl font-bold mb-4">Sửa thông tin học sinh</h2>

            <label className="font-semibold ml-2 text-base">Mã học sinh</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập mã học sinh..."
              value={formData.studentCode}
              onChange={(e) =>
                setFormData({ ...formData, studentCode: e.target.value })
              }
            />
            <label className="font-semibold ml-2 text-base">Họ và tên</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập tên học sinh..."
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <label className="font-semibold ml-2 text-base">Ngày sinh</label>
            <input
              type="date"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập ngày sinh..."
              value={formData.birthDate}
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
            />
            <label className="font-semibold ml-2 text-base">Email</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập email..."
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
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

      {showPhotoModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-[20px] w-[800px] flex gap-4">
            {/* Left Column: Photo Form */}
            <div className="flex-1 pr-4">
              <h3 className="font-semibold mb-2">Upload Ảnh Học sinh</h3>
              <label className="block text-sm font-bold">Học sinh</label>
              <input
                list="photoStudentSuggestions"
                className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
                placeholder="Nhập mã học sinh..."
                value={newPhoto.studentInput || ""}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setNewPhoto((prev) => ({
                    ...prev,
                    studentInput: inputValue,
                  }));
                  const found = students.find(
                    (s) => s.studentCode === inputValue
                  );
                  if (found) {
                    setNewPhoto((prev) => ({ ...prev, student: found._id }));
                  } else {
                    setNewPhoto((prev) => ({ ...prev, student: "" }));
                  }
                }}
              />
              <datalist id="photoStudentSuggestions">
                {newPhoto.studentInput &&
                  students
                    .filter(
                      (s) =>
                        s.studentCode
                          .toLowerCase()
                          .includes(newPhoto.studentInput.toLowerCase()) ||
                        s.name
                          .toLowerCase()
                          .includes(newPhoto.studentInput.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((s) => (
                      <option key={s._id} value={s.studentCode}>
                        {s.name} ({s.studentCode})
                      </option>
                    ))}
              </datalist>

              <label className="block text-sm font-bold">Năm học</label>
              <select
                className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
                value={newPhoto.schoolYear}
                onChange={(e) =>
                  setNewPhoto({ ...newPhoto, schoolYear: e.target.value })
                }
              >
                <option value="">--Chọn năm học--</option>
                {schoolYears.map((sy) => (
                  <option key={sy._id} value={sy._id}>
                    {sy.code}
                  </option>
                ))}
              </select>
              <label className="block font-bold text-sm mb-1">File ảnh *</label>
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 bg-gray-50 text-center text-gray-500 cursor-pointer hover:border-[#002147] transition"
                onClick={() =>
                  photoInputRef.current && photoInputRef.current.click()
                }
              >
                {newPhoto.file ? (
                  <img
                    src={URL.createObjectURL(newPhoto.file)}
                    alt="Preview"
                    className="w-full max-h-48 object-contain"
                  />
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      Kéo thả hoặc chọn tệp từ máy tính
                    </p>
                    <p className="text-xs italic mt-1">
                      Định dạng hỗ trợ: <b>image/*</b> &bull; Dung lượng tối đa:
                      5MB
                    </p>
                  </>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setNewPhoto({ ...newPhoto, file });
                  }}
                />
              </div>
              {newPhoto.file && (
                <div className="mt-2">
                  <div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {newPhoto.file.name}
                    </span>
                    <button
                      onClick={() => setNewPhoto({ ...newPhoto, file: null })}
                      className="ml-2 text-red-500 font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setShowPhotoModal(false);
                      // reset state nếu muốn
                      setNewPhoto({
                        student: "",
                        schoolYear: "",
                        file: null,
                        studentInput: "",
                      });
                    }}
                    className="px-3 py-2 bg-orange-red text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#ff6b3a] transform transition-transform duration-300 hover:scale-105 "
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleStudentPhotoUpload}
                    className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
                  >
                    Upload ảnh
                  </button>
                </div>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="w-px bg-gray-300" />

            {/* Right Column: Upload Photo & ZIP */}
            <div className="flex-1 pl-4">
              <h3 className="font-semibold mb-2">
                Upload ZIP ảnh cho nhiều học sinh
              </h3>
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 bg-gray-50 text-center text-gray-500 cursor-pointer hover:border-[#002147] transition"
                onClick={() =>
                  zipInputRef.current && zipInputRef.current.click()
                }
              >
                <p className="text-sm font-medium">
                  Kéo thả hoặc chọn tệp ZIP từ máy tính
                </p>
                <p className="text-xs italic mt-1">
                  Định dạng hỗ trợ: <b>.zip</b> &bull; Dung lượng tối đa: 1024MB
                </p>
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setPhotoZipFile(file);
                  }}
                />
              </div>
              {photoZipFile && (
                <div className="mt-2">
                  <div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {photoZipFile.name}
                    </span>
                    <button
                      onClick={() => setPhotoZipFile(null)}
                      className="ml-2 text-red-500 font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleStudentPhotoZipUpload}
                  className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg hover:bg-[#001635] transition-transform duration-300 hover:scale-105"
                >
                  Upload
                </button>
              </div>
              {/* Hiển thị 'Đang xử lý...' nếu đang upload */}
              {photoZipUploading && (
                <div className="mt-2 text-sm italic text-gray-600">
                  Đang xử lý, vui lòng chờ...
                </div>
              )}
              {/* /* Hiển thị thống kê sau khi xử lý xong */}
              {photoZipStats && (
                <div className="mt-2 p-3 border rounded-xl bg-gray-50 text-sm text-gray-600">
                  <p className="font-bold text-gray-800">Kết quả:</p>
                  <p>
                    Tổng số file trong thư mục: {photoZipStats.totalEntries}
                  </p>
                  <p>Không tìm thấy học sinh: {photoZipStats.noStudentFound}</p>
                  <p>Ảnh mới tạo: {photoZipStats.createdPhotos}</p>
                  <p>Ảnh được cập nhật: {photoZipStats.updatedPhotos}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentStudent;
