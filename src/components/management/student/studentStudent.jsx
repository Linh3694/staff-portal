import React, { useEffect, useState, useRef } from "react";
import { API_URL } from "../../../config";
import { toast } from "react-toastify";

const StudentStudent = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [studentExcelFile, setStudentExcelFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    fullName: "",
    dateOfBirth: "",
    email: "",
  });
  // State cho Enrollment
  const [classes, setClasses] = useState([]);
  const [newEnrollment, setNewEnrollment] = useState({
    student: "",
    class: "",
    schoolYear: "",
    startDate: "",
    endDate: "",
  });
  // State cho upload ảnh học sinh
  const [newPhoto, setNewPhoto] = useState({
    student: "",
    schoolYear: "",
    file: null,
  });
  const [photoZipFile, setPhotoZipFile] = useState(null);
  const indexOfLastRecord = currentPage * pageSize;
  const indexOfFirstRecord = indexOfLastRecord - pageSize;
  const currentStudents = students.slice(indexOfFirstRecord, indexOfLastRecord);

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

  useEffect(() => {
    fetchStudents();
    fetchClasses();
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
      setFormData({ code: "", fullName: "", dateOfBirth: "", email: "" });
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
      code: student.code,
      fullName: student.fullName,
      dateOfBirth: student.dateOfBirth
        ? student.dateOfBirth.substring(0, 10)
        : "",
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

  // 6. Hàm tạo Enrollment
  const createEnrollment = async () => {
    try {
      const res = await fetch(`${API_URL}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEnrollment),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Enrollment thành công!");
      setNewEnrollment({
        student: "",
        class: "",
        schoolYear: "",
        startDate: "",
        endDate: "",
      });
    } catch (error) {
      toast.error("Lỗi tạo Enrollment!");
    }
  };

  // 7. Hàm upload ảnh đơn cho học sinh
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
      const res = await fetch(`${API_URL}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Upload ảnh học sinh thành công!");
      setNewPhoto({ student: "", schoolYear: "", file: null });
      // (Có thể gọi hàm fetchPhotos() nếu cần refresh danh sách ảnh)
    } catch (error) {
      console.error(error);
      toast.error("Lỗi upload ảnh học sinh!");
    }
  };

  // 8. Hàm upload file ZIP ảnh học sinh
  const handleStudentPhotoZipUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("zipFile", file);
      const res = await fetch(`${API_URL}/photos/bulk-upload-student`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Upload ZIP ảnh học sinh thành công!");
      // (Có thể gọi hàm fetchPhotos() nếu cần)
    } catch (error) {
      console.error(error);
      toast.error("Lỗi upload ZIP ảnh học sinh!");
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-6">Quản lý Học sinh</h1>
        <div classnName="flex items-center gap-10">
          <button
            onClick={() => setShowCreateModal(true)}
            className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
          >
            Thêm
          </button>
          <button
            onClick={handleStudentExcelUpload}
            className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
          >
            Upload Excel
          </button>
          <button
            onClick={() => setShowEnrollmentModal(true)}
            className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
          >
            Enrollment
          </button>
          <button
            onClick={() => setShowPhotoModal(true)}
            className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
          >
            Upload Ảnh
          </button>
        </div>
      </div>
      {loading ? (
        <div>Đang tải dữ liệu...</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Mã</th>
              <th className="p-2 text-left">Họ tên</th>
              <th className="p-2 text-left">Ngày sinh</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((student, idx) => (
              <tr key={student._id} className="border-b">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2 font-bold">{student.code}</td>
                <td className="p-2">{student.fullName}</td>
                <td className="p-2">
                  {student.dateOfBirth
                    ? student.dateOfBirth.substring(0, 10)
                    : ""}
                </td>
                <td className="p-2">{student.email}</td>
                <td className="p-2">
                  <button
                    onClick={() => openEditModal(student)}
                    className="mr-2 px-3 py-1 bg-yellow-400 text-white rounded"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(student._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex items-center justify-between mt-4">
        <div>
          <label className="mr-2">Records per page:</label>
          <select
            className="border p-2 rounded"
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
        </div>
        <div>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3 py-1 bg-gray-300 rounded mr-2"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {Math.ceil(students.length / pageSize)}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, Math.ceil(students.length / pageSize))
              )
            }
            className="px-3 py-1 bg-gray-300 rounded ml-2"
          >
            Next
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-xl font-bold mb-4">Tạo Học sinh mới</h2>
            <input
              type="text"
              className="border p-2 rounded mb-2 w-full"
              placeholder="Mã học sinh"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
            />
            <input
              type="text"
              className="border p-2 rounded mb-2 w-full"
              placeholder="Họ tên"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
            <input
              type="date"
              className="border p-2 rounded mb-2 w-full"
              placeholder="Ngày sinh"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
              }
            />
            <input
              type="email"
              className="border p-2 rounded mb-2 w-full"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="mr-2 px-4 py-2 bg-gray-300 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-xl font-bold mb-4">Chỉnh sửa Học sinh</h2>
            <input
              type="text"
              className="border p-2 rounded mb-2 w-full"
              placeholder="Mã học sinh"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
            />
            <input
              type="text"
              className="border p-2 rounded mb-2 w-full"
              placeholder="Họ tên"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
            <input
              type="date"
              className="border p-2 rounded mb-2 w-full"
              placeholder="Ngày sinh"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
              }
            />
            <input
              type="email"
              className="border p-2 rounded mb-2 w-full"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <div className="flex justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="mr-2 px-4 py-2 bg-gray-300 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
      {showEnrollmentModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="p-4 border rounded-md mb-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Enrollment</h3>
            <div className="flex gap-4 mb-2">
              <div>
                <label className="block text-sm font-bold">Học sinh</label>
                <select
                  className="border p-2 rounded"
                  value={newEnrollment.student}
                  onChange={(e) =>
                    setNewEnrollment({
                      ...newEnrollment,
                      student: e.target.value,
                    })
                  }
                >
                  <option value="">--Chọn học sinh--</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.fullName} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold">Lớp</label>
                <select
                  className="border p-2 rounded"
                  value={newEnrollment.class}
                  onChange={(e) =>
                    setNewEnrollment({
                      ...newEnrollment,
                      class: e.target.value,
                    })
                  }
                >
                  <option value="">--Chọn lớp--</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.className}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold">Năm học</label>
                <select
                  className="border p-2 rounded"
                  value={newEnrollment.schoolYear}
                  onChange={(e) =>
                    setNewEnrollment({
                      ...newEnrollment,
                      schoolYear: e.target.value,
                    })
                  }
                >
                  <option value="">--Chọn năm học--</option>
                  {/* {schoolYears.map((sy) => (
                  <option key={sy._id} value={sy._id}>
                    {sy.code}
                  </option>
                ))} */}
                </select>
              </div>
            </div>
            <div className="flex gap-4 mb-2">
              <div>
                <label className="block text-sm font-bold">Ngày bắt đầu</label>
                <input
                  type="date"
                  className="border p-2 rounded"
                  value={newEnrollment.startDate}
                  onChange={(e) =>
                    setNewEnrollment({
                      ...newEnrollment,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold">Ngày kết thúc</label>
                <input
                  type="date"
                  className="border p-2 rounded"
                  value={newEnrollment.endDate}
                  onChange={(e) =>
                    setNewEnrollment({
                      ...newEnrollment,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <button
              onClick={createEnrollment}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
            >
              Thêm Enrollment
            </button>
          </div>
        </div>
      )}
      {showPhotoModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="p-4 border rounded-md mb-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Upload Ảnh Học sinh</h3>
            <div className="mb-4">
              <h4 className="font-semibold">Upload 1 ảnh cho 1 học sinh</h4>
              <div className="flex gap-2">
                <select
                  className="border p-2 rounded"
                  value={newPhoto.student}
                  onChange={(e) =>
                    setNewPhoto({ ...newPhoto, student: e.target.value })
                  }
                >
                  <option value="">--Chọn học sinh--</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.fullName} ({s.code})
                    </option>
                  ))}
                </select>
                <select
                  className="border p-2 rounded"
                  value={newPhoto.schoolYear}
                  onChange={(e) =>
                    setNewPhoto({ ...newPhoto, schoolYear: e.target.value })
                  }
                >
                  <option value="">--Chọn năm học--</option>
                  {/* {schoolYears.map((sy) => (
                  <option key={sy._id} value={sy._id}>
                    {sy.code}
                  </option>
                ))} */}
                </select>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setNewPhoto({ ...newPhoto, file: e.target.files[0] })
                  }
                />
                <button
                  onClick={handleStudentPhotoUpload}
                  className="px-4 py-2 bg-orange-500 text-white rounded"
                >
                  Upload ảnh
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold">
                Upload ZIP ảnh cho nhiều học sinh
              </h4>
              <input
                type="file"
                accept=".zip"
                onChange={handleStudentPhotoZipUpload}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentStudent;
