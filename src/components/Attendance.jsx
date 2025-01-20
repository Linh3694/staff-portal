import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import { Navigation } from "swiper/modules";
import "./attendance.css"; // CSS riêng của bạn

const formatAttendanceByMonth = (attendanceLog, selectedMonth) => {
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  // Chuẩn hóa ngày đầu và cuối tháng với UTC
  const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  console.log("Start Date:", startDate);
  console.log("End Date:", endDate);

  // Lọc dữ liệu chính xác theo UTC
  const filteredAttendanceLog = attendanceLog.filter((entry) => {
    const entryDate = new Date(entry.time); // Giả sử entry.time là ISO string
    return entryDate >= startDate && entryDate <= endDate;
  });

  console.log("Filtered Logs:", filteredAttendanceLog);

  // Tiếp tục xử lý dữ liệu
  const attendanceByDay = {};
  filteredAttendanceLog.forEach((entry) => {
    const date = entry.time.split("T")[0];
    if (!attendanceByDay[date]) attendanceByDay[date] = [];
    attendanceByDay[date].push(new Date(entry.time));
  });

  // Tạo dữ liệu chấm công cho từng ngày
  const daysInMonth = new Date(year, month + 1, 0).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(Date.UTC(year, month, day)).toISOString().split("T")[0];
    const times = attendanceByDay[date] || [];

    if (times.length > 0) {
      const sortedTimes = times.sort((a, b) => a - b);
      const checkInTime = sortedTimes[0];
      const checkOutTime = sortedTimes[sortedTimes.length - 1];
      
      const lateMinutes = Math.max(0, (checkInTime.getHours() * 60 + checkInTime.getMinutes()) - 480); // 8:00 là 480 phút
      const earlyMinutes = Math.max(0, 1020 - (checkOutTime.getHours() * 60 + checkOutTime.getMinutes())); // 17:00 là 1020 phút

      return {
        date,
        checkIn: checkInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        checkOut: checkOutTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        late: lateMinutes > 0 ? `${lateMinutes}'` : null,
        early: earlyMinutes > 0 ? `${earlyMinutes}'` : null,
      };
    } else {
      return { date, checkIn: "--", checkOut: "--" };
    }
  });
};


const Attendance = ({ currentUser }) => {
  const { attendance } = currentUser;
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [logs, setLogs] = useState([]); // Dữ liệu chấm công đã xử lý
  const itemsPerPage = 8; // Số thẻ mỗi trang
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today); // Thêm dòng này
  const swiperRef = useRef(null);
  const [highlightedDate, setHighlightedDate] = useState(today); // Ngày được highlight khi click
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false);
  const [summaryLate, setSummaryLate] = useState(0);
  const [summaryEarly, setSummaryEarly] = useState(0);
  
  
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredLogs = formatAttendanceByMonth(currentUser.attendance, selectedMonth)
  .filter((log) => {
    if (filterStatus === 'Late') return log.late;
    if (filterStatus === 'Early') return log.early;
    if (filterStatus === 'On-time') return log.onTime;
    return true; // 'All'
  });


  console.log("Dữ liệu currentUser:", currentUser);

  const handleMonthChange = (date) => {
    setSelectedMonth(date);
    setHasScrolledToToday(false); // Đặt lại trạng thái cuộn
    console.log("Selected Month:", date); // Sau này sẽ gọi API để lấy dữ liệu theo tháng
  };
  console.log("selectedMonth:", selectedMonth);
  const calculateTotalAttendance = (logs) => {
    return logs.filter((log) => log.checkIn !== "--" && log.checkOut !== "--").length;
  };
  const totalAttendance = calculateTotalAttendance(filteredLogs);

  const calculateSummary = (logs, type) => {
    return logs.reduce((total, log) => {
      const time = type === "late" ? log.late : log.early;
      if (time && typeof time === "string") {
        const minutes = parseInt(time.replace("'", "")); // Lấy số phút từ chuỗi
        return total + (isNaN(minutes) ? 0 : minutes); // Bỏ qua giá trị không hợp lệ
      }
      return total;
    }, 0);
  };

  useEffect(() => {
    // Recalculate summaries whenever filteredLogs or selectedMonth changes
    const updatedSummaryLate = calculateSummary(filteredLogs, "late");
    const updatedSummaryEarly = calculateSummary(filteredLogs, "early");
  
    setSummaryLate(updatedSummaryLate);
    setSummaryEarly(updatedSummaryEarly);
  }, [filteredLogs, selectedMonth]); // Dependency là filteredLogs và selectedMonth

  useEffect(() => {
    if (swiperRef.current && !hasScrolledToToday) {
      const todayIndex = filteredLogs.findIndex((log) => log.date === today);
      if (todayIndex !== -1) {
        swiperRef.current.slideTo(todayIndex, 300); // Scroll đến ngày hôm nay
        setHasScrolledToToday(true); // Đánh dấu đã scroll
      }
    }
  }, [filteredLogs, hasScrolledToToday]);


    // Hiển thị thông báo khi không có dữ liệu
    if (!attendance || attendance.length === 0) {
      return <p>Không có dữ liệu chấm công.</p>;
    }



  return (
    <div className="bg-white text-[#002147] rounded-2xl p-6 shadow-xl border">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Thông tin người dùng</h2>
        <div className="flex space-x-4 items-center">
          <label className="text-sm font-semibold text-gray-600">Tháng:</label>
          <DatePicker
            selected={selectedMonth}
            onChange={handleMonthChange}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className="bg-white text-[#002147] p-2 rounded-lg border shadow-md w-20 text-center"
          />
          <button
            
            className="bg-[#FF5733] text-white px-4 py-2 rounded-md shadow hover:bg-red-600"
          >
            Xuất File
          </button>
        </div>
      </div>
  
      {/* Thông tin nhân viên */}
      <div className="text-[#002147] flex items-center space-x-8 mb-6">
        <img
          src={currentUser.avatarUrl || "https://via.placeholder.com/100"}
          alt="Employee Avatar"
          className="w-24 h-24 rounded-full object-cover"
        />
        <div>
          <h2 className="text-xl font-bold">{currentUser.fullname}</h2>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div>
              <p className="text-xs">Chức vụ</p>
              <p className="text-sm font-semibold">{currentUser.title || "---"}</p>
            </div>
            <div>
              <p className="text-xs">Phòng ban</p>
              <p className="text-sm font-semibold">{currentUser.department || "---"}</p>
            </div>
            <div>
              <p className="text-xs">Email</p>
              <p className="text-sm font-semibold">{currentUser.email || "---"}</p>
            </div>
          </div>
        </div>
      </div>
  
      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="flex items-center space-x-4 bg-[#002147] text-white p-4 rounded-lg shadow hover:scale-105 transition-transform duration-300">
          <div className="w-10 h-10 bg-[#FF5733] rounded-full flex items-center justify-center">
            <i className="fas fa-clock text-xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{totalAttendance}</h3>
            <p className="text-xs mt-1 text-gray-300">Tổng số ngày công</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-[#002147] text-white p-4 rounded-lg shadow hover:scale-105 transition-transform duration-300">
          <div className="w-10 h-10 bg-[#FF5733] rounded-full flex items-center justify-center">
            <i className="fas fa-right-to-bracket text-xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{summaryLate}</h3>
            <p className="text-xs mt-1 text-gray-300">Tổng thời gian đi muộn</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-[#002147] text-white p-4 rounded-lg shadow hover:scale-105 transition-transform duration-300">
          <div className="w-10 h-10 bg-[#FF5733] rounded-full flex items-center justify-center">
            <i className="fas fa-sign-out-alt text-xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{summaryEarly}</h3>
            <p className="text-xs mt-1 text-gray-300">Tổng thời gian về sớm</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-[#002147] text-white p-4 rounded-lg shadow hover:scale-105 transition-transform duration-300">
          <div className="w-10 h-10 bg-[#FF5733] rounded-full flex items-center justify-center">
            <i className="fas fa-award text-xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{currentUser.predicate}</h3>
            <p className="text-xs mt-1 text-gray-300">Số ngày nghỉ phép</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-[#002147] text-white p-4 rounded-lg shadow hover:scale-105 transition-transform duration-300">
          <div className="w-10 h-10 bg-[#FF5733] rounded-full flex items-center justify-center">
            <i className="fas fa-award text-xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{currentUser.predicate}</h3>
            <p className="text-xs mt-1 text-gray-300">Số ngày phép còn lại</p>
          </div>
        </div>
      </div>
  
      {/* Lịch sử chấm công */}
      <div className="attendance-container">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Lịch sử chấm công</h2>
            <button
              onClick={() => {
                const todayIndex = filteredLogs.findIndex((log) => log.date === today);
                if (swiperRef.current && todayIndex !== -1) {
                  swiperRef.current.slideTo(todayIndex, 300);
                  setHighlightedDate(today); // Highlight ngày hôm nay
                }
              }}
              className="bg-[#FF5733] text-white px-4 py-2 rounded-md shadow hover:bg-red-600 transition-transform duration-300"
            >
              Hôm nay
            </button>
          </div>
             {/* Swiper thay thế cho map hiện tại */}
                  <Swiper
                  onSwiper={(swiper) => (swiperRef.current = swiper)}
                  grabCursor={true}
                  centeredSlides={true} // Card sẽ căn giữa Swiper
                  slidesPerView="auto" // Hiển thị tất cả thẻ trên một dòng
                  spaceBetween={30} // Khoảng cách giữa các thẻ
                  navigation={true}
                  modules={[Navigation]}
                  className="mySwiper"
                >
                  {filteredLogs && filteredLogs.length > 0 ? (
                    filteredLogs.map((log, index) => (
                      <SwiperSlide key={index} style={{ width: "300px" }}>
                        <div
                          className={`p-4 rounded-lg shadow-md transition-transform duration-300 ${
                            log.date === highlightedDate 
                            ? "bg-[#002147] text-white scale-110" 
                            : "bg-[#f8f8f8] text-[#002147]"
                          }`}
                          onClick={() => setHighlightedDate(log.date)}
                        >
                          {/* Header ngày */}
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-2">
                              <i className="fas fa-calendar-alt"></i>
                              <p className="font-semibold text-xs">{log.date}</p>
                            </div>
                            <div className="flex gap-2">
                              {log.late && (
                                <div className="bg-[#FF5733] text-white px-2 py-1 rounded-md text-xs font-semibold">
                                  Muộn: {log.late}
                                </div>
                              )}
                              {log.early && (
                                <div className="bg-[#FF5733] text-white px-2 py-1 rounded-md text-xs font-semibold">
                                  Sớm: {log.early}
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
                              <p className="text-sm">Giờ vào</p>
                              <p className=" text-base font-bold">{log.checkIn}</p>
                            </div>
                            <div>
                              <p className="text-sm">Giờ ra</p>
                              <p className=" text-base font-bold">{log.checkOut}</p>
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 p-4">
                      <p>Không có dữ liệu chấm công cho tháng này.</p>
                    </div>
                  )}
                </Swiper>
        </div>
    </div>
  );
};

export default Attendance;