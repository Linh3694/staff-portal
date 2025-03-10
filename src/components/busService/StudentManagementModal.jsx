import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiTrash2 } from "react-icons/fi";
import { API_URL, BASE_URL } from "../../config";

const StudentManagementModal = ({ trip, onClose, onSave, staffList = [] }) => {
  // Khởi tạo students từ trip.students nếu có, ngược lại là []
  const [students, setStudents] = useState(() =>
    Array.isArray(trip?.students) ? trip.students : []
  );
  const [monitor, setMonitor] = useState(trip?.staff || null);

  // State cho tìm kiếm và thêm học sinh mới
  const [studentSearch, setStudentSearch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);

  useEffect(() => {
    if (trip && Array.isArray(trip.students)) {
      setStudents(trip.students);
    } else {
      setStudents([]);
    }
    setMonitor(trip?.staff || null);
    // Fetch danh sách học sinh từ backend (giả sử endpoint /api/students)
    axios
      .get(`${API_URL}/students`)
      .then((res) => setAvailableStudents(res.data))
      .catch((err) => console.error(err));
  }, [trip]);

  // Filter available students dựa trên tên và loại trừ những học sinh đã có
  useEffect(() => {
    if (studentSearch.trim() === "") {
      setFilteredStudents([]);
    } else {
      const filtered = availableStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(studentSearch.toLowerCase()) &&
          !students.some((st) => st.studentId === s._id)
      );
      setFilteredStudents(filtered);
    }
  }, [studentSearch, availableStudents, students]);

  const handleStudentStatusChange = (index, status) => {
    const updated = [...students];
    updated[index].attendance = status;
    // Nếu không là "absent", xóa note
    if (status !== "absent") {
      updated[index].note = "";
    }
    setStudents(updated);
  };

  const handleStudentNoteChange = (index, note) => {
    const updated = [...students];
    updated[index].note = note;
    setStudents(updated);
  };

  const handleRemoveStudent = (index) => {
    const updated = [...students];
    updated.splice(index, 1);
    setStudents(updated);
  };

  const handleAddStudent = (student) => {
    // Thêm học sinh mới với trạng thái mặc định "pending"
    setStudents([
      ...students,
      {
        studentId: student._id,
        attendance: "pending",
        note: "",
        name: student.name,
      },
    ]);
    setStudentSearch("");
    setFilteredStudents([]);
  };

  const handleSave = () => {
    // Only update student attendance and related issues
    const payload = {
      students: students.map((s) => ({
        studentId:
          s.studentId && s.studentId._id ? s.studentId._id : s.studentId,
        attendance: s.attendance,
        note: s.note || "",
      })),
      staff: monitor ? monitor._id || monitor : null,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-h-full overflow-auto">
        <h3 className="text-lg font-bold mb-4">Quản lý học sinh & Monitor</h3>

        {/* Phần chọn Monitor */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">
            Monitor
          </label>
          <select
            className="w-full p-2 border rounded-lg"
            value={monitor ? monitor._id : ""}
            onChange={(e) => {
              const selected = staffList.find((s) => s._id === e.target.value);
              setMonitor(selected);
            }}
          >
            <option value="">Chọn Monitor</option>
            {staffList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.fullName || s.username || s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-md mb-2">Danh sách học sinh</h4>
          <div className="max-h-64 overflow-auto">
            {Array.isArray(students) && students.length > 0 ? (
              <ul>
                {students.map((student, index) => {
                  // Fallbacks to ensure everything is a string
                  const displayName =
                    student.student && typeof student.student.name === "string"
                      ? student.student.name
                      : student.name || "Học sinh";

                  const studentCode =
                    student.student &&
                    typeof student.student.studentCode === "string"
                      ? student.student.studentCode
                      : typeof student.studentId === "string"
                      ? student.studentId
                      : "N/A";

                  const photoUrl =
                    student.photo && typeof student.photo.photoUrl === "string"
                      ? student.photo.photoUrl
                      : "default-placeholder.png";

                  const classLabel =
                    student.currentClass &&
                    (student.currentClass.name ||
                      student.currentClass.className);

                  return (
                    <li
                      key={index}
                      className="flex items-center justify-between border-b py-2"
                    >
                      <div className="flex items-center">
                        <img
                          src={`${BASE_URL}/${photoUrl}`}
                          alt={displayName}
                          className="w-16 h-16 rounded-full mr-2 object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{displayName}</span>
                          <span className="text-sm text-gray-500">
                            Mã HS: {studentCode}
                          </span>
                          {classLabel && (
                            <span className="text-sm text-gray-500">
                              Lớp: {classLabel}
                            </span>
                          )}
                          {student.attendance === "absent" && (
                            <input
                              type="text"
                              className="mt-1 p-1 border rounded"
                              placeholder="Nhập lý do"
                              value={student.note || ""}
                              onChange={(e) =>
                                handleStudentNoteChange(index, e.target.value)
                              }
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={student.attendance}
                          onChange={(e) =>
                            handleStudentStatusChange(index, e.target.value)
                          }
                          className="p-1 border rounded"
                        >
                          <option value="pending">Pending</option>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
                        <button
                          onClick={() => handleRemoveStudent(index)}
                          className="text-red-500"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500">Không có học sinh nào.</p>
            )}
          </div>
        </div>

        {/* Phần thêm học sinh mới */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-600">
            Thêm học sinh
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded-lg"
            placeholder="Tìm kiếm học sinh..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
          />
          {filteredStudents.length > 0 && (
            <div className="absolute z-10 bg-white border rounded-lg w-full max-h-40 overflow-auto">
              {filteredStudents.map((s) => (
                <div
                  key={s._id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleAddStudent(s)}
                >
                  {s.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Các nút hành động */}
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#002855] text-white rounded-lg"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentManagementModal;
