import React, { useState, useEffect } from "react";
import { FiEdit, FiCpu, FiHardDrive, FiMonitor, FiTrash2 } from "react-icons/fi";
import { FaTools, FaMemory, FaUserCog } from "react-icons/fa";
import { MdSystemUpdate } from "react-icons/md";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DesktopProductCard = ({ desktopData, onAddRepair, onDeleteRepair }) => {
  const [activeTab, setActiveTab] = useState("repairs");
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairs, setRepairs] = useState([]);
  const [repairData, setRepairData] = useState({
    description: "",
    date: "",
  });

  useEffect(() => {
    if (desktopData.repairs) {
      setRepairs(desktopData.repairs);
    }
  }, [desktopData]);

  if (!desktopData) {
    return <p>Loading desktop details...</p>;
  }

  const assignedUsers = Array.isArray(desktopData.assigned) ? desktopData.assigned : [];
  const repairHistory = Array.isArray(desktopData.repairs) ? desktopData.repairs : [];
  const updateHistory = Array.isArray(desktopData.updates) ? desktopData.updates : [];

  const handleSaveRepair = () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) {
      console.error("Không tìm thấy thông tin user trong localStorage.");
      return;
    }
    console.log("Repair being added:", repairData); // Log để kiểm tra dữ liệu thêm

    if (onAddRepair) {
      onAddRepair({
        description: repairData.description,
        date: repairData.date || new Date().toISOString(),
        updatedBy: currentUser.fullname || "Không xác định",
      });

      // Sau khi gọi API, cập nhật danh sách repairs
    setRepairs((prevRepairs) => [
      ...prevRepairs,
      {
        description: repairData.description,
        date: repairData.date || new Date().toISOString(),
        updatedBy: JSON.parse(localStorage.getItem("currentUser"))?.fullname || "Không xác định",
      },
    ]);
      
      setShowRepairModal(false);
      setRepairData({ description: "", date: "" });
    } else {
      console.error("onAddRepair không được truyền vào ITProductCard.");
      toast.error("Không thể thêm lịch sử sửa chữa!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleDeleteRepair = (repairId) => {
    if (!repairId) {
      console.error("repairId không hợp lệ.");
      return;
    }

    if (onDeleteRepair) {
      onDeleteRepair(desktopData._id, repairId)
        .then(() => {
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
      <div className="bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden"
      onClick={(e) => {
        // Đóng modal nếu người dùng nhấp ra ngoài modal
        if (e.target === e.currentTarget) {
          setShowRepairModal(false); // Hoặc setSelectedDesktop(null);
        }
      }}>
        <div className="p-6">
          {/* Info Section */}
          <div className="flex justify-between items-start mb-6"
          onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan xuống container ngoài
          >
            <div>
              <h2 className="text-2xl font-bold text-[#002147]">{desktopData.name}</h2>
              <p className="text-theme-color-neutral-content">
                Năm sản xuất: {desktopData.releaseYear || "N/A"}
              </p>
            </div>
            <div className="px-4 py-2 text-center">
              <span
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-center ${
                  desktopData.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : desktopData.status === "In Repair"
                    ? "bg-yellow-100 text-yellow-800"
                    : desktopData.status === "Lưu kho"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {desktopData.status === "Active"
                  ? "Đang sử dụng"
                  : desktopData.status === "In Repair"
                  ? "Chờ sửa chữa"
                  : desktopData.status === "Lưu kho"
                  ? "Lưu kho"
                  : "Không xác định"}
              </span>
            </div>
          </div>

          {/* Specs Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-3 bg-gray-200 p-4 rounded-md">
              <FiCpu className="text-2xl text-[#FF5733]" />
              <div>
                <p className="text-sm text-theme-color-neutral-content">Processor</p>
                <p className="font-semibold">{desktopData.specs?.processor || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-gray-200 p-4 rounded-md">
              <FaMemory className="text-2xl text-[#FF5733]" />
              <div>
                <p className="text-sm text-theme-color-neutral-content">RAM</p>
                <p className="font-semibold">{desktopData.specs?.ram || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-gray-200 p-4 rounded-md">
              <FiHardDrive className="text-2xl text-[#FF5733]" />
              <div>
                <p className="text-sm text-theme-color-neutral-content">Storage</p>
                <p className="font-semibold">{desktopData.specs?.storage || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-gray-200 p-4 rounded-md">
              <FiMonitor className="text-2xl text-[#FF5733]" />
              <div>
                <p className="text-sm text-theme-color-neutral-content">Display</p>
                <p className="font-semibold">{desktopData.specs?.display || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Assignment Section */}
          <div className="mb-6 bg-gray-200 p-4 rounded-md">
            <div className="flex items-center space-x-2 mb-3">
              <FaUserCog className="text-2xl text-[#FF5733]" />
              <h3 className="text-lg font-semibold">Thông tin bàn giao</h3>
            </div>
            {assignedUsers.length > 0 ? (
              assignedUsers.map((user) => (
                <div key={user._id} className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-theme-color-neutral-content">Người sử dụng</p>
                    <p className="font-semibold">{user.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-theme-color-neutral-content">Chức vụ</p>
                    <p className="font-semibold">{user.jobTitle || "N/A"}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>Chưa được bàn giao</p>
            )}
          </div>

          {/* Repair & Update History */}
          <div className="border-b border-neutral-medium mb-6">
              <div className="flex justify-between">
                <div className="flex space-x-4">
                  <button
                     className={`flex items-center space-x-2 pb-2 ${
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
                    className={`flex items-center space-x-2 pb-2 ${
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

          {/* Nội dung tabs */}
          <div className="max-h-40 overflow-y-auto space-y-4">
            {activeTab === "repairs" && (
              <>
                {Array.isArray(repairHistory) &&
                        repairHistory
                          .slice() // Tạo một bản sao để không thay đổi thứ tự gốc của mảng
                          .reverse() // Đảo ngược thứ tự
                          .map((repair, index) =>  (
                  <div key={repair._id} className="bg-gray-200 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{repair.description || "Không có mô tả"}</h4>
                     <div>
                          <span className="text-sm text-theme-color-neutral-content">
                              {dayjs(repair.date).format("HH:mm:ss | DD-MM-YYYY")}
                          </span>
                          <button onClick={() => handleDeleteRepair(repair._id)}
                            className="ml-4 text-red-600 hover:text-red-800">
                            <FiTrash2 size={16}/>
                          </button>
                      </div>
                    </div>
                    <p className="text-theme-color-neutral-content">
                         Người cập nhật: {repair.updatedBy || "Không xác định"}
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

      {/* Modal thêm sửa chữa */}
      {showRepairModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 ">
                  <h3 className="text-lg font-semibold mb-4">Thêm nhật ký sửa chữa</h3>
                    <span>Mô tả</span>
                    <input
                      type="text"
                      placeholder="Mô tả sửa chữa"
                      value={repairData.description}
                      onChange={(e) => setRepairData({ ...repairData, description: e.target.value })}
                      className="w-full mb-4 p-2 border rounded"
                    />
                    <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowRepairModal(false)}
                      className="bg-gray-200 p-2 rounded-md"
                    >
                      Hủy
                    </button>
                    <button onClick={handleSaveRepair} className="bg-[#002147] text-white p-2 rounded-md">
                      Lưu
                    </button>
                  </div>
            </div>
         </div>
         )}
    </div>
  );
};

export default DesktopProductCard;