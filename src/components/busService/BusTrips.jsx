import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import StudentManagementModal from "./StudentManagementModal"; // Import modal

const BusTrips = () => {
  // Các state chính
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  // Sử dụng startDate và endDate thay cho date
  const [tripForm, setTripForm] = useState({
    startDate: "",
    endDate: "",
    route: "",
    vehicle: "",
    staff: null,
    students: [],
    departureTime: "",
    arrivalTime: "",
    status: "planned",
  });

  // State cho tìm kiếm nhân viên & học sinh
  const [staffSearch, setStaffSearch] = useState("");
  const [filteredStaff, setFilteredStaff] = useState([]);

  const [studentSearch, setStudentSearch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const handleOpenStudentModal = (trip) => {
    setSelectedTrip(trip);
    setShowStudentModal(true);
  };
  // ------------------------- Fetch Data -------------------------
  const fetchTrips = async () => {
    try {
      const response = await axios.get(`${API_URL}/trips`);
      setTrips(response.data);
    } catch (error) {
      console.error("Error fetching trips:", error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`${API_URL}/routes`);
      setRoutes(response.data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API_URL}/vehicles`);
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      setStaffList(response.data);
      console.log("Staff list:", response.data);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/students`);
      setStudentsList(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchRoutes();
    fetchVehicles();
    fetchStaff();
    fetchStudents();
  }, []);

  // ------------------------- Modal mở tạo/chỉnh sửa -------------------------
  const handleOpenCreateModal = () => {
    setEditingTrip(null);
    setTripForm({
      startDate: "",
      endDate: "",
      route: "",
      vehicle: "",
      staff: null,
      students: [],
      departureTime: "",
      arrivalTime: "",
      status: "planned",
    });
    setStaffSearch("");
    setStudentSearch("");
    setShowModal(true);
  };

  const handleOpenEditModal = (trip) => {
    setEditingTrip(trip._id);
    setTripForm({
      startDate: trip.startDate ? trip.startDate.split("T")[0] : "",
      endDate: trip.endDate ? trip.endDate.split("T")[0] : "",
      route: trip.route ? trip.route._id : "",
      vehicle: trip.vehicle ? trip.vehicle._id : "",
      staff: trip.staff
        ? { _id: trip.staff._id, name: trip.staff.fullname || trip.staff.name }
        : null,
      students: trip.students
        ? trip.students.map((s) => ({
            _id: s.studentId._id,
            name: s.studentId.name,
            photo: s.studentId.photo,
          }))
        : [],
      departureTime: trip.departureTime
        ? trip.departureTime.split("T")[1].slice(0, 5)
        : "",
      arrivalTime: trip.arrivalTime
        ? trip.arrivalTime.split("T")[1].slice(0, 5)
        : "",
      status: trip.status,
    });
    setStaffSearch(trip.staff ? trip.staff.fullname || trip.staff.name : "");
    setStudentSearch("");
    setShowModal(true);
  };

  // ------------------------- Xử lý Lưu và Xóa -------------------------
  const handleSaveTrip = async () => {
    // Kiểm tra khoảng thời gian hợp lệ
    if (!tripForm.startDate || !tripForm.endDate) {
      alert("Vui lòng chọn khoảng thời gian hợp lệ.");
      return;
    }
    if (new Date(tripForm.startDate) > new Date(tripForm.endDate)) {
      alert("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.");
      return;
    }

    // Kiểm tra trùng lặp (giả sử backend có endpoint /trips/check-duplicate)
    try {
      const duplicateCheck = await axios.get(
        `${API_URL}/trips/check-duplicate`,
        {
          params: {
            route: tripForm.route,
            vehicle: tripForm.vehicle,
            startDate: tripForm.startDate,
            endDate: tripForm.endDate,
            excludeId: editingTrip || "",
          },
        }
      );
      if (duplicateCheck.data.exists) {
        alert("Lịch trình trùng lặp với lịch trình đã tồn tại.");
        return;
      }
    } catch (error) {
      console.error("Error checking duplicate trip:", error);
    }

    try {
      const payload = {
        startDate: tripForm.startDate,
        endDate: tripForm.endDate,
        route: tripForm.route,
        vehicle: tripForm.vehicle,
        staff: tripForm.staff ? tripForm.staff._id : null,
        students: tripForm.students.map((s) => ({ studentId: s._id })),
        departureTime: tripForm.departureTime,
        arrivalTime: tripForm.arrivalTime,
        status: tripForm.status,
      };
      if (editingTrip) {
        await axios.put(`${API_URL}/trips/${editingTrip}`, payload);
      } else {
        await axios.post(`${API_URL}/trips`, payload);
      }
      fetchTrips();
      setShowModal(false);
      setEditingTrip(null);
      setTripForm({
        startDate: "",
        endDate: "",
        route: "",
        vehicle: "",
        staff: null,
        students: [],
        departureTime: "",
        arrivalTime: "",
        status: "planned",
      });
    } catch (error) {
      console.error("Error saving trip:", error);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      await axios.delete(`${API_URL}/trips/${tripId}`);
      fetchTrips();
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  // ------------------------- Xử lý tìm kiếm nhân viên -------------------------
  useEffect(() => {
    if (!staffSearch || staffSearch.trim() === "") {
      setFilteredStaff([]);
    } else {
      const filtered = staffList.filter((staff) => {
        // Dùng đúng trường fullName (chữ F hoa)
        const staffName = staff.fullname || staff.username || staff.name || "";
        return staffName.toLowerCase().includes(staffSearch.toLowerCase());
      });
      setFilteredStaff(filtered);
    }
  }, [staffSearch, staffList]);

  const handleSelectStaff = (staff) => {
    const staffName = staff.fullname || staff.name || "";
    setTripForm((prev) => ({ ...prev, staff }));
    setStaffSearch(staffName);
    setFilteredStaff([]);
  };

  // ------------------------- Xử lý tìm kiếm học sinh -------------------------
  useEffect(() => {
    if (studentSearch.trim() === "") {
      setFilteredStudents([]);
    } else {
      const filtered = studentsList.filter((student) =>
        student.name.toLowerCase().includes(studentSearch.toLowerCase())
      );
      // Loại bỏ những học sinh đã được chọn
      const selectedIds = tripForm.students.map((s) => s._id);
      setFilteredStudents(filtered.filter((s) => !selectedIds.includes(s._id)));
    }
  }, [studentSearch, studentsList, tripForm.students]);

  const handleAddStudent = (student) => {
    setTripForm((prev) => ({
      ...prev,
      students: [...prev.students, student],
    }));
    setStudentSearch("");
    setFilteredStudents([]);
  };

  const handleRemoveStudent = (studentId) => {
    setTripForm((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s._id !== studentId),
    }));
  };

  // ------------------------- Render giao diện -------------------------
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản lý Chuyến Xe</h2>
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#002855] text-white px-4 py-2 rounded-lg font-semibold"
        >
          Tạo chuyến xe mới
        </button>
      </div>

      {/* Bảng hiển thị danh sách chuyến xe */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-2 text-left">Thời gian</th>
            <th className="py-2 text-left">Tuyến</th>
            <th className="py-2 text-left">Phương tiện</th>
            <th className="py-2 text-left">Nhân viên</th>
            <th className="py-2 text-left">Giờ khởi hành</th>
            <th className="py-2 text-left">Giờ đến</th>
            <th className="py-2 text-left">Trạng thái</th>
            <th className="py-2 text-left">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2">
                {trip.startDate && trip.endDate ? (
                  <>
                    {new Date(trip.startDate).toLocaleDateString()} -{" "}
                    {new Date(trip.endDate).toLocaleDateString()}
                  </>
                ) : (
                  ""
                )}
              </td>
              <td
                className="py-2 px-4 border cursor-pointer text-blue-600 underline"
                onClick={() => handleOpenStudentModal(trip)}
              >
                {trip.route?.name || "N/A"}
              </td>
              <td className="py-2">
                {trip.vehicle ? trip.vehicle.licensePlate : "N/A"}
              </td>
              <td className="py-2">
                {trip.staff ? trip.staff.fullname || trip.staff.name : "N/A"}
              </td>
              <td className="py-2">
                {trip.departureTime
                  ? new Date(trip.departureTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </td>
              <td className="py-2">
                {trip.arrivalTime
                  ? new Date(trip.arrivalTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </td>
              <td className="py-2">{trip.status}</td>
              <td className="py-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(trip)}
                    className="text-blue-600"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteTrip(trip._id)}
                    className="text-red-600"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showStudentModal && selectedTrip && (
        <StudentManagementModal
          trip={selectedTrip}
          onClose={() => setShowStudentModal(false)}
          onSave={(updatedData) => {
            // Remove departureTime and arrivalTime from the payload when updating student attendance
            const payload = { ...updatedData };
            const tripId = selectedTrip._id || selectedTrip.id;
            axios.put(`${API_URL}/trips/${tripId}`, payload).then(fetchTrips); // Refresh trips
            setShowStudentModal(false);
          }}
        />
      )}

      {/* Modal tạo mới / chỉnh sửa chuyến xe với 2 cột */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-h-full overflow-auto">
            <h3 className="text-lg font-bold mb-4">
              {editingTrip ? "Chỉnh sửa Chuyến Xe" : "Tạo Chuyến Xe Mới"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Cột trái: Thông tin chuyến xe */}
              <div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-lg"
                    value={tripForm.startDate}
                    onChange={(e) =>
                      setTripForm({ ...tripForm, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-lg"
                    value={tripForm.endDate}
                    onChange={(e) =>
                      setTripForm({ ...tripForm, endDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Tuyến
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={tripForm.route}
                    onChange={(e) =>
                      setTripForm({ ...tripForm, route: e.target.value })
                    }
                    required
                  >
                    <option value="">Chọn tuyến</option>
                    {routes.map((route) => (
                      <option key={route._id} value={route._id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Phương tiện
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={tripForm.vehicle}
                    onChange={(e) =>
                      setTripForm({ ...tripForm, vehicle: e.target.value })
                    }
                    required
                  >
                    <option value="">Chọn phương tiện</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.licensePlate}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Giờ khởi hành
                  </label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded-lg"
                    value={tripForm.departureTime}
                    onChange={(e) =>
                      setTripForm({
                        ...tripForm,
                        departureTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Giờ đến
                  </label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded-lg"
                    value={tripForm.arrivalTime}
                    onChange={(e) =>
                      setTripForm({ ...tripForm, arrivalTime: e.target.value })
                    }
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Trạng thái
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={tripForm.status}
                    onChange={(e) =>
                      setTripForm({ ...tripForm, status: e.target.value })
                    }
                    required
                  >
                    <option value="planned">Planned</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
              </div>
              {/* Cột phải: Nhân viên & Học sinh */}
              <div>
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium text-gray-600">
                    Nhân viên
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    placeholder="Tìm kiếm nhân viên..."
                    value={staffSearch}
                    onChange={(e) => {
                      setStaffSearch(e.target.value);
                      setTripForm({ ...tripForm, staff: null });
                    }}
                    required
                  />
                  {/* Gợi ý danh sách nhân viên */}
                  {filteredStaff.length > 0 && (
                    <div className="absolute z-10 bg-white border rounded-lg w-full max-h-40 overflow-auto">
                      {filteredStaff.map((staff) => (
                        <div
                          key={staff._id}
                          className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                          onClick={() => handleSelectStaff(staff)}
                        >
                          <span>
                            {staff.fullname || staff.username || staff.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Danh sách nhân viên đã chọn */}
                  {tripForm.staff && (
                    <div className="mt-2 flex items-center bg-gray-200 p-2 rounded-lg justify-between">
                      <span className="text-gray-800 font-medium">
                        {tripForm.staff.fullname ||
                          tripForm.staff.username ||
                          tripForm.staff.name}
                      </span>
                      <button
                        onClick={() =>
                          setTripForm({ ...tripForm, staff: null })
                        }
                        className="text-red-500 text-sm font-bold"
                      >
                        x
                      </button>
                    </div>
                  )}
                </div>
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium text-gray-600">
                    Học sinh
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
                      {filteredStudents.map((student) => (
                        <div
                          key={student._id}
                          className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                          onClick={() => handleAddStudent(student)}
                        >
                          {student.photo && (
                            <img
                              src={student.photo}
                              alt={student.name}
                              className="w-6 h-6 rounded-full mr-2"
                            />
                          )}
                          {student.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {tripForm.students.length > 0 && (
                    <div className="mt-2">
                      {tripForm.students.map((student) => (
                        <div
                          key={student._id}
                          className="flex items-center justify-between bg-gray-200 p-1 rounded mb-1"
                        >
                          <div className="flex items-center">
                            {student.photo && (
                              <img
                                src={student.photo}
                                alt={student.name}
                                className="w-6 h-6 rounded-full mr-2"
                              />
                            )}
                            <span>{student.name}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveStudent(student._id)}
                            className="text-red-500 text-sm"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Nút hành động */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveTrip}
                className="px-4 py-2 bg-[#002855] text-white rounded-lg"
              >
                {editingTrip ? "Lưu chỉnh sửa" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusTrips;
