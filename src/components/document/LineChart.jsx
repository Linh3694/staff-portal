import React, { useState, useEffect, useRef } from "react";
import Chart from "react-apexcharts";
import axios from "axios";
import { API_URL } from "../../config";

const LineChart = ({
  selectedYear,
  setSelectedYear,
  monthRange,
  setMonthRange,
}) => {
  const [loading, setLoading] = useState(true);
  const [viewByMonth] = useState(true);
  const viewByMonthRef = useRef(viewByMonth);
  useEffect(() => {
    viewByMonthRef.current = viewByMonth;
    console.log("viewByMonth (always true):", viewByMonth);
  }, [viewByMonth]);

  const [chartData, setChartData] = useState({ series: [], options: {} });

  const getFiscalYearRange = (date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return month < 7 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
  };

  // Chuyển chuỗi "YYYY-MM" (theo doc.thangSuDung) thành chỉ số tháng tài khoá (1–12)
  // Quy ước: Tháng thực 7 → fiscal 1, 8 → 2, …, 12 → 6, 1 → 7, …, 6 → 12.
  const getFiscalMonth = (yearStr, monthStr) => {
    const monthUsed = Number(monthStr);
    return monthUsed >= 7 ? monthUsed - 6 : monthUsed + 6;
  };

  // Chuyển chỉ số tháng tài khoá thành nhãn hiển thị, ví dụ: 1 → "Tháng 7"
  const fiscalMonthToLabel = (index) => {
    const actualMonth =
      index >= 1 && index <= 12 ? (index <= 6 ? index + 6 : index - 6) : index;
    return `Tháng ${actualMonth}`;
  };

  // Fetch dữ liệu từ API và tính toán tổng chi phí theo năm và theo tháng
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        console.log("Fetching data from API...");
        const res = await axios.get(`${API_URL}/documents`);
        const docs = res.data;
        console.log("Documents fetched:", docs);

        const prCostsByYear = {};
        const prCostsByMonth = {};

        docs.forEach((doc) => {
          if (doc.loai === "Tờ Trình/PR" && doc.chiPhi) {
            const fiscalYear = getFiscalYearRange(doc.createdAt);
            prCostsByYear[fiscalYear] =
              (prCostsByYear[fiscalYear] || 0) + doc.chiPhi;

            if (
              typeof doc.thangSuDung === "string" &&
              doc.thangSuDung.includes("-")
            ) {
              const [yearUsedStr, monthUsedStr] = doc.thangSuDung.split("-");
              const fiscalYearUsed =
                Number(monthUsedStr) < 7
                  ? `${Number(yearUsedStr) - 1}-${yearUsedStr}`
                  : `${yearUsedStr}-${Number(yearUsedStr) + 1}`;
              const fiscalMonth = getFiscalMonth(yearUsedStr, monthUsedStr);
              if (!prCostsByMonth[fiscalYearUsed])
                prCostsByMonth[fiscalYearUsed] = {};
              prCostsByMonth[fiscalYearUsed][fiscalMonth] =
                (prCostsByMonth[fiscalYearUsed][fiscalMonth] || 0) + doc.chiPhi;
            }
          }
        });

        // Tính toán dữ liệu năm trước
        const previousYear = selectedYear.split("-").map(Number);
        const previousFiscalYear = `${previousYear[0] - 1}-${
          previousYear[1] - 1
        }`;

        setTimeout(() => {
          setChartData({
            series: [
              {
                name: `Chi phí PR - Năm tài khoá ${selectedYear}`,
                data: Array.from({ length: 12 }, (_, i) => {
                  const dataObj = prCostsByMonth[selectedYear] || {};
                  return dataObj[i + 1] || 0;
                }),
              },
            ],
            options: {
              chart: {
                id: "line-chart",
                toolbar: { show: false },
                events: {
                  dataPointSelection: () => {
                    console.log("Click event ở chế độ tháng");
                  },
                },
              },
              colors: ["#FF5733"],
              stroke: { curve: "smooth" },
              markers: { size: 5 },
              xaxis: {
                categories: Array.from({ length: 12 }, (_, i) => i + 1).map(
                  fiscalMonthToLabel
                ),
                title: { text: "Tháng (theo năm tài khoá)" },
              },
              yaxis: {
                labels: {
                  formatter: (value) => value.toLocaleString("vi-VN") + " VND",
                },
              },
              tooltip: {
                custom: ({ series, seriesIndex, dataPointIndex }) => {
                  const currentValue = series[seriesIndex][dataPointIndex] || 0;
                  const currentFiscalMonth = dataPointIndex + 1; // Chắc chắn rằng index bắt đầu từ 1

                  const lastYearDataObj =
                    prCostsByMonth[previousFiscalYear] || {};
                  const lastYearValue =
                    lastYearDataObj[currentFiscalMonth] || null;

                  let comparisonText;
                  if (lastYearValue === null) {
                    comparisonText = `<span style="color: gray;">Không có dữ liệu năm ngoái</span>`;
                  } else {
                    const percentageChange = lastYearValue
                      ? ((currentValue - lastYearValue) / lastYearValue) * 100
                      : 0;

                    const isIncrease = percentageChange >= 0;
                    comparisonText = isIncrease
                      ? `<span style="color: green;"> Tăng ${percentageChange.toFixed(
                          2
                        )}%</span>`
                      : `<span style="color: red;"> Giảm ${Math.abs(
                          percentageChange.toFixed(2)
                        )}%</span>`;
                  }

                  return `
                    <div style="padding: 10px; background: white; border-radius: 5px;">
                      <strong>${fiscalMonthToLabel(
                        currentFiscalMonth
                      )}</strong><br/>
                      <span style="color: #002147; font-weight:bold"> Chi phí: </span>
                      <strong>${currentValue.toLocaleString(
                        "vi-VN"
                      )} VND</strong><br/>
                      ${comparisonText}
                    </div>
                  `;
                },
              },
            },
            prCostsByYear,
            prCostsByMonth,
          });
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  // Cập nhật chart khi thay đổi lựa chọn tháng (monthRange) – luôn hiển thị full 12 tháng nếu không có filter tháng
  useEffect(() => {
    if (viewByMonth) {
      // Nếu có filter theo tháng (monthRange không rỗng), cập nhật lại series theo khoảng đã chọn
      if (monthRange.start !== null && monthRange.end !== null) {
        setChartData((prev) => ({
          ...prev,
          series: [
            {
              name: `Chi phí PR - Năm tài khoá ${selectedYear}`,
              data: Array.from({ length: 12 }, (_, i) => {
                const dataObj =
                  (prev.prCostsByMonth && prev.prCostsByMonth[selectedYear]) ||
                  {};
                // Lọc dữ liệu theo tháng từ monthRange.start đến monthRange.end
                const fiscalMonth = i + 1;
                return fiscalMonth >= monthRange.start &&
                  fiscalMonth <= monthRange.end
                  ? dataObj[fiscalMonth] || 0
                  : 0;
              }),
            },
          ],
        }));
      } else {
        // Nếu chưa chọn tháng (monthRange rỗng) hiển thị full 12 tháng
        setChartData((prev) => ({
          ...prev,
          series: [
            {
              name: `Chi phí PR - Năm tài khoá ${selectedYear}`,
              data: Array.from({ length: 12 }, (_, i) => {
                const dataObj =
                  (prev.prCostsByMonth && prev.prCostsByMonth[selectedYear]) ||
                  {};
                return dataObj[i + 1] || 0;
              }),
            },
          ],
          options: {
            ...prev.options,
            xaxis: {
              ...prev.options.xaxis,
              categories: Array.from({ length: 12 }, (_, i) => i + 1).map(
                fiscalMonthToLabel
              ),
              min: undefined,
              max: undefined,
            },
            annotations: {},
          },
        }));
      }
    }
  }, [viewByMonth, selectedYear, monthRange]);

  // Khi selectedYear thay đổi và không có filter tháng, reset hiển thị full 12 tháng
  useEffect(() => {
    if (viewByMonth && monthRange.start === null) {
      setChartData((prev) => ({
        ...prev,
        options: {
          ...prev.options,
          xaxis: {
            ...prev.options.xaxis,
            categories: Array.from({ length: 12 }, (_, i) => i + 1).map(
              fiscalMonthToLabel
            ),
            title: { text: "Tháng (theo năm tài khoá)" },
            min: undefined,
            max: undefined,
          },
          annotations: {},
        },
      }));
    }
  }, [selectedYear, viewByMonth, monthRange]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-[#002147]">
          Chi phí trong năm tài khoá
        </h2>
      </div>

      <Chart
        options={chartData.options}
        series={chartData.series}
        type="line"
        height={280}
      />
    </div>
  );
};

export default LineChart;
