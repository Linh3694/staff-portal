import React, { useState, useEffect, useMemo } from "react";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import { API_URL, UPLOAD_URL, BASE_URL } from "../../../config";

const Inspect = ({ laptopData, onClose, user, onInspectionComplete }) => {
  // user: chủ máy (người sở hữu); inspector sẽ được lấy từ currentUser (kỹ thuật kiểm tra)
  const [inspector, setInspector] = useState(null);
  useEffect(() => {
    // Giả sử currentUser được lưu trong localStorage dưới key "currentUser"
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      setInspector(JSON.parse(currentUser));
    }
  }, []);

  const [currentStep, setCurrentStep] = useState(1);
  const [isGuidelinesChecked, setIsGuidelinesChecked] = useState(false);
  const [isInspectionConfirmed, setIsInspectionConfirmed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Tổng thể");
  const [evaluation, setEvaluation] = useState({});
  const [inspectId, setInspectId] = useState(null);
  const [isInspectionSubmitted, setIsInspectionSubmitted] = useState(false);
  const [monitorList, setMonitorList] = useState(null);
  // Bổ sung state cho bước "Kết luận kỹ thuật"
  const [overallConclusion, setOverallConclusion] = useState("");
  const [followUpRecommendation, setFollowUpRecommendation] = useState("");
  // State lưu giá trị ngày hiện tại để xuất báo cáo
  const [today, setToday] = useState("");

  useEffect(() => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate().toString().padStart(2, "0")}/${(currentDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${currentDate.getFullYear()}`;
    setToday(formattedDate);
  }, []);

  // Helper: cập nhật trường cho evaluation của một danh mục
  const updateEvaluationField = (category, field, value) => {
    setEvaluation((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  // Helper: ngăn nhập các ký tự không hợp lệ cho input kiểu number
  const preventInvalidInput = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Dùng useMemo để tránh re-run không cần thiết khi lấy loại thiết bị
  const deviceType = useMemo(() => laptopData.type, [laptopData.type]);

  // Khi chọn danh mục "Màn hình" và nếu thiết bị là Desktop thì fetch danh sách màn hình
  useEffect(() => {
    if (selectedCategory === "Màn hình" && deviceType === "Desktop") {
      const token = localStorage.getItem("authToken");
      fetch(`${API_URL}/monitors`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data && Array.isArray(data.populatedMonitors)) {
            // Lọc ra những thiết bị có đầy đủ _id, name và chỉ lấy những đối tượng có type === "monitor"
            const validMonitors = data.populatedMonitors.filter(
              (monitor) =>
                monitor && monitor._id && monitor.name && monitor.type === "monitor"
            );
            const uniqueMonitors = [
              ...new Map(validMonitors.map((item) => [item._id, item])).values(),
            ];
            setMonitorList(uniqueMonitors);
          } else {
            setMonitorList([]);
          }
        })
        .catch((error) => {
          console.error("Error fetching monitors:", error);
          setMonitorList([]);
        });
    } else {
      setMonitorList(null);
    }
  }, [selectedCategory, deviceType]);

  // Cập nhật danh sách bước
  const steps = [
    "Hướng dẫn kiểm tra",
    "Thông tin kiểm tra",
    "Kiểm tra thiết bị",
    "Kết luận kỹ thuật",
    "Kết quả kiểm tra",
  ];

  const submitInspectionData = async () => {
    if (!inspector) {
      toast.error("Thông tin kỹ thuật kiểm tra không xác định.");
      return;
    }
    const payload = {
      laptopId: laptopData._id,
      inspectorId: inspector._id, // Sử dụng thông tin của currentUser (inspector)
      inspectionDate: new Date(),
      results: {
        externalCondition: {
          overallCondition: evaluation["Tổng thể"]?.overallCondition || "Không xác định",
          notes: evaluation["Tổng thể"]?.notes || "Không xác định",
        },
        cpu: {
          performance: evaluation["CPU"]?.performance?.toString() || "0",
          temperature: evaluation["CPU"]?.temperature?.toString() || "0",
          overallCondition: evaluation["CPU"]?.overallCondition || "Không xác định",
          notes: evaluation["CPU"]?.notes || "Không xác định",
        },
        ram: {
          consumption: evaluation["RAM"]?.consumption?.toString() || "0",
          overallCondition: evaluation["RAM"]?.overallCondition || "Không xác định",
          notes: evaluation["RAM"]?.notes || "Không xác định",
        },
        storage: {
          remainingCapacity: evaluation["Ổ cứng"]?.remainingCapacity || null,
          overallCondition: evaluation["Ổ cứng"]?.overallCondition || "Không xác định",
          notes: evaluation["Ổ cứng"]?.notes || "Không xác định",
        },
        battery: {
          capacity: evaluation["Pin"]?.capacity || null,
          performance: evaluation["Pin"]?.performance || null,
          chargeCycles: evaluation["Pin"]?.chargeCycles || null,
          overallCondition: evaluation["Pin"]?.overallCondition || "Không xác định",
          notes: evaluation["Pin"]?.notes || "Không xác định",
        },
        display: {
          isStriped: evaluation["Màn hình"]?.isStriped || false,
          hasDeadPixels: evaluation["Màn hình"]?.hasDeadPixels || false,
          colorAndBrightness: evaluation["Màn hình"]?.colorAndBrightness || "",
          overallCondition: evaluation["Màn hình"]?.overallCondition || "Không xác định",
          notes: evaluation["Màn hình"]?.notes || "Không xác định",
        },
        connectivity: {
          Wifi: evaluation["Kết nối"]?.Wifi || false,
          Bluetooth: evaluation["Kết nối"]?.Bluetooth || false,
          USB: evaluation["Kết nối"]?.USB || false,
          HDMI: evaluation["Kết nối"]?.HDMI || false,
          Ethernet: evaluation["Kết nối"]?.Ethernet || false,
          Micro: evaluation["Kết nối"]?.Micro || false,
          Loa: evaluation["Kết nối"]?.Loa || false,
          overallCondition: evaluation["Kết nối"]?.overallCondition || "Không xác định",
          notes: evaluation["Kết nối"]?.notes || "Không xác định",
        },
        software: {
          "Kiểm tra hệ điều hành": evaluation["Phần mềm"]?.["Kiểm tra hệ điều hành"] || false,
          "Cập nhật bản vá": evaluation["Phần mềm"]?.["Cập nhật bản vá"] || false,
          "Tắt Windows Updates": evaluation["Phần mềm"]?.["Tắt Windows Updates"] || false,
          overallCondition: evaluation["Phần mềm"]?.overallCondition || "Không xác định",
          notes: evaluation["Phần mềm"]?.notes || "Không xác định",
        },
      },
      technicalConclusion: overallConclusion || "Không có kết luận",
      followUpRecommendation: followUpRecommendation || "Không có đề xuất",
      passed: true,
      recommendations: "",
    };

    try {
      if (inspectId) {
        const response = await fetch(`${API_URL}/inspects/${inspectId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (response.ok) {
          setIsInspectionSubmitted(true);
        } else {
          console.error("Error updating inspection:", data);
        }
      } else {
        const response = await fetch(`${API_URL}/inspects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (response.ok) {
          setInspectId(data.data._id);
          setIsInspectionSubmitted(true);
          if (typeof onInspectionComplete === "function") {
            onInspectionComplete(data.data);
          }
        } else {
          console.error("Error submitting inspection:", data);
        }
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
    }
  };

  const getIncompleteCategories = () => {
    const requiredCategories = ["CPU", "RAM", "Ổ cứng", "Màn hình", "Pin", "Kết nối", "Phần mềm"];
    return requiredCategories.filter((category) => !evaluation[category]);
  };

  const handleNext = () => {
    if (currentStep === 1 && !isGuidelinesChecked) {
      alert("Vui lòng xác nhận đã đọc hướng dẫn trước khi tiếp tục.");
      return;
    }
    if (currentStep === 2 && !isInspectionConfirmed) {
      alert("Vui lòng tick vào xác nhận kiểm tra thiết bị trước khi tiếp tục.");
      return;
    }
    if (currentStep === 3) {
      const incompleteCategories = getIncompleteCategories();
      if (incompleteCategories.length > 0) {
        alert(`Bạn chưa hoàn thành các danh mục kiểm tra sau:\n- ${incompleteCategories.join("\n- ")}`);
        return;
      }
      if (!isInspectionSubmitted) {
        submitInspectionData();
      }
    }
    if (currentStep === 4) {
      if (!overallConclusion.trim() || !followUpRecommendation.trim()) {
        alert("Vui lòng điền đầy đủ kết luận và đề xuất xử lý tiếp theo.");
        return;
      }
    }
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
    if (currentStep === steps.length) {
      setIsInspectionSubmitted(false);
    }
  };

  useEffect(() => {
    if (!evaluation[selectedCategory]) {
      setEvaluation((prev) => ({
        ...prev,
        [selectedCategory]: {
          overallCondition: "",
          notes: "",
        },
      }));
    }
  }, [selectedCategory, evaluation]);

  useEffect(() => {
    if (currentStep === 5 && inspectId) {
      const fetchInspectionData = async () => {
        try {
          const response = await fetch(`${API_URL}/inspects/${inspectId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          });
          const data = await response.json();
          if (response.ok) {
            setEvaluation({
              ...data.results,
              "Phần mềm": data.results["Phần mềm"] || {},
            });
          } else {
            console.error("Error fetching inspection data:", data);
          }
        } catch (error) {
          console.error("Error connecting to server:", error);
        }
      };
      fetchInspectionData();
    }
  }, [currentStep, inspectId]);

  const handleGenerateInspectionReport = async () => {
    try {
      const response = await fetch("/inspection_report.docx");
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const data = {
        today: today,
        user_fullname: laptopData.assigned[0]?.fullname || "Không xác định",
        user_department: laptopData.assigned[0]?.department || "Không xác định",
        laptopName: laptopData.name || "Không xác định",
        laptopSerial: laptopData.serial || "Không xác định",
        laptopProcessor: laptopData.specs.processor || "Không xác định",
        laptopRam: laptopData.specs.ram || "Không xác định",
        laptopStorage: laptopData.specs.storage || "Không xác định",
        laptopreleaseYear: laptopData.releaseYear || "Không xác định",
        inspectorName: inspector?.fullname || "Không xác định",
        inspectorTitle: inspector?.jobTitle || "Không xác định",
        evaluation: evaluation || {},
        externalCondition_overallCondition: evaluation["Tổng thể"]?.overallCondition || "Không xác định",
        externalCondition_notes: evaluation["Tổng thể"]?.notes || "Không có ghi chú.",
        CPU_performance: evaluation["CPU"]?.performance || "Không xác định",
        CPU_temperature: evaluation["CPU"]?.temperature || "Không xác định",
        CPU_overallCondition: evaluation["CPU"]?.overallCondition || "Không xác định",
        CPU_notes: evaluation["CPU"]?.notes || "Không xác định",
        RAM_consumption: evaluation["RAM"]?.consumption || "Không xác định",
        RAM_overallCondition: evaluation["RAM"]?.overallCondition || "Không xác định",
        RAM_notes: evaluation["RAM"]?.notes || "Không xác định",
        storage_remainingCapacity: evaluation["Ổ cứng"]?.remainingCapacity || "Không xác định",
        storage_overallCondition: evaluation["Ổ cứng"]?.overallCondition || "Không xác định",
        storage_notes: evaluation["Ổ cứng"]?.notes || "Không xác định",
        battery_capacity: evaluation["Pin"]?.capacity || "Không xác định",
        battery_performance: evaluation["Pin"]?.performance || null,
        battery_chargeCycles: evaluation["Pin"]?.chargeCycles || "Không xác định",
        battery_overallCondition: evaluation["Pin"]?.overallCondition || "Không xác định",
        battery_notes: evaluation["Pin"]?.notes || "Không xác định",
        display_colorAndBrightness: evaluation["Màn hình"]?.colorAndBrightness || "Không xác định",
        display_isStriped: evaluation["Màn hình"]?.isStriped ? "Có" : "Không",
        display_hasDeadPixels: evaluation["Màn hình"]?.hasDeadPixels ? "Có" : "Không",
        display_overallCondition: evaluation["Màn hình"]?.overallCondition || "Không xác định",
        display_notes: evaluation["Màn hình"]?.notes || "Không xác định",
        connectivity_Wifi: evaluation["Kết nối"]?.Wifi ? "Có" : "Không",
        connectivity_Bluetooth: evaluation["Kết nối"]?.Bluetooth ? "Có" : "Không",
        connectivity_USB: evaluation["Kết nối"]?.USB ? "Có" : "Không",
        connectivity_HDMI: evaluation["Kết nối"]?.HDMI ? "Có" : "Không",
        connectivity_Ethernet: evaluation["Kết nối"]?.Ethernet ? "Có" : "Không",
        connectivity_Micro: evaluation["Kết nối"]?.Micro ? "Có" : "Không",
        connectivity_Loa: evaluation["Kết nối"]?.Loa ? "Có" : "Không",
        connectivity_overallCondition: evaluation["Kết nối"]?.overallCondition || "Không xác định",
        connectivity_notes: evaluation["Kết nối"]?.notes || "Không xác định",
        software_overallCondition: evaluation["Phần mềm"]?.overallCondition || "Không xác định",
        software_notes: evaluation["Phần mềm"]?.notes || "Không xác định",
        technicalConclusion: overallConclusion || "Không có kết luận",
        followUpRecommendation: followUpRecommendation || "Không có đề xuất",
      };

      doc.setData(data);
      doc.render();
      const output = doc.getZip().generate({ type: "blob" });
      saveAs(output, `inspection_report_${laptopData.serial}.docx`);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const handleCompleteInspection = async () => {
    try {
      const response = await fetch("/inspection_report.docx");
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const data = {
        today: today,
        user_fullname: laptopData.assigned[0]?.fullname || "Không xác định",
        user_department: laptopData.assigned[0]?.department || "Không xác định",
        laptopName: laptopData.name || "Không xác định",
        laptopSerial: laptopData.serial || "Không xác định",
        laptopProcessor: laptopData.specs.processor || "Không xác định",
        laptopRam: laptopData.specs.ram || "Không xác định",
        laptopStorage: laptopData.specs.storage || "Không xác định",
        laptopreleaseYear: laptopData.releaseYear || "Không xác định",
        inspectorName: inspector?.fullname || "Không xác định",
        inspectorTitle: inspector?.jobTitle || "Không xác định",
        evaluation: evaluation || {},
        externalCondition_overallCondition: evaluation["Tổng thể"]?.overallCondition || "Không xác định",
        externalCondition_notes: evaluation["Tổng thể"]?.notes || "Không có ghi chú.",
        CPU_performance: evaluation["CPU"]?.performance || "Không xác định",
        CPU_temperature: evaluation["CPU"]?.temperature || "Không xác định",
        CPU_overallCondition: evaluation["CPU"]?.overallCondition || "Không xác định",
        CPU_notes: evaluation["CPU"]?.notes || "Không xác định",
        RAM_consumption: evaluation["RAM"]?.consumption || "Không xác định",
        RAM_overallCondition: evaluation["RAM"]?.overallCondition || "Không xác định",
        RAM_notes: evaluation["RAM"]?.notes || "Không xác định",
        storage_remainingCapacity: evaluation["Ổ cứng"]?.remainingCapacity || "Không xác định",
        storage_overallCondition: evaluation["Ổ cứng"]?.overallCondition || "Không xác định",
        storage_notes: evaluation["Ổ cứng"]?.notes || "Không xác định",
        battery_capacity: evaluation["Pin"]?.capacity || "Không xác định",
        battery_performance: evaluation["Pin"]?.performance || null,
        battery_chargeCycles: evaluation["Pin"]?.chargeCycles || "Không xác định",
        battery_overallCondition: evaluation["Pin"]?.overallCondition || "Không xác định",
        battery_notes: evaluation["Pin"]?.notes || "Không xác định",
        display_colorAndBrightness: evaluation["Màn hình"]?.colorAndBrightness || "Không xác định",
        display_isStriped: evaluation["Màn hình"]?.isStriped ? "Có" : "Không",
        display_hasDeadPixels: evaluation["Màn hình"]?.hasDeadPixels ? "Có" : "Không",
        display_overallCondition: evaluation["Màn hình"]?.overallCondition || "Không xác định",
        display_notes: evaluation["Màn hình"]?.notes || "Không xác định",
        connectivity_Wifi: evaluation["Kết nối"]?.Wifi ? "Có" : "Không",
        connectivity_Bluetooth: evaluation["Kết nối"]?.Bluetooth ? "Có" : "Không",
        connectivity_USB: evaluation["Kết nối"]?.USB ? "Có" : "Không",
        connectivity_HDMI: evaluation["Kết nối"]?.HDMI ? "Có" : "Không",
        connectivity_Ethernet: evaluation["Kết nối"]?.Ethernet ? "Có" : "Không",
        connectivity_Micro: evaluation["Kết nối"]?.Micro ? "Có" : "Không",
        connectivity_Loa: evaluation["Kết nối"]?.Loa ? "Có" : "Không",
        connectivity_overallCondition: evaluation["Kết nối"]?.overallCondition || "Không xác định",
        connectivity_notes: evaluation["Kết nối"]?.notes || "Không xác định",
        software_overallCondition: evaluation["Phần mềm"]?.overallCondition || "Không xác định",
        software_notes: evaluation["Phần mềm"]?.notes || "Không xác định",
        technicalConclusion: overallConclusion || "Không có kết luận",
        followUpRecommendation: followUpRecommendation || "Không có đề xuất",
      };

      doc.setData(data);
      doc.render();
      const output = doc.getZip().generate({ type: "blob" });

      const formData = new FormData();
      formData.append("file", new File([output], `inspection_report.docx`));
      formData.append("inspectId", inspectId);

      const saveResponse = await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });

      if (!saveResponse.ok) {
        throw new Error("Lưu biên bản thất bại.");
      }
      toast.success("Biên bản đã được lưu thành công!");
      onClose();
    } catch (error) {
      console.error("Error completing inspection:", error);
      toast.error("Không thể lưu biên bản. Vui lòng thử lại!");
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-4/5 max-w-5xl p-6 relative">
        <h2 className="text-2xl font-bold text-[#002147] mb-6">Kiểm tra định kỳ</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition duration-300">×</button>
        <div className="flex">
          <div className="flex flex-col items-center justify-center space-y-4 pr-6">
            {steps.map((step, index) => (
              <div key={index} className={`flex items-center justify-start w-full py-5 px-5 rounded-lg ${currentStep === index + 1 ? "bg-[#FF5733] text-white font-bold" : "bg-[#f8f8f8] text-[#002147] font-semibold"}`}>
                <span className="mr-4 text-xs">
                  {`Bước ${index + 1}`} <br />
                  <span className="text-sm ">{step}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="w-3/4 pl-6 border-l border-gray-200">
            {currentStep === 1 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Hướng dẫn kiểm tra</h3>
                <div className="h-80 rounded-lg mb-4 overflow-auto border p-2">
                  {["/logo.png", "/logo192.png", "/logo512.png"].map((imgSrc, idx) => (
                    <img key={idx} src={imgSrc} alt={`Hướng dẫn kiểm tra ${idx + 1}`} className="mb-2 w-full h-auto rounded-lg" />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="guidelinesCheck" checked={isGuidelinesChecked} onChange={(e) => setIsGuidelinesChecked(e.target.checked)} className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#002147] checked:bg-[#002147]" />
                  <label htmlFor="guidelinesCheck" className="text-red-600 text-sm">Tôi đã đọc kỹ hướng dẫn và hiểu nội dung bên trong</label>
                </div>
              </div>
            )}
            {currentStep === 2 && (
              <div>
                <h3 className="text-xl font-bold mb-2">Thông tin kiểm tra</h3>
                <div className="flex flex-col">
                  <div>
                    <div className="flex items-center text-sm bg-[#002147] p-3 mb-2 rounded-lg">
                      <img src={inspector?.avatarUrl ? `${BASE_URL}${inspector.avatarUrl}` : "/default-avatar.png"} alt="Avatar" className="w-16 h-16 rounded-full mr-4 object-cover" />
                      <div>
                        <p className="font-bold text-white text-base">{inspector?.fullname || "Không xác định"}</p>
                        <p className="text-base text-gray-200">{inspector?.jobTitle || "Chức vụ không xác định"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#f8f8f8] text-sm rounded-lg p-4">
                    <h4 className="text-sm font-bold text-gray-800">{laptopData.name || "Tên thiết bị không xác định"}</h4>
                    <ul className="grid grid-cols-2 text-sm space-y-4 text-gray-600">
                      <li className="mt-4 text-sm"><span className="font-bold text-sm">Bộ xử lý:</span> {laptopData.specs.processor || "N/A"}</li>
                      <li><span className="font-bold text-sm">RAM:</span> {laptopData.specs.ram || "N/A"}</li>
                      <li><span className="font-bold text-sm">Bộ nhớ:</span> {laptopData.specs.storage || "N/A"}</li>
                      <li><span className="font-bold text-sm">Màn hình:</span> {laptopData.specs.display || "N/A"}</li>
                      <li><span className="font-bold text-sm">Năm sản xuất:</span> {laptopData.releaseYear || "N/A"}</li>
                      <li><span className="font-bold text-sm">Serial:</span> {laptopData.serial || "N/A"}</li>
                    </ul>
                  </div>
                  <div className="mt-6 bg-[#f8f8f8] p-4 rounded-lg">
                    <div className="flex items-center">
                      <input type="checkbox" id="inspectionConfirm" className="mr-2 w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#002147] checked:bg-[#002147]" checked={isInspectionConfirmed} onChange={(e) => setIsInspectionConfirmed(e.target.checked)} />
                      <label htmlFor="inspectionConfirm" className="text-gray-600 text-sm">Xác nhận tiến hành kiểm tra thiết bị</label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="flex w-full h-full p-2">
                <div className="w-1/4 border-r pr-4">
                  <ul>
                    {["Tổng thể", "CPU", "RAM", "Ổ cứng", "Màn hình", "Pin", "Kết nối", "Phần mềm"].map((category, index) => (
                      <li key={index} className={`py-2 px-4 mb-2 rounded-lg cursor-pointer ${selectedCategory === category ? "bg-[#FF5733] text-white font-bold" : "bg-gray-100 text-[#002147] font-medium"}`} onClick={() => setSelectedCategory(category)}>
                        {category}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-3/4 pl-6">
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                    <h3 className="text-xl font-bold text-[#002147] text-center mb-4">{selectedCategory}</h3>
                    <div className="flex flex-row">
                      <div className="w-1/2 flex-col border-r pr-4">
                        {selectedCategory === "Tổng thể" && (
                          <div className="flex flex-col text-sm space-y-2">
                            <h4 className="text-sm font-bold text-gray-800">Kết quả kiểm tra</h4>
                            <ul className="list-disc pl-6 text-sm font-bold text-gray-600 mb-4">
                              <li>Vỏ máy</li>
                              <li>Bàn phím</li>
                              <li>Bản lề</li>
                              <li>Kết nối vật lý</li>
                            </ul>
                          </div>
                        )}
                        {selectedCategory === "CPU" && (
                          <div className="flex flex-col text-xs space-y-2">
                            <span className="text-sm font-bold text-gray-800">Cấu hình</span>
                            <span className="text-xs font-bold text-gray-800">{laptopData.specs.processor || "N/A"}</span>
                            <span className="text-sm font-bold text-gray-800">Kết quả</span>
                            <label className="font-bold text-gray-700">Hiệu năng (%)</label>
                            <input type="number" className="border border-gray-300 text-xs rounded-2xl p-2" placeholder="Nhập hiệu năng" value={evaluation["CPU"]?.performance || ""} onChange={(e) => updateEvaluationField("CPU", "performance", e.target.value === "" ? "" : Number(e.target.value))} onKeyDown={preventInvalidInput} />
                            <label className="font-bold text-gray-700">Nhiệt độ (°C)</label>
                            <input type="number" className="border border-gray-300 text-xs rounded-2xl p-2" placeholder="Nhập nhiệt độ" value={evaluation["CPU"]?.temperature || ""} onChange={(e) => updateEvaluationField("CPU", "temperature", e.target.value === "" ? "" : Number(e.target.value))} onKeyDown={preventInvalidInput} />
                          </div>
                        )}
                        {selectedCategory === "RAM" && (
                          <div className="flex flex-col text-xs space-y-2">
                            <span className="text-sm font-bold text-gray-800">Cấu hình</span>
                            <span className="text-xs font-bold text-gray-800">{laptopData.specs.ram || "N/A"}</span>
                            <span className="text-sm font-bold text-gray-800">Kết quả</span>
                            <input type="number" className="border border-gray-300 text-xs rounded-2xl p-2" placeholder="Nhập dung lượng" value={evaluation["RAM"]?.consumption || ""} onChange={(e) => updateEvaluationField("RAM", "consumption", e.target.value === "" ? "" : Number(e.target.value))} onKeyDown={preventInvalidInput} />
                          </div>
                        )}
                        {selectedCategory === "Ổ cứng" && (
                          <div className="flex flex-col text-xs space-y-2">
                            <span className="text-sm font-bold text-gray-800">Cấu hình</span>
                            <span className="text-xs font-bold text-gray-800">{laptopData.specs.storage || "N/A"}</span>
                            <span className="text-sm font-bold text-gray-800">Kết quả</span>
                            <input type="number" className="border border-gray-300 text-xs rounded-2xl p-2" placeholder="Nhập dung lượng" value={evaluation["Ổ cứng"]?.remainingCapacity || ""} onChange={(e) => updateEvaluationField("Ổ cứng", "remainingCapacity", e.target.value === "" ? "" : Number(e.target.value))} onKeyDown={preventInvalidInput} />
                          </div>
                        )}
                        {selectedCategory === "Màn hình" && (
                          <div className="flex flex-col text-sm space-y-2">
                            <span className="text-sm font-bold text-gray-800">Loại màn hình</span>
                            {laptopData.type === "Laptop" ? (
                              <span className="pl-2 text-xs font-bold text-gray-800">Tích hợp</span>
                            ) : (
                              <div>
                                <ul className="pl-2">
                                  {monitorList && monitorList.length > 0 ? (
                                    monitorList.map((monitor) => (
                                      <li key={monitor._id} className="text-xs font-bold text-gray-800">
                                        {monitor.name || "Không xác định"}
                                      </li>
                                    ))
                                  ) : (
                                    <p className="text-xs text-gray-500">Không có màn hình nào được liên kết</p>
                                  )}
                                </ul>
                              </div>
                            )}
                            <span className="text-sm font-bold text-gray-800">Kết quả kiểm tra</span>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-2 w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#002147] checked:bg-[#002147]" checked={evaluation["Màn hình"]?.isStriped || false} onChange={(e) => updateEvaluationField("Màn hình", "isStriped", e.target.checked)} />
                              <span className="text-gray-700 text-xs font-bold">Sọc màn hình</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-2 w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#002147] checked:bg-[#002147]" checked={evaluation["Màn hình"]?.hasDeadPixels || false} onChange={(e) => updateEvaluationField("Màn hình", "hasDeadPixels", e.target.checked)} />
                              <span className="text-gray-700 text-xs font-bold">Điểm chết</span>
                            </label>
                            <label className="text-gray-700 text-xs font-bold">Màu sắc và độ sáng</label>
                            <textarea className="border border-gray-300 text-xs rounded-lg p-2" placeholder="Nhập mô tả màu sắc và độ sáng" value={evaluation["Màn hình"]?.colorAndBrightness || ""} onChange={(e) => updateEvaluationField("Màn hình", "colorAndBrightness", e.target.value)} />
                          </div>
                        )}
                        {selectedCategory === "Pin" && (
                          <div className="flex flex-col text-sm space-y-2">
                            <label className="font-semibold text-gray-700">Dung lượng</label>
                            <input type="number" className="border border-gray-300 text-xs rounded-2xl p-2" placeholder="Nhập dung lượng" value={evaluation["Pin"]?.capacity || ""} onChange={(e) => updateEvaluationField("Pin", "capacity", e.target.value === "" ? "" : Number(e.target.value))} onKeyDown={preventInvalidInput} />
                            <label className="font-semibold text-gray-700">Dung lượng còn lại</label>
                            <input type="number" className="border border-gray-300 text-xs rounded-2xl p-2" placeholder="Nhập dung lượng còn lại" value={evaluation["Pin"]?.performance || ""} onChange={(e) => updateEvaluationField("Pin", "performance", e.target.value === "" ? "" : Number(e.target.value))} onKeyDown={preventInvalidInput} />
                            <label className="font-semibold text-gray-700">Số lần sạc</label>
                            <input type="number" className="border border-gray-300 text-xs rounded-2xl p-2" placeholder="Nhập số lần sạc" value={evaluation["Pin"]?.chargeCycles || ""} onChange={(e) => updateEvaluationField("Pin", "chargeCycles", e.target.value === "" ? "" : Number(e.target.value))} onKeyDown={preventInvalidInput} />
                          </div>
                        )}
                        {selectedCategory === "Kết nối" && (
                          <div className="flex flex-col text-sm space-y-1">
                            <h4 className="text-lg font-bold text-gray-800">Đánh giá kết nối</h4>
                            <p className="text-sm text-gray-600 mb-2">Tích vào các thành phần còn hoạt động:</p>
                            {["Wifi", "Bluetooth", "USB", "HDMI", "Ethernet", "Micro", "Loa"].map((component) => (
                              <label key={component} className="flex items-center">
                                <input type="checkbox" className="mr-2 w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#002147] checked:bg-[#002147]" checked={evaluation["Kết nối"]?.[component] || false} onChange={(e) => updateEvaluationField("Kết nối", component, e.target.checked)} />
                                <span className="text-[#002147]">{component}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {selectedCategory === "Phần mềm" && (
                          <div className="flex flex-col text-sm space-y-2">
                            <h4 className="text-sm font-bold text-gray-800">Đánh giá phần mềm</h4>
                            {["Kiểm tra hệ điều hành", "Cập nhật bản vá", "Tắt Windows Updates"].map((task) => (
                              <label key={task} className="flex items-center">
                                <input type="checkbox" className="mr-2 w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#002147] checked:bg-[#002147]" checked={evaluation["Phần mềm"]?.[task] || false} onChange={(e) => updateEvaluationField("Phần mềm", task, e.target.checked)} />
                                <span className="text-[#002147]">{task}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="w-1/2 flex-col pl-4 text-sm space-y-4">
                        {["Tổng thể", "CPU", "RAM", "Ổ cứng", "Màn hình", "Pin", "Kết nối", "Phần mềm"].includes(selectedCategory) && (
                          <div className="flex flex-col text-sm space-y-2">
                            <label className="font-semibold text-gray-700">Đánh giá</label>
                            <select className="border border-gray-300 text-sm rounded-lg p-2" value={evaluation[selectedCategory]?.overallCondition || ""} onChange={(e) => updateEvaluationField(selectedCategory, "overallCondition", e.target.value)}>
                              <option value="">Chọn đánh giá</option>
                              {selectedCategory === "Tổng thể" && (
                                <>
                                  <option value="Tốt">Hình thức tốt</option>
                                  <option value="Bình thường">Hình thức bình thường</option>
                                  <option value="Kém">Hình thức kém</option>
                                </>
                              )}
                              {["CPU", "RAM", "Ổ cứng", "Màn hình", "Pin", "Kết nối", "Phần mềm"].includes(selectedCategory) && (
                                <>
                                  <option value="Đạt">Đạt</option>
                                  <option value="Không đạt">Không đạt</option>
                                </>
                              )}
                            </select>
                            <textarea className="h-24 border border-gray-300 text-sm rounded-lg p-2" placeholder="Nhập đề xuất / chi tiết" value={evaluation[selectedCategory]?.notes || ""} onChange={(e) => updateEvaluationField(selectedCategory, "notes", e.target.value)} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {currentStep === 4 && (
              <div className="p-4">
                <h3 className="text-xl font-bold text-[#002147] text-center mb-4">Kết luận kỹ thuật</h3>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Kết luận tổng quan về máy tính</label>
                  <textarea className="w-full border border-gray-300 rounded-lg p-2" rows="4" placeholder="Nhập kết luận tổng quan về máy tính..." value={overallConclusion} onChange={(e) => setOverallConclusion(e.target.value)} />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Đề xuất bước xử lý tiếp theo</label>
                  <textarea className="w-full border border-gray-300 rounded-lg p-2" rows="4" placeholder="Nhập đề xuất xử lý tiếp theo..." value={followUpRecommendation} onChange={(e) => setFollowUpRecommendation(e.target.value)} />
                </div>
              </div>
            )}
            {currentStep === 5 && (
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-2xl font-bold text-green-600">Thiết bị đã vượt qua kiểm tra định kỳ!</h3>
                <p className="text-gray-600">Hãy lưu lại kết quả kiểm tra và báo cho quản lý nếu cần.</p>
                <div className="flex space-x-4">
                  <button onClick={handleGenerateInspectionReport} className="px-5 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-700">In biên bản</button>
                  <button onClick={handleCompleteInspection} className="px-5 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-700">Hoàn thành</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <button onClick={handleBack} disabled={currentStep === 1} className={`px-4 py-2 rounded-lg ${currentStep === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Quay lại</button>
          <button onClick={handleNext} disabled={currentStep === steps.length} className={`px-4 py-2 rounded-lg ${currentStep === steps.length ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#FF5733] text-white hover:bg-[#f3694a]"}`}>Tiếp tục</button>
        </div>
      </div>
    </div>
  );
};

export default Inspect;