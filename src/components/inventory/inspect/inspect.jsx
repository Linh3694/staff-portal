import React, { useState,useEffect } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";



const Inspect = ({ laptopData, onClose, user , onInspectionComplete }) => {
  console.log(laptopData)
  console.log(user)
  const [currentStep, setCurrentStep] = useState(1);
  const [isGuidelinesChecked, setIsGuidelinesChecked] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Tổng thể"); // Lựa chọn danh mục
  const [evaluation, setEvaluation] = useState({}); // Lưu trữ đánh giá từng danh mục
  const [notes, setNotes] = useState(""); // Ghi chú
  const [inspectId, setInspectId] = useState();
  const [isInspectionSubmitted, setIsInspectionSubmitted] = useState(false);
  const [monitorList, setMonitorList] = useState(null); // Hoặc undefined
  

  useEffect(() => {
  const token = localStorage.getItem("authToken");
  if (selectedCategory === "Màn hình" && laptopData.type === "Desktop") {
    fetch("/api/monitors", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.populatedMonitors)) {
          setMonitorList(data.populatedMonitors); // Trích xuất mảng populatedMonitors
        } else {
          console.error("API không trả về mảng hợp lệ:", data);
          setMonitorList([]); // Gán mảng rỗng nếu dữ liệu không hợp lệ
        }
      })
      .catch((error) =>
        console.error("Lỗi khi lấy danh sách màn hình:", error)
      );
  }
}, [selectedCategory, laptopData.type]);
  
  const steps = [
    "Hướng dẫn kiểm tra",
    "Thông tin kiểm tra",
    "Kiểm tra thiết bị",
    "Kết quả kiểm tra",
  ];

  const submitInspectionData = async () => {
    const payload = {
      laptopId: laptopData._id,
      inspectorId: user._id,
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
          notes: evaluation["Tổng thể"]?.notes || "Không xác định",
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
      passed: true,
      recommendations: JSON.stringify(notes), // Chuyển thành chuỗi JSON
    };
  
    try {
      if (inspectId) {
        // Nếu đã có inspectId, thực hiện cập nhật
        const response = await fetch(`/api/inspects/${inspectId}`, {
          method: "PUT", // Sử dụng PATCH hoặc PUT
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(payload),
        });
  
        const data = await response.json();
        if (response.ok) {
          console.log("Dữ liệu kiểm tra đã được cập nhật:", data);
          setIsInspectionSubmitted(true); // Đánh dấu đã gửi
        } else {
          console.error("Lỗi khi cập nhật dữ liệu:", data);
        }
      } else {
        // Nếu chưa có inspectId, thực hiện tạo mới
        const response = await fetch("/api/inspects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(payload),
        });
  
        const data = await response.json();
        if (response.ok) {
          setInspectId(data.data._id); // Lưu inspectId
          setIsInspectionSubmitted(true); // Đánh dấu đã gửi
          console.log("API response:", data);
           // Truyền dữ liệu kiểm tra lên cha
          if (typeof onInspectionComplete === "function") {
            onInspectionComplete(data.data); // Gửi dữ liệu kiểm tra lên cha
          }
          console.log(data.data._id)
        } else {
          console.error("Lỗi khi gửi dữ liệu:", data);
        }
      }
    } catch (error) {
      console.error("Lỗi kết nối khi gửi dữ liệu kiểm tra:", error);
    }
  };

  const getIncompleteCategories = () => {
    const requiredCategories = [
      "CPU",
      "RAM",
      "Ổ cứng",
      "Màn hình",
      "Pin",
      "Kết nối",
      "Phần mềm",
    ];
  
    // Lọc các danh mục chưa hoàn thành
    return requiredCategories.filter((category) => !evaluation[category]);
  };


  const handleNext = () => {
    if (currentStep === 1 && !isGuidelinesChecked) {
      alert("Vui lòng xác nhận đã đọc hướng dẫn trước khi tiếp tục.");
      return;
    }
  
    if (currentStep === 3) {
      // Kiểm tra nếu tất cả danh mục đã hoàn thành
      const incompleteCategories = getIncompleteCategories();
      if (incompleteCategories.length > 0) {
        alert(
          `Bạn chưa hoàn thành các danh mục kiểm tra sau:\n- ${incompleteCategories.join(
            "\n- "
          )}`
        );
        return;
      }
  
      // Gửi dữ liệu nếu chưa gửi
      if (!isInspectionSubmitted) {
        submitInspectionData();
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
  
    // Đặt lại trạng thái gửi dữ liệu nếu quay lại bước 3
    if (currentStep === 4) {
      setIsInspectionSubmitted(false);
    }
  };

  useEffect(() => {
    console.log("Inspect ID:", inspectId);
    if (currentStep === 4) {
      const fetchInspectionData = async () => {
        try {
          const response = await fetch(`/api/inspects/${inspectId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          });
  
          const data = await response.json();
          if (response.ok) {
            console.log("Dữ liệu kiểm tra đã tải:", data);
            setEvaluation({
              ...data.results,
              "Phần mềm": data.results["Phần mềm"] || {}, // Khởi tạo nếu thiếu
            }); // Cập nhật lại state từ dữ liệu tải về
          } else {
            console.error("Lỗi khi tải dữ liệu kiểm tra:", data);
          }
        } catch (error) {
          console.error("Lỗi kết nối khi tải dữ liệu kiểm tra:", error);
        }
      };
  
      fetchInspectionData();
    }
  }, [currentStep]);

  const handleGenerateInspectionReport = async () => {
    try {
      // 1. Tải file template từ thư mục public
      const response = await fetch("/inspection_report.docx");
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
  
      // 2. Tạo PizZip instance từ file mẫu
      const zip = new PizZip(arrayBuffer);
  
      // 3. Khởi tạo Docxtemplater
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
  
      // 4. Định dạng dữ liệu
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate()}/${
        currentDate.getMonth() + 1
      }/${currentDate.getFullYear()}`;
  
      const data = {
        today: formattedDate,
        user_fullname: laptopData.assigned[0]?.fullname || "Không xác định",
        user_department: laptopData.assigned[0]?.department || "Không xác định",    
        laptopName: laptopData.name || "Không xác định",
        laptopSerial: laptopData.serial || "Không xác định",
        laptopProcessor: laptopData.specs.processor || "Không xác định",
        laptopRam: laptopData.specs.ram || "Không xác định",
        laptopStorage: laptopData.specs.storage || "Không xác định",
        laptopreleaseYear: laptopData.releaseYear || "Không xác định",
        inspectorName: user.fullname || "Không xác định",
        inspectorTitle: user.jobTitle || "Không xác định",
        evaluation: evaluation || {},

        externalCondition_overallCondition: evaluation["Tổng thể"]?.overallCondition || "Không xác định",
        externalCondition_notes: evaluation["Tổng thể"]?.notes || "Không có ghi chú.",

        CPU_performance: evaluation["CPU"]?.performance || "Không xác định",
        CPU_temperature: evaluation["CPU"]?.temperature || "Không xác định",
        CPU_overallCondition: evaluation["CPU"]?.overallCondition || "Không xác định",
        CPU_notes: evaluation["Tổng thể"]?.notes || "Không xác định",

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
        // Thêm các mục khác từ evaluation nếu cần
      };
  
      // 5. Gán dữ liệu vào file mẫu
      doc.setData(data);
  
      // 6. Render tài liệu
      doc.render();
  
      // 7. Tạo file output
      const output = doc.getZip().generate({ type: "blob" });
      saveAs(output, `inspection_report_${laptopData.serial}.docx`);
    } catch (error) {
      console.error("Lỗi khi xuất biên bản:", error);
    }
  };

  // Bổ sung hàm để lưu biên bản và đóng modal
const handleCompleteInspection = async () => {
  try {
    // 1. Tải template file từ public
    const response = await fetch("/inspection_report.docx");
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // 2. Tạo PizZip instance từ file mẫu
    const zip = new PizZip(arrayBuffer);

    // 3. Khởi tạo Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // 4. Chuẩn bị dữ liệu để chèn vào template
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()}/${
      currentDate.getMonth() + 1
    }/${currentDate.getFullYear()}`;

    const data = {
      today: formattedDate,
      user_fullname: laptopData.assigned[0]?.fullname || "Không xác định",
      user_department: laptopData.assigned[0]?.department || "Không xác định",    
      laptopName: laptopData.name || "Không xác định",
      laptopSerial: laptopData.serial || "Không xác định",
      laptopProcessor: laptopData.specs.processor || "Không xác định",
      laptopRam: laptopData.specs.ram || "Không xác định",
      laptopStorage: laptopData.specs.storage || "Không xác định",
      laptopreleaseYear: laptopData.releaseYear || "Không xác định",
      inspectorName: user.fullname || "Không xác định",
      inspectorTitle: user.jobTitle || "Không xác định",
      evaluation: evaluation || {},

      externalCondition_overallCondition: evaluation["Tổng thể"]?.overallCondition || "Không xác định",
      externalCondition_notes: evaluation["Tổng thể"]?.notes || "Không có ghi chú.",

      CPU_performance: evaluation["CPU"]?.performance || "Không xác định",
      CPU_temperature: evaluation["CPU"]?.temperature || "Không xác định",
      CPU_overallCondition: evaluation["CPU"]?.overallCondition || "Không xác định",
      CPU_notes: evaluation["Tổng thể"]?.notes || "Không xác định",

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
      // Thêm các mục khác từ evaluation nếu cần
    };

    // 5. Chèn dữ liệu vào template
    doc.setData(data);
    doc.render();

    // 6. Tạo file blob từ tài liệu
    const output = doc.getZip().generate({ type: "blob" });

    // 7. Gửi file lên server để lưu trữ
    const formData = new FormData();
    formData.append("file", new File([output], `inspection_report.docx`));
    formData.append("inspectId", inspectId);  // <-- Gửi inspectId lên backend
    console.log(formData)
    const saveResponse = await fetch("/api/reports", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: formData,
    });
    console.log(saveResponse)

    if (!saveResponse.ok) {
      throw new Error("Lưu biên bản thất bại.");
    }
    toast.success("Biên bản đã được lưu thành công!");
    onClose(); // Đóng modal sau khi hoàn thành
  } catch (error) {
    console.error("Lỗi khi hoàn thành kiểm tra:", error);
    toast.error("Không thể lưu biên bản. Vui lòng thử lại!");
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
  }, [selectedCategory]);

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
  <div className="bg-white rounded-lg shadow-lg w-4/5 max-w-5xl p-6 relative">
    {/* Header */}
    <h2 className="text-2xl font-bold text-[#002147] mb-6">
      Kiểm tra định kỳ
    </h2>
    <button
      onClick={onClose}
      className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition duration-300"
    >
      ×
    </button>

    {/* Content */}
    <div className="flex">
        {/* Process Bar */}
        <div className="flex flex-col items-center justify-center space-y-4 pr-6">
            {steps.map((step, index) => (
                <div
                    key={index}
                    className={`flex items-center justify-start w-full py-5 px-5 rounded-lg ${
                        currentStep === index + 1 ? "bg-[#FF5733] text-white font-bold" : "bg-[#f8f8f8] text-[#002147] font-semibold"
                    }`}
                >
                    <span className="mr-4 text-xs">
                        {`Bước ${index + 1}`} <br />
                        <span className="text-sm ">{step}</span>
                    </span>
                    
                </div>
            ))}
        </div>

      {/* Content Section */}
      <div className="w-3/4 pl-6 border-l border-gray-200">
        {currentStep === 1 && (
          <div>
            <h3 className="text-xl font-bold mb-4">Hướng dẫn kiểm tra</h3>
            <div className="h-80 rounded-lg mb-4 overflow-hidden border p-2">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer fileUrl="/inspect_guidlines.pdf" />
              </Worker>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="guidelinesCheck"
                checked={isGuidelinesChecked}
                onChange={(e) => setIsGuidelinesChecked(e.target.checked)}
                className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#002147] checked:bg-[#002147]"
              />
              <label htmlFor="guidelinesCheck" className="text-red-600 text-sm">
                Tôi đã đọc kỹ hướng dẫn và hiểu nội dung bên trong
              </label>
            </div>
          </div>
        )}

            {currentStep === 2 && (
        <div >
          <h3 className="text-xl font-bold mb-2">Thông tin kiểm tra</h3>
              <div className="flex flex-col">
                        {/* Avatar + Thông tin người dùng */}
                            <div>
                                <div className="flex items-center text-sm bg-[#002147] p-3 mb-2 rounded-lg">
                                <img
                                  src={user?.avatarUrl ? `https://42.96.42.197:5001${user.avatarUrl}` : "/default-avatar.png"}
                                  alt="Avatar"
                                  className="w-16 h-16 rounded-full mr-4 object-cover"
                                />  
                                
                                        <div>
                                            <p className="font-bold text-white text-base">
                                            {user?.fullname || "Không xác định"}
                                            </p>
                                            <p className="text-base  text-gray-200">
                                            {user?.jobTitle || "Chức vụ không xác định"}
                                            </p>
                                        </div>
                                </div>
                            </div>

                            {/* Thông tin thiết bị */}
                            <div className="bg-[#f8f8f8] text-sm rounded-lg p-4">
                            <h4 className="text-sm font-bold text-gray-800">
                                {laptopData.name || "Tên thiết bị không xác định"}
                            </h4>
                            <ul className="grid grid-cols-2 text-sm space-y-4 text-gray-600">
                                <li className="mt-4 text-sm">
                                <span className="font-bold text-sm">Bộ xử lý:</span> {laptopData.specs.processor || "N/A"}
                                </li>
                                <li>
                                <span className="font-bold text-sm">RAM:</span> {laptopData.specs.ram || "N/A"}
                                </li>
                                <li>
                                <span className="font-bold text-sm">Bộ nhớ:</span> {laptopData.specs.storage || "N/A"}
                                </li>
                                <li>
                                <span className="font-bold text-sm">Màn hình:</span> {laptopData.specs.display || "N/A"}
                                </li>
                                <li>
                                <span className="font-bold text-sm">Năm sản xuất:</span> {laptopData.releaseYear || "N/A"}
                                </li>
                                <li>
                                <span className="font-bold text-sm">Serial:</span> {laptopData.serial || "N/A"}
                                </li>
                            </ul>
                            </div>
    </div>

                {/* Trạng thái kiểm tra */}
                <div className="mt-6 bg-[#f8f8f8] p-4 rounded-lg">
                <h4 className="text-sm font-bold text-gray-800 mb-2">
                    Kiểm tra lần cuối: {laptopData.lastInspectionDate || "N/A"}
                </h4>
                <p
                    className={`font-bold text-sm ${
                    laptopData.isInspectionPassed
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                >
                    {laptopData.isInspectionPassed
                    ? "Thiết bị đạt điều kiện kiểm tra định kỳ"
                    : "Thiết bị không đạt điều kiện kiểm tra định kỳ"}
                </p>
                <div className="flex items-center mt-2">
                    <input
                    type="checkbox"
                    id="inspectionConfirm"
                    className="mr-2 w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#002147] checked:bg-[#002147]"
                    onChange={(e) =>
                        console.log(
                        "Xác nhận kiểm tra định kỳ:",
                        e.target.checked
                        )
                    }
                    />
                    <label htmlFor="inspectionConfirm" className="text-gray-600 text-sm">
                    Xác nhận tiến hành kiểm tra định kỳ thiết bị
                    </label>
                </div>
                </div>
    </div>
            )}


        {currentStep === 3 && (
      <div className="flex w-full h-full p-2">
        {/* Thanh bước bên trái */}
        <div className="w-1/4 border-r pr-4">
          <ul>
            {[
              "Tổng thể",
              "CPU",
              "RAM",
              "Ổ cứng",
              "Màn hình",
              "Pin",
              "Kết nối",
              "Phần mềm",
            ].map((category, index) => (
              <li
                key={index}
                className={`py-2 px-4 mb-2 rounded-lg cursor-pointer ${
                  selectedCategory === category
                    ? "bg-[#FF5733] text-white font-bold"
                    : "bg-gray-100 text-[#002147] font-medium"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </li>
            ))}
          </ul>
        </div>

        {/* Nội dung kiểm tra */}
              <div className="w-3/4 pl-6">
                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <h3 className="text-xl font-bold text-[#002147] text-center mb-4">
                    {selectedCategory}
                  </h3>
                  <div className="flex flex-row">
                    <div className="w-1/2 flex-col border-r pr-4">
                        {selectedCategory === "Tổng thể" && (
                        <div className="flex flex-col text-sm space-y-2">
                       <h4 className="text-sm font-bold text-gray-800">Kết quả kiểm tra</h4>
                        <ul className="list-disc pl-6 text-sm font-bold text-gray-600 mb-4">
                         <>
                            <li>Vỏ máy</li>
                            <li>Bàn phím</li>
                            <li>Bản lề</li>
                            <li>Kết nối vật lý</li>
                          </>
                        </ul> 
                        </div> 
                        )}
                        {selectedCategory === "CPU" && (
                          <div className="flex flex-col text-xs space-y-2">
                          <span className="text-sm font-bold text-gray-800">Cấu hình</span>
                          <span className="text-xs font-bold text-gray-800">{laptopData.specs.processor || "N/A"}</span>
                          <span className="text-sm font-bold text-gray-800">Kết quả</span>
                          <label className="font-bold text-gray-700">Hiệu năng (%)</label>
                            <input
                              type="number"
                              className="border border-gray-300 text-xs rounded-2xl p-2"
                              placeholder="Nhập hiệu năng"
                              value={evaluation[selectedCategory]?.performance || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEvaluation((prev) => ({
                                  ...prev,
                                  [selectedCategory]: {
                                    ...prev[selectedCategory],
                                    performance: value === "" ? "" : Number(value), // Đảm bảo lưu số
                                  },
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                  e.preventDefault();
                                }
                              }}
                            />

                            <label className="font-bold text-gray-700">Nhiệt độ (°C)</label>
                            <input
                              type="number"
                              className="border border-gray-300 text-xs rounded-2xl p-2"
                              placeholder="Nhập nhiệt độ"
                              value={evaluation[selectedCategory]?.temperature || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEvaluation((prev) => ({
                                  ...prev,
                                  [selectedCategory]: {
                                    ...prev[selectedCategory],
                                    temperature: value === "" ? "" : Number(value), // Đảm bảo lưu số
                                  },
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                  e.preventDefault();
                                }
                              }}
                            />
                          </div>
                        )}
                        {selectedCategory === "RAM" && (
                            <div className="flex flex-col text-xs space-y-2">
                            <span className="text-sm font-bold text-gray-800">Cấu hình</span>
                            <span className="text-xs font-bold text-gray-800">{laptopData.specs.ram || "N/A"}</span>
                            <span className="text-sm font-bold text-gray-800">Kết quả</span>
                            <input
                              type="number"
                              className="border border-gray-300 text-xs rounded-2xl p-2"
                              placeholder="Nhập dung lượng"
                              value={evaluation[selectedCategory]?.consumption || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEvaluation((prev) => ({
                                  ...prev,
                                  [selectedCategory]: {
                                    ...prev[selectedCategory],
                                    consumption: value === "" ? "" : Number(value), // Đảm bảo lưu số
                                  },
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                  e.preventDefault();
                                }
                              }}
                            />
                            </div>
                          
                        )}
                        {selectedCategory === "Ổ cứng" && (
                          <div className="flex flex-col text-xs space-y-2">
                          <span className="text-sm font-bold text-gray-800">Cấu hình</span>
                          <span className="text-xs font-bold text-gray-800">{laptopData.specs.storage || "N/A"}</span>
                          <span className="text-sm font-bold text-gray-800">Kết quả</span>
                          <input
                              type="number"
                              className="border border-gray-300 text-xs rounded-2xl p-2"
                              placeholder="Nhập dung lượng"
                              value={evaluation[selectedCategory]?.performance || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEvaluation((prev) => ({
                                  ...prev,
                                  [selectedCategory]: {
                                    ...prev[selectedCategory],
                                    performance: value === "" ? "" : Number(value), // Đảm bảo lưu số
                                  },
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                  e.preventDefault();
                                }
                              }}
                            />
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
                                    {Array.isArray(monitorList) && monitorList.length > 0 ? (
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

                              {/* Sọc màn hình */}
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="mr-2 w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#002147] checked:bg-[#002147]"
                                  checked={evaluation[selectedCategory]?.isStriped || false}
                                  onChange={(e) =>
                                    setEvaluation((prev) => ({
                                      ...prev,
                                      [selectedCategory]: {
                                        ...prev[selectedCategory],
                                        isStriped: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span className="text-gray-700 text-xs font-bold">Sọc màn hình</span>
                              </label>

                              {/* Điểm chết */}
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="mr-2 w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#002147] checked:bg-[#002147]"
                                  checked={evaluation[selectedCategory]?.hasDeadPixels || false}
                                  onChange={(e) =>
                                    setEvaluation((prev) => ({
                                      ...prev,
                                      [selectedCategory]: {
                                        ...prev[selectedCategory],
                                        hasDeadPixels: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span className="text-gray-700 text-xs font-bold">Điểm chết</span>
                              </label>

                              {/* Mô tả màu sắc và độ sáng */}
                              <label className="text-gray-700 text-xs font-bold">Màu sắc và độ sáng</label>
                              <textarea
                                className="border border-gray-300 text-xs rounded-lg p-2"
                                placeholder="Nhập mô tả màu sắc và độ sáng"
                                value={evaluation[selectedCategory]?.colorAndBrightness || ""}
                                onChange={(e) =>
                                  setEvaluation((prev) => ({
                                    ...prev,
                                    [selectedCategory]: {
                                      ...prev[selectedCategory],
                                      colorAndBrightness: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                          )}
                        {selectedCategory === "Pin" && (
                          <div className="flex flex-col text-sm space-y-2">
                            <label className="font-semibold text-gray-700">Dung lượng </label>
                            <input
                              type="number"
                              className="border border-gray-300 text-xs rounded-2xl p-2"
                              placeholder="Nhập dung lượng"
                              value={evaluation[selectedCategory]?.capacity || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEvaluation((prev) => ({
                                  ...prev,
                                  [selectedCategory]: {
                                    ...prev[selectedCategory],
                                    capacity: value === "" ? "" : Number(value), // Đảm bảo lưu số
                                  },
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                  e.preventDefault();
                                }
                              }}
                            />

                          <label className="font-semibold text-gray-700">Dung lượng còn lại</label>
                          <input
                              type="number"
                              className="border border-gray-300 text-xs rounded-2xl p-2"
                              placeholder="Nhập dung lượng"
                              value={evaluation[selectedCategory]?.performance || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEvaluation((prev) => ({
                                  ...prev,
                                  [selectedCategory]: {
                                    ...prev[selectedCategory],
                                    performance: value === "" ? "" : Number(value), // Đảm bảo lưu số
                                  },
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                  e.preventDefault();
                                }
                              }}
                            />

                          <label className="font-semibold text-gray-700">Số lần sạc</label>
                          <input
                              type="number"
                              className="border border-gray-300 text-xs rounded-2xl p-2"
                              placeholder="Nhập dung lượng"
                              value={evaluation[selectedCategory]?.chargeCycles || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEvaluation((prev) => ({
                                  ...prev,
                                  [selectedCategory]: {
                                    ...prev[selectedCategory],
                                    chargeCycles: value === "" ? "" : Number(value), // Đảm bảo lưu số
                                  },
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                  e.preventDefault();
                                }
                              }}
                            />
                        </div>
                        )}
                        {selectedCategory === "Kết nối" && (
                          <div className="flex flex-col text-sm space-y-1">
                            <h4 className="text-lg font-bold text-gray-800">Đánh giá kết nối</h4>
                            <p className="text-sm text-gray-600 mb-2">Tích vào các thành phần còn hoạt động:</p>

                            {/* Checkbox cho từng thành phần */}
                            {["Wifi", "Bluetooth", "USB", "HDMI", "Ethernet", "Micro", "Loa"].map((component) => (
                              <label key={component} className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="mr-2 w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#002147] checked:bg-[#002147]"
                                  checked={evaluation[selectedCategory]?.[component] || false}
                                  onChange={(e) =>
                                    setEvaluation((prev) => ({
                                      ...prev,
                                      [selectedCategory]: {
                                        ...prev[selectedCategory],
                                        [component]: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span className="text-[#002147]">{component}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {selectedCategory === "Phần mềm" && (
                            <div className="flex flex-col text-sm space-y-2">
                              <h4 className="text-sm font-bold text-gray-800">Đánh giá phần mềm</h4>

                              {/* Checkbox cho từng công việc */}
                              {["Kiểm tra hệ điều hành", "Cập nhật bản vá", "Tắt Windows Updates"].map((task) => (
                                <label key={task} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="mr-2 w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#002147] checked:bg-[#002147]"
                                    checked={evaluation[selectedCategory]?.[task] || false}
                                    onChange={(e) =>
                                      setEvaluation((prev) => ({
                                        ...prev,
                                        [selectedCategory]: {
                                          ...prev[selectedCategory],
                                          [task]: e.target.checked,
                                        },
                                      }))
                                    }
                                  />
                                  <span className="text-[#002147]">{task}</span>
                                </label>
                              ))}
                            </div>
                          )}
                    </div>
                    <div className="w-1/2 flex-col pl-4 text-sm space-y-4">
                      {/* Input và Textarea cho các trường tương ứng */}
                        {selectedCategory === "Tổng thể" && (
                          <div className="flex flex-col text-sm space-y-2">
                            <label className="font-semibold text-gray-700">Đánh giá</label>
                            <select
                              className="border border-gray-300 text-sm rounded-lg p-2"
                              value={evaluation[selectedCategory]?.overallCondition || ""}
                              onChange={(e) =>
                                setEvaluation((prev) => ({
                                  ...prev,
                                  [selectedCategory]: {
                                    ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                    overallCondition: e.target.value, // Cập nhật `overallCondition` cho danh mục hiện tại
                                  },
                                }))
                              }
                            >
                              <option value="">Chọn đánh giá</option>
                              <option value="Tốt">Hình thức tốt</option>
                              <option value="Bình thường">Hình thức bình thường</option>
                              <option value="Kém">Hình thức kém</option>
                            </select>
                            <textarea
                              className="h-24 border border-gray-300 text-sm rounded-lg p-2"
                              placeholder="Nhập chi tiết"
                              value={evaluation[selectedCategory]?.notes || ""}
                              onChange={(e) =>
                                setEvaluation((prev) => ({
                                  ...prev,
                                  [selectedCategory]: {
                                    ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                    notes: e.target.value, // Cập nhật `notes` cho danh mục hiện tại
                                  },
                                }))
                              }
                            />
                          </div>
                        )}

                        {/* Tương tự cho các danh mục khác */}
                        {selectedCategory === "CPU" && (
                          <div className="flex flex-col text-sm space-y-2">
                          <label className="font-semibold text-gray-700">Đánh giá</label>
                          <select
                            className="border border-gray-300 text-sm rounded-lg p-2"
                            value={evaluation[selectedCategory]?.overallCondition || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  overallCondition: e.target.value, // Cập nhật `overallCondition` cho danh mục hiện tại
                                },
                              }))
                            }
                          >
                            <option value="">Chọn đánh giá</option>
                            <option value="Đạt">Đạt</option>
                            <option value="Không đạt">Không đạt</option>
                          </select>
                          <textarea
                            className="h-24 border border-gray-300 text-sm rounded-lg p-2"
                            placeholder="Nhập đề xuất"
                            value={evaluation[selectedCategory]?.notes || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  notes: e.target.value, // Cập nhật `notes` cho danh mục hiện tại
                                },
                              }))
                            }
                          />
                        </div>
                        )}

                        {/* Ví dụ thêm cho RAM */}
                        {selectedCategory === "RAM" && (
                          <div className="flex flex-col text-sm space-y-2">
                          <label className="font-semibold text-gray-700">Đánh giá</label>
                          <select
                            className="border border-gray-300 text-sm rounded-lg p-2"
                            value={evaluation[selectedCategory]?.overallCondition || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  overallCondition: e.target.value, // Cập nhật `overallCondition` cho danh mục hiện tại
                                },
                              }))
                            }
                          >
                            <option value="">Chọn đánh giá</option>
                            <option value="Đạt">Đạt</option>
                            <option value="Không đạt">Không đạt</option>
                          </select>
                          <textarea
                            className="h-24 border border-gray-300 text-sm rounded-lg p-2"
                            placeholder="Nhập đề xuất"
                            value={evaluation[selectedCategory]?.notes || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  notes: e.target.value, // Cập nhật `notes` cho danh mục hiện tại
                                },
                              }))
                            }
                          />
                        </div>
                        )}

                        {selectedCategory === "Ổ cứng" && (
                          <div className="flex flex-col text-sm space-y-2">
                          <label className="font-semibold text-gray-700">Đánh giá</label>
                          <select
                            className="border border-gray-300 text-sm rounded-lg p-2"
                            value={evaluation[selectedCategory]?.overallCondition || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  overallCondition: e.target.value, // Cập nhật `overallCondition` cho danh mục hiện tại
                                },
                              }))
                            }
                          >
                            <option value="">Chọn đánh giá</option>
                            <option value="Đạt">Đạt</option>
                            <option value="Không đạt">Không đạt</option>
                          </select>
                          <textarea
                            className="h-24 border border-gray-300 text-sm rounded-lg p-2"
                            placeholder="Nhập đề xuất"
                            value={evaluation[selectedCategory]?.notes || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  notes: e.target.value, // Cập nhật `notes` cho danh mục hiện tại
                                },
                              }))
                            }
                          />
                        </div>
                        )} 
                        {selectedCategory === "Màn hình" && (
                          <div className="flex flex-col text-sm space-y-2">
                          <label className="font-semibold text-gray-700">Đánh giá</label>
                          <select
                            className="border border-gray-300 text-sm rounded-lg p-2"
                            value={evaluation[selectedCategory]?.overallCondition || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  overallCondition: e.target.value, // Cập nhật `overallCondition` cho danh mục hiện tại
                                },
                              }))
                            }
                          >
                            <option value="">Chọn đánh giá</option>
                            <option value="Đạt">Đạt</option>
                            <option value="Không đạt">Không đạt</option>
                          </select>
                          <textarea
                            className="h-24 border border-gray-300 text-sm rounded-lg p-2"
                            placeholder="Nhập đề xuất"
                            value={evaluation[selectedCategory]?.notes || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  notes: e.target.value, // Cập nhật `notes` cho danh mục hiện tại
                                },
                              }))
                            }
                          />
                        </div>
                        )}  
                        {selectedCategory === "Pin" && (
                          <div className="flex flex-col text-sm space-y-2">
                          <label className="font-semibold text-gray-700">Đánh giá</label>
                          <select
                            className="border border-gray-300 text-sm rounded-lg p-2"
                            value={evaluation[selectedCategory]?.overallCondition || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  overallCondition: e.target.value, // Cập nhật `overallCondition` cho danh mục hiện tại
                                },
                              }))
                            }
                          >
                            <option value="">Chọn đánh giá</option>
                            <option value="Đạt">Đạt</option>
                            <option value="Không đạt">Không đạt</option>
                          </select>
                          <textarea
                            className="h-24 border border-gray-300 text-sm rounded-lg p-2"
                            placeholder="Nhập đề xuất"
                            value={evaluation[selectedCategory]?.notes || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  notes: e.target.value, // Cập nhật `notes` cho danh mục hiện tại
                                },
                              }))
                            }
                          />
                        </div>
                        )} 
                        {selectedCategory === "Kết nối" && (
                          <div className="flex flex-col text-sm space-y-2">
                          <label className="font-semibold text-gray-700">Đánh giá</label>
                          <select
                            className="border border-gray-300 text-sm rounded-lg p-2"
                            value={evaluation[selectedCategory]?.overallCondition || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  overallCondition: e.target.value, // Cập nhật `overallCondition` cho danh mục hiện tại
                                },
                              }))
                            }
                          >
                            <option value="">Chọn đánh giá</option>
                            <option value="Đạt">Đạt</option>
                            <option value="Không đạt">Không đạt</option>
                          </select>
                          <textarea
                            className="h-24 border border-gray-300 text-sm rounded-lg p-2"
                            placeholder="Nhập đề xuất"
                            value={evaluation[selectedCategory]?.notes || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  notes: e.target.value, // Cập nhật `notes` cho danh mục hiện tại
                                },
                              }))
                            }
                          />
                        </div>
                        )} 
                        {selectedCategory === "Phần mềm" && (
                          <div className="flex flex-col text-sm space-y-2">
                          <label className="font-semibold text-gray-700">Đánh giá</label>
                          <select
                            className="border border-gray-300 text-sm rounded-lg p-2"
                            value={evaluation[selectedCategory]?.overallCondition || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  overallCondition: e.target.value, // Cập nhật `overallCondition` cho danh mục hiện tại
                                },
                              }))
                            }
                          >
                            <option value="">Chọn đánh giá</option>
                            <option value="Đạt">Đạt</option>
                            <option value="Không đạt">Không đạt</option>
                          </select>
                          <textarea
                            className="h-24 border border-gray-300 text-sm rounded-lg p-2"
                            placeholder="Nhập đề xuất"
                            value={evaluation[selectedCategory]?.notes || ""}
                            onChange={(e) =>
                              setEvaluation((prev) => ({
                                ...prev,
                                [selectedCategory]: {
                                  ...prev[selectedCategory], // Giữ lại các giá trị khác trong danh mục
                                  notes: e.target.value, // Cập nhật `notes` cho danh mục hiện tại
                                },
                              }))
                            }
                          />
                        </div>
                        )} 
                      </div>
                    </div>
                  </div>
                </div>
      </div>
    )}



        {/* //// Cập nhật giao diện của bước 4 */}
        {currentStep === 4 && (
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-2xl font-bold text-green-600">
              Thiết bị đã vượt qua kiểm tra định kỳ!
            </h3>
            <p className="text-gray-600">
              Hãy lưu lại kết quả kiểm tra và báo cho quản lý nếu cần.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleGenerateInspectionReport} // In biên bản
                className="px-5 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-700"
              >
                In biên bản
              </button>
              <button
                onClick={handleCompleteInspection} // Lưu biên bản và hoàn thành
                className="px-5 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-700"
              >
                Hoàn thành
              </button>
            </div>
          </div>
        )}

      </div>
    </div>

    {/* Navigation Buttons */}
    <div className="flex justify-between mt-6">
      <button
        onClick={handleBack}
        disabled={currentStep === 1}
        className={`px-4 py-2 rounded-lg ${
          currentStep === 1
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        Quay lại
      </button>
      <button
        onClick={handleNext}
        disabled={currentStep === steps.length}
        className={`px-4 py-2 rounded-lg ${
          currentStep === steps.length
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-[#FF5733] text-white hover:bg-[#f3694a]"
        }`}
      >
        Tiếp tục
      </button>
    </div>
  </div>
</div>
  );
};

export default Inspect;