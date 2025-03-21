// src/components/inventory/PrinterDashboardDetail.jsx
import React, { useState, useEffect } from "react";
import { API_URL } from "../../config";
import {
  FaCheck,
  FaExclamation,
  FaClockRotateLeft,
  FaFileCircleQuestion,
} from "react-icons/fa6";

const PrinterDashboardDetail = () => {
  const [printers, setPrinters] = useState([]);
  const [deviceFilter, setDeviceFilter] = useState("Tất cả");
  const [printerTypes, setPrinterTypes] = useState([]);
  const [yearDeviceFilter, setYearDeviceFilter] = useState("Printer");

  const [statusData, setStatusData] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [yearData, setYearData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [yearCurrentPage, setYearCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${API_URL}/printers`, { headers });
        const data = await res.json();
        if (data && Array.isArray(data.populatedPrinters)) {
          setPrinters(data.populatedPrinters);
        }
      } catch (error) {
        console.error("Lỗi khi tải printers:", error);
      }
    };
    fetchPrinters();
  }, []);

  useEffect(() => {
    if (!printers.length) return;

    // Tính danh sách các loại máy in hiện có
    const types = Array.from(new Set(printers.map((printer) => printer.type)));
    setPrinterTypes(types);

    // Lọc theo loại đã chọn
    const filteredPrinters =
      deviceFilter === "Tất cả"
        ? printers
        : printers.filter((printer) => printer.type === deviceFilter);

    const statusCount = {
      Active: 0,
      Broken: 0,
      Standby: 0,
      PendingDocumentation: 0,
    };
    filteredPrinters.forEach((printer) => {
      if (statusCount[printer.status] !== undefined) {
        statusCount[printer.status]++;
      } else {
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
      total: totalCount,
    });

    // Compute distinct types and update state

    const deptMap = {};
    printers.forEach((printer) => {
      let dept = "Chưa gán";
      if (printer.assigned && printer.assigned.length > 0) {
        dept = printer.assigned[0].department || "Không xác định";
      }
      if (!deptMap[dept]) {
        // Initialize count for each type to 0
        deptMap[dept] = { total: 0 };
        types.forEach((t) => {
          deptMap[dept][t] = 0;
        });
      }
      deptMap[dept].total += 1;
      const pType = printer.type || "Không xác định";
      if (deptMap[dept][pType] !== undefined) {
        deptMap[dept][pType] += 1;
      } else {
        deptMap[dept][pType] = 1;
      }
    });
    const deptStats = Object.keys(deptMap).map((dept) => ({
      department: dept,
      ...deptMap[dept],
    }));
    setDeptData(deptStats);

    const yearMap = {};
    printers.forEach((printer) => {
      const year = printer.releaseYear || "Không rõ";
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
  }, [printers]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Printer</h2>
      {/* Cấu trúc hiển thị tương tự */}
      {statusData && (
        <div className="flex flex-row items-center justify-between p-6 mb-6 bg-[#002855] rounded-xl">
          {/* Bộ lọc và thống kê trạng thái */}
          <div className="flex flex-col">
            <div className="flex space-x-2">
              {["Tất cả", ...printerTypes].map((type) => (
                <button
                  key={type}
                  onClick={() => setDeviceFilter(type)}
                  className={`px-4 py-2 rounded-full font-bold text-sm ${
                    deviceFilter === type
                      ? "bg-[#e8e8e8] text-[#002855]"
                      : "bg-transparent text-[#e8e8e8] border border-[#e8e8e8]"
                  }`}
                >
                  {type === "Tất cả" ? "Tất cả" : type}
                </button>
              ))}
            </div>
            <p className="text-sm text-[#e8e8e8] mt-1">
              Thống kê số lượng thiết bị theo trạng thái
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 ">
            {statusData.labels.map((label, idx) => {
              const count = statusData.counts[idx] || 0;
              const total = statusData.total || 0;
              const percent =
                total > 0 ? ((count / total) * 100).toFixed(0) : 0;
              let icon = null;
              let iconBg = "#E6FFFA";
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
                  <div
                    className="absolute -top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                    style={{ backgroundColor: iconBg }}
                  >
                    {icon}
                  </div>
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
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Bảng thống kê: Phòng ban sử dụng */}
        <div className="rounded-2xl shadow-xl p-7 border border-gray-100 mt-6">
          <h3 className="text-xl font-bold mb-2">Phòng ban sử dụng</h3>
          {deptData && deptData.length > 0 ? (
            <div>
              <table className="w-full">
                <thead>
                  <tr className="!border-px !border-gray-400">
                    <th className="border-b-[1px] border-gray-200 py-2 pr-4 text-start text-sm font-bold text-gray-500">
                      PHÒNG BAN
                    </th>
                    {printerTypes.map((type, idx) => (
                      <th
                        key={idx}
                        className="border-b-[1px] border-gray-200 py-2 pr-4 text-start text-sm font-bold text-gray-500"
                      >
                        {type.toUpperCase()}
                      </th>
                    ))}
                    <th className="border-b-[1px] border-gray-200 py-2 pr-4 text-start text-sm font-bold text-gray-500">
                      TỔNG
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deptData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 pr-4">
                        <p className="text-sm font-bold text-navy-700">
                          {item.department}
                        </p>
                      </td>
                      {printerTypes.map((type, idx) => (
                        <td key={idx} className="py-3 pr-4">
                          <p className="text-sm font-bold text-navy-700">
                            {item[type] || 0}
                          </p>
                        </td>
                      ))}
                      <td className="py-3 pr-4">
                        <p className="text-sm font-bold text-navy-700">
                          {item.total}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Đang tải dữ liệu...</p>
          )}
        </div>

        {/* Bảng thống kê: Năm sản xuất */}
        <div className="rounded-2xl shadow-xl p-7 border border-gray-100 mt-6">
          <h3 className="text-xl font-bold mb-2">Năm sản xuất</h3>
          {yearData && yearData.length > 0 ? (
            <div>
              <table className="w-full">
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
                  {yearData.map((item, index) => (
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
            </div>
          ) : (
            <p>Đang tải dữ liệu...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrinterDashboardDetail;
