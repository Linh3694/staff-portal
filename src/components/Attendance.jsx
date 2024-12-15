import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker'; // Sử dụng thư viện này nếu muốn chọn tháng
import 'react-datepicker/dist/react-datepicker.css';


const Attendance = ({ currentUser, view }) => {  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Mock data cho Employee Details
  const employeeDetails = {
    name: 'Natashia Khaleria',
    role: 'Head of UX Design',
    phone: '(+62) 812 3456-7890',
    email: 'natashiakhaleria@gmail.com',
    totalAttendance: 309,
    avgCheckIn: '08:46',
    avgCheckOut: '17:04',
    predicate: 'Role Model',
  };

  const handleMonthChange = (date) => {
    setSelectedMonth(date);
    console.log("Selected Month:", date); // Sau này sẽ gọi API để lấy dữ liệu theo tháng
  };

  // Mock data cho Attendance History
  const attendanceHistory = [
    { date: 'March 08, 2023', checkIn: '08:53', checkOut: '17:15', status: 'On Time' },
    { date: 'March 07, 2023', checkIn: '08:27', checkOut: '17:09', status: 'Late' },
    { date: 'March 06, 2023', checkIn: '', checkOut: '', status: 'Absent' },
    { date: 'March 05, 2023', checkIn: '08:55', checkOut: '17:10', status: 'On Time' },
  ];

  const handleSync = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/sync-attendance');
      if (response.status === 200) {
        setMessage('Đồng bộ thành công.');
      } else {
        setMessage('Đồng bộ thất bại.');
      }
    } catch (error) {
      console.error('Error syncing attendance:', error);
      setMessage('Đồng bộ thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" text-white min-h-screen p-6 space-y-6">
      {/* Nút đồng bộ
      <div className="flex justify-end">
        <button
          onClick={handleSync}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-lg text-sm font-semibold"
        >
          {loading ? 'Đang đồng bộ...' : 'Đồng bộ'}
        </button>
      </div> */}

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
            <p className="text-xs mt-1 text-gray-300">Ca làm việc</p>
          </div>
        </div>
      </div>
   </div>
      {/* Attendance History */}
      <div className="bg-white text-[#002417] rounded-2xl p-6 shadow-lg border">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Lịch sử chấm công</h2>
          <div className="flex space-x-4">
            <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-semibold">
              Sắp xếp
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-semibold">
              Lọc
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {attendanceHistory.map((item, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-400">{item.date}</p>
              <p className="mt-2 text-sm">Check-In: {item.checkIn || '--:--'}</p>
              <p className="text-sm">Check-Out: {item.checkOut || '--:--'}</p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                  item.status === 'On Time'
                    ? 'bg-green-500 text-white'
                    : item.status === 'Late'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Attendance;