import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function Admission() {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Thêm state để lưu thống kê tuyển sinh
  const [admissionStats, setAdmissionStats] = useState({
    newStudents: 0,
    returningStudents: 0,
    totalStudents: 0,
    schoolYear: "2025-2026",
  });

  // Thêm state loading cho API
  const [loadingStats, setLoadingStats] = useState(true);

  // Tham chiếu đến kích thước cũ khi không fullscreen
  const oldDimensionsRef = useRef({ width: 0, height: 0 });

  // Format ngày hiện tại
  const today = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Fetch thống kê tuyển sinh từ API
  const fetchAdmissionStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch(`${API_URL}/admission/stats`);

      if (!response.ok) {
        throw new Error("Lỗi khi lấy dữ liệu thống kê tuyển sinh");
      }

      const data = await response.json();

      if (data.success) {
        setAdmissionStats({
          newStudents: data.data.newStudents,
          returningStudents: data.data.returningStudents,
          totalStudents: data.data.totalStudents,
          schoolYear: data.data.schoolYear || "2025-2026",
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchAdmissionStats();

    // Thiết lập interval để cập nhật thống kê mỗi 10 giây
    const statsInterval = setInterval(fetchAdmissionStats, 10000);

    return () => clearInterval(statsInterval);
  }, []);

  // Calculate countdown to August 31, 2025
  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date("August 31, 2025 00:00:00").getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  // Xử lý sự kiện fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Đã thoát fullscreen
        setIsFullscreen(false);
      } else {
        // Vừa vào fullscreen
        setIsFullscreen(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Hàm để bật/tắt chế độ fullscreen
  const toggleFullScreen = () => {
    const container = document.getElementById("admission-container");
    if (!container) return;

    if (!document.fullscreenElement) {
      // Bật fullscreen
      container.requestFullscreen().catch((err) => alert(err.message));
    } else {
      // Thoát fullscreen
      document.exitFullscreen().catch((err) => alert(err.message));
    }
  };

  // Đóng modal hiển thị chính sách thưởng tuyển sinh
  const closeSaleModal = () => {
    setShowSaleModal(false);
  };

  // Hàm refresh thống kê ngay lập tức
  const refreshStats = () => {
    fetchAdmissionStats();
  };

  return (
    <>
      <div
        id="admission-container"
        className={`relative w-full max-h-screen flex flex-col items-center justify-center overflow-hidden ${
          isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
        }`}
        style={{
          backgroundImage: isFullscreen
            ? "url(/pdf/fullscreen-back.png)"
            : "url(/pdf/back.png)",
          backgroundSize: "cover",
        }}
      >
        <div>
          <img
            src="/pdf/wellsping-logo.png"
            alt="Wellspring Logo"
            className="absolute top-3 left-2 w-32 sm:w-40 md:w-[240px]"
          />
          <img
            src="/pdf/happyjourney.png"
            alt="WSHN Logo"
            className="absolute top-1 right-2 w-28 sm:w-36 md:w-[200px]"
          />
        </div>

        <div className="relative w-full h-full flex justify-center items-start overflow-y-auto pt-24 sm:pt-28 pb-16">
          <div className="flex flex-col w-full items-center justify-start bg-white bg-opacity-60 p-8 rounded-xl max-w-5xl mx-4">
            {/* Bộ đếm thời gian (đối với mobile hiển thị theo lưới 2 cột) */}
            <div className="mt-4 md:mt-0 grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 mb-8 w-full px-4">
              {[
                { value: timeLeft.days, label: "Ngày" },
                { value: timeLeft.hours, label: "Giờ" },
                { value: timeLeft.minutes, label: "Phút" },
                { value: timeLeft.seconds, label: "Giây" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center bg-[#002147] text-white p-3 sm:p-4 rounded-lg shadow-lg"
                >
                  <span className="text-3xl sm:text-4xl font-bold">
                    {item.value}
                  </span>
                  <span className="text-xs sm:text-sm mt-1">{item.label}</span>
                </div>
              ))}
            </div>

            <p className="text-xl md:text-2xl italic text-center text-gray-700 mb-6">
              đến hạn 31/08/2025
            </p>

            {/* Thêm phần hiển thị thống kê tuyển sinh */}
            <div className="w-full rounded-lg p-4">
              <div className="flex justify-center items-center mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-center text-[#002855] ">
                  NĂM HỌC 2025-2026
                </h2>
                <button
                  onClick={refreshStats}
                  className="flex items-center gap-1 px-3 py-1 bg-[#002147] text-white rounded-md hover:bg-[#001b38] transition-colors"
                  disabled={loadingStats}
                >
                  <i className="fas fa-sync-alt px-1 py-1"></i>
                </button>
              </div>

              {/* Năm học heading */}

              {loadingStats ? (
                <div className="flex justify-center py-8"></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 px-2 sm:px-4">
                  {/* Học sinh mới */}
                  <div className="bg-white w-full p-5 sm:p-6 md:p-8 border-2 border-[#002855] rounded-2xl shadow-xl text-center transform transition-all hover:scale-105">
                    <div className="text-xl md:text-2xl text-[#002855] font-semibold mb-4">
                      Học sinh mới
                    </div>
                    <div className="text-3xl md:text-5xl font-bold text-[#002855]">
                      {admissionStats.newStudents}
                    </div>
                  </div>

                  {/* Học sinh hiện hữu */}
                  <div className="bg-white w-full p-5 sm:p-6 md:p-8 border-2 border-[#009483] rounded-2xl shadow-xl text-center transform transition-all hover:scale-105">
                    <div className="text-xl md:text-2xl text-[#002855] font-semibold mb-4">
                      Học sinh hiện hữu
                    </div>
                    <div className="text-3xl md:text-5xl font-bold text-[#009483]">
                      {admissionStats.returningStudents}
                    </div>
                  </div>

                  {/* Tổng số học sinh */}
                  <div className="bg-white w-full p-5 sm:p-6 md:p-8 border-2 border-orange-red rounded-2xl shadow-xl text-center transform transition-all hover:scale-105">
                    <div className="text-xl md:text-2xl text-[#002855] font-semibold mb-4">
                      Tổng số học sinh
                    </div>
                    <div className="text-3xl md:text-5xl font-bold text-orange-red">
                      {admissionStats.totalStudents}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center text-xs text-gray-500 mt-4">
                Tính đến ngày {today} (Dữ liệu tự động cập nhật mỗi 10 giây)
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() =>
                  window.open(
                    "https://docs.google.com/spreadsheets/d/10W4xkYUaw5ZhGOiTcgFKFrR2-R7b_nD6TIyBtZmTzps/edit?gid=288416278#gid=288416278",
                    "_blank"
                  )
                }
                className="px-8 py-3 bg-[#002147] text-white font-bold rounded-lg hover:bg-[#001b33] transition-all"
              >
                Tải Salekit
              </button>
            </div>

            {/* Thêm slogan tri ân */}
            <div className="w-full text-center mt-[10%]">
              <p className="text-xl md:text-4xl font-semibold uppercase text-[#002855]">
                Tri ân 15 năm - Cùng nhau viết tiếp tương lai
              </p>

              {/* Hiển thị ảnh chính sách thưởng ngay bên dưới */}

              <div className="mt-20 flex justify-center">
                <img
                  src="/admission/sale.svg"
                  alt="Chính sách thưởng tuyển sinh"
                  className="w-full h-auto object-cover rounded-xl shadow-2xl border"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Admission;
