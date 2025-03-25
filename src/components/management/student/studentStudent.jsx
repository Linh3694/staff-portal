import React, { useEffect, useState, useRef } from "react";
import { API_URL } from "../../../config";
import { toast } from "react-toastify";
import { FiEdit, FiTrash2 } from "react-icons/fi";

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
    studentInput: "",
    class: "",
    classInput: "",
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
  const [schoolYears, setSchoolYears] = useState([]);

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
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu học sinh!");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchSchoolYears();
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
                    {student.code}
                  </p>
                </td>
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">
                    {" "}
                    {student.fullName}
                  </p>
                </td>
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">
                    {" "}
                    {student.dateOfBirth
                      ? student.dateOfBirth.substring(0, 10)
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-[20px] w-96">
            <h2 className="text-xl font-bold mb-4">Tạo Học sinh mới</h2>
            <label className="font-semibold ml-2 text-base">Mã học sinh</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập mã học sinh..."
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
            />
            <label className="font-semibold ml-2 text-base">Họ và tên</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập tên học sinh..."
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
            <label className="font-semibold ml-2 text-base">Ngày sinh</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập ngày sinh..."
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
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
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded w-96">
            <label className="font-semibold ml-2 text-base">Mã học sinh</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập mã học sinh..."
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
            />
            <label className="font-semibold ml-2 text-base">Họ và tên</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập tên học sinh..."
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
            <label className="font-semibold ml-2 text-base">Ngày sinh</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập ngày sinh..."
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
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
            <div className="flex justify-end">
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
      {showEnrollmentModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-[20px] w-96">
            <h3 className="font-semibold mb-2">Gán học sinh vào lớp</h3>
            <label className="block text-sm font-bold">Học sinh</label>
            <input
              list="studentSuggestions"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập mã học sinh..."
              value={newEnrollment.studentInput || ""}
              onChange={(e) => {
                const inputValue = e.target.value;
                setNewEnrollment((prev) => ({
                  ...prev,
                  studentInput: inputValue,
                }));
                // Tìm học sinh có mã khớp để lưu lại _id
                const found = students.find((s) => s.code === inputValue);
                if (found) {
                  setNewEnrollment((prev) => ({ ...prev, student: found._id }));
                } else {
                  setNewEnrollment((prev) => ({ ...prev, student: "" }));
                }
              }}
            />
            <datalist id="studentSuggestions">
              {newEnrollment.studentInput &&
                students
                  .filter(
                    (s) =>
                      s.code
                        .toLowerCase()
                        .includes(newEnrollment.studentInput.toLowerCase()) ||
                      s.fullName
                        .toLowerCase()
                        .includes(newEnrollment.studentInput.toLowerCase())
                  )
                  .slice(0, 5)
                  .map((s) => (
                    <option key={s._id} value={s.code}>
                      {s.fullName} ({s.code})
                    </option>
                  ))}
            </datalist>

            <label className="block text-sm font-bold">Lớp</label>
            <input
              list="classSuggestions"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="Nhập tên lớp..."
              value={newEnrollment.classInput || ""}
              onChange={(e) => {
                const inputValue = e.target.value;
                setNewEnrollment((prev) => ({
                  ...prev,
                  classInput: inputValue,
                }));
                const found = classes.find((c) => c.className === inputValue);
                if (found) {
                  setNewEnrollment((prev) => ({ ...prev, class: found._id }));
                } else {
                  setNewEnrollment((prev) => ({ ...prev, class: "" }));
                }
              }}
            />
            <datalist id="classSuggestions">
              {newEnrollment.classInput &&
                classes
                  .filter((c) =>
                    c.className
                      .toLowerCase()
                      .includes(newEnrollment.classInput.toLowerCase())
                  )
                  .slice(0, 5)
                  .map((c) => (
                    <option key={c._id} value={c.className}>
                      {c.className}
                    </option>
                  ))}
            </datalist>

            <label className="block text-sm font-bold">Năm học</label>
            <select
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              value={newEnrollment.schoolYear}
              onChange={(e) =>
                setNewEnrollment({
                  ...newEnrollment,
                  schoolYear: e.target.value,
                })
              }
            >
              <option value="">--Chọn năm học--</option>
              {schoolYears.map((sy) => (
                <option key={sy._id} value={sy._id}>
                  {sy.code}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 mt-2">
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setShowEnrollmentModal(false);
                    setNewEnrollment({
                      student: "",
                      studentInput: "",
                      class: "",
                      classInput: "",
                      schoolYear: "",
                      startDate: "",
                      endDate: "",
                    });
                  }}
                  className="px-3 py-2 bg-orange-red text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#ff6b3a] transform transition-transform duration-300 hover:scale-105"
                >
                  Huỷ
                </button>
                <button
                  onClick={createEnrollment}
                  className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105"
                >
                  Thêm Enrollment
                </button>
              </div>
            </div>
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
