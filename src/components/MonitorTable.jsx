import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiCopy } from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import ReactDOM from "react-dom";
import "../css/table.css"
import { MdCancel, MdCheckCircle, MdOutlineError,MdOutlinePending } from "react-icons/md";
import Dropdown from "./function/dropdown";
import MonitorProductCard from "./productcard/monitorProductCard.jsx";



const MonitorTable = () => {
        
        const [data, setData] = useState([]); // State cho danh sách Monitors
        const [users, setUsers] = useState([]); // Lưu danh sách users từ API
        const [showAddModal, setShowAddModal] = useState(false); // State để điều khiển modal 
        const [newMonitor, setNewMonitor] = useState({
            name: "",
            type: "Monitor",
            manufacturer: "",
            serial: "",
            assigned: [],
            room: null, // Gán room mặc định là null
            status: "Active",
            releaseYear: "",
            specs: {
              display: "",
          },
          }); 
        const [editingMonitor, setEditingMonitor] = useState({
            name: "",
            type: "Monitor",
            manufacturer: "",
            serial: "",
            assigned: [],
            room: null, // Gán room mặc định là null
            status: "Active",
            releaseYear: "",
            specs: {
              display: "",
          },
          });
        const [showEditModal, setShowEditModal] = useState(false);
        const [filteredUsers, setFilteredUsers] = useState([]); // Lưu danh sách gợi ý tạm thời
        const [showSuggestions, setShowSuggestions] = useState(false); // Kiểm soát hiển thị gợi ý
        const [showConfirmModal, setShowConfirmModal] = useState(false);
        const [MonitorToDelete, setMonitorToDelete] = useState(null);
        const [selectedMonitor, setSelectedMonitor] = useState(null);
        const [showDetailModal, setShowDetailModal] = useState(false); // Kiểm soát hiển thị modal
        const [showUploadModal, setShowUploadModal] = useState(false);
        const [parsedData, setParsedData] = useState([]);
        const [isUploading, setIsUploading] = useState(false);
        const [showDropdown, setShowDropdown] = useState(false);
        const [selectedOption, setSelectedOption] = useState("Tất cả trạng thái");
        const [selectedDepartment, setSelectedDepartment] = useState("Tất cả phòng ban");
        const [selectedManufacturer, setSelectedManufacturer] = useState("Tất cả nhà sản xuất");
        const [selectedYear, setSelectedYear] = useState("Tất cả năm sản xuất");
        const [selectedType, setSelectedType] = useState("Tất cả"); // Mặc định là Tất cả
        const [rooms, setRooms] = useState([]); // Lưu danh sách phòng
        const [filteredRooms, setFilteredRooms] = useState([]); // Lưu danh sách gợi ý phòng tạm thời
        const [showRoomSuggestions, setShowRoomSuggestions] = useState(false); // Kiểm soát hiển thị gợi ý phòng


        const statusLabels = {
          Active: "Đang sử dụng",
                  "Standby": "Chờ Cấp Phát",
                  "Broken": "Hỏng",

          default: "Không xác định",
        };

        // Hàm gọi API để lấy danh sách Monitors
        const fetchMonitors = async () => {
          try {
            const token = localStorage.getItem("authToken");
            const response = await axios.get("/api/monitors", {
              headers: { Authorization: `Bearer ${token}` },
            });

            // Map dữ liệu `assigned` để phù hợp với định dạng giao diện
            const Monitors = response.data.map((Monitor) => ({
              ...Monitor,
              assigned: Monitor.assigned.map((user) => ({
                value: user._id,
                label: user.name,
                title: user.jobTitle || "Không xác định",
                departmentName: user.department || "Không xác định",
              })),
              room: Monitor.room
                  ? { label: Monitor.room.name, value: Monitor.room._id, location: Monitor.room.location }
                  : null,
            }));
            setData(Monitors);
            console.log("Monitors fetched:", response.data); // Log dữ liệu
          } catch (error) {
            console.error("Error fetching Monitors:", error);
          }
        };

        // Lấy danh sách users
     
        const fetchUsers = async () => {
          try {
            const token = localStorage.getItem("authToken");
            const response = await axios.get("/api/users", {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Dữ liệu từ API users:", response.data);

            if (response.data && Array.isArray(response.data)) {
              setUsers(
                response.data.map((user) => ({
                  value: user._id,
                  label: user.fullname,
                  title: user.jobTitle || "Không xác định",
                  departmentName: user.department || "Unknown",
                  emailAddress : user.email,
                }))
              );
            } else {
              console.error("API không trả về danh sách người dùng hợp lệ");
              setUsers([]);
            }
          } catch (error) {
            console.error("Lỗi khi lấy danh sách users:", error);
            setUsers([]);
          }
        };
        // Hàm gọi API lấy danh sách phòng
        const fetchRooms = async () => {
          try {
            const token = localStorage.getItem("authToken");
            const response = await axios.get("/api/rooms", {
              headers: { Authorization: `Bearer ${token}` },
            });
        
            const roomsData = response.data.rooms || []; // Kiểm tra dữ liệu trả về từ API
            if (!Array.isArray(roomsData)) {
              throw new Error("API trả về dữ liệu không hợp lệ");
            }
        
            const rooms = roomsData.map((room) => ({
              value: room._id,
              label: room.name || "Không xác định",
              location: room.location
                ? room.location.map((loc) => `${loc.building}, tầng ${loc.floor}`).join("; ")
                : "Không xác định",
            }));
        
            console.log("Danh sách rooms đã xử lý:", rooms); // Kiểm tra danh sách
            setRooms(rooms);
          } catch (error) {
            console.error("Error fetching rooms:", error.response || error.message);
            toast.error("Lỗi khi tải danh sách phòng! Vui lòng kiểm tra lại.");
          }
        };
        const handleDeleteRepair = async (MonitorId, repairId) => {
          if (!repairId) {
            return Promise.reject("repairId không hợp lệ");
          }
        
          try {
            const token = localStorage.getItem("authToken");
            const response = await axios.delete(
              `/api/monitors/${MonitorId}/repairs/${repairId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
        
            if (response.status === 200) {
              setSelectedMonitor((prevMonitor) => ({
                ...prevMonitor,
                repairs: prevMonitor.repairs.filter((repair) => repair._id !== repairId),
              }));
              toast.success("Xóa nhật ký sửa chữa thành công!",{
                className: "toast-success",
              });
              return Promise.resolve(); // Trả về Promise thành công
            }
            } catch (error) {
                console.error("Error deleting repair log:", error);
                toast.error("Không thể xóa nhật ký sửa chữa!",{
                  className: "toast-error",
                });
              return Promise.reject(error); // Trả về Promise lỗi
          }
        };
        
          const handleAddRepair = async (repairData) => {
              try {

                const currentUser = JSON.parse(localStorage.getItem("currentUser")) || { fullname: "Không xác định" }; // Lấy thông tin người dùng hiện tại
                const payload = {
                  description: repairData.description || "Không có mô tả",
                  date: repairData.date || new Date().toISOString(),
                  details: repairData.details,
                  updatedBy: currentUser.fullname,
                };
                console.log(payload);
                console.log("Token:", localStorage.getItem("authToken"));
                const response = await fetch(`/api/monitors/${selectedMonitor._id}/repairs`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                  },
                  body: JSON.stringify(payload),
                });
            
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error("API Error:", errorText);
                  throw new Error(errorText || "Failed to add repair log");
                }
                const updatedRepair = await response.json();
            
                setSelectedMonitor((prevMonitor) => ({
                  ...prevMonitor,
                  repairs: [updatedRepair, ...(prevMonitor.repairs || [])], // Thêm nhật ký sửa chữa mới vào đầu danh sách
                }));
            
                console.log("Repair log updated successfully:", updatedRepair);
              } catch (error) {
                console.error("Error adding repair log:", error);
              }
          };
          
          console.log("Props truyền vào MonitorProductCard:", {
            MonitorData: selectedMonitor,
            onDeleteRepair: handleDeleteRepair,
          });

          
          const handleViewDetails = (Monitor) => {
            setSelectedMonitor(Monitor); // Lưu thiết bị được chọn
            setShowDetailModal(true); // Hiển thị modal
          };

          

          const handleClone = async (monitor) => {
            try {
              // Payload giữ nguyên thông tin Monitor, chỉ thay đổi serial
              const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Lấy thông tin người dùng hiện tại
              const userId = currentUser ? currentUser._id : null; // Lấy ID người dùng
              const { _id, ...clonedMonitorData } = monitor;
              const clonedMonitor = {
                ...clonedMonitorData,
                serial: `${monitor.serial}_copy`,
                assigned: monitor.assigned?.map((user) => user.value),
                room: monitor.room?.value,
                userId,
              };
          
              // Gửi yêu cầu POST để tạo Monitor mới
              const response = await axios.post(
                "/api/monitors",
                clonedMonitor,
                {
                  headers: { 
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                  },
                }
              );
          
              if (response.status === 201) {
                toast.success("Nhân bản Monitor thành công!", {
                  className: "toast-success",
                });
                fetchMonitors(); // Cập nhật lại danh sách
              }
            } catch (error) {
              console.error("Error cloning Monitor:", error);
              toast.error("Không thể nhân bản Monitor!", {
                className: "toast-error",
              });
            }
          };

          const handleDelete = async (id) => {
            if (!MonitorToDelete) return;

              try {
                await axios.delete(`/api/monitors/${MonitorToDelete._id}`, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Thêm token ở đây
                  },
                }
                );
                fetchMonitors(); // Cập nhật lại danh sách sau khi xóa
                toast.success("Monitor đã được xóa!",
                  {
                    className: "toast-success",
                  }
                );
              } catch (error) {
                console.error("Error deleting Monitor:", error);
                toast.error("Có lỗi xảy ra khi xóa Monitor!",
                  {
                    className: "toast-error",
                  }
                );
              } finally {
                setShowConfirmModal(false); // Đóng modal
                setMonitorToDelete(null); // Reset Monitor cần xóa
              }
          };

          const handleEdit = (item) => {
              setEditingMonitor({
                ...item,
                releaseYear: item.releaseYear || "", // Đảm bảo có giá trị mặc định cho Năm sản xuất
                specs: {

                  display: item.specs?.display || "",
                },
                assigned: Array.isArray(item.assigned)
                  ? item.assigned.map((user) => ({
                      value: user.value || user._id, // Đảm bảo định dạng user
                      label: user.label || user.fullname,
                    }))
                  : [],
              });
              setShowEditModal(true); // Hiển thị modal chỉnh sửa
          };

          const confirmDelete = (Monitor) => {
            setMonitorToDelete(Monitor); // Đặt Monitor cần xóa
            setShowConfirmModal(true); // Hiển thị modal xác nhận
          };
          
          const handleAddMonitor = async (e) => {
            e.preventDefault();
          
            try {
              // Kiểm tra dữ liệu nhập
              if (!newMonitor.name || !newMonitor.manufacturer || !newMonitor.serial || !newMonitor.status) {
                toast.error("Vui lòng điền đầy đủ thông tin!",
                  {
                    className: "toast-error",
                  }
                );
                return;
              }
              const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Assuming currentUser is stored in localStorage
              const userId = currentUser ? currentUser._id : null; // Retrieve the user's ID
              console.log("Current User từ localStorage:", localStorage.getItem("currentUser"));

              if (!userId) {
                toast.error('User is not logged in. Please log in and try again.');
                return;
              }
          
              // Chuẩn bị payload
              const payload = {
                ...newMonitor,
                releaseYear: newMonitor.releaseYear || "",
                specs: {
                  display: newMonitor.specs?.display || "",
                },
                assigned: newMonitor.assigned?.map((user) => user.value) || [],
                 // Xử lý danh sách người dùng
              };
        
          
              // Gửi dữ liệu lên API
              const response = await axios.post("/api/monitors", payload, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Đảm bảo token được gửi kèm
                },
              });
          
              if (response.status === 201) {
                toast.success("Thêm Monitor thành công!",
                  {
                    className: "toast-success",
                    progressClassName: "Toastify__progress-bar",
                  }
                );
                
                // Cập nhật danh sách Monitors và đóng modal
                fetchMonitors();
                setShowAddModal(false);
                setNewMonitor({
                  name: "",
                  manufacturer: "",
                  serial: "",
                  releaseYear: "",
                  specs: {
                    display: "",
                  },
                  assigned: [],
                  status: "Active",
                  });
              }
            } catch (error) {
              console.error("Lỗi khi thêm Monitor:", error);
              toast.error("Có lỗi xảy ra khi thêm Monitor. Vui lòng thử lại!",
                {
                  className: "toast-error",
                  progressClassName: "Toastify__progress-bar",
                }
              );
            }
          };

          const handleFileChange = (e) => {
            const file = e.target.files[0];
        
            if (!file) {
                toast.error("Vui lòng chọn một tệp!",
                  {
                    className: "toast-error",
                    progressClassName: "Toastify__progress-bar",
                  }
                );
                return;
            }
        
            if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
                toast.error("Định dạng tệp không hợp lệ. Vui lòng chọn tệp Excel!",
                  {
                    className: "toast-error",
                    progressClassName: "Toastify__progress-bar",
                  }
                );
                return;
            }
        
        const reader = new FileReader();
        
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
                    // Chuẩn hóa dữ liệu
                    const normalizedData = sheetData.map((row, index) => {
                        if (!row["Tên Thiết Bị (name)"] || !row["Nhà Sản Xuất (manufacturer)"] || !row["Serial (serial)"]) {
                            console.error(`Hàng ${index + 1} bị thiếu dữ liệu bắt buộc.`);
                            return null;
                        }
                        const roomName = row["Phòng (room)"]?.trim();
                        const matchedRoom = rooms.find((room) => room.label === roomName);

                        if (!matchedRoom) {
                          console.error(`Phòng không hợp lệ ở dòng ${index + 1}: ${roomName}`);
                          return null;
                        }
                      
                        const assignedFullnames = row["Người Dùng (assigned)"]
                            ? row["Người Dùng (assigned)"].split(",").map((name) => name.trim())
                            : [];

                        const assignedIds = assignedFullnames.map((name) => {
                           const normalizedFullname = name.trim().toLowerCase();
                           const matchedUser = users.find(
                            (user) => user.label.trim().toLowerCase() === normalizedFullname // So sánh tên đã chuẩn hóa
                          );
                            if (!matchedUser) {
                              const suggestions = users.map((user) => user.label).join(", ");
                              console.error(`Tên không hợp lệ: ${name}. Các tên hợp lệ: ${suggestions}`);
                              toast.error(`Tên không hợp lệ: ${name}. Gợi ý: ${suggestions}`);
                              throw new Error(`Tên không hợp lệ: ${name}`);
                          }
                            return matchedUser.value; // Lấy ID nếu khớp
                        }); 
        
                        return {
                            name: row["Tên Thiết Bị (name)"] || "",
                            manufacturer: row["Nhà Sản Xuất (manufacturer)"] || "",
                            serial: row["Serial (serial)"] || "",
                            status: row["Trạng Thái (status)"] === "Đang sử dụng"
                                  ? "Active"
                                  : row["Trạng Thái (status)"] === "Chờ Cấp Phát"
                                  ? "Standby"
                                  : row["Trạng Thái (status)"] === "Hỏng"
                                  ? "Broken"
                                  : "Không xác định",
                            specs: {
                                display: row["Màn Hình (display)"] || "",
                            },
                            assigned: assignedIds,
                            room: matchedRoom.value, // Gán ID của phòng
                            releaseYear: row["Năm đưa vào sử dụng (releaseYear)"] || "",
                        };
                    }).filter((item) => item !== null); // Loại bỏ các dòng không hợp lệ
        
                    console.log("Dữ liệu chuẩn hóa:", normalizedData);
        
                    if (normalizedData.length === 0) {
                        toast.error("File Excel không chứa dữ liệu hợp lệ!",{
                            className: "toast-error",
                            progressClassName: "Toastify__progress-bar",
                          }
                        );
                        return;
                    }
        
                    setParsedData(normalizedData);
                    toast.success("File Excel hợp lệ và đã được tải lên!",
                      {
                        className: "toast-success",
                        progressClassName: "Toastify__progress-bar",
                      }
                    );
                } catch (error) {
                    console.error("Lỗi khi xử lý tệp Excel:", error);
                    toast.error("Đã xảy ra lỗi khi xử lý tệp. Vui lòng kiểm tra lại!",
                      {
                        className: "toast-error",
                        progressClassName: "Toastify__progress-bar",
                      }
                    );
                }
            };
        
            reader.readAsArrayBuffer(file);
        };
          

        const handleConfirmUpload = async () => {
          if (!parsedData || parsedData.length === 0) {
            toast.error("Không có dữ liệu để upload. Vui lòng kiểm tra file Excel!");
            return;
          }
        
          // Kiểm tra trùng lặp serial trong file Excel
          const serials = parsedData.map((item) => item.serial);
          const duplicateSerials = serials.filter(
            (serial, index) => serials.indexOf(serial) !== index
          );
        
          if (duplicateSerials.length > 0) {
            toast.error(`Serial trùng lặp trong file: ${duplicateSerials.join(", ")}`);
            return;
          }
        
          try {
            console.log("Dữ liệu gửi lên:", parsedData);
        
            const response = await axios.post(
              "/api/monitors/bulk-upload",
              { monitors: parsedData },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
              }
            );
        
            if (response.status === 201) {
              toast.success(`${response.data.addedMonitors} Monitor(s) đã được thêm thành công!`);
              fetchMonitors();
              setShowUploadModal(false);
            }
          } catch (error) {
            console.error("Lỗi khi tải dữ liệu lên:", error);
        
            // Hiển thị lỗi từ server nếu serial đã tồn tại
            if (error.response?.status === 400) {
              const { errors } = error.response.data || {};
              const duplicateSerialsFromServer = errors?.map((err) => err.serial) || [];
              toast.error(`Serial đã tồn tại: ${duplicateSerialsFromServer.join(", ")}`);
            } else {
              toast.error("Có lỗi xảy ra khi tải dữ liệu lên!");
            }
          }
        };

        useEffect(() => {
          const fetchData = async () => {
            try {
              await fetchRooms(); // Gọi API lấy danh sách phòng
              await fetchUsers(); // Gọi API lấy danh sách người dùng
              await fetchMonitors(); // Gọi API lấy danh sách Monitor
              console.log("Danh sách gợi ý phòng:", filteredRooms);

            } catch (error) {
              console.error("Error fetching data:", error);
            }
          };
          fetchData();
        }, []);


            
    <monitorProductCard
            monitorData={{
              ...selectedMonitor,
              repairs: selectedMonitor?.repairs || [], // Đảm bảo repairs là mảng
            }}
            onAddRepair={(repair) => {
                    // Gọi API thêm nhật ký sửa chữa
                    fetch(`/api/monitors/${selectedMonitor._id}/repairs`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(repair),
                    })
                      .then((response) => {
                        if (response.ok) {
                          console.log("Repair saved successfully");
                        
                        } else {
                          console.error("Failed to save repair");                         
                        }
                      })
                      .catch((error) => console.error("Error saving repair:", error));
               }}
            currentUser={JSON.parse(localStorage.getItem("currentUser"))}
            onDeleteRepair={handleDeleteRepair}
    />

  return (  
    <div className="w-full h-full px-6 pb-6 sm:overflow-x-auto rounded-2xl">
        {/* Header */}
        <div className="flex flex-col justify-between items-start mb-2">
                   {/* Search Input */}
            <div className="flex items-center justify-between w-full mb-1">
    
                <div className="relative w-1/3 mb-4 ">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                          type="text"
                          placeholder="Tìm kiếm Monitor..."
                          className="pl-10 pr-4 py-2 border rounded-md w-100 "
                          onChange={(e) => {
                            const query = e.target.value.toLowerCase();
                            if (query === "") {
                              // Nếu ô tìm kiếm rỗng, khôi phục dữ liệu gốc
                              fetchMonitors();
                            } else {
                              const filteredData = data.filter((item) =>
                                item.name.toLowerCase().includes(query) ||
                                item.manufacturer.toLowerCase().includes(query) ||
                                item.serial.toLowerCase().includes(query)
                              );
                              setData(filteredData); // Cập nhật danh sách được hiển thị
                            }
                          }}
                        />
                      </div>
                  <div className="flex space-x-2">
                        <button
                            onClick={() => {
                            setNewMonitor({
                            name: "",
                            manufacturer: "",
                            serial: "",
                            assigned: [],
                            status: "Active",
                      });
                                            setShowAddModal(true);
                                          }}
                                          className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-md hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
                                        >
                                          Thêm mới
                                        </button>
                                        <button
                                          className="bg-[#FF5733] text-white text-sm font-bold px-3 py-2 rounded-lg shadow-md hover:bg-[#cc4529]transform transition-transform duration-300 hover:scale-105 "
                                          onClick={() => setShowUploadModal(true)}
                                        >
                                          Upload
                                        </button>
                      </div>  
                </div>
           
                <div className="flex items-center justify-start w-full space-x-4 mb-4">   
                     <Dropdown
                          button={
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-50 focus:ring-2 focus:ring-[#002147] transform transition-transform duration-300 hover:scale-105 ">
                              {selectedOption === "Tất cả"
                                ? "Trạng thái"
                                : `Trạng thái: ${selectedOption}`}
                            </button>
                          }
                          children={
                            <div className="flex flex-col gap-2 mt-10 bg-white rounded-lg shadow-lg p-4">
                              {/* Option "Tất cả trạng thái" */}
                              <button
                                key="all"
                                className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                onClick={() => {
                                  setSelectedOption("Tất cả");
                                  fetchMonitors(); // Lấy lại toàn bộ dữ liệu
                                  setShowDropdown(false); // Đóng dropdown
                                }}
                              >
                                Tất cả trạng thái
                              </button>

                              {/* Các trạng thái */}
                              {[
                                { value: "Active", label: "Đang sử dụng" },
                                { value: "Standby", label: "Chờ Cấp Phát" },
                                { value: "Broken", label: "Hỏng" },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                  onClick={() => {
                                    setSelectedOption(option.label);
                                    setData(data.filter((item) => item.status === option.value)); // Lọc theo trạng thái
                                    setShowDropdown(false); // Đóng dropdown
                                  }}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          }
                        />
                        
                        <Dropdown
                            button={
                              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-50 focus:ring-2 focus:ring-[#002147] transform transition-transform duration-300 hover:scale-105">
                                {selectedDepartment === "Tất cả"
                                  ? "Phòng ban"
                                  : `Phòng ban: ${selectedDepartment}`}
                              </button>
                            }
                            children={
                              <div className="flex flex-col gap-2 mt-10 bg-white rounded-lg shadow-lg p-4">
                                {/* Tùy chọn "Tất cả phòng ban" */}
                                <button
                                  key="all"
                                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                  onClick={() => {
                                    setSelectedDepartment("Tất cả");
                                    fetchMonitors(); // Hiển thị toàn bộ dữ liệu
                                  }}
                                >
                                  Tất cả phòng ban
                                </button>

                                {/* Lọc phòng ban từ cột Người sử dụng */}
                                {Array.from(
                                  new Set(
                                    data.flatMap((item) =>
                                      item.assigned?.map((user) => user.departmentName || "Unknown")
                                    )
                                  )
                                ).map((department) => (
                                  <button
                                    key={department}
                                    className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                    onClick={() => {
                                      setSelectedDepartment(department);
                                      setData(
                                        data.filter((item) =>
                                          item.assigned.some((user) => user.departmentName === department)
                                        )
                                      );
                                    }}
                                  >
                                    {department}
                                  </button>
                                ))}
                              </div>
                            }
                          />
                            <Dropdown
                                button={
                                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-50 focus:ring-2 focus:ring-[#002147] transform transition-transform duration-300 hover:scale-105">
                                    {selectedManufacturer === "Tất cả"
                                      ? "Nhà sản xuất"
                                      : `Nhà sản xuất: ${selectedManufacturer}`}
                                  </button>
                                }
                                children={
                                  <div className="flex flex-col gap-2  mt-10 bg-white rounded-lg shadow-lg p-4">
                                    {/* Option "Tất cả nhà sản xuất" */}
                                    <button
                                      key="all"
                                      className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                      onClick={() => {
                                        setSelectedManufacturer("Tất cả");
                                        fetchMonitors(); // Lấy lại toàn bộ dữ liệu
                                        setShowDropdown(false); // Đóng dropdown
                                      }}
                                    >
                                      Tất cả nhà sản xuất
                                    </button>

                                    {/* Các nhà sản xuất */}
                                    {Array.from(new Set(data.map((item) => item.manufacturer))).map(
                                      (manufacturer) => (
                                        <button
                                          key={manufacturer}
                                          className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                          onClick={() => {
                                            setSelectedManufacturer(manufacturer);
                                            setData(data.filter((item) => item.manufacturer === manufacturer)); // Lọc theo nhà sản xuất
                                            setShowDropdown(false); // Đóng dropdown
                                          }}
                                        >
                                          {manufacturer}
                                        </button>
                                      )
                                    )}
                                  </div>
                                }
                              />
                              <Dropdown
                                button={
                                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-50 focus:ring-2 focus:ring-[#002147] transform transition-transform duration-300 hover:scale-105">
                                    {selectedYear === "Tất cả"
                                      ? "Năm sản xuất"
                                      : `Năm sản xuất: ${selectedYear}`}
                                  </button>
                                }
                                children={
                                  <div className="flex flex-col gap-2  mt-10 bg-white rounded-lg shadow-lg p-4">
                                    {/* Option "Tất cả năm sản xuất" */}
                                    <button
                                      key="all"
                                      className="text-left px-4 py-2 hover:bg-[gray-100] rounded-lg"
                                      onClick={() => {
                                        setSelectedYear("Tất cả");
                                        fetchMonitors(); // Lấy lại toàn bộ dữ liệu
                                        setShowDropdown(false); // Đóng dropdown
                                      }}
                                    >
                                      Tất cả năm sản xuất
                                    </button>

                                    {/* Các năm sản xuất */}
                                    {Array.from(new Set(data.map((item) => item.releaseYear)))
                                      .sort()
                                      .map((year) => (
                                        <button
                                          key={year}
                                          className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                          onClick={() => {
                                            setSelectedYear(year);
                                            setData(data.filter((item) => item.releaseYear === year)); // Lọc theo năm
                                            setShowDropdown(false); // Đóng dropdown
                                          }}
                                        >
                                          {year}
                                        </button>
                                      ))}
                                  </div>
                                }
                              />
                        
                    </div>
                   
              </div>

      {/* {-----------------------------------------/* Bảng /-----------------------------------------} */}
  <div className="w-full h-full px-6 pb-6 sm:overflow-x-auto bg-white rounded-2xl shadow-xl border">
    <div className="mt-1 overflow-x-scroll xl:overflow-x-hidden">
      <table className="w-full ">
        <thead>
                  <tr className="!border-px !border-gray-400" >
                    <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500">TÊN THIẾT BỊ
                        </p>
                    </th>
                    <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500">SERIAL
                        </p>
                    </th>
                    <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500">NGƯỜI SỬ DỤNG
                        </p>
                    </th>
                    <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                      <p className="text-sm font-bold text-gray-500">NƠI SỬ DỤNG</p>
                    </th>
                    <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500">TRẠNG THÁI
                        </p>
                    </th>
                    <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500">HÀNH ĐỘNG
                        </p>
                    </th>
                  </tr>
        </thead>
        <tbody>
              {data.map((item, index) => (
                
                <tr key={index} className="border-b border-gray-200">
                  <td
                    onClick={() => handleViewDetails(item)} 
                    className="cursor-pointer text-[#002147] min-w-[150px] border-white/0 py-3 pr-4 "
                  >
                    <p className="text-sm font-bold text-navy-700">
                    {item.name}
                    </p>
                    <span className="text-sm italic bold text-gray-500">
                      {item.manufacturer || "Không xác định"} - {item.releaseYear || "N/A"}
                    </span>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">{item.serial}
                    </p>
                    </td>
                    <td className="min-w-[150px] border-white/0 py-3 pr-4 text-sm font-bold text-navy-700">
                      {Array.isArray(item.assigned) && item.assigned.length > 0 ? (
                      item.assigned.map((user) => (
                        <div key={user.value || user._id}>
                          <p className="font-bold">{user.label}</p>
                          <span className="italic text-gray-400">
                            {user.departmentName ? user.departmentName : "SS"}
                          </span>
                          {console.log("User Object:", user)}
                        {console.log("User Department Name:", user.departmentName)}
                        </div>
                      ))
                    ) : (
                      "Chưa bàn giao"
                    )}
                   </td>
                   <td className="min-w-[150px] border-white/0 py-3 pr-4 text-sm font-bold text-navy-700">
                          {item.room ? (
                            <div>
                              <p className="font-bold">{item.room.label || "N/A"}</p>
                              {Array.isArray(item.room.location) && item.room.location.length > 0 ? (
                                <span className="italic text-gray-400">
                                  {item.room.location
                                    .map((loc) => `Tòa nhà: ${loc.building || "N/A"}, tầng ${loc.floor || "N/A"}`)
                                    .join("; ")}
                                </span>
                              ) : (
                                <span className="italic text-gray-400">Không xác định</span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold">N/A</p>
                            </div>
                          )}
                        </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <div className="flex items-center">
                      {item.status === "Active" ? (
                        <MdCheckCircle className="text-[#009483] me-1" />
                      ) : item.status === "Broken" ? (
                        <MdCancel className="text-orange-red me-1" />
                      ) : item.status === "Standby" ? (
                        <MdOutlineError className="text-amber-500 me-1" />
                      ) : null}
                      <p className="text-sm font-bold text-navy-700">
                        {statusLabels[item.status] || statusLabels.default}
                      </p>
                    </div>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiEdit size={14} />
                        </button>
                        <button
                          onClick={() => confirmDelete(item)}
                          className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg  transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiTrash2 size={14} />
                        </button>
                        <button
                          onClick={() => handleClone(item)}
                          className="flex items-center justify-center w-7 h-7 text-white bg-[#009483] rounded-lg  transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiCopy size={14} />
                        </button>
                      </div>
                    </td>
                </tr>
              ))}
     </tbody>
    </table>
  </div>
</div>  


      {/* {-----------------------------------------/* Modal thêm mới /-----------------------------------------} */}
      {showAddModal && 
        ReactDOM.createPortal
          (
              <div
                className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 space-y-6 z-1000"
                onClick={() => setShowAddModal(false)}
              >
                <div
                  className="bg-white rounded-lg shadow-lg p-6 w-[50%]"
                  onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
                >
                  <h3 className="text-2xl font-bold mb-6 text-[#002147]">Thêm mới Monitor</h3>
                  <form onSubmit={handleAddMonitor}>
                    {/* Thông tin chung */}
                    <div
                      className="border rounded-lg p-4 mb-4 relative"
                      style={{ position: "relative", padding: "16px", marginBottom: "30px" }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "-12px",
                          left: "16px",
                          backgroundColor: "#fff",
                          padding: "0 8px",
                          fontWeight: "bold",
                          color: "#002147",
                        }}
                      >
                        Thông tin chung
                      </span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Tên thiết bị</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập tên thiết bị"
                            value={newMonitor.name}
                            onChange={(e) => setNewMonitor({ ...newMonitor, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Nhà sản xuất</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập nhà sản xuất"
                            value={newMonitor.manufacturer}
                            onChange={(e) => setNewMonitor({ ...newMonitor, manufacturer: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Serial</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập số serial"
                            value={newMonitor.serial}
                            onChange={(e) => setNewMonitor({ ...newMonitor, serial: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Năm sản xuất</label>
                          <input
                            type="number"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập năm sản xuất"
                            value={newMonitor.releaseYear}
                            onChange={(e) => setNewMonitor({ ...newMonitor, releaseYear: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cấu hình */}
                    <div
                      className="border rounded-lg p-4 mb-4 relative"
                      style={{ position: "relative", padding: "16px", marginBottom: "30px" }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "-12px",
                          left: "16px",
                          backgroundColor: "#fff",
                          padding: "0 8px",
                          fontWeight: "bold",
                          color: "#002147",
                          marginBottom: "16px"
                        }}
                      >
                        Cấu hình
                      </span>
                      
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Màn hình</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập kích thước màn hình"
                            value={newMonitor.specs?.display || ""}
                            onChange={(e) =>
                              setNewMonitor({ ...newMonitor, specs: { ...newMonitor.specs, display: e.target.value } })
                            }
                          />
                        </div>
                    </div>

                    {/* Trạng thái */}
                    <div
                      className="border rounded-lg p-4 mb-4 relative"
                      style={{ position: "relative", padding: "16px", marginBottom: "16px" }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "-12px",
                          left: "16px",
                          backgroundColor: "#fff",
                          padding: "0 8px",
                          fontWeight: "bold",
                          color: "#002147",
                          marginBottom: "16px"
                        }}
                      >
                        Trạng thái
                      </span>
                      <select
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        value={newMonitor.status}
                        onChange={(e) => setNewMonitor({ ...newMonitor, status: e.target.value })}
                      >
                        <option value="Active">Đang sử dụng</option>
                        <option value="Standby">Chờ Cấp Phát</option>
                        <option value="Broken">Hỏng</option>
                      </select>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#002147] text-white rounded"
                      >
                        Lưu
                      </button>
                    </div>
                  </form>
                </div>
              </div>,
              document.body
          )}

      {/* {-----------------------------------------/* Modal upload /-----------------------------------------} */}
      {showUploadModal && ReactDOM.createPortal(
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-9999"
            style={{ zIndex: 1050 }}>
              <div className="bg-white p-6 rounded-md shadow-md w-1/3 relative z-9999"
              style={{ zIndex: 1050 }}>
                <h2 className="text-2xl font-bold mb-4 text-center text-[#002147]">Cập nhật dữ liệu</h2>
                <form>
                  {/* Input chọn file */}
                  <div className="mb-4">
                    <label className="block text-base font-medium mb-2">Chọn file Excel</label>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      className="block w-full text-sm text-gray-900 border border-gray-300 cursor-pointer bg-gray-50 focus:outline-none"
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  {/* Trạng thái tải */}
                  {isUploading && (
                    <div className="text-blue-500 text-center mb-4">
                      Đang xử lý tệp, vui lòng chờ...
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    {/* Nút tải file mẫu */}
                    <a
                      href="/monitor-sample-upload.xlsx"
                      download
                      className="bg-[#009483] text-white px-4 py-2 rounded-md hover:bg-[#001635]"
                    >
                      Tải file mẫu
                    </a>
                    <div className="flex space-x-2">
                      {/* Nút hủy */}
                      <button
                        type="button"
                        className="bg-[#FF5733] text-white px-4 py-2 rounded-md"
                        onClick={() => setShowUploadModal(false)}
                      >
                        Hủy
                      </button>
                      {/* Nút xác nhận */}
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-md text-white ${
                          isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-[#002147] hover:bg-[#001635]"
                        }`}
                        onClick={handleConfirmUpload}
                        disabled={isUploading}
                      >
                        Xác nhận
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
      {/* {-----------------------------------------/* Modal cập nhật thông tin /-----------------------------------------} */}
      {showEditModal && ReactDOM.createPortal(
            <div
              className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 space-y-6 z-1000"
              style={{ zIndex: 1050 }}
              onClick={() => setShowEditModal(false)}>
              <div
                className="bg-white rounded-lg shadow-lg p-6 w-[50%]"
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
                style={{ zIndex: 1050 }}>
                <h3 className="text-2xl font-semibold mb-8 text-[#002147]">Cập nhật thông tin Monitor</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const payload = {
                        ...editingMonitor,
                        releaseYear: editingMonitor.releaseYear || "",
                        specs: {
                          display: editingMonitor.specs?.display || "",
                        },
                        assigned:
                            editingMonitor.assigned
                              ? editingMonitor.assigned.map((user) => user.value)
                              : selectedMonitor.assigned.map((user) => user.value),
                        room: editingMonitor.room?.value || null, // Gửi ID phòng
                        };
                        
                      
                        console.log("Payload gửi lên server:", payload);

                      await axios.put(
                        `/api/monitors/${editingMonitor._id}`,
                        payload,
                        {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                          },
                        }
                      );
                      setShowEditModal(false);
                      fetchMonitors(); // Cập nhật danh sách sau khi sửa
                      toast.success("Cập nhật Monitor thành công!",
                        {
                          className: "toast-succes",
                          progressClassName: "Toastify__progress-bar",
                        }
                      );
                    } catch (error) {
                      console.error("Error updating Monitor:", error);
                      toast.error("Không thể cập nhật Monitor!",
                        {
                          className: "toast-error",
                          progressClassName: "Toastify__progress-bar",
                        }
                      );
                    }
                  }}
                >
                  {/* Thông tin chung */}
                  <div className="border rounded-lg p-4 mb-4 relative"
                  style={{ position: "relative", padding: "16px", marginBottom: "30px" }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "-12px",
                        left: "16px",
                        backgroundColor: "#fff",
                        padding: "0 8px",
                        fontWeight: "bold",
                        color: "#002147",
                      }}
                    >
                      Thông tin chung
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Tên thiết bị</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập tên thiết bị"
                          value={editingMonitor.name}
                          onChange={(e) => setEditingMonitor({ ...editingMonitor, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Nhà sản xuất</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập nhà sản xuất"
                          value={editingMonitor.manufacturer}
                          onChange={(e) => setEditingMonitor({ ...editingMonitor, manufacturer: e.target.value })}
                        />
                      </div>
                      <div>
                          <label className="block text-gray-600 font-medium mb-2">Phân loại</label>
                          <select
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            value={editingMonitor.type}
                            onChange={(e) => setEditingMonitor({ ...editingMonitor, type: e.target.value })}
                          >
                            <option value="Monitor">Monitor</option>
                            <option value="Desktop">Desktop</option>
                          </select>
                        </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Serial</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập số serial"
                          value={editingMonitor.serial}
                          onChange={(e) => setEditingMonitor({ ...editingMonitor, serial: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Năm sản xuất</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập năm sản xuất"
                          value={editingMonitor.releaseYear}
                          onChange={(e) => setEditingMonitor({ ...editingMonitor, releaseYear: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cấu hình */}
                  <div className="border rounded-lg p-4 mb-4 relative"
                  style={{ position: "relative", padding: "16px", marginBottom: "30px" }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "-12px",
                        left: "16px",
                        backgroundColor: "#fff",
                        padding: "0 8px",
                        fontWeight: "bold",
                        color: "#002147",
                      }}
                    >
                      Cấu hình
                    </span>       
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Màn hình</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập kích thước màn hình"
                          value={editingMonitor.specs?.display || ""}
                          onChange={(e) =>
                            setEditingMonitor({ ...editingMonitor, specs: { ...editingMonitor.specs, display: e.target.value } })
                          }
                        />
                      </div>
                  </div>
                  {/* Trạng thái */}
                    <div
                      className="border rounded-lg p-4 mb-8 relative"
                      style={{ position: "relative", padding: "16px", marginBottom: "30px" }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "-12px",
                          left: "16px",
                          backgroundColor: "#fff",
                          padding: "0 8px",
                          fontWeight: "bold",
                          color: "#002147",
                        }}
                      >
                        Trạng thái
                      </span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Tình trạng</label>
                          <select
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            value={editingMonitor.status}
                            onChange={(e) => setEditingMonitor({ ...editingMonitor, status: e.target.value })}
                          >
                            <option value="Active">Đang sử dụng</option>
                            <option value="Standby">Chờ Cấp Phát</option>
                            <option value="Broken">Hỏng</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Người sử dụng</label>
                          <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                                placeholder="Nhập tên người sử dụng"
                                value={editingMonitor.assigned[0]?.label || ""}

                                onChange={(e) => {
                                  const query = e.target.value.toLowerCase();

                                  // Lọc danh sách người dùng phù hợp
                                  const filtered = users.filter((user) =>
                                    user.label.toLowerCase().includes(query) ||
                                    user.emailAddress.toLowerCase().includes(query)
                                  );

                                  setFilteredUsers(filtered);
                                  setShowSuggestions(true);

                                  // Tạm thời gắn giá trị nhập vào assigned
                                  setEditingMonitor({
                                    ...editingMonitor,
                                    assigned: [{ label: e.target.value, value: null }],
                                  });
                                }}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Đợi người dùng chọn gợi ý
                              />
                          {showSuggestions && filteredUsers.length > 0 && (
                            <ul className="border rounded-lg mt-2 bg-white shadow-lg max-h-40 overflow-y-auto">
                              {filteredUsers.map((user) => (
                                <li
                                  key={user.value}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => {
                                    setEditingMonitor({ ...editingMonitor, assigned: [user] });
                                    setShowSuggestions(false);
                                  }}
                                >
                                 <span className="font-bold">{user.label}</span>
                                  <br />
                                  <span className="italic text-gray-500">{user.emailAddress}</span>
                                </li>
                              ))}
                              {filteredUsers.length === 0 && (
                                <li className="px-4 py-2 text-gray-500 italic">Không tìm thấy kết quả</li>
                              )}
                            </ul>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Phòng</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập tên phòng"
                            value={editingMonitor.room?.label || ""}
                            onChange={(e) => {
                              const query = e.target.value.toLowerCase();

                              // Lọc danh sách rooms phù hợp
                              const filtered = rooms.filter((room) =>
                                room.label.toLowerCase().includes(query)
                              );

                              setFilteredRooms(filtered);
                              setShowRoomSuggestions(true);

                              // Tạm thời gắn giá trị nhập vào room
                              setEditingMonitor({
                                ...editingMonitor,
                                room: { label: e.target.value, value: null },
                              });
                            }}
                            onBlur={() => setTimeout(() => setShowRoomSuggestions(false), 200)}
                          />
                          {showRoomSuggestions && filteredRooms.length > 0 && (
                                <ul className="border rounded-lg mt-2 bg-white shadow-lg max-h-40 overflow-y-auto">
                                {filteredRooms.map((room) => (
                                  <li
                                    key={room.value}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      setEditingMonitor({
                                        ...editingMonitor,
                                        room: { label: room.label, value: room.value }, // Cập nhật cả label và value
                                      });
                                      setShowRoomSuggestions(false); // Ẩn gợi ý
                                    }}
                                  >
                                    <span className="font-bold">{room.label}</span>
                                    <br />
                                    <span className="italic text-gray-500">{room.location}</span>
                                  </li>
                                ))}
                              </ul>
                              )}
                        
                        </div>
                      </div>
                    </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#002147] text-white rounded"
                    >
                      Lưu
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
      {/* {-----------------------------------------/* Modal confirm /-----------------------------------------} */}
      {showConfirmModal && ReactDOM.createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center"
          style={{ zIndex: 1050 }}>
            <div className="bg-white rounded-lg shadow-lg p-6 w-96" 
                        style={{ zIndex: 1050 }}>
              <h3 className="text-lg text-center font-semibold mb-4 text-[#002147]">Xác nhận xóa</h3>
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa Monitor <strong>{MonitorToDelete?.name}</strong> không?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-[#002147] text-white rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-[#FF5733] text-white rounded hover:bg-[#cc4529] transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>,
          document.body
          )}

         {/* {-----------------------------------------/* Modal click /-----------------------------------------} */}
      {showDetailModal && selectedMonitor && ReactDOM.createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-1000"
          style={{ zIndex: 1050 }}
          onClick={(e) => {
            // Đóng modal nếu người dùng nhấp ra ngoài modal
            if (e.target === e.currentTarget) {
              setSelectedMonitor(null);
            }
          }}
          >
            <div className=" w-3/4 max-w-4xl"
            style={{ zIndex: 1050 }}
            onClick={(e) => e.stopPropagation()}>
              <MonitorProductCard
                monitorData={{
                  ...selectedMonitor,
                  assigned: selectedMonitor?.assigned.map((user) => ({
                    ...user,
                    jobTitle: user.jobTitle || "Không xác định", // Thêm jobTitle
                  })) || [],
                  releaseYear: selectedMonitor.releaseYear || "Không có",
                }}
                onAddRepair={handleAddRepair} // Truyền hàm vào đây
                onDeleteRepair={handleDeleteRepair}
                onCloseModal={() => {
                  setSelectedMonitor(null); // Reset laptop đã chọn
                  setShowDetailModal(false); // Đóng modal
                }} // Truyền hàm đóng modal
              />
            </div>
          </div>,
          document.body
        )}    
      
    </div>
  );
};

export default MonitorTable;
