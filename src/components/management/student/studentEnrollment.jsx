import React, { useEffect, useState } from "react";
import { API_URL } from "../../../config";
import { toast } from "react-toastify";

const StudentEnrollment = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [formData, setFormData] = useState({
    studentId: "",
    classId: "",
    schoolYearId: "",
    enrollmentDate: "",
  });

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/enrollments`);
      const data = await res.json();
      setEnrollments(data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu phân lớp!");
    }
    setLoading(false);
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/students`);
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu học sinh!");
    }
  };

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
      const res = await fetch(`${API_URL}/schoolyears`);
      const data = await res.json();
      setSchoolYears(data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu năm học!");
    }
  };

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchClasses();
    fetchSchoolYears();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch(`${API_URL}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Tạo phân lớp thành công!");
      setShowCreateModal(false);
      setFormData({
        studentId: "",
        classId: "",
        schoolYearId: "",
        enrollmentDate: "",
      });
      fetchEnrollments();
    } catch (error) {
      toast.error("Lỗi khi tạo phân lớp");
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(
        `${API_URL}/enrollments/${selectedEnrollment._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      if (!res.ok) throw new Error("Failed to update enrollment");
      toast.success("Cập nhật phân lớp thành công!");
      setShowEditModal(false);
      setSelectedEnrollment(null);
      fetchEnrollments();
    } catch (error) {
      toast.error("Lỗi khi cập nhật phân lớp!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Chắc chắn xoá?")) return;
    try {
      const res = await fetch(`${API_URL}/enrollments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete enrollment");
      toast.success("Đã xoá phân lớp!");
      fetchEnrollments();
    } catch (error) {
      toast.error("Lỗi xoá phân lớp!");
    }
  };

  const openEditModal = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setFormData({
      studentId: enrollment.student?._id || enrollment.student,
      classId: enrollment.class?._id || enrollment.class,
      schoolYearId: enrollment.schoolYear?._id || enrollment.schoolYear,
      enrollmentDate: enrollment.enrollmentDate
        ? enrollment.enrollmentDate.substring(0, 10)
        : "",
    });
    setShowEditModal(true);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Quản lý Phân lớp</h1>
      <button
        onClick={() => setShowCreateModal(true)}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded"
      >
        Thêm Phân lớp
      </button>
      {loading ? (
        <div>Đang tải dữ liệu...</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Học sinh</th>
              <th className="p-2 text-left">Lớp</th>
              <th className="p-2 text-left">Năm học</th>
              <th className="p-2 text-left">Ngày phân lớp</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((en, idx) => (
              <tr key={en._id} className="border-b">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2">{en.student?.fullName || en.student}</td>
                <td className="p-2">{en.class?.className || en.class}</td>
                <td className="p-2">{en.schoolYear?.code || en.schoolYear}</td>
                <td className="p-2">
                  {en.enrollmentDate ? en.enrollmentDate.substring(0, 10) : ""}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => openEditModal(en)}
                    className="mr-2 px-3 py-1 bg-yellow-400 text-white rounded"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(en._id)}
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

      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-xl font-bold mb-4">Tạo Phân lớp mới</h2>
            <select
              className="border p-2 rounded mb-2 w-full"
              value={formData.studentId}
              onChange={(e) =>
                setFormData({ ...formData, studentId: e.target.value })
              }
            >
              <option value="">Chọn Học sinh</option>
              {students.map((stu) => (
                <option key={stu._id} value={stu._id}>
                  {stu.fullName}
                </option>
              ))}
            </select>
            <select
              className="border p-2 rounded mb-2 w-full"
              value={formData.classId}
              onChange={(e) =>
                setFormData({ ...formData, classId: e.target.value })
              }
            >
              <option value="">Chọn Lớp</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.className}
                </option>
              ))}
            </select>
            <select
              className="border p-2 rounded mb-2 w-full"
              value={formData.schoolYearId}
              onChange={(e) =>
                setFormData({ ...formData, schoolYearId: e.target.value })
              }
            >
              <option value="">Chọn Năm học</option>
              {schoolYears.map((sy) => (
                <option key={sy._id} value={sy._id}>
                  {sy.code}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="border p-2 rounded mb-2 w-full"
              placeholder="Ngày phân lớp"
              value={formData.enrollmentDate}
              onChange={(e) =>
                setFormData({ ...formData, enrollmentDate: e.target.value })
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
            <h2 className="text-xl font-bold mb-4">Chỉnh sửa Phân lớp</h2>
            <select
              className="border p-2 rounded mb-2 w-full"
              value={formData.studentId}
              onChange={(e) =>
                setFormData({ ...formData, studentId: e.target.value })
              }
            >
              <option value="">Chọn Học sinh</option>
              {students.map((stu) => (
                <option key={stu._id} value={stu._id}>
                  {stu.fullName}
                </option>
              ))}
            </select>
            <select
              className="border p-2 rounded mb-2 w-full"
              value={formData.classId}
              onChange={(e) =>
                setFormData({ ...formData, classId: e.target.value })
              }
            >
              <option value="">Chọn Lớp</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.className}
                </option>
              ))}
            </select>
            <select
              className="border p-2 rounded mb-2 w-full"
              value={formData.schoolYearId}
              onChange={(e) =>
                setFormData({ ...formData, schoolYearId: e.target.value })
              }
            >
              <option value="">Chọn Năm học</option>
              {schoolYears.map((sy) => (
                <option key={sy._id} value={sy._id}>
                  {sy.code}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="border p-2 rounded mb-2 w-full"
              placeholder="Ngày phân lớp"
              value={formData.enrollmentDate}
              onChange={(e) =>
                setFormData({ ...formData, enrollmentDate: e.target.value })
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
    </div>
  );
};

export default StudentEnrollment;
