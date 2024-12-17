import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker'; // Sử dụng thư viện này nếu muốn chọn tháng
import 'react-datepicker/dist/react-datepicker.css';

const formatAttendanceByMonth = (attendanceLog, selectedMonth) => {
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const attendanceByDay = {};

  // Nhóm dữ liệu chấm công theo ngày
  attendanceLog.forEach((entry) => {
    const date = entry.time.split("T")[0];
    if (!attendanceByDay[date]) attendanceByDay[date] = [];
    attendanceByDay[date].push(new Date(entry.time));
  });

  // Duyệt qua tất cả các ngày trong tháng
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      .toISOString()
      .split("T")[0];

    const times = attendanceByDay[date] || [];

    if (times.length > 0) {
      const sortedTimes = times.sort((a, b) => a - b);
      const checkInTime = sortedTimes[0];
      const checkOutTime = sortedTimes[sortedTimes.length - 1];

      // Mốc giờ đi làm và tan ca
      const checkInThreshold = new Date(checkInTime);
      checkInThreshold.setHours(8, 0, 0, 0);

      const checkOutThreshold = new Date(checkInTime);
      checkOutThreshold.setHours(17, 0, 0, 0);

      // Tính đi muộn và về sớm
      let lateMinutes = Math.round((checkInTime - checkInThreshold) / (1000 * 60));
      let earlyMinutes = Math.round((checkOutThreshold - checkOutTime) / (1000 * 60));

      return {
        date,
        checkIn: checkInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        checkOut: checkOutTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        late: lateMinutes > 0 ? `${lateMinutes} phút` : null,
        early: earlyMinutes > 0 ? `${earlyMinutes} phút` : null,
        onTime: lateMinutes <= 0 && earlyMinutes <= 0 ? "On-time" : null,
        status: "Đi làm",
      };
    } else {
      // Ngày không có dữ liệu
      return {
        date,
        checkIn: "--",
        checkOut: "--",
        late: null,
        early: null,
        onTime: null,
        status: "Nghỉ",
      };
    }
  });
};

const Attendance = ({ currentUser, view }) => {  
  const { attendance } = currentUser;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Số thẻ mỗi trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredLogs = formatAttendanceByMonth(currentUser.attendance, selectedMonth)
  .filter((log) => {
    if (filterStatus === 'Late') return log.late;
    if (filterStatus === 'Early') return log.early;
    if (filterStatus === 'On-time') return log.onTime;
    return true; // 'All'
  });

// Tính totalPages dựa trên filteredLogs
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  // Hiển thị thông báo khi không có dữ liệu
  if (!attendance || attendance.length === 0) {
    return <p>Không có dữ liệu chấm công.</p>;
  }

  console.log("Dữ liệu currentUser:", currentUser);
  // Mock data cho Employee Details
  const employeeDetails = {
    name: 'Natashia Khaleria',
    role: 'Head of UX Design',
    phone: '(+62) 812 3456-7890',
    email: 'natashiakhaleria@gmail.com',
    totalAttendance: 21,
    avgCheckIn: '08:46',
    avgCheckOut: '17:04',
    predicate: 'Standby',
  };

  const handleMonthChange = (date) => {
    setSelectedMonth(date);
    console.log("Selected Month:", date); // Sau này sẽ gọi API để lấy dữ liệu theo tháng
  };

  return (
    <div className=" text-white min-h-screen p-2 space-y-6">
      {/* Employee Details */}
    <div className="bg-white text-[#002147] rounded-2xl p-6 shadow-xl border">
      {/* Tiêu đề và nút chọn tháng */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Thông tin người dùng</h2>
          <div className="flex space-x-4 items-center">
            <label className="text-sm font-semibold text-gray-600">Tháng: </label>
            <DatePicker
              selected={selectedMonth}
              onChange={handleMonthChange}
              dateFormat="MM/yyyy" // Định dạng chỉ hiện tháng và năm
              showMonthYearPicker
              className="bg-white text-[#002147] p-2 rounded-lg border shadow-md w-20 text-center"
            />
          </div>
        </div>
      <div className=" text-#002147 flex items-center space-x-8">
            {/* Avatar */}
            <img
              src={currentUser.avatarUrl || 'https://via.placeholder.com/100'} // Đường dẫn ảnh avatar
              alt="Employee Avatar"
              className="w-24 h-24 rounded-full object-cover"
            />

            {/* Thông tin nhân viên */}
            <div>
              <h2 className="text-xl font-bold">{currentUser.fullname}</h2>
              <div className="grid grid-cols-3 gap-4 mt-2 ">
                {/* Title */}
                <div>
                  <p className="text-xs text-#002147">Chức vụ</p>
                  <p className="text-sm font-semibold">{currentUser.title || '---'}</p>
                </div>

                {/* Department */}
                <div>
                  <p className="text-xs text-#002147">Phòng ban</p>
                  <p className="text-sm font-semibold">{currentUser.department || '---'}</p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-xs text-#002147">Email</p>
                  <p className="text-sm font-semibold">{currentUser.email || '---'}</p>
                </div>
              </div>
            </div>
          </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {/* Total Attendance */}
        <div className="flex items-center space-x-4 bg-[#002147] text-white p-4 rounded-lg shadow transform transition-colors transition-transform duration-300  hover:scale-105">
          <div className="flex items-center justify-center w-10 h-10 bg-[#FF5733] rounded-full">
            <i className="fas  fa-clock text-xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{employeeDetails.totalAttendance}</h3>
            <p className="text-xs mt-1 text-gray-300">Tổng số ngày công</p>
          </div>
        </div>

        {/* Average Check-in Time */}
        <div className="flex items-center space-x-4 bg-[#002147] text-white p-4 rounded-lg shadow transform transition-colors transition-transform duration-300  hover:scale-105">
          <div className="flex items-center justify-center w-10 h-10 bg-[#FF5733] rounded-full">
            <i className="fas fa-right-to-bracket text-xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{employeeDetails.avgCheckIn}</h3>
            <p className="text-xs mt-1 text-gray-300">Thời gian Check-in trung bình</p>
          </div>
        </div>

        {/* Average Check-out Time */}
        <div className="flex items-center space-x-4 bg-[#002147] text-white p-4 rounded-lg shadow transform transition-colors transition-transform duration-300  hover:scale-105">
          <div className="flex items-center justify-center w-10 h-10 bg-[#FF5733] rounded-full">
            <i className="fas fa-sign-out-alt text-xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{employeeDetails.avgCheckOut}</h3>
            <p className="text-xs mt-1 text-gray-300">Thời gian Check-out trung bình</p>
          </div>
        </div>
      
        {/* Employee Predicate */}
        <div className="flex items-center space-x-4 bg-[#002147] text-white p-4 rounded-lg shadow transform transition-colors transition-transform duration-300  hover:scale-105">
          <div className="flex items-center justify-center w-10 h-10 bg-[#FF5733] rounded-full">
            <i className="fas fa-award text-xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{employeeDetails.predicate}</h3>
            <p className="text-xs mt-1 text-gray-300">Standby</p>
          </div>
        </div>
      </div>
   </div>

   <div className="bg-white text-[#002147] rounded-2xl p-6 shadow-xl border">
      {/* Lịch sử chấm công */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Lịch sử chấm công</h2>
        {/* Dropdown lọc trạng thái */}
        <select
          className="bg-white text-[#002147] p-2 rounded-lg border"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">Tất cả</option>
          <option value="Late">Đi muộn</option>
          <option value="Early">Về sớm</option>
          <option value="On-time">Đúng giờ</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredLogs.slice(indexOfFirstItem, indexOfLastItem).map((log, index) => (
            <div key={index} className="p-4 bg-[#002147] rounded-lg shadow-md text-white">
              {/* Header ngày */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-calendar-alt"></i>
                  <p className="font-semibold">{log.date}</p>
                </div>
                {/* Late và Early hiển thị riêng biệt */}
                <div className="flex gap-2">
                  {log.late && (
                    <div className="bg-[#FF5733] text-white px-2 py-1 rounded-md text-xs font-semibold">
                      Late: {log.late}
                    </div>
                  )}
                  {log.early && (
                    <div className="bg-[#FF5733] text-white px-2 py-1 rounded-md text-xs font-semibold">
                      Early: {log.early}
                    </div>
                  )}
                  {!log.late && !log.early && (
                    <div className="bg-[#009483] text-white px-2 py-1 rounded-md text-xs font-semibold">
                      On-time
                    </div>
                  )}
                </div>
              </div>

              {/* Thông tin Check In và Check Out */}
              <div className="flex justify-start gap-10">
                <div>
                  <p className="text-sm">Check In Time</p>
                  <p className=" text-base font-bold">{log.checkIn}</p>
                </div>
                <div>
                  <p className="text-sm">Check Out Time</p>
                  <p className=" text-base font-bold">{log.checkOut}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4 space-x-2">
              {/* Nút First */}
              <button 
                onClick={() => handlePageChange(1)} 
                disabled={currentPage === 1}
                className="px-2 py-1 bg-gray-300 rounded"
              >
                First
              </button>

              {/* Nút Prev */}
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                className="px-2 py-1 bg-gray-300 rounded"
              >
                Prev
              </button>

              {/* Hiển thị trang hiện tại và 2 trang lân cận */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => 
                  page === 1 || 
                  page === totalPages || 
                  Math.abs(currentPage - page) <= 2
                )
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-2 py-1 rounded ${
                      currentPage === page ? "bg-[#FF5733] text-white" : "bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                ))}

              {/* Nút Next */}
              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="px-2 py-1 bg-gray-300 rounded"
              >
                Next
              </button>

              {/* Nút Last */}
              <button 
                onClick={() => handlePageChange(totalPages)} 
                disabled={currentPage === totalPages}
                className="px-2 py-1 bg-gray-300 rounded"
              >
                Last
              </button>
            </div>
       </div>
  </div>
  );
};

export default Attendance;