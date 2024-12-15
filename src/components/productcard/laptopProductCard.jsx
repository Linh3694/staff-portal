import React, { useState, useEffect } from "react";
import { FiEdit, FiCpu, FiHardDrive, FiMonitor, FiTrash2 } from "react-icons/fi";
import { FaTools, FaMemory, FaUserCog, FaUser } from "react-icons/fa";
import { MdSystemUpdate } from "react-icons/md";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



const LaptopProductCard = ({ laptopData, onAddRepair, onDeleteRepair, onCloseModal }) => {
  console.log("Props truyền vào LaptopProductCard:", {
    assigned: laptopData.assigned,
  });
  console.log("Assigned Users:", laptopData.assigned);
  console.log("Assigned Users Details:", laptopData.assigned);
  const [activeTab, setActiveTab] = useState("repairs");
  const [showRepairModal, setShowRepairModal] = useState(false); // Control Repair Modal
  const [repairs, setRepairs] = useState([]); // Quản lý danh sách sửa chữa cục bộ
  const [showRepairDetails, setShowRepairDetails] = useState(null);
  const [repairData, setRepairData] = useState({
    description: "",
    date: "",
    details: "",
  });
  useEffect(() => {
    if (laptopData.repairs) {
      setRepairs(laptopData.repairs); // Cập nhật danh sách sửa chữa khi component nhận được props mới
    }
  }, [laptopData]);

  if (!laptopData) {
    return <p>Loading laptop details...</p>;
  }
      // const assignedUsers = Array.isArray(laptopData.assigned) ? laptopData.assigned : [];
      const repairHistory = Array.isArray(laptopData.repairs) ? laptopData.repairs : [];
      const updateHistory = Array.isArray(laptopData.updates) ? laptopData.updates : [];

      
    // Gọi hàm từ component cha để xử lý thêm nhật ký
      const handleSaveRepair = () => {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      
        if (!currentUser) {
          console.error("Không tìm thấy thông tin user trong localStorage.");
          return;
        }
      
        if (onAddRepair) {
          onAddRepair({
            description: repairData.description,
            details: repairData.details,
            date: repairData.date || new Date().toISOString(),
            updatedBy: currentUser.fullname || "Không xác định", // Lấy fullname từ currentUser
          });
          console.error(onAddRepair);
          toast.success("Thêm lịch sử sửa chữa thành công!", );
          setShowRepairModal(false);
          setRepairData({ 
            description: "", 
            date: "", 
            details: "", 
            updatedBy: "" });
        } else {
          console.error("onAddRepair không được truyền vào ITProductCard.");
          toast.error("Không thể thêm lịch sử!",);
        }
      };
    
      const handleDeleteRepair = (repairId) => {
        if (!repairId) {
          console.error("repairId không hợp lệ.");
          return;
        }
      
        if (onDeleteRepair) {
          // Gọi hàm xóa từ cha
          onDeleteRepair(laptopData._id, repairId)
            .then(() => {
              // Xóa thành công, cập nhật danh sách sửa chữa
              setRepairs((prevRepairs) =>
                prevRepairs.filter((repair) => repair._id !== repairId)
              );
              toast.success("Xoá lịch sử sửa chữa thành công!", {
                position: "top-right",
                autoClose: 1000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
            })
            .catch((error) => {
              console.error("Xóa lịch sử sửa chữa thất bại:", error);
              toast.error("Không thể xoá lịch sử sửa chữa!", {
                position: "top-right",
                autoClose: 1000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
            });
        } else {
          console.error("onDeleteRepair không được truyền vào ITProductCard.");
          toast.error("Không thể thực hiện xóa lịch sử sửa chữa!", {
            position: "top-right",
            autoClose: 1000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6">
          {/* --------------- Info--------------- */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#002147]">{laptopData.name} - {laptopData.type}</h2>
              <p className="text-theme-color-neutral-content">
                Năm sản xuất: {laptopData.releaseYear || "N/A"}
              </p>
            </div>
            <div className="px-4 py-2 text-center">
              <span
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-center ${
                  laptopData.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : laptopData.status === "In Repair"
                    ? "bg-yellow-100 text-yellow-800"
                    : laptopData.status === "Lưu kho"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {laptopData.status === "Active"
                  ? "Đang sử dụng"
                  : laptopData.status === "In Repair"
                  ? "Chờ sửa chữa"
                  : laptopData.status === "Lưu kho"
                  ? "Lưu kho"
                  : "Không xác định"}
              </span>
              <button
                onClick={onCloseModal}
                 // Hàm đóng modal
                
                className="ml-2 px-2 py-1 bg-[#FF5733] text-white text-sm rounded-lg shadow-md hover:bg-[#cc4529] transform transition-transform duration-300 hover:scale-105"
              >
                Đóng
              </button>
            </div>
          </div>
        
          {/* --------------- Specs Section --------------- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center space-x-3 bg-gray-200 p-4 rounded-md">
                    <FiCpu className="text-2xl text-[#FF5733]" />
                    <div>
                      <p className="text-sm text-theme-color-neutral-content">Processor</p>
                      <p className="font-semibold">{laptopData.specs?.processor || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-gray-200 p-4 rounded-md">
                    <FaMemory className="text-2xl text-[#FF5733]" />
                    <div>
                      <p className="text-sm text-theme-color-neutral-content">RAM</p>
                      <p className="font-semibold">{laptopData.specs?.ram || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-gray-200 p-4 rounded-md">
                    <FiHardDrive className="text-2xl text-[#FF5733]" />
                    <div>
                      <p className="text-sm text-theme-color-neutral-content">Bộ nhớ</p>
                      <p className="font-semibold">{laptopData.specs?.storage || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-gray-200 p-4 rounded-md">
                    <FiMonitor className="text-2xl text-[#FF5733]" />
                    <div>
                      <p className="text-sm text-theme-color-neutral-content">Màn hình</p>
                      <p className="font-semibold">{laptopData.specs?.display || "N/A"}</p>
                    </div>
                  </div>
                </div>

          {/* --------------- Assignment--------------- */}
          <div className="mb-6 bg-gray-200 p-4 rounded-md">
            <div className="flex items-center space-x-2 mb-3">
              <FaUserCog className="text-2xl text-[#FF5733]" />
              <h3 className="text-lg font-semibold">Thông tin bàn giao</h3>
            </div>
            {laptopData.assigned && laptopData.assigned.length > 0 ? (
                  laptopData.assigned.map((user) => (
                    <div key={user._id} className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-theme-color-neutral-content">Người sử dụng</p>
                        <p className="font-semibold">{user.name || user.label || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-theme-color-neutral-content">Chức vụ</p>
                        <p className="font-semibold">{user.title || "Không xác định"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-theme-color-neutral-content">Chưa có thông tin bàn giao</p>
                )}
          </div>

          {/* --------------- History--------------- */}
          <div className="border-b border-neutral-medium mb-6">
              <div className="flex justify-between">
                <div className="flex space-x-4">
                  <button
                    className={`flex items-center space-x-2 pb-2 transform transition-transform duration-300 hover:scale-105 ${
                      activeTab === "repairs"
                        ? "border-b-2 border-theme-color-base text-[#FF5733]"
                        : "text-theme-color-neutral"
                    }`}
                    onClick={() => setActiveTab("repairs")}
                  >
                    <FaTools />
                    <span>Sửa chữa</span>
                  </button>
                  <button
                    className={`flex items-center space-x-2 pb-2 transform transition-transform duration-300 hover:scale-105 ${
                      activeTab === "updates"
                        ? "border-b-2 border-theme-color-base text-[#FF5733]"
                        : "text-theme-color-neutral"
                    }`}
                    onClick={() => setActiveTab("updates")}
                  >
                    <MdSystemUpdate />
                    <span>Cập nhật</span>
                  </button>
                </div>
                  <button
                    onClick={() => setShowRepairModal(true)}
                    className="flex items-center space-x-2 pb-2 font-semibold text-[#FF5733]"
                  >
                    <FiEdit size={16}/>
                  </button>
              </div>
            </div>

          {/* Repair or Update History */}
          <div className="space-y-4 space-y-4 max-h-40 overflow-y-auto ">
                    {activeTab === "repairs" && (
                    <>
                      {Array.isArray(repairHistory) &&
                        repairHistory
                          .slice() // Tạo một bản sao để không thay đổi thứ tự gốc của mảng
                          .reverse() // Đảo ngược thứ tự
                          .map((repair, index) => (
                            <div key={repair._id} className="bg-gray-200 p-4 rounded-md ">
                              <div className="flex justify-between items-start mb-2 ">
                                <button className="text-[#002417] font-bold text-lg hover:underline"
                                    onClick={() => setShowRepairDetails(repair)}>
                                  {repair?.description || "Không có mô tả"}
                                </button>
                              <div>
                                <span className="text-sm text-theme-color-neutral-content">
                                 {dayjs(repair.date).format("HH:mm:ss | DD-MM-YYYY")}
                                </span>
                                <button
                                  onClick={() => handleDeleteRepair(repair._id)}
                                  className="ml-4 text-red-600 hover:text-red-800"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                                </div>
                              </div>
                              <p className="text-theme-color-neutral-content">
                                Kỹ thuật: {repair.updatedBy || "Không xác định"}
                              </p>
                            </div>
                          ))}
                    </>
                  )}

            {activeTab === "updates" &&
              updateHistory.map((update, index) => (
                <div key={index} className="bg-gray-200 p-4 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{update.version}</h4>
                    <span className="text-sm text-theme-color-neutral-content">{update.date}</span>
                  </div>
                  <p className="text-theme-color-neutral-content">{update.description}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Modal for Adding Repair */}
      {showRepairModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Thêm nhật ký sửa chữa</h3>
            <span classname="font-bold">Mô tả</span>
            <input
              type="text"
              placeholder="Mô tả sửa chữa"
              value={repairData.description}
              onChange={(e) => setRepairData({ ...repairData, description: e.target.value })}
              className="w-full mb-4 p-2 border rounded"
            />
            <div>
            <span classname="font-semibold">Nội dung chi tiết</span>
            <textarea
              placeholder="Nhập nội dung chi tiết"
              value={repairData.details} // Thêm giá trị mới cho trường 'details'
              onChange={(e) => setRepairData({ ...repairData, details: e.target.value })} // Cập nhật giá trị vào state
              className="w-full mb-4 p-2 border rounded h-24" // Hộp textarea lớn hơn
            ></textarea>
          </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowRepairModal(false)}
                className="p-2 bg-gray-300 rounded-md"
              >
                Hủy
              </button>
              <button 
                className="bg-[#002147] text-white p-2 rounded-md"
                onClick={() => {
                handleSaveRepair();
                }}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

        {showRepairDetails && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                  onClick={() => setShowRepairDetails(null)}>
             <div className="flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full transform transition-transform duration-300 hover:scale-105"
                  onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-[#002147] text-2xl md:text-3xl font-bold mb-4 font-sans">
                    {showRepairDetails.description}
                  </h2>
                  <p className="text-[#002147] text-base md:text-lg mb-6 font-sans leading-relaxed">
                     {showRepairDetails.details || "Không có chi tiết nào được cung cấp."}
                  </p>
          
                  <div className="border-t border-gray-600 pt-4">
                    <div className="flex items-center mb-3">
                      <FaUser className="text-[#002147] mr-2" />
                      <p className="text-[#002147] italic font-sans text-xs">
                        Cập nhật bởi: <span className="font-medium">{showRepairDetails.updatedBy}</span>
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-#002147 text-xs italic font-sans">
                        Cập nhật lúc: {new Date(showRepairDetails.date).toLocaleDateString("vi", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            second: "numeric",
                          })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        )}
    </div>
  );
};

export default LaptopProductCard;