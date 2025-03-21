import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL, BASE_URL } from "../../config";

const StudentManagement = () => {
  const [activeTab, setActiveTab] = useState("schoolYear");

  // State cho SchoolYear
  const [schoolYears, setSchoolYears] = useState([]);
  const [newSchoolYear, setNewSchoolYear] = useState({
    code: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [editingSchoolYear, setEditingSchoolYear] = useState(null);

  // State cho Class
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState({
    className: "",
    schoolYear: "",
    homeroomTeacher: "",
  });
  const [editingClass, setEditingClass] = useState(null);

  // State cho Student
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({
    studentCode: "",
    name: "",
    email: "",
    birthDate: "",
    gender: "Nam",
  });
  const [editingStudent, setEditingStudent] = useState(null);

  // State cho Enrollment
  const [enrollments, setEnrollments] = useState([]);
  const [newEnrollment, setNewEnrollment] = useState({
    student: "",
    class: "",
    schoolYear: "",
    startDate: "",
    endDate: "",
  });
  const [editingEnrollment, setEditingEnrollment] = useState(null);

  // State cho Photo (upload ảnh)
  const [photos, setPhotos] = useState([]);
  const [zipFile, setZipFile] = useState(null);
  const [newPhoto, setNewPhoto] = useState({
    student: "",
    schoolYear: "",
    file: null, // file object
  });
  const [classZipUploadResult, setClassZipUploadResult] = useState("");
  const [classPhotos, setClassPhotos] = useState([]);

  // Các state phụ trợ
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // 2. FETCH DATA (useEffect)
  // -----------------------------
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSchoolYears(),
        fetchClasses(),
        fetchStudents(),
        fetchEnrollments(),
        fetchPhotos(),
        fetchClassPhotos(), // Gọi luôn ở đây
      ]);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 3. API CALLS
  // -----------------------------

  // ---- SchoolYear ----
  const fetchSchoolYears = async () => {
    const res = await fetch(`${API_URL}/schoolyears`);
    if (!res.ok) throw new Error("Failed to get schoolYears");
    const data = await res.json();
    setSchoolYears(data);
  };
  const createSchoolYear = async () => {
    try {
      const res = await fetch(`${API_URL}/schoolyears`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSchoolYear),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Tạo Năm học thành công!");
      setNewSchoolYear({
        code: "",
        startDate: "",
        endDate: "",
        description: "",
      });
      fetchSchoolYears();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tạo Năm học");
    }
  };
  const updateSchoolYear = async (id) => {
    try {
      const res = await fetch(`${API_URL}/schoolyears/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSchoolYear),
      });
      if (!res.ok) throw new Error("Failed to update SchoolYear");
      toast.success("Cập nhật Năm học thành công!");
      setEditingSchoolYear(null);
      fetchSchoolYears();
    } catch (error) {
      toast.error("Lỗi khi cập nhật Năm học");
    }
  };
  const deleteSchoolYear = async (id) => {
    if (!window.confirm("Chắc chắn xoá?")) return;
    try {
      const res = await fetch(`${API_URL}/schoolyears/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Đã xoá Năm học!");
      fetchSchoolYears();
    } catch (error) {
      toast.error("Không xoá được Năm học");
    }
  };

  // ---- Class ----
  const fetchClassPhotos = async () => {
    try {
      const res = await fetch(`${API_URL}/photos`); // API lấy danh sách ảnh
      if (!res.ok) throw new Error("Failed to get class photos");
      const data = await res.json();

      // Lưu ảnh theo classId để dễ truy xuất
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

  const fetchClasses = async () => {
    const res = await fetch(`${API_URL}/classes`);
    if (!res.ok) throw new Error("Failed to get classes");
    const data = await res.json();
    setClasses(data);
  };
  const createClass = async () => {
    try {
      const res = await fetch(`${API_URL}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Tạo Lớp thành công!");
      setNewClass({ className: "", schoolYear: "", homeroomTeacher: "" });
      fetchClasses();
    } catch (error) {
      toast.error("Lỗi khi tạo Lớp");
    }
  };
  const updateClass = async (id) => {
    try {
      const res = await fetch(`${API_URL}/classes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingClass),
      });
      if (!res.ok) throw new Error("Failed to update class");
      toast.success("Cập nhật Lớp thành công!");
      setEditingClass(null);
      fetchClasses();
    } catch (error) {
      toast.error("Lỗi cập nhật Lớp!");
    }
  };
  const deleteClass = async (id) => {
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

  // ---- Student ----
  const fetchStudents = async () => {
    const res = await fetch(`${API_URL}/students`);
    if (!res.ok) throw new Error("Failed to get students");
    const data = await res.json();
    setStudents(data);
  };
  const createStudent = async () => {
    try {
      const res = await fetch(`${API_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Thêm Học sinh thành công!");
      setNewStudent({
        studentCode: "",
        name: "",
        email: "",
        birthDate: "",
        gender: "Nam",
      });
      fetchStudents();
    } catch (error) {
      toast.error("Lỗi khi thêm Học sinh");
    }
  };
  const updateStudent = async (id) => {
    try {
      const res = await fetch(`${API_URL}/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingStudent),
      });
      if (!res.ok) throw new Error("Failed to update student");
      toast.success("Cập nhật học sinh thành công!");
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      toast.error("Lỗi cập nhật học sinh");
    }
  };
  const deleteStudent = async (id) => {
    if (!window.confirm("Chắc chắn xoá Học sinh này?")) return;
    try {
      const res = await fetch(`${API_URL}/students/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete student");
      toast.success("Đã xoá Học sinh!");
      fetchStudents();
    } catch (error) {
      toast.error("Không thể xoá Học sinh");
    }
  };

  // ---- Enrollment (thêm học sinh vào lớp) ----
  const fetchEnrollments = async () => {
    const res = await fetch(`${API_URL}/enrollments`);
    if (!res.ok) throw new Error("Failed to get enrollments");
    const data = await res.json();
    setEnrollments(data);
  };
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
      toast.success("Đã phân lớp thành công!");
      setNewEnrollment({
        student: "",
        class: "",
        schoolYear: "",
        startDate: "",
        endDate: "",
      });
      fetchEnrollments();
    } catch (error) {
      toast.error("Lỗi phân lớp!");
    }
  };
  const updateEnrollment = async (id) => {
    try {
      const res = await fetch(`${API_URL}/enrollments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEnrollment),
      });
      if (!res.ok) throw new Error("Failed to update enrollment");
      toast.success("Cập nhật Enrollment thành công!");
      setEditingEnrollment(null);
      fetchEnrollments();
    } catch (error) {
      toast.error("Lỗi cập nhật Enrollment");
    }
  };
  const deleteEnrollment = async (id) => {
    if (!window.confirm("Chắc chắn xoá?")) return;
    try {
      const res = await fetch(`${API_URL}/enrollments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete enrollment");
      toast.success("Đã xoá Enrollment!");
      fetchEnrollments();
    } catch (error) {
      toast.error("Lỗi xoá Enrollment!");
    }
  };

  // ---- Photos (upload ảnh hằng năm) ----
  const fetchPhotos = async () => {
    const res = await fetch(`${API_URL}/photos`);
    if (!res.ok) throw new Error("Failed to get photos");
    const data = await res.json();
    setPhotos(data);
  };
  const createPhoto = async () => {
    // POST FormData => /api/photos
    try {
      const formData = new FormData();
      formData.append("student", newPhoto.student);
      formData.append("schoolYear", newPhoto.schoolYear);
      formData.append("photo", newPhoto.file); // 'photo' field theo routes/photoRoutes

      const res = await fetch(`${API_URL}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Upload ảnh thành công!");
      setNewPhoto({ student: "", schoolYear: "", file: null });
      fetchPhotos();
    } catch (error) {
      toast.error("Lỗi upload ảnh");
    }
  };
  const deletePhoto = async (id) => {
    if (!window.confirm("Xoá ảnh này?")) return;
    try {
      const res = await fetch(`${API_URL}/photos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete photo");
      toast.success("Đã xoá ảnh!");
      fetchPhotos();
    } catch (error) {
      toast.error("Không thể xoá ảnh!");
    }
  };
  /* ---------------------------
   * 1) UPLOAD EXCEL - CLASS
   * --------------------------- */
  const [classExcelFile, setClassExcelFile] = useState(null);

  const handleClassExcelUpload = async () => {
    if (!classExcelFile) {
      toast.warning("Bạn chưa chọn file Excel!");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("excelFile", classExcelFile);

      // Gửi lên API (VD: POST /api/classes/bulk)
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
      // Gọi lại fetchClasses() nếu muốn reload danh sách lớp
      fetchClasses();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi upload Excel lớp!");
    }
  };

  /* ---------------------------
   * 2) UPLOAD EXCEL - STUDENT
   * --------------------------- */
  const [studentExcelFile, setStudentExcelFile] = useState(null);

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

  /* ---------------------------
   * 3) UPLOAD EXCEL - ENROLLMENT
   * (nếu cần)
   * --------------------------- */
  const [enrollmentExcelFile, setEnrollmentExcelFile] = useState(null);

  const handleEnrollmentExcelUpload = async () => {
    if (!enrollmentExcelFile) {
      toast.warning("Bạn chưa chọn file Excel!");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("excelFile", enrollmentExcelFile);

      // Gửi lên API (VD: POST /api/enrollments/bulk)
      const res = await fetch(`${API_URL}/enrollments/bulk`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Upload Excel Enrollment thành công!");
      setEnrollmentExcelFile(null);
      fetchEnrollments();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi upload Excel Enrollment!");
    }
  };

  /* ---------------------------
   * 4) UPLOAD MULTIPLE IMAGES - PHOTO
   * --------------------------- */
  const [photoFiles, setPhotoFiles] = useState([]);
  const handleZipUpload = async () => {
    if (!zipFile) {
      toast.warning("Bạn chưa chọn file ZIP!");
      return;
    }
    try {
      const formData = new FormData();
      // Tên field trùng với backend (VD: 'zipFile')
      formData.append("zipFile", zipFile);

      // Gửi lên endpoint /api/photos/bulk-zip (đã có trong code)
      const res = await fetch(`${API_URL}/photos/bulk-zip`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Upload ZIP ảnh thành công!");
      setZipFile(null);
      fetchPhotos();
    } catch (error) {
      toast.error("Lỗi upload ZIP ảnh!");
      console.error(error);
    }
  };

  // Hàm upload ZIP của lớp
  const handleBulkClassPhotoZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
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
    } catch (error) {
      console.error("Error uploading class photos:", error);
      setClassZipUploadResult("Upload thất bại! " + error.message);
    }
  };

  const handlePhotoBulkUpload = async () => {
    if (photoFiles.length === 0) {
      toast.warning("Bạn chưa chọn ảnh nào!");
      return;
    }
    try {
      const formData = new FormData();
      // Cho phép chọn nhiều ảnh
      photoFiles.forEach((file) => formData.append("photo", file));
      const res = await fetch(`${API_URL}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Upload nhiều ảnh thành công!");
      setPhotoFiles([]);
      fetchPhotos();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi upload ảnh!");
    }
  };

  // -----------------------------
  // 4. GIAO DIỆN CHÍNH (render)
  // -----------------------------
  return (
    <div className="p-4 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Quản lý học sinh</h1>

      {/* Thanh tab */}
      <div className="flex gap-2 mb-4">
        {["schoolYear", "class", "student", "enrollment", "photo"].map(
          (tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-md border font-bold 
              ${activeTab === tab ? "bg-blue-500 text-white" : "bg-gray-100"} 
            `}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "schoolYear" && "Năm học"}
              {tab === "class" && "Lớp"}
              {tab === "student" && "Học sinh"}
              {tab === "enrollment" && "Phân lớp (Enrollment)"}
              {tab === "photo" && "Ảnh"}
            </button>
          )
        )}
      </div>

      {/* Nội dung từng tab */}
      <div>
        {/* ------------------------------------ */}
        {/* TAB 1: SCHOOL YEAR */}
        {/* ------------------------------------ */}
        {activeTab === "schoolYear" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Quản lý Năm học</h2>

            {/* Form tạo SchoolYear */}
            <div className="p-4 border rounded-md mb-4 bg-gray-50">
              <div className="flex gap-4 mb-2">
                <div>
                  <label className="block text-sm font-bold">Mã năm học</label>
                  <input
                    className="border p-2 rounded w-52"
                    type="text"
                    value={newSchoolYear.code}
                    onChange={(e) =>
                      setNewSchoolYear({
                        ...newSchoolYear,
                        code: e.target.value,
                      })
                    }
                    placeholder="VD: 2023-2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Bắt đầu</label>
                  <input
                    className="border p-2 rounded w-52"
                    type="date"
                    value={newSchoolYear.startDate}
                    onChange={(e) =>
                      setNewSchoolYear({
                        ...newSchoolYear,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Kết thúc</label>
                  <input
                    className="border p-2 rounded w-52"
                    type="date"
                    value={newSchoolYear.endDate}
                    onChange={(e) =>
                      setNewSchoolYear({
                        ...newSchoolYear,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <label className="block text-sm font-bold mb-1">Mô tả</label>
              <textarea
                className="border p-2 rounded w-full"
                value={newSchoolYear.description}
                onChange={(e) =>
                  setNewSchoolYear({
                    ...newSchoolYear,
                    description: e.target.value,
                  })
                }
                placeholder="VD: Năm học mới..."
              />
              <button
                onClick={createSchoolYear}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Thêm Năm học
              </button>
            </div>

            {/* Danh sách SchoolYear */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Mã</th>
                  <th className="p-2 text-left">Bắt đầu</th>
                  <th className="p-2 text-left">Kết thúc</th>
                  <th className="p-2 text-left">Mô tả</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {schoolYears.map((sy, idx) => (
                  <tr key={sy._id} className="border-b">
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2 font-bold">{sy.code}</td>
                    <td className="p-2">{sy.startDate?.substring(0, 10)}</td>
                    <td className="p-2">{sy.endDate?.substring(0, 10)}</td>
                    <td className="p-2">{sy.description}</td>
                    <td className="p-2 text-right">
                      {editingSchoolYear?._id === sy._id ? (
                        <>
                          <button
                            onClick={() => updateSchoolYear(sy._id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingSchoolYear(null)}
                            className="px-3 py-1 bg-gray-300 rounded"
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingSchoolYear(sy)}
                            className="px-3 py-1 bg-yellow-400 text-white rounded mr-2"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => deleteSchoolYear(sy._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded"
                          >
                            Xoá
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Nếu đang sửa => hiển thị form inline */}
            {editingSchoolYear && (
              <div className="bg-white p-4 mt-2 rounded border">
                <h3 className="font-semibold mb-2">Chỉnh sửa Năm học</h3>
                <input
                  type="text"
                  className="border p-2 rounded mr-2"
                  placeholder="Mã năm học"
                  value={editingSchoolYear.code || ""}
                  onChange={(e) =>
                    setEditingSchoolYear({
                      ...editingSchoolYear,
                      code: e.target.value,
                    })
                  }
                />
                <input
                  type="date"
                  className="border p-2 rounded mr-2"
                  value={editingSchoolYear.startDate?.substring(0, 10) || ""}
                  onChange={(e) =>
                    setEditingSchoolYear({
                      ...editingSchoolYear,
                      startDate: e.target.value,
                    })
                  }
                />
                <input
                  type="date"
                  className="border p-2 rounded mr-2"
                  value={editingSchoolYear.endDate?.substring(0, 10) || ""}
                  onChange={(e) =>
                    setEditingSchoolYear({
                      ...editingSchoolYear,
                      endDate: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  className="border p-2 rounded mr-2"
                  placeholder="Mô tả"
                  value={editingSchoolYear.description || ""}
                  onChange={(e) =>
                    setEditingSchoolYear({
                      ...editingSchoolYear,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------ */}
        {/* TAB 2: CLASS */}
        {/* ------------------------------------ */}
        {activeTab === "class" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Quản lý Lớp</h2>
            {/* Form tạo Lớp */}
            <div className="p-4 border rounded-md mb-4 bg-gray-50">
              <div className="flex gap-4 mb-2">
                <div>
                  <label className="block text-sm font-bold">Tên lớp</label>
                  <input
                    className="border p-2 rounded"
                    type="text"
                    value={newClass.className}
                    onChange={(e) =>
                      setNewClass({ ...newClass, className: e.target.value })
                    }
                    placeholder="VD: 10A1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Năm học</label>
                  <select
                    className="border p-2 rounded"
                    value={newClass.schoolYear}
                    onChange={(e) =>
                      setNewClass({ ...newClass, schoolYear: e.target.value })
                    }
                  >
                    <option value="">--Chọn--</option>
                    {schoolYears.map((sy) => (
                      <option key={sy._id} value={sy._id}>
                        {sy.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold">GVCN</label>
                  <input
                    className="border p-2 rounded"
                    type="text"
                    value={newClass.homeroomTeacher}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        homeroomTeacher: e.target.value,
                      })
                    }
                    placeholder="VD: Thầy A"
                  />
                </div>
              </div>
              <button
                onClick={createClass}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Thêm Lớp
              </button>
              <div className="mt-4 bg-gray-50 p-4 border rounded-md">
                <h3 className="font-semibold mb-2">Upload Excel Lớp</h3>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setClassExcelFile(e.target.files[0])}
                />
                <button
                  onClick={handleClassExcelUpload}
                  className="ml-2 px-4 py-2 bg-orange-500 text-white rounded"
                >
                  Upload
                </button>
                <div className="mt-8 border p-3">
                  <h3 className="text-lg font-semibold mb-2">
                    Bulk Upload Ảnh Lớp (ZIP)
                  </h3>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleBulkClassPhotoZip}
                    className="border p-2"
                  />
                  {classZipUploadResult && (
                    <p className="mt-2 text-green-600">
                      {classZipUploadResult}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Danh sách Lớp */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Tên lớp</th>
                  <th className="p-2 text-left">Năm học</th>
                  <th className="p-2 text-left">GVCN</th>
                  <th className="p-2 text-left">Ảnh</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c, idx) => (
                  <tr key={c._id} className="border-b">
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2 font-bold">{c.className}</td>
                    <td className="p-2">{c.schoolYear?.code}</td>
                    <td className="p-2">{c.homeroomTeacher}</td>
                    <td className="p-2">
                      {classPhotos[c._id] ? (
                        <img
                          src={`${BASE_URL}/${classPhotos[c._id]}`}
                          alt="Class Photo"
                          className="w-50 h-50 object-cover"
                        />
                      ) : (
                        <span className="text-gray-500">Chưa có</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {editingClass?._id === c._id ? (
                        <>
                          <button
                            onClick={() => updateClass(c._id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingClass(null)}
                            className="px-3 py-1 bg-gray-300 rounded"
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingClass(c)}
                            className="px-3 py-1 bg-yellow-400 text-white rounded mr-2"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => deleteClass(c._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded"
                          >
                            Xoá
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Form sửa Class inline */}
            {editingClass && (
              <div className="bg-white p-4 mt-2 rounded border">
                <h3 className="font-semibold mb-2">Chỉnh sửa Lớp</h3>
                <input
                  type="text"
                  className="border p-2 rounded mr-2"
                  placeholder="Tên lớp"
                  value={editingClass.className || ""}
                  onChange={(e) =>
                    setEditingClass({
                      ...editingClass,
                      className: e.target.value,
                    })
                  }
                />
                <select
                  className="border p-2 rounded mr-2"
                  value={
                    editingClass.schoolYear?._id || editingClass.schoolYear
                  }
                  onChange={(e) =>
                    setEditingClass({
                      ...editingClass,
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
                <input
                  type="text"
                  className="border p-2 rounded mr-2"
                  placeholder="GVCN"
                  value={editingClass.homeroomTeacher || ""}
                  onChange={(e) =>
                    setEditingClass({
                      ...editingClass,
                      homeroomTeacher: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------ */}
        {/* TAB 3: STUDENT */}
        {/* ------------------------------------ */}
        {activeTab === "student" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Quản lý Học sinh</h2>

            {/* Form tạo Student */}
            <div className="p-4 border rounded-md mb-4 bg-gray-50">
              <div className="flex gap-4 mb-2">
                <div>
                  <label className="block text-sm font-bold">Mã HS</label>
                  <input
                    className="border p-2 rounded"
                    type="text"
                    value={newStudent.studentCode}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        studentCode: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Họ Tên</label>
                  <input
                    className="border p-2 rounded"
                    type="text"
                    value={newStudent.name}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Email</label>
                  <input
                    className="border p-2 rounded"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4 mb-2">
                <div>
                  <label className="block text-sm font-bold">Ngày sinh</label>
                  <input
                    className="border p-2 rounded"
                    type="date"
                    value={newStudent.birthDate}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        birthDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Giới tính</label>
                  <select
                    className="border p-2 rounded"
                    value={newStudent.gender}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, gender: e.target.value })
                    }
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
              <button
                onClick={createStudent}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Thêm Học sinh
              </button>
              {/* Nút upload Excel học sinh */}
              <div className="mt-4 bg-gray-50 p-4 border rounded-md">
                <h3 className="font-semibold mb-2">Upload Excel Học sinh</h3>
                <p className="text-sm text-gray-500 mb-2">
                  File Excel gồm các cột: STT - Họ tên HS - ID học sinh - Ngày
                  sinh (DD/MM/YYYY)
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setStudentExcelFile(e.target.files[0])}
                />
                <button
                  onClick={handleStudentExcelUpload}
                  className="ml-2 px-4 py-2 bg-orange-500 text-white rounded"
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Danh sách Student */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Mã HS</th>
                  <th className="p-2 text-left">Họ Tên</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Ngày sinh</th>
                  <th className="p-2 text-left">Giới tính</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s._id} className="border-b">
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2 font-bold">{s.studentCode}</td>
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{s.email}</td>
                    <td className="p-2">
                      {s.birthDate ? s.birthDate.substring(0, 10) : ""}
                    </td>
                    <td className="p-2">{s.gender}</td>
                    <td className="p-2 text-right">
                      {editingStudent?._id === s._id ? (
                        <>
                          <button
                            onClick={() => updateStudent(s._id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingStudent(null)}
                            className="px-3 py-1 bg-gray-300 rounded"
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingStudent(s)}
                            className="px-3 py-1 bg-yellow-400 text-white rounded mr-2"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => deleteStudent(s._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded"
                          >
                            Xoá
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Form sửa Student inline */}
            {editingStudent && (
              <div className="bg-white p-4 mt-2 rounded border">
                <h3 className="font-semibold mb-2">Chỉnh sửa Học sinh</h3>
                <input
                  type="text"
                  className="border p-2 rounded mr-2"
                  placeholder="Mã HS"
                  value={editingStudent.studentCode || ""}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      studentCode: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  className="border p-2 rounded mr-2"
                  placeholder="Họ Tên"
                  value={editingStudent.name || ""}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      name: e.target.value,
                    })
                  }
                />
                <input
                  type="email"
                  className="border p-2 rounded mr-2"
                  placeholder="Email"
                  value={editingStudent.email || ""}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      email: e.target.value,
                    })
                  }
                />
                <input
                  type="date"
                  className="border p-2 rounded mr-2"
                  value={
                    editingStudent.birthDate
                      ? editingStudent.birthDate.substring(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      birthDate: e.target.value,
                    })
                  }
                />
                <select
                  className="border p-2 rounded"
                  value={editingStudent.gender || "Nam"}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      gender: e.target.value,
                    })
                  }
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------ */}
        {/* TAB 4: ENROLLMENT */}
        {/* ------------------------------------ */}
        {activeTab === "enrollment" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Phân lớp (Enrollment)
            </h2>

            {/* Form tạo Enrollment */}
            <div className="p-4 border rounded-md mb-4 bg-gray-50">
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
                    <option value="">--Chọn--</option>
                    {students.map((st) => (
                      <option key={st._id} value={st._id}>
                        {st.name} ({st.studentCode})
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
                    <option value="">--Chọn--</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.className} - {c.schoolYear?.code}
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
                    <option value="">--Chọn--</option>
                    {schoolYears.map((sy) => (
                      <option key={sy._id} value={sy._id}>
                        {sy.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mb-2">
                <div>
                  <label className="block text-sm font-bold">
                    Ngày bắt đầu
                  </label>
                  <input
                    className="border p-2 rounded"
                    type="date"
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
                  <label className="block text-sm font-bold">
                    Ngày kết thúc
                  </label>
                  <input
                    className="border p-2 rounded"
                    type="date"
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
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Thêm Enrollment
              </button>
              {/* Nút upload Excel enrollment */}
              <div className="mt-4 bg-gray-50 p-4 border rounded-md">
                <h3 className="font-semibold mb-2">Upload Excel Enrollment</h3>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setEnrollmentExcelFile(e.target.files[0])}
                />
                <button
                  onClick={handleEnrollmentExcelUpload}
                  className="ml-2 px-4 py-2 bg-orange-500 text-white rounded"
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Danh sách Enrollment */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Học sinh</th>
                  <th className="p-2 text-left">Lớp</th>
                  <th className="p-2 text-left">Năm học</th>
                  <th className="p-2 text-left">Bắt đầu</th>
                  <th className="p-2 text-left">Kết thúc</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enr, idx) => (
                  <tr key={enr._id} className="border-b">
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2">
                      {enr.student?.name} ({enr.student?.studentCode})
                    </td>
                    <td className="p-2">{enr.class?.className}</td>
                    <td className="p-2">{enr.schoolYear?.code}</td>
                    <td className="p-2">
                      {enr.startDate ? enr.startDate.substring(0, 10) : ""}
                    </td>
                    <td className="p-2">
                      {enr.endDate ? enr.endDate.substring(0, 10) : ""}
                    </td>
                    <td className="p-2 text-right">
                      {editingEnrollment?._id === enr._id ? (
                        <>
                          <button
                            onClick={() => updateEnrollment(enr._id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingEnrollment(null)}
                            className="px-3 py-1 bg-gray-300 rounded"
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingEnrollment(enr)}
                            className="px-3 py-1 bg-yellow-400 text-white rounded mr-2"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => deleteEnrollment(enr._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded"
                          >
                            Xoá
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Form sửa Enrollment inline */}
            {editingEnrollment && (
              <div className="bg-white p-4 mt-2 rounded border">
                <h3 className="font-semibold mb-2">Chỉnh sửa Enrollment</h3>
                <select
                  className="border p-2 rounded mr-2"
                  value={
                    editingEnrollment.student?._id || editingEnrollment.student
                  }
                  onChange={(e) =>
                    setEditingEnrollment({
                      ...editingEnrollment,
                      student: e.target.value,
                    })
                  }
                >
                  <option value="">--Chọn học sinh--</option>
                  {students.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name} ({st.studentCode})
                    </option>
                  ))}
                </select>
                <select
                  className="border p-2 rounded mr-2"
                  value={
                    editingEnrollment.class?._id || editingEnrollment.class
                  }
                  onChange={(e) =>
                    setEditingEnrollment({
                      ...editingEnrollment,
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
                <select
                  className="border p-2 rounded mr-2"
                  value={
                    editingEnrollment.schoolYear?._id ||
                    editingEnrollment.schoolYear
                  }
                  onChange={(e) =>
                    setEditingEnrollment({
                      ...editingEnrollment,
                      schoolYear: e.target.value,
                    })
                  }
                >
                  <option value="">--Năm học--</option>
                  {schoolYears.map((sy) => (
                    <option key={sy._id} value={sy._id}>
                      {sy.code}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="border p-2 rounded mr-2"
                  value={
                    editingEnrollment.startDate
                      ? editingEnrollment.startDate.substring(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    setEditingEnrollment({
                      ...editingEnrollment,
                      startDate: e.target.value,
                    })
                  }
                />
                <input
                  type="date"
                  className="border p-2 rounded mr-2"
                  value={
                    editingEnrollment.endDate
                      ? editingEnrollment.endDate.substring(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    setEditingEnrollment({
                      ...editingEnrollment,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------ */}
        {/* TAB 5: PHOTO */}
        {/* ------------------------------------ */}
        {activeTab === "photo" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Quản lý Ảnh học sinh</h2>

            {/* Form upload ảnh */}
            <div className="p-4 border rounded-md mb-4 bg-gray-50">
              <div className="flex gap-4 mb-2">
                <div>
                  <label className="block text-sm font-bold">Học sinh</label>
                  <select
                    className="border p-2 rounded"
                    value={newPhoto.student}
                    onChange={(e) =>
                      setNewPhoto({ ...newPhoto, student: e.target.value })
                    }
                  >
                    <option value="">--Chọn--</option>
                    {students.map((st) => (
                      <option key={st._id} value={st._id}>
                        {st.name} ({st.studentCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold">Năm học</label>
                  <select
                    className="border p-2 rounded"
                    value={newPhoto.schoolYear}
                    onChange={(e) =>
                      setNewPhoto({ ...newPhoto, schoolYear: e.target.value })
                    }
                  >
                    <option value="">--Chọn--</option>
                    {schoolYears.map((sy) => (
                      <option key={sy._id} value={sy._id}>
                        {sy.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold">Chọn ảnh</label>
                  <input
                    className="border p-2 rounded w-60"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setNewPhoto({ ...newPhoto, file });
                    }}
                  />
                </div>
              </div>
              <button
                onClick={createPhoto}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Upload ảnh
              </button>
              <div className="mt-4 bg-gray-50 p-4 border rounded-md">
                <h3 className="font-semibold mb-2">
                  Upload nhiều ảnh cùng lúc
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  Đặt tên file theo ID Học sinh (và có thể kèm năm học), ví dụ:{" "}
                  <br />
                  <code>1001_2023-2024.jpg</code> (server parse để xác định ID =
                  1001, year = 2023-2024)
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setPhotoFiles(Array.from(e.target.files))}
                />
                <button
                  onClick={handlePhotoBulkUpload}
                  className="ml-2 px-4 py-2 bg-orange-500 text-white rounded"
                >
                  Upload
                </button>
              </div>
              {/* Bên dưới form upload single, upload multiple... */}
              <div className="mt-4 bg-gray-50 p-4 border rounded-md">
                <h3 className="font-semibold mb-2">Upload file ZIP</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Nén nhiều ảnh vào 1 file .zip. Tên file ảnh là mã học sinh, ví
                  dụ "HS001.jpg".
                </p>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files[0])}
                />
                <button
                  onClick={handleZipUpload}
                  className="ml-2 px-4 py-2 bg-orange-500 text-white rounded"
                >
                  Upload ZIP
                </button>
              </div>
            </div>

            {/* Danh sách ảnh */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Học sinh</th>
                    <th className="p-2 text-left">Năm học</th>
                    <th className="p-2 text-left">Ảnh</th>
                    <th className="p-2 text-left">Thời gian up</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {photos.map((p, idx) => (
                    <tr key={p._id} className="border-b">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">
                        {p.student?.name} ({p.student?.studentCode})
                      </td>
                      <td className="p-2">{p.schoolYear?.code}</td>
                      <td className="p-2">
                        {p.photoUrl ? (
                          <img
                            src={`${BASE_URL}/${p.photoUrl}`}
                            alt="student"
                            className="h-16 object-cover border rounded"
                          />
                        ) : (
                          "No image"
                        )}
                      </td>
                      <td className="p-2">
                        {p.uploadedAt ? p.uploadedAt.substring(0, 10) : ""}
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => deletePhoto(p._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded"
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="mt-4 text-blue-500 font-semibold">
          Đang tải dữ liệu...
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
