import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { API_URL } from "../../config"; // tùy đường dẫn config
import { FiEdit, FiTrash2 } from "react-icons/fi";


const StudentTable = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newStudent, setNewStudent] = useState({
    studentCode: "",
    name: "",
    email: "",
    klass: [],
    birthYear: ""
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [file, setFile] = useState(null);

  // Lấy danh sách students
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/students`);
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Không thể tải danh sách học sinh!");
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Thêm student
  const handleCreateStudent = async () => {
    try {
      const { studentCode, name, email, klass, birthYear } = newStudent;
  
      if (!klass || (typeof klass === "string" && klass.trim() === "")) {
        toast.error("Vui lòng nhập lớp hiện tại!");
        return;
      } 
  
      const formattedStudent = {
        studentCode,
        name,
        email,
        klass: [{ year: new Date().getFullYear(), className: klass }],
        birthYear,
      };
  
      const response = await fetch(`${API_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedStudent),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
  
      toast.success("Thêm học sinh thành công!");
      setIsAddModalOpen(false);
      setNewStudent({
        studentCode: "",
        name: "",
        email: "",
        klass: "",
        birthYear: "",
      });
      fetchStudents();
    } catch (error) {
      console.error("Error creating student:", error);
      toast.error("Lỗi khi thêm học sinh!");
    }
  };

  // Sửa
  const handleUpdateStudent = async () => {
    try {
      const { studentCode, name, email, klass, birthYear } = selectedStudent;
  
      if (!klass || (typeof klass === "string" && klass.trim() === "")) {
        toast.error("Vui lòng nhập lớp hiện tại!");
        return;
      }
  
      const updatedStudent = {
        ...selectedStudent,
        klass: [
          ...selectedStudent.klass,
          { year: new Date().getFullYear(), className: klass },
        ],
      };
  
      const response = await fetch(`${API_URL}/students/${selectedStudent._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStudent),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update student");
      }
  
      toast.success("Cập nhật thông tin học sinh thành công!");
      setIsEditModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Lỗi khi cập nhật học sinh!");
    }
  };

  // Xoá
  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá học sinh này?")) return;

    try {
      const response = await fetch(`${API_URL}/students/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete student");
      }
      toast.success("Xoá học sinh thành công!");
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Lỗi khi xoá học sinh!");
    }
  };

  // Lọc theo searchTerm
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter((std) => {
      const combined = [
        std.studentCode,
        std.name,
        std.email,
        ...std.klass.map((k) => `${k.year} ${k.className}`), // Lọc cả lịch sử lớp học
      ]
        .join(" ")
        .toLowerCase();
      return combined.includes(searchTerm.toLowerCase());
    });
  }, [students, searchTerm]);

  return (
    <div className="w-full h-full p-6 bg-white rounded-2xl shadow-xl">
      <div className="text-2xl font-bold text-navy-700">Danh sách học sinh</div>
      <div className="flex mt-4 mb-4 justify-between">
          <div className=" items-center">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 w-72"
            />
          </div>
          <div className="flex justify-end items-center gap-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 ">
              Thêm mới
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-[#FF5733] text-white text-sm font-bold px-3 py-2 rounded-lg shadow-2xl hover:bg-[#cc4529]transform transition-transform duration-300 hover:scale-105 "
              >
              Upload 
            </button>
          </div>
      </div>
      {/* Thanh tìm kiếm */}
      

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">MÃ HS</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">HỌ TÊN</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">EMAIL</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">LỚP</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">NĂM SINH</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">HÀNH ĐỘNG</p>
              </th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  Không có dữ liệu học sinh
                </td>
              </tr>
            ) : (
              <>
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="min-w-[150px] border-white/0 py-3 pr-4">
                      <p className="text-sm font-semibold text-navy-700">{student.studentCode}
                      </p>
                    </td>
                    <td className="min-w-[150px] border-white/0 py-3 pr-4">
                      <p className="text-sm font-semibold text-navy-700">{student.name}
                      </p>
                    </td>
                    <td className="min-w-[150px] border-white/0 py-3 pr-4">
                      <p className="text-sm font-semibold text-navy-700">{student.email}
                      </p>
                    </td>
                    <td className="py-2">
                      {student.klass.length > 0 ? (
                        student.klass.map((k, index) => (
                          <span key={index} className="text-xs block">
                            {k.className}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs">Chưa có thông tin</span>
                      )}
                    </td>
                    <td className="min-w-[150px] border-white/0 py-3 pr-4">
                        <p className="text-sm font-semibold text-navy-700">{student.birthYear || ""}
                        </p>
                      </td>
                    <td className="min-w-[150px] border-white/0 py-3 pr-4 text-left">
                    <div className="flex justify-start space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsEditModalOpen(true);
                        }}
                        className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                       <FiEdit size={14} />

                      </button>{" "}
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg  transform transition-transform duration-300 hover:scale-105"
                        >
                      <FiTrash2 size={14} />
                      </button>
                    </div>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm Học Sinh */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[500px]">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Thêm học sinh mới</h3>
            <label className="block mt-2">
              Mã HS:
              <input
                type="text"
                value={newStudent.studentCode}
                onChange={(e) => setNewStudent({ ...newStudent, studentCode: e.target.value })}
                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
              />
            </label>
            <label className="block mt-2">
              Họ và Tên:
              <input
                type="text"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
              />
            </label>
            <label className="block mt-2">
              Email:
              <input
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
              />
            </label>
            <label className="block mt-2">
              Lớp:
              <input
                type="text"
                value={newStudent.klass}
                onChange={(e) => setNewStudent({ ...newStudent, klass: e.target.value })}
                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
              />
            </label>
            <label className="block mt-2">
              Năm sinh:
              <input
                type="number"
                value={newStudent.birthYear}
                onChange={(e) => setNewStudent({ ...newStudent, birthYear: e.target.value })}
                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
              />
            </label>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 mr-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateStudent}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa Học Sinh */}
      {isEditModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[500px]">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Cập nhật thông tin</h3>
            <label className="block mt-2">
              Mã HS:
              <input
                type="text"
                value={selectedStudent.studentCode}
                onChange={(e) =>
                  setSelectedStudent({ ...selectedStudent, studentCode: e.target.value })
                }
                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
              />
            </label>
            <label className="block mt-2">
              Họ và Tên:
              <input
                type="text"
                value={selectedStudent.name}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, name: e.target.value })}
                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
              />
            </label>
            <label className="block mt-2">
              Email:
              <input
                type="email"
                value={selectedStudent.email}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, email: e.target.value })}
                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
              />
            </label>
            <label className="block mt-2">
              Lớp: 
            <input
              type="text"
              value={selectedStudent.klass?.map(k => k.className).join(", ") || ""}
              onChange={(e) =>
                setSelectedStudent({
                  ...selectedStudent,
                  klass: [{ year: new Date().getFullYear(), className: e.target.value }],
                })
              }
              className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
            />
            </label>
            <label className="block mt-2">
              Năm sinh:
              <input
                type="number"
                value={selectedStudent.birthYear || ""}
                onChange={(e) =>
                  setSelectedStudent({ ...selectedStudent, birthYear: e.target.value })
                }
                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
              />
            </label>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 mr-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateStudent}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-[500px]">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Upload Excel</h3>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setFile(e.target.files[0])}
                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 mr-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    if (!file) {
                      toast.error("Vui lòng chọn một file Excel!");
                      return;
                    }
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const response = await fetch(`${API_URL}/students/upload`, {
                        method: "POST",
                        body: formData,
                      });
                      if (!response.ok) {
                        throw new Error(await response.text());
                      }
                      toast.success("Upload và xử lý dữ liệu thành công!");
                      setIsUploadModalOpen(false);
                      setFile(null);
                      fetchStudents(); // Reload danh sách học sinh
                    } catch (error) {
                      console.error("Error uploading file:", error);
                      toast.error("Đã xảy ra lỗi khi upload file!");
                    }
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default StudentTable;