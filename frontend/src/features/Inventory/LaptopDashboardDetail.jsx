// src/components/inventory/LaptopDashboardDetail.jsx
import React, { useState, useEffect } from "react";
import { API_URL } from "../../core/config";
import {
  FaCheck,
  FaExclamation,
  FaClockRotateLeft,
  FaFileCircleQuestion,
} from "react-icons/fa6";

const LaptopDashboardDetail = () => {
  const [laptops, setLaptops] = useState([]);
  const [deviceFilter, setDeviceFilter] = useState("Laptop");
  const [yearDeviceFilter, setYearDeviceFilter] = useState("Laptop");

  const [statusData, setStatusData] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [yearData, setYearData] = useState([]);
  // Đầu file, bên trong component LaptopDashboardDetail, thêm state sau:
  const [currentPage, setCurrentPage] = useState(0);
  const [yearCurrentPage, setYearCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Gọi API thật để lấy danh sách laptops
  useEffect(() => {
    const fetchLaptops = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${API_URL}/laptops`, { headers });
        const data = await res.json();
        if (data && Array.isArray(data.populatedLaptops)) {
          setLaptops(data.populatedLaptops);
        }
      } catch (error) {
        console.error("Lỗi khi tải laptops:", error);
      }
    };
    fetchLaptops();
  }, []);

  // Tính toán dữ liệu mỗi khi laptops thay đổi
  useEffect(() => {
    if (!laptops.length) return;

    // Lọc danh sách dựa trên deviceFilter:
    const filteredLaptops = laptops.filter((lap) => {
      if (deviceFilter === "Laptop") {
        // Nếu không có type hoặc type không phải "desktop"
        return !lap.type || lap.type.toLowerCase() !== "desktop";
      } else if (deviceFilter === "Desktop") {
        return lap.type && lap.type.toLowerCase() === "desktop";
      } else {
        return true; // "All": không lọc
      }
    });

    // 1) Thống kê trạng thái
    const statusCount = {
      Active: 0,
      Broken: 0,
      Standby: 0,
      PendingDocumentation: 0,
    };
    filteredLaptops.forEach((lap) => {
      if (statusCount[lap.status] !== undefined) {
        statusCount[lap.status]++;
      } else {
        // Nếu trạng thái không mong đợi, cho vào Standby
        statusCount["Standby"]++;
      }
    });
    const statusMapping = {
      Active: "Đang sử dụng",
      Standby: "Chờ cấp phát",
      Broken: "Hỏng",
      PendingDocumentation: "Thiếu biên bản",
    };
    const countsArray = Object.values(statusCount);
    const totalCount = countsArray.reduce((acc, val) => acc + val, 0);

    setStatusData({
      labels: Object.keys(statusCount).map((key) => statusMapping[key] || key),
      counts: countsArray,
      total: totalCount, // Lưu thêm tổng vào statusData
    });

    // 2) Thống kê phòng ban (Laptop / Desktop)
    const deptMap = {};
    laptops.forEach((lap) => {
      let dept = "Chưa gán";
      if (lap.assigned && lap.assigned.length > 0) {
        dept = lap.assigned[0].department || "Không xác định";
      }
      if (!deptMap[dept]) {
        deptMap[dept] = { laptop: 0, desktop: 0, total: 0 };
      }
      // Phân loại theo lap.type
      if (lap.type && lap.type.toLowerCase() === "desktop") {
        deptMap[dept].desktop += 1;
      } else {
        deptMap[dept].laptop += 1;
      }
      deptMap[dept].total += 1;
    });
    const deptStats = Object.keys(deptMap).map((dept) => ({
      department: dept,
      laptop: deptMap[dept].laptop,
      desktop: deptMap[dept].desktop,
      total: deptMap[dept].total,
    }));
    setDeptData(deptStats);

    // 3) Thống kê năm sản xuất
    // Lọc danh sách laptops theo yearDeviceFilter
    const filteredLaptopsForYear = laptops.filter((lap) => {
      if (yearDeviceFilter === "Laptop") {
        return !lap.type || lap.type.toLowerCase() !== "desktop";
      } else if (yearDeviceFilter === "Desktop") {
        return lap.type && lap.type.toLowerCase() === "desktop";
      } else {
        return true; // All
      }
    });
    const yearMap = {};
    filteredLaptopsForYear.forEach((lap) => {
      const year = lap.releaseYear || "Không rõ";
      yearMap[year] = (yearMap[year] || 0) + 1;
    });
    const totalYearCount = Object.values(yearMap).reduce(
      (acc, cur) => acc + cur,
      0
    );
    const yearStats = Object.keys(yearMap).map((year) => {
      const count = yearMap[year];
      const percent =
        totalYearCount > 0 ? ((count / totalYearCount) * 100).toFixed(0) : "0";
      return { year, count, percent };
    });
    setYearData(yearStats);
  }, [laptops, deviceFilter, yearDeviceFilter]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Laptop || Desktop</h2>

      {/* 1) Thẻ trạng thái + Donut Chart */}
      {statusData && (
        <div className="flex flex-row items-center justify-between p-6 mb-6 bg-[#002855] rounded-xl">
          {/* Bộ lọc thay cho H2 tĩnh */}
          <div className="flex flex-col">
            <div className="flex space-x-2">
              {["All", "Laptop", "Desktop"].map((type) => (
                <button
                  key={type}
                  onClick={() => setDeviceFilter(type)}
                  className={`px-4 py-2 rounded-full font-bold text-sm ${
                    deviceFilter === type
                      ? "bg-[#e8e8e8] text-[#002855]"
                      : "bg-transparent text-[#e8e8e8] border border-[#e8e8e8]"
                  }`}
                >
                  {type === "All" ? "Tất cả" : type}
                </button>
              ))}
            </div>
            <p className="text-sm text-[#e8e8e8] mt-1">
              Thống kê số lượng thiết bị theo trạng thái
            </p>
          </div>
          {/* Dãy 4 thẻ trạng thái */}
          <div className="mt-4 flex flex-wrap gap-4 ">
            {statusData.labels.map((label, idx) => {
              const count = statusData.counts[idx] || 0;
              const total = statusData.total || 0;
              const percent =
                total > 0 ? ((count / total) * 100).toFixed(0) : 0;

              // Tuỳ chọn icon và màu icon theo từng trạng thái
              let icon = null;
              let iconBg = "#E6FFFA"; // Màu nền tròn chứa icon
              if (label === "Đang sử dụng") {
                icon = <FaCheck className="text-[#009483] text-xl" />;
              } else if (label === "Hỏng") {
                icon = <FaExclamation className="text-[#FF5733] text-xl" />;
              } else if (label === "Chờ cấp phát") {
                icon = <FaClockRotateLeft className="text-[#ffdb86] text-xl" />;
              } else if (label === "Thiếu biên bản") {
                icon = (
                  <FaFileCircleQuestion className="text-[#EAA300] text-xl" />
                );
              }

              return (
                <div
                  key={idx}
                  className="relative bg-white shadow-xl rounded-2xl p-4 w-[150px] transform transition-transform duration-300 hover:scale-105"
                >
                  {/* Icon ở trên cùng */}
                  <div
                    className="absolute -top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                    style={{ backgroundColor: iconBg }}
                  >
                    {icon}
                  </div>
                  {/* Nội dung thẻ */}
                  <div className="mt-6">
                    <h3 className="text-sm font-bold text-[#4B5563]">
                      {label}
                    </h3>
                    <div className="flex flex-row items-center justify-between mt-2">
                      <p className="text-xl font-bold text-[#FF5733]">
                        {count}
                      </p>
                      <span className="ml-2 text-lg font-bold text-[#FF5733]">
                        {percent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2) Bảng thống kê: Phòng ban */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-2xl shadow-xl p-7 border border-gray-100">
          <h3 className="text-xl font-bold mb-2">Phòng ban sử dụng</h3>
          {deptData && deptData.length > 0 ? (
            <div>
              <table className="w-full">
                <thead>
                  <tr className="!border-px !border-gray-400">
                    <th className="border-b-[1px] border-gray-200 py-2 pr-4 text-start text-sm font-bold text-gray-500">
                      PHÒNG BAN
                    </th>
                    <th className="border-b-[1px] border-gray-200 py-2 pr-4 text-start text-sm font-bold text-gray-500">
                      LAPTOP
                    </th>
                    <th className="border-b-[1px] border-gray-200 py-2 pr-4 text-start text-sm font-bold text-gray-500">
                      DESKTOP
                    </th>
                    <th className="border-b-[1px] border-gray-200 py-2 pr-4 text-start text-sm font-bold text-gray-500">
                      TỔNG
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deptData
                    .slice(
                      currentPage * rowsPerPage,
                      (currentPage + 1) * rowsPerPage
                    )
                    .map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-3 pr-4">
                          <p className="text-sm font-bold text-navy-700">
                            {item.department}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="text-sm font-bold text-navy-700">
                            {item.laptop}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="text-sm font-bold text-navy-700">
                            {item.desktop}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="text-sm font-bold text-navy-700">
                            {item.total}
                          </p>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="flex flex-row gap-2 justify-end items-center mt-4">
                {/* Phân trang cho bảng năm sản xuất */}
                <div className="flex space-x-2">
                  {Array.from(
                    { length: Math.ceil(yearData.length / rowsPerPage) },
                    (_, i) => (
                      <button
                        key={i}
                        onClick={() => setYearCurrentPage(i)}
                        className={`px-1 border border-gray-300 rounded ${
                          yearCurrentPage === i
                            ? "bg-[#002855] text-white text-base"
                            : "bg-white text-gray-700 text-sm"
                        }`}
                      >
                        {i + 1}
                      </button>
                    )
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setYearCurrentPage(0); // Reset về trang đầu tiên
                    }}
                    className="text-base border border-gray-300 rounded-lg"
                  >
                    {[5, 10, 20, 50].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <p>Đang tải dữ liệu...</p>
          )}
        </div>

        {/* 3) Bảng thống kê: Năm sản xuất */}
        <div className="rounded-2xl shadow-xl p-7 border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold">Năm sản xuất</h3>
            <select
              value={yearDeviceFilter}
              onChange={(e) => setYearDeviceFilter(e.target.value)}
              className="px-5 py-1 border border-gray-300 rounded-2xl text-sm"
            >
              <option value="All">Tất cả</option>
              <option value="Laptop">Laptop</option>
              <option value="Desktop">Desktop</option>
            </select>
          </div>
          {yearData && yearData.length > 0 ? (
            <div>
              <table className="w-full rounded-2xl">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-start text-sm font-bold text-gray-500">
                      NĂM
                    </th>
                    <th className="px-4 py-2 text-start text-sm font-bold text-gray-500">
                      SỐ LƯỢNG
                    </th>
                    <th className="px-4 py-2 text-start text-sm font-bold text-gray-500">
                      TỶ LỆ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {yearData
                    .slice(
                      yearCurrentPage * rowsPerPage,
                      (yearCurrentPage + 1) * rowsPerPage
                    )
                    .map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-navy-700">
                            {item.year}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-navy-700">
                            {item.count}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-navy-700">
                            {item.percent}%
                          </p>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="flex flex-row gap-2 justify-end items-center mt-4">
                {/* Phân trang cho bảng năm sản xuất */}
                <div className="flex space-x-2">
                  {Array.from(
                    { length: Math.ceil(yearData.length / rowsPerPage) },
                    (_, i) => (
                      <button
                        key={i}
                        onClick={() => setYearCurrentPage(i)}
                        className={`px-1 border border-gray-300 rounded ${
                          yearCurrentPage === i
                            ? "bg-[#002855] text-white text-base"
                            : "bg-white text-gray-700 text-sm"
                        }`}
                      >
                        {i + 1}
                      </button>
                    )
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setYearCurrentPage(0); // Reset về trang đầu tiên
                    }}
                    className="text-base border border-gray-300 rounded-lg"
                  >
                    {[5, 10, 20, 50].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <p>Đang tải dữ liệu...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaptopDashboardDetail;
