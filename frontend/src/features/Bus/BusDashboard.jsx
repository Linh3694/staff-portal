import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../core/config";
import StudentManagementModal from "./StudentManagementModal"; // Import modal

const BusDashboard = () => {
  // Chọn ngày hiện tại theo định dạng YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dailyTrips, setDailyTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const handleOpenStudentModal = (trip) => {
    setSelectedTrip(trip);
    setShowStudentModal(true);
  };
  // Lấy danh sách Daily Trips theo ngày được chọn
  const fetchDailyTrips = async (date) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/daily-trips`, {
        params: { date },
      });
      setDailyTrips(response.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra khi lấy danh sách lịch trình.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyTrips(selectedDate);
  }, [selectedDate]);

  // Xử lý thay đổi ngày từ date picker
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        Dashboard - Lịch trình theo ngày
      </h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Chọn ngày:
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="mt-1 block w-64 p-2 border border-gray-300 rounded-md"
        />
      </div>

      {isLoading ? (
        <div>Đang tải danh sách lịch trình...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          {dailyTrips.length === 0 ? (
            <div>Không có lịch trình nào cho ngày {selectedDate}</div>
          ) : (
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">Tuyến</th>
                  <th className="py-2 px-4 border">Phương tiện</th>
                  <th className="py-2 px-4 border">Nhân viên</th>
                  <th className="py-2 px-4 border">Giờ khởi hành</th>
                  <th className="py-2 px-4 border">Giờ đến</th>
                  <th className="py-2 px-4 border">Trạng thái chuyến</th>
                  <th className="py-2 px-4 border">Trạng thái xe</th>
                  <th className="py-2 px-4 border">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {dailyTrips.map((trip, index) => (
                  <tr key={index} className="text-center">
                    <td
                      className="py-2 px-4 border cursor-pointer text-blue-600 underline"
                      onClick={() => handleOpenStudentModal(trip)}
                    >
                      {trip.route?.name || "N/A"}
                    </td>
                    <td className="py-2 px-4 border">
                      {trip.vehicle && trip.vehicle.licensePlate
                        ? trip.vehicle.licensePlate
                        : "N/A"}
                    </td>
                    <td className="py-2 px-4 border">
                      {trip.staff &&
                      (trip.staff.fullname ||
                        trip.staff.username ||
                        trip.staff.name)
                        ? trip.staff.fullname ||
                          trip.staff.username ||
                          trip.staff.name
                        : "N/A"}
                    </td>
                    <td className="py-2 px-4 border">
                      {trip.departureTime
                        ? new Date(trip.departureTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </td>
                    <td className="py-2 px-4 border">
                      {trip.arrivalTime
                        ? new Date(trip.arrivalTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </td>
                    <td className="py-2 px-4 border">{trip.status}</td>
                    <td className="py-2 px-4 border">{trip.vehicleStatus}</td>
                    <td className="py-2 px-4 border">{trip.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {showStudentModal && selectedTrip && (
            <StudentManagementModal
              trip={selectedTrip}
              onClose={() => setShowStudentModal(false)}
              onSave={(updatedData) => {
                // Remove departureTime and arrivalTime from the payload when updating student attendance
                const payload = { ...updatedData };
                axios
                  .put(`${API_URL}/daily-trips/${selectedTrip._id}`, payload)
                  .then(() => fetchDailyTrips(selectedDate)); // Refresh list
                setShowStudentModal(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default BusDashboard;
