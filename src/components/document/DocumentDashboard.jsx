import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import LineChart from "./LineChart";
import Widget from "./Widget";
import { MdDescription, MdAssignment, MdGavel, MdCheckCircle } from "react-icons/md";
import { FaDollarSign } from "react-icons/fa6";
import Dropdown from "../function/dropdown"; // Import đúng đường dẫn của Dropdown


// Helper: chuyển chỉ số fiscal month thành nhãn hiển thị (ví dụ: 1 → "Tháng 7")
const fiscalMonthToLabel = (fiscalMonthIndex) => {
  const actualMonth = fiscalMonthIndex <= 6 ? fiscalMonthIndex + 6 : fiscalMonthIndex - 6;
  return `Tháng ${actualMonth}`;
};

const DocumentDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  // State cho khoảng tháng: nếu full năm → {start: null, end: null}; nếu có filter tháng, set {start, end}
  const [monthRange, setMonthRange] = useState({ start: null, end: null });
  const today = new Date();
  // Định nghĩa năm tài khoá theo dạng "YYYY-YYYY"
  // Nếu hiện tại là trước tháng 7, ví dụ 03/2025 → "2024-2025"; nếu từ tháng 7 trở đi, ví dụ 09/2025 → "2025-2026"
  const currentFiscalYearRange =
    today.getMonth() + 1 < 7
      ? `${today.getFullYear() - 1}-${today.getFullYear()}`
      : `${today.getFullYear()}-${today.getFullYear() + 1}`;
  // Mặc định chọn năm tài khoá là năm hiện tại theo lịch thực
  const [selectedYear, setSelectedYear] = useState(currentFiscalYearRange);
  const [availableFiscalYears, setAvailableFiscalYears] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [widgetsData, setWidgetsData] = useState({
    totalCost: 0,
    toTrinhPR: 0,
    bienBan: 0,
    hopDong: 0,
    hoanCong: 0,
  });

  // Helper: tính năm tài khoá của một document
  const getFiscalYearFromDoc = (doc) => {
    if (doc.thangSuDung) {
      const [year, month] = doc.thangSuDung.split("-").map(Number);
      return month < 7 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
    }
    const d = new Date(doc.createdAt);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return month < 7 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
  };

  // Helper: chuyển đổi tháng thực thành chỉ số tháng tài khoá
  const getFiscalMonth = (year, month) => {
    return month >= 7 ? month - 6 : month + 6;
  };

  const [totalCostByYear, setTotalCostByYear] = useState(0);
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        console.log("Fetching documents in DocumentDashboard...");
        const res = await axios.get(`${API_URL}/documents`);
        const allDocs = res.data;
        console.log("Fetched documents:", allDocs);
        setDocuments(allDocs);
  
        // Lọc dữ liệu theo năm tài khoá đang chọn
        const filteredDocs = allDocs.filter((doc) => getFiscalYearFromDoc(doc) === selectedYear);
  
        // Tính tổng chi phí cho PR trong năm tài khoá được chọn
        const totalCost = filteredDocs
          .filter((d) => d.loai === "Tờ Trình/PR" && d.chiPhi)
          .reduce((sum, doc) => sum + doc.chiPhi, 0);
        setTotalCostByYear(totalCost);
        console.log("Total cost for selected fiscal year:", totalCost);
  
        // Cập nhật số lượng tài liệu theo loại
        const toTrinhPR = filteredDocs.filter((d) => d.loai === "Tờ Trình/PR").length;
        const bienBan = filteredDocs.filter((d) => d.loai === "Biên bản").length;
        const hopDong = filteredDocs.filter((d) => d.loai === "Hợp đồng").length;
        const hoanCong = filteredDocs.filter((d) => d.loai === "Hoàn công").length;
  
        setWidgetsData({
          totalCost,
          toTrinhPR,
          bienBan,
          hopDong,
          hoanCong,
        });
  
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tài liệu:", error);
      }
    };
  
    fetchDocs();
  }, [selectedYear]); // Khi `selectedYear` thay đổi, fetch lại dữ liệu

  useEffect(() => {
    const fetchFiscalYears = async () => {
      try {
        const res = await axios.get(`${API_URL}/documents`);
        const allDocs = res.data;
  
        // Lấy tất cả các năm tài khoá đã có trong DB từ PR
        const fiscalYearSet = new Set(
          allDocs
            .filter((d) => d.loai === "Tờ Trình/PR")
            .map((doc) => getFiscalYearFromDoc(doc))
        );
  
        // Tạo danh sách năm tài khoá có sẵn
        let sortedFiscalYears = Array.from(fiscalYearSet).sort();
  
        // Xác định năm tài khoá hiện tại theo ngày tháng thực tế
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentFiscalYear =
          today.getMonth() + 1 < 7 ? `${currentYear - 1}-${currentYear}` : `${currentYear}-${currentYear + 1}`;
  
        // Xác định năm tài khoá lớn nhất trong DB
        const lastFiscalYear = sortedFiscalYears.length > 0 ? sortedFiscalYears[sortedFiscalYears.length - 1] : currentFiscalYear;
  
        // Tạo năm tài khoá tiếp theo (dự trù 1 năm trong tương lai)
        const [startYear] = lastFiscalYear.split("-").map(Number);
        const nextFiscalYear = `${startYear + 1}-${startYear + 2}`;
  
        // Luôn thêm năm tài khoá hiện tại nếu chưa có
        if (!sortedFiscalYears.includes(currentFiscalYear)) {
          sortedFiscalYears.push(currentFiscalYear);
        }
  
        // Luôn thêm năm tài khoá trong tương lai
        sortedFiscalYears.push(nextFiscalYear);
  
        // Sắp xếp theo thứ tự mới nhất lên trước
        sortedFiscalYears = sortedFiscalYears.sort().reverse();
  
        setAvailableFiscalYears(sortedFiscalYears);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách năm tài khoá:", error);
      }
    };
  
    fetchFiscalYears();
  }, []);

  let filteredPR = [];
  console.log("Current monthRange (fiscal):", monthRange);
  filteredPR = documents.filter((doc) => {
    if (doc.loai !== "Tờ Trình/PR" || !doc.thangSuDung) return false;
    const fiscalYearDoc = getFiscalYearFromDoc(doc);
    if (fiscalYearDoc !== selectedYear) return false;
    const [docYear, docMonth] = doc.thangSuDung.split("-").map(Number);
    const fiscalMonthDoc = getFiscalMonth(docYear, docMonth);
    if (monthRange.start !== null && monthRange.end !== null) {
      return fiscalMonthDoc >= monthRange.start && fiscalMonthDoc <= monthRange.end;
    } else if (monthRange.start !== null && monthRange.end === null) {
      return fiscalMonthDoc === monthRange.start;
    }
    return true;
  });
  console.log("Filtered PR (fiscal):", filteredPR);
  filteredPR.sort((a, b) => (b.chiPhi || 0) - (a.chiPhi || 0));

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPR.length]);

  const totalPages = Math.ceil(filteredPR.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPR = filteredPR.slice(indexOfFirstItem, indexOfLastItem);

  const toTrinhPR = documents.filter((d) => d.loai === "Tờ Trình/PR").length;
  const bienBan = documents.filter((d) => d.loai === "Biên bản").length;
  const hopDong = documents.filter((d) => d.loai === "Hợp đồng").length;
  const hoanCong = documents.filter((d) => d.loai === "Hoàn công").length;

  const totalCost = documents
    .filter((d) => d.loai === "Tờ Trình/PR")
    .reduce((sum, item) => sum + (item.chiPhi || 0), 0);

  // Tính tiêu đề dựa trên monthRange, sử dụng fiscalMonthToLabel để chuyển đổi số thành nhãn
  let prTitle = `Tất cả PR trong năm ${selectedYear}`;
  if (monthRange.start !== null && monthRange.end !== null) {
    if (monthRange.start === monthRange.end) {
      prTitle = `PR tháng ${fiscalMonthToLabel(monthRange.start)}/${selectedYear}`;
    } else {
      prTitle = `PR từ ${fiscalMonthToLabel(monthRange.start)} đến ${fiscalMonthToLabel(monthRange.end)}/${selectedYear}`;
    }
  } else if (monthRange.start !== null && monthRange.end === null) {
    prTitle = `PR tháng ${fiscalMonthToLabel(monthRange.start)}/${selectedYear}`;
  }

  return (
    <div className="p-4">
      {/* Header: Tiêu đề bên trái và dropdown chọn năm tài khoá bên phải */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[#002147]">Báo cáo tài liệu</h2>
        <div>
          <Dropdown
              button={
                <button
                  className="flex items-center justify-center w-32 px-3 py-2 bg-white border rounded-md shadow-md hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>{selectedYear || "Chọn năm tài khoá"}</span>
                </button>
              }
              animation="origin-bottom transition-all duration-300 ease-in-out"
              children={
                <div className="absolute items-center justify-center right-0 top-10 mt-2 w-32 bg-white border rounded-md shadow-md z-50">
                  {availableFiscalYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setIsDropdownOpen(false); // Đóng dropdown sau khi chọn
                      }}
                      className={`block w-full text-left px-4 py-2 hover:bg-gray-200 ${
                        selectedYear === year ? "bg-gray-300 font-bold" : ""
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              }
              classNames="relative"
            />
        </div>
      </div>
      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Widget
          icon={<FaDollarSign className="h-6 w-6 text-white" />}
          title={"PR"}
          subtitle={`${totalCostByYear.toLocaleString("vi-VN")} đ`}
          bgColor="bg-white"
        />
        <Widget
          icon={<MdDescription className="h-6 w-6 text-white" />}
          title={"Tờ Trình"}
          subtitle={`${widgetsData.toTrinhPR}`}
          bgColor="bg-white"
        />
        <Widget
          icon={<MdAssignment className="h-6 w-6 text-white" />}
          title={"Biên bản"}
          subtitle={`${widgetsData.bienBan}`}
          bgColor="bg-white"
        />
        <Widget
          icon={<MdGavel className="h-6 w-6 text-white" />}
          title={"Hợp đồng"}
          subtitle={`${widgetsData.hopDong}`}
          bgColor="bg-white"
        />
        <Widget
          icon={<MdCheckCircle className="h-6 w-6 text-white" />}
          title={"Hoàn công"}
          subtitle={`${widgetsData.hoanCong} tài liệu`}
          bgColor="bg-white"
        />
      </div>

      <div className="flex flex-row gap-7">
        {/* Chart */}
        <div className="w-2/3 h-[370px] bg-white p-6 rounded-lg shadow-xl">
          <LineChart
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            monthRange={monthRange}
            setMonthRange={setMonthRange}
          />
        </div>

        {/* Bảng PR */}
        <div className="w-1/3 h-full bg-white p-6 rounded-lg shadow-xl">
          <div className="flex flex-row justify-between text-center items-center mb-4">
            <h3 className="text-lg font-bold text-[#002147]">{prTitle}</h3>
          </div>
          {currentPR.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b-[1px] border-gray-200">
                  <th className="pb-2 pr-4 text-start text-sm font-bold text-gray-500">
                    Tên PR
                  </th>
                  <th className="pb-2 pr-4 text-end text-sm font-bold text-gray-500">
                    Giá tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentPR.map((doc) => (
                  <tr key={doc._id} className="border-b border-gray-200">
                    <td className="py-3 pr-4 text-start text-sm font-bold text-navy-700">
                      {doc.ten}
                    </td>
                    <td className="py-3 pr-4 text-end text-sm font-bold text-navy-700">
                      {doc.chiPhi?.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-center mt-4">Không có dữ liệu PR</p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    console.log("Changing to page:", page);
                    setCurrentPage(page);
                  }}
                  className={`px-3 py-1 border rounded ${
                    page === currentPage ? "bg-[#002147] text-white" : ""
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-6 rounded-lg shadow-xl bg-white">
        <h3 className="text-lg font-bold text-[#002147] mb-3">Tài liệu gần đây</h3>
        <ul className="space-y-2">
          {recentDocuments.map((doc) => (
            <li key={doc._id} className="p-3">
              <p>
                <strong>{doc.ten}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Ngày tạo: {new Date(doc.createdAt).toLocaleDateString("vi-VN")} | {doc.loai}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DocumentDashboard;