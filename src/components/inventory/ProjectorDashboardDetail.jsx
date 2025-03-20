// src/components/inventory/ProjectorDashboardDetail.jsx
import React, { useState, useEffect } from "react";
import { API_URL } from "../../config";
import {
  FaCheck,
  FaExclamation,
  FaClockRotateLeft,
  FaFileCircleQuestion,
} from "react-icons/fa6";

const ProjectorDashboardDetail = () => {
  const [projectors, setProjectors] = useState([]);
  const [deviceFilter, setDeviceFilter] = useState("Projector");
  const [yearDeviceFilter, setYearDeviceFilter] = useState("Projector");

  const [statusData, setStatusData] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [yearData, setYearData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [yearCurrentPage, setYearCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const fetchProjectors = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${API_URL}/projectors`, { headers });
        const data = await res.json();
        if (data && Array.isArray(data.populatedProjectors)) {
          setProjectors(data.populatedProjectors);
        }
      } catch (error) {
        console.error("Lỗi khi tải projectors:", error);
      }
    };
    fetchProjectors();
  }, []);

  useEffect(() => {
    if (!projectors.length) return;

    const filteredProjectors = projectors;

    const statusCount = {
      Active: 0,
      Broken: 0,
      Standby: 0,
      PendingDocumentation: 0,
    };
    filteredProjectors.forEach((proj) => {
      if (statusCount[proj.status] !== undefined) {
        statusCount[proj.status]++;
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

    const deptMap = {};
    projectors.forEach((proj) => {
      let dept = "Chưa gán";
      if (proj.assigned && proj.assigned.length > 0) {
        dept = proj.assigned[0].department || "Không xác định";
      }
      if (!deptMap[dept]) {
        deptMap[dept] = { total: 0 };
      }
      deptMap[dept].total += 1;
    });
    const deptStats = Object.keys(deptMap).map((dept) => ({
      department: dept,
      total: deptMap[dept].total,
    }));
    setDeptData(deptStats);

    const yearMap = {};
    projectors.forEach((proj) => {
      const year = proj.releaseYear || "Không rõ";
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
  }, [projectors]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Projector</h2>
      {/* Cấu trúc hiển thị tương tự */}
      {statusData && (
        <div className="flex flex-row items-center justify-between p-6 mb-6 bg-[#002855] rounded-xl">
          {/* Bộ lọc và thống kê trạng thái */}
          <div className="flex flex-col">
            <div className="flex space-x-2">
              {["All", "Projector"].map((type) => (
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
    </div>
  );
};

export default ProjectorDashboardDetail;
