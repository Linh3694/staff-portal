import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiCopy } from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import MonitorProductCard from "./productcard/monitorProductCard";
import * as XLSX from "xlsx";
import ReactDOM from "react-dom";
import "../css/table.css"
import { MdCancel, MdCheckCircle, MdOutlineError } from "react-icons/md";
import Dropdown from "./function/dropdown";



const MonitorTable = () => {
        
        const [data, setData] = useState([]); // State cho danh sách monitors
        const [users, setUsers] = useState([]); // Lưu danh sách users từ API
        const [showAddModal, setShowAddModal] = useState(false); // State để điều khiển modal 
        const [newMonitor, setNewMonitor] = useState({
            name: "",
            type: "Monitor",
            manufacturer: "",
            serial: "",
            assigned: [],
            room: "",
            status: "Standby",
            reason: "",
            releaseYear: "",
            specs: {
              processor: "",
              ram: "",
              storage: "",
              display: "",
          },
          }); 
        const [editingMonitor, setEditingMonitor] = useState({
            name: "",
            type: "Monitor",
            manufacturer: "",
            serial: "",
            assigned: [],
            room: "",
            status: "Active",
            reason: "",
            releaseYear: "",
            specs: {
              processor: "",
              ram: "",
              storage: "",
              display: "",
          },
          });
        const [showEditModal, setShowEditModal] = useState(false);
        const [filteredUsers, setFilteredUsers] = useState([]); // Lưu danh sách gợi ý tạm thời
        const [showSuggestions, setShowSuggestions] = useState(false); // Kiểm soát hiển thị gợi ý
        const [showConfirmModal, setShowConfirmModal] = useState(false);
        const [monitorToDelete, setMonitorToDelete] = useState(null);
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
        const [rooms, setRooms] = useState([]); // Lưu danh sách rooms từ API
        const [filteredRooms, setFilteredRooms] = useState([]); // Lưu gợi ý tìm kiếm
        const [showRoomSuggestions, setShowRoomSuggestions] = useState(false); // Kiểm soát hiển thị gợi ý      
        const [refreshKey, setRefreshKey] = useState(0);
        const [currentPage, setCurrentPage] = useState(1);
        const [totalPages, setTotalPages] = useState(0); 
  

        
        const statusLabels = {
          Active: "Đang sử dụng",
          Standby: "Chờ Cấp Phát",
          Broken: "Hỏng",
          PendingDocumentation: "Đã bàn giao - Chưa có biên bản", // Thêm trạng thái mới
        };

        const handleUpdateSpecs = (monitorId, updatedSpecs) => {
          const token = localStorage.getItem("authToken");
          return axios
            .put(`/api/monitors/${monitorId}/specs`, updatedSpecs, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            })
            .then((response) => {
              // Dữ liệu monitor đã được cập nhật
              const updatedMonitor = response.data; 
              // Cập nhật state cục bộ (nếu đang giữ selectedMonitor)
              if (selectedMonitor && selectedMonitor._id === updatedMonitor._id) {
                setSelectedMonitor(updatedMonitor);
              }
              return updatedMonitor; 
            })
            .catch((error) => {
              console.error("Lỗi cập nhật specs:", error);
              throw error;
            });
        };

                
          const handleViewDetails = (monitor) => {
            setSelectedMonitor(monitor); // Chỉ truyền dữ liệu xuống MonitorProductCard
            setRefreshKey((prevKey) => prevKey + 1); // Tăng giá trị để ép render
            setShowDetailModal(true);
          };

          const handleRefreshData = async () => {
            await fetchMonitors(); // Làm mới danh sách nếu cần
          };
          

          const fetchUsers = async () => {
            try {
              const token = localStorage.getItem("authToken");
              const response = await axios.get("/api/users", {
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.data && Array.isArray(response.data)) {
                setUsers(
                  response.data.map((user) => ({
                    value: user._id,
                    label: user.fullname,
                    title: user.jobTitle || "Không",
                    departmentName: user.department || "Unknown",
                    emailAddress : user.email,
                    avatarUrl: user.avatarUrl || "Không có",
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

          // Hàm gọi API để lấy danh sách monitors
          const fetchMonitors = async (page = 1) => {
            try {
              const token = localStorage.getItem("authToken");
              const response = await axios.get(`/api/monitors?page=${page}&limit=30`, {
                headers: { Authorization: `Bearer ${token}` },
              });
          
              // Ghi log để kiểm tra dữ liệu trả về
              console.log("Dữ liệu API monitors:", response.data);
          
              // Cập nhật state
              setData(
                response.data.populatedMonitors.map((monitor) => ({
                  ...monitor,
                  room: monitor.room
                    ? {
                        label: monitor.room.name,
                        value: monitor.room._id,
                        location: monitor.room.location || ["Không xác định"],
                        status: monitor.room.status,
                      }
                    : { label: "Không xác định", location: ["Không xác định"] },
                  assigned: Array.isArray(monitor.assigned)
                    ? monitor.assigned.map((user) => ({
                        value: user._id,
                        label: user.fullname,
                        departmentName: user.department || "Không xác định",
                        title: user.jobTitle || "Không xác định",
                        avatarUrl: user.avatarUrl || "",
                      }))
                    : [],
                }))
              );
              setCurrentPage(response.data.currentPage);
              setTotalPages(response.data.totalPages);
            } catch (error) {
              console.error("Error fetching monitors:", error);
            }
          };

          useEffect(() => {
            fetchMonitors(currentPage);
          }, [currentPage]);
          // Lấy danh sách users
       
          
          const fetchRooms = async () => {
            try {
              const token = localStorage.getItem("authToken");
              const response = await axios.get("/api/rooms", {
                headers: { Authorization: `Bearer ${token}` },
              });
          
              const roomsData = response.data.rooms || [];
              const normalizedRooms = roomsData.map((room) => ({
                value: room._id,
                label: room.name,
                location: Array.isArray(room.location)
                  ? room.location.map((loc) => {
                      if (typeof loc === "string") {
                        const [building, floor] = loc.split(", ");
                        return `Tòa nhà: ${building || "Không xác định"} | Tầng: ${floor || "Không rõ"}`;
                      }
                      return "Không xác định"; // Trả về mặc định nếu loc không hợp lệ
                    })
                  : ["Không xác định"], // Trả về mặc định nếu location không phải mảng
              }));
          
              setRooms(normalizedRooms);
            } catch (error) {
              console.error("Error fetching rooms:", error);
              toast.error("Không thể tải danh sách phòng!");
            }
          };
          // const renderLocation = (locationArray) => {
          //   // Nếu room không tồn tại hoặc locationArray không hợp lệ
          //   if (!locationArray || !Array.isArray(locationArray) || locationArray.length === 0) {
          //     return ""; 
          //   }
          
          //   const locationString = locationArray[0]; 
          //   const [building, floor] = locationString.split(", "); 
          
          //   if (!building && !floor) {
          //     return "";
          //   }
        
          //   return `Tòa nhà: ${building} | Tầng: ${floor}`;
          // };

           // ----------------------------------------------------
            // Gọi API “thu hồi” (POST /monitors/:id/revoke)
            // ----------------------------------------------------
            const handleRevokeMonitor = async (monitorId, reasons) => {
              try {
                const token = localStorage.getItem("authToken");
                const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Lấy thông tin người dùng hiện tại
                const response = await fetch(`/api/monitors/${monitorId}/revoke`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ revokedBy: currentUser?._id || null, reasons }),
                });
            
                if (!response.ok) throw new Error("Không thể thu hồi monitor!");
            
                const updatedMonitor = await response.json();
                await fetchMonitorDetails(monitorId); // Gọi API để đồng bộ lại chi tiết

            
                // Đồng bộ trạng thái với danh sách monitors
                setData((prevData) =>
                  prevData.map((monitor) => (monitor._id === updatedMonitor._id ? updatedMonitor : monitor))
                );
                setSelectedMonitor(updatedMonitor); // Cập nhật monitor đang được chọn
                toast.success("Thu hồi monitor thành công!");
                return updatedMonitor;
              } catch (error) {
                console.error("Error during revoke:", error);
                toast.error("Đã xảy ra lỗi khi thu hồi monitor!");
              }
            };

            // ----------------------------------------------------
            // Gọi API “bàn giao” (POST /monitors/:id/assign)
            // ----------------------------------------------------
            const handleAssignMonitor = async (monitorId, newUserId, notes) => {
              try {
                const token = localStorage.getItem("authToken");
                const currentUser = JSON.parse(localStorage.getItem("currentUser"));
            
                const response = await fetch(`/api/monitors/${monitorId}/assign`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    newUserId,
                    notes,
                    assignedBy: currentUser?._id || null,
                  }),
                });
            
                console.log("Response from API:", response); // Debug toàn bộ response
            
                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(error.message || "API lỗi không xác định.");
                }
            
                const data = await response.json();
                console.log("Parsed data:", data); // Debug dữ liệu đã parse

                if (!data || !data._id) {
                  throw new Error("Dữ liệu trả về từ API không hợp lệ.");
                }
            
                // Cập nhật state
                if (Array.isArray(data)) {
                  setData(
                    data.map((monitor) => ({
                      ...monitor,
                      room: monitor.room
                        ? {
                            ...monitor.room,
                            location: Array.isArray(monitor.room.location)
                              ? monitor.room.location.map((loc) =>
                                  typeof loc === "string"
                                    ? loc
                                    : "Không xác định"
                                )
                              : ["Không xác định"], // Giá trị mặc định nếu `location` không phải mảng
                          }
                        : { name: "Không xác định", location: ["Không xác định"] }, // Nếu `room` null
                    }))
                  );
                }
            
                return data; // Trả về dữ liệu đã cập nhật
              } catch (error) {
                console.error("Error in handleAssignMonitor:", error);
                throw error; // Throw lại lỗi để xử lý ở `MonitorProductCard.jsx`
              }
            };

            const fetchMonitorDetails = async (monitorId) => {
              try {
                const token = localStorage.getItem("authToken");
                const response = await axios.get(`/api/monitors/${monitorId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
            
                // Cập nhật dữ liệu chi tiết
                setSelectedMonitor(response.data);
            
                console.log("Dữ liệu backend", response.data);
              } catch (error) {
                console.error("Error fetching monitor details:", error);
                toast.error("Không thể tải thông tin monitor!");
              }
            };

            const updateMonitorState = (updatedMonitor) => {
              if (!updatedMonitor || !updatedMonitor._id) {
                console.error("updatedMonitor is invalid:", updatedMonitor);
                return;
              }

              setData((prevData) =>
                prevData.map((monitor) =>
                  monitor && monitor._id === updatedMonitor._id ? updatedMonitor : monitor
                )
              );
            };

            const handleUpdateRoom = (updatedMonitor) => {
              // Tìm thông tin phòng chi tiết
              const updatedRoom = rooms.find((room) => room.value === updatedMonitor.room?.value);
            
              const newMonitorData = {
                ...updatedMonitor,
                room: updatedRoom || { value: updatedMonitor.room, label: "Không xác định" },
              };
            
              // Cập nhật danh sách tại bảng
              setData((prevData) =>
                prevData.map((monitor) =>
                  monitor._id === updatedMonitor._id ? newMonitorData : monitor
                )
              );
            
              // Cập nhật monitor đang chọn nếu cần
              if (selectedMonitor && selectedMonitor._id === updatedMonitor._id) {
                setSelectedMonitor(newMonitorData);
              }
            };

            

          const handleClone = async (monitor) => {
            try {
              // Payload giữ nguyên thông tin monitor, chỉ thay đổi serial
              const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Lấy thông tin người dùng hiện tại
              const userId = currentUser ? currentUser._id : null; // Lấy ID người dùng
              const clonedMonitor = {
                ...monitor,
                serial: `${monitor.serial}_copy`,
                assigned: monitor.assigned?.map((user) => user.value),
                room: monitor.room ? monitor.room.value : null,
                userId,
              };
          
              // Gửi yêu cầu POST để tạo monitor mới
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
                toast.success("Nhân bản monitor thành công!", {
                  className: "toast-success",
                });
                fetchMonitors(); // Cập nhật lại danh sách
              }
            } catch (error) {
              console.error("Error cloning monitor:", error);
              toast.error("Không thể nhân bản monitor!", {
                className: "toast-error",
              });
            }
          };

          const handleDelete = async (id) => {
            if (!monitorToDelete) return;

              try {
                await axios.delete(`/api/monitors/${monitorToDelete._id}`, {
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
                console.error("Error deleting monitor:", error);
                toast.error("Có lỗi xảy ra khi xóa monitor!",
                  {
                    className: "toast-error",
                  }
                );
              } finally {
                setShowConfirmModal(false); // Đóng modal
                setMonitorToDelete(null); // Reset monitor cần xóa
              }
          };

          // Xử lý trong handleEdit
              const handleEdit = (item) => {
                setEditingMonitor({
                  ...item,
                  assigned: Array.isArray(item.assigned)
                    ? item.assigned.map((user) => ({
                        value: user.value || user._id,
                        label: user.label || user.fullname,
                      }))
                    : [],
                  room: item.room
                    ? { value: item.room._id, label: item.room.label }
                    : null,
                });
                setShowEditModal(true);
              };

          const confirmDelete = (monitor) => {
            setMonitorToDelete(monitor); // Đặt monitor cần xóa
            setShowConfirmModal(true); // Hiển thị modal xác nhận
          };
          
          const handleAddMonitor = async (e) => {
            e.preventDefault();
          
            try {
              // Kiểm tra dữ liệu nhập
              if (!newMonitor.name || !newMonitor.serial) {
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
                status: newMonitor.status || "Standby",
                type: newMonitor.type || "Monitor",
                specs: {
                  processor: newMonitor.specs?.processor || "",
                  ram: newMonitor.specs?.ram || "",
                  storage: newMonitor.specs?.storage || "",
                  display: newMonitor.specs?.display || "",
                },
                assigned: newMonitor.status === "Active" ? newMonitor.assigned.map((user) => user.value) : [],
                room: newMonitor.status !== "Active" ? newMonitor.room : null,
                reason: newMonitor.status === "Broken" ? newMonitor.reason : null, // Thêm lý do hỏng nếu có
                userId,
                 // Xử lý danh sách người dùng
              };
        
          
              // Gửi dữ liệu lên API
              const response = await axios.post("/api/monitors", payload, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Đảm bảo token được gửi kèm
                },
              });
          
              if (response.status === 201) {
                toast.success("Thêm monitor thành công!",
                  {
                    className: "toast-success",
                    progressClassName: "Toastify__progress-bar",
                  }
                );
                
                // Cập nhật danh sách monitors và đóng modal
                fetchMonitors();
                setShowAddModal(false);
                setNewMonitor({
                  name: "",
                  manufacturer: "",
                  serial: "",
                  releaseYear: "",
                  specs: {
                    processor: "",
                    ram: "",
                    storage: "",
                    display: "",
                  },
                  assigned: [],
                  status: "Standby",
                  room:"",
                  userId,
                });
              }
            } catch (error) {
              console.error("Lỗi khi thêm monitor:", error);
              toast.error("Có lỗi xảy ra khi thêm monitor. Vui lòng thử lại!",
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
                toast.error("Vui lòng chọn một tệp!", {
                    className: "toast-error",
                });
                return;
            }
        
            if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
                toast.error("Định dạng tệp không hợp lệ. Vui lòng chọn tệp Excel!", {
                    className: "toast-error",
                });
                return;
            }
        
            const reader = new FileReader();
        
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
                    console.log("Dữ liệu thô từ Excel:", sheetData);
        
                    // Chuẩn hóa dữ liệu
                    const normalizedData = sheetData
                        .map((row, index) => {
                            // Kiểm tra các trường bắt buộc
                            if (!row["Tên Thiết Bị (name)"] || !row["Serial (serial)"]) {
                                console.warn(`Hàng ${index + 1} bị bỏ qua: thiếu "Tên thiết bị" hoặc "Serial".`);
                                return null; // Bỏ qua nếu thiếu trường bắt buộc
                            }
        
                            // Chuẩn hóa các trường không bắt buộc
                            const specs = {
                                processor: typeof row["Bộ Xử Lý (processor)"] === "string" ? row["Bộ Xử Lý (processor)"].trim() : "",
                                ram: typeof row["RAM (ram)"] === "string" ? row["RAM (ram)"].trim() : "",
                                storage: typeof row["Bộ Nhớ (storage)"] === "string" ? row["Bộ Nhớ (storage)"].trim() : "",
                                display: typeof row["Màn Hình (display)"] === "string" ? row["Màn Hình (display)"].trim() : "",
                            };
        
                            const roomName = typeof row["Tên Phòng (Room Name)"] === "string" ? row["Tên Phòng (Room Name)"].trim() : "";
                            const matchedRoom = roomName
                                ? rooms.find((room) => room.label.toLowerCase() === roomName.toLowerCase())
                                : null;
        
                            if (roomName && !matchedRoom) {
                                console.warn(`Tên phòng "${roomName}" không tồn tại. Trường này sẽ bị bỏ qua.`);
                            }
        
                            const assignedFullnames = row["Người Dùng (assigned)"]
                                ? row["Người Dùng (assigned)"].split(",").map((name) => name.trim())
                                : [];
        
                            const assignedIds = assignedFullnames
                                .map((name) => {
                                    const matchedUser = users.find(
                                        (user) => user.label.trim().toLowerCase() === name.toLowerCase()
                                    );
                                    if (!matchedUser) {
                                        console.warn(`Tên người dùng "${name}" không hợp lệ. Bỏ qua.`);
                                        return null;
                                    }
                                    return matchedUser.value; // ID hợp lệ
                                })
                                .filter((id) => id !== null); // Loại bỏ các giá trị không hợp lệ
        
                            return {
                                name: row["Tên Thiết Bị (name)"].trim(),
                                serial: row["Serial (serial)"] ? String(row["Serial (serial)"]).trim() : "",
                                manufacturer: typeof row["Nhà Sản Xuất (manufacturer)"] === "string" ? row["Nhà Sản Xuất (manufacturer)"].trim() : "",
                                releaseYear: typeof row["Năm đưa vào sử dụng (releaseYear)"] === "string" ? row["Năm đưa vào sử dụng (releaseYear)"].trim() : "",
                                status: typeof row["Trạng Thái (status)"] === "string" ? row["Trạng Thái (status)"].trim() : "Không xác định",
                                specs: specs,
                                assigned: assignedIds,
                                room: matchedRoom?.value || "", // Nếu không hợp lệ hoặc trống, để trống
                            };
                        })
                        .filter((item) => item !== null); // Loại bỏ các dòng không hợp lệ
        
                    console.log("Dữ liệu chuẩn hóa:", normalizedData);
        
                    if (normalizedData.length === 0) {
                        toast.error("File Excel không chứa dữ liệu hợp lệ!", {
                            className: "toast-error",
                        });
                        return;
                    }
        
                    setParsedData(normalizedData);
                    toast.success("File Excel hợp lệ và đã được tải lên!", {
                        className: "toast-success",
                    });
                } catch (error) {
                    console.error("Lỗi khi xử lý tệp Excel:", error);
                    toast.error("Đã xảy ra lỗi khi xử lý tệp. Vui lòng kiểm tra lại!", {
                        className: "toast-error",
                    });
                }
            };
        
            reader.readAsArrayBuffer(file);
        };
          

        const handleConfirmUpload = async () => {
          if (!parsedData || parsedData.length === 0) {
              toast.error("Không có dữ liệu để upload. Vui lòng kiểm tra file Excel!",
                {
                  className: "toast-error",
                  progressClassName: "Toastify__progress-bar",
                }
              );
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
                  toast.success(`${response.data.addedMonitors} monitor(s) đã được thêm thành công!`,
                    {
                      className: "toast-success",
                      progressClassName: "Toastify__progress-bar",
                    }
                  );
                  fetchMonitors();
                  setShowUploadModal(false); 
              }
          } catch (error) {
              console.error("Lỗi khi tải dữ liệu lên:", error);
      
              if (error.response?.status === 400) {
                  const { errors } = error.response.data || {};
                  if (errors && Array.isArray(errors)) {
                      const duplicateSerials = errors
                          .filter((err) => err.message.includes("đã tồn tại"))
                          .map((err) => err.serial);
                      
                      if (duplicateSerials.length > 0) {
                          toast.error(`Các serial bị trùng: ${duplicateSerials.join(", ")}`,
                          {
                            className: "toast-error",
                            progressClassName: "Toastify__progress-bar",
                          });
                      } else {
                          toast.error("File chứa lỗi không xác định.",
                            {
                              className: "toast-error",
                              progressClassName: "Toastify__progress-bar",
                            }
                          );
                      }
                  } else {
                      toast.error("Dữ liệu có lỗi, vui lòng kiểm tra lại.",
                        {
                          className: "toast-error",
                          progressClassName: "Toastify__progress-bar",
                        }
                      );
                  }
              } else {
                  toast.error("Đã xảy ra lỗi không xác định từ server!",
                    {
                      className: "toast-error",
                      progressClassName: "Toastify__progress-bar",
                    }
                  );
              }
          }
      };

      useEffect(() => {
        const fetchData = async () => {
          await fetchMonitors();
          await fetchUsers();
          await fetchRooms();
        };
      
        fetchData();
      }, []);

      useEffect(() => {
        if (selectedMonitor) {
          const updatedMonitor = data.find((monitor) => monitor._id === selectedMonitor._id);
          if (updatedMonitor) setSelectedMonitor(updatedMonitor); // Đồng bộ dữ liệu mới
        }
      }, [data]);

  return (  
    <div className="w-full h-full px-6 pb-6 sm:overflow-x-auto rounded-2xl">
        {/* Header */}
        <div className="flex flex-col justify-between items-start mb-2">
                   {/* Search Input */}
            <div className="flex items-center justify-between w-full mb-4">
    
                <div className="relative w-1/3">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                          type="text"
                          placeholder="Tìm kiếm monitor..."
                          className="pl-10 pr-4 py-2 rounded-md w-100 px-3 "
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
                      });
                          setShowAddModal(true);
                             }}
                className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
                         >
                   Thêm mới
                                        </button>
                                        <button
                                          className="bg-[#FF5733] text-white text-sm font-bold px-3 py-2 rounded-lg shadow-2xl hover:bg-[#cc4529]transform transition-transform duration-300 hover:scale-105 "
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
                                ? "Trạng thái: Tất cả trạng thái"
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
                                { value: "PendingDocumentation", label: "Đã bàn giao - Chưa có biên bản" },

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
                                  ? "Phòng ban: Tất cả phòng ban"
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
                                      ? "Nhà sản xuất: Tất cả nhà sản xuất"
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
                                      ? "Năm sản xuất: Tất cả năm sản xuất"
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
                        <p className="text-sm font-bold text-gray-500">NƠI SỬ DỤNG
                        </p>
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
                              {user.departmentName ? user.departmentName : "Không xác định"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div>
                          <p className="font-bold">Chưa bàn giao</p>
                        </div>
                      )}
                    </td>
                    <td className="min-w-[150px] border-white/0 py-3 pr-4 text-sm font-bold text-navy-700">
                    {item.room ? (
                      <div>
                        <p className="font-bold">{item.room.label}</p>
                        {Array.isArray(item.room.location) && item.room.location.length > 0 ? (
                          item.room.location.map((loc, idx) => {
                            if (typeof loc === "string" && loc.includes(", tầng ")) {
                              const [building, floor] = loc.split(", tầng ");
                              return (
                                <p key={idx} className="italic text-gray-400">
                                  Tòa nhà: {building.trim() || "Không xác định"} | Tầng: {floor.trim() || "Không rõ"}
                                </p>
                              );
                            }
                            return (
                          "");
                          })
                        ) : (
                          <p className="italic text-gray-400">Không xác định</p>
                        )}
                      </div>
                    ) : (
                      <p className="font-bold">Không xác định</p>
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
                      ) : item.status === "PendingDocumentation" ? (
                        <MdOutlineError className="text-[#FFC107] me-1" />
                      ) : null}
                      <p className="text-sm font-bold text-navy-700">
                        {statusLabels[item.status] || "Không xác định"}
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
    {/* Phân trang */}
    <div className="flex justify-end items-center mt-4">
      <button
        disabled={currentPage === 1}
        onClick={() => {
          const newPage = currentPage - 1;
          fetchMonitors(newPage);
        }}
        className="px-3 py-1 bg-[#FF5733] text-white text-sm  font-bold rounded-lg hover:bg-[#ff6b4a] disabled:bg-[#002147] disabled:cursor-not-allowed"
      >
        Trước
      </button>
      <span className="mx-4 text-xs font-bold">
        {currentPage} / {totalPages}
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => {
          const newPage = currentPage + 1;
          fetchMonitors(newPage);
        }}
        className="px-3 py-1 bg-[#FF5733] text-white text-sm  font-bold rounded-lg hover:bg-[#ff6b4a] disabled:bg-[#002147] disabled:cursor-not-allowed"
      >
        Sau
      </button>
    </div>
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
                  <h3 className="text-2xl font-bold mb-6 text-[#002147]">Thêm mới monitor</h3>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Processor</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập bộ xử lý"
                            value={newMonitor.specs?.processor || ""}
                            onChange={(e) =>
                              setNewMonitor({ ...newMonitor, specs: { ...newMonitor.specs, processor: e.target.value } })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">RAM</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập dung lượng RAM"
                            value={newMonitor.specs?.ram || ""}
                            onChange={(e) =>
                              setNewMonitor({ ...newMonitor, specs: { ...newMonitor.specs, ram: e.target.value } })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Bộ Nhớ</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập dung lượng Bộ nhớ"
                            value={newMonitor.specs?.storage || ""}
                            onChange={(e) =>
                              setNewMonitor({ ...newMonitor, specs: { ...newMonitor.specs, storage: e.target.value } })
                            }
                          />
                        </div>
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
                        type: editingMonitor.type || "Monitor",
                        reason: editingMonitor.reason || "",
                        specs: {
                          processor: editingMonitor.specs?.processor || "",
                          ram: editingMonitor.specs?.ram || "",
                          storage: editingMonitor.specs?.storage || "",
                          display: editingMonitor.specs?.display || "",
                        },
                        assigned: Array.isArray(editingMonitor.assigned)
                          ? editingMonitor.assigned
                              .filter((user) => user.value) // Lọc bỏ user không có ID
                              .map((user) => user.value) // Chỉ lấy ID
                          : [],
                        room: editingMonitor.room?.value || null, // Chỉ lấy ID phòng
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
                      fetchMonitors(); // Làm mới danh sách sau khi lưu
                      toast.success("Cập nhật monitor thành công!");
                    } catch (error) {
                      console.error("Error updating monitor:", error);
                      toast.error("Không thể cập nhật monitor!");
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Processor</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập bộ xử lý"
                          value={editingMonitor.specs?.processor || ""}
                          onChange={(e) =>
                            setEditingMonitor({ ...editingMonitor, specs: { ...editingMonitor.specs, processor: e.target.value } })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">RAM</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập dung lượng RAM"
                          value={editingMonitor.specs?.ram || ""}
                          onChange={(e) =>
                            setEditingMonitor({ ...editingMonitor, specs: { ...editingMonitor.specs, ram: e.target.value } })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Bộ Nhớ</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập dung lượng bộ nhớ"
                          value={editingMonitor.specs?.storage || ""}
                          onChange={(e) =>
                            setEditingMonitor({ ...editingMonitor, specs: { ...editingMonitor.specs, storage: e.target.value } })
                          }
                        />
                      </div>
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
                  </div>

                  {/* Trạng thái */}
                    <div
                      className="border rounded-lg p-4 mb-4 relative justify-between"
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
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div>
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
                        
                        {/* Ô người sử dụng khi trạng thái là "Đang sử dụng" */}
                        {editingMonitor.status === "Active" && (
                          <div>
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
                              </ul>
                            )}
                             </div>
                            )}

                            {/* Ô lý do hỏng khi trạng thái là "Hỏng" */}
                            {editingMonitor.status === "Broken" && (
                                <div>
                                  <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                                    placeholder="Nhập lý do hỏng"
                                    value={editingMonitor.reason || ""}
                                    onChange={(e) =>
                                      setEditingMonitor({ ...editingMonitor, reason: e.target.value })
                                    }
                                  />
                                </div>
                              )}
                          </div>
                       <div>   
                        {/* <div>
                          <label className="block mt-3 text-gray-600 font-medium mb-2">Nơi sử dụng</label>
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
                                      room,
                                    });
                                    setShowRoomSuggestions(false);
                                  }}
                                >
                                  <span className="font-bold">{room.label}</span>
                                  <br />
                                  <span className="italic text-gray-500">{room.location}</span>
                                </li>
                              ))}
                            </ul>
                            )}
                        </div> */}
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
                Bạn có chắc chắn muốn xóa monitor <strong>{monitorToDelete?.name}</strong> không?
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
      {/* {-----------------------------------------/* Modal click thiết bị /-----------------------------------------} */}
      {showDetailModal && selectedMonitor && ReactDOM.createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          style={{ zIndex: 1050 }}
          onClick={(e) => {
            // Đóng modal nếu người dùng nhấp ra ngoài modal
            if (e.target === e.currentTarget) {
              setSelectedMonitor(null);
            }
          }}
          >
            <div className="  w-4/5 max-w-7xl rounded-lg shadow-lg relative overflow-y-auto max-h-[90vh]"
            style={{ zIndex: 1990 }}
            onClick={(e) => e.stopPropagation()}>
              <MonitorProductCard
                  key={refreshKey} // Force re-render khi refreshKey thay đổi
                  monitorData={{
                    ...selectedMonitor,
                    releaseYear: selectedMonitor.releaseYear || "Không có",
                  }}
                  setSelectedMonitor={setSelectedMonitor}
                  onUpdateSpecs={handleUpdateSpecs} // Bổ sung prop này
                  onCloseModal={() => {
                    setSelectedMonitor(null); // Reset monitor đã chọn
                    setShowDetailModal(false); // Đóng modal
                    fetchMonitors(); // refresh sau khi thao tác
                  }} // Truyền hàm đóng modal
                  // Truyền vào 2 hàm thu hồi / bàn giao
                  onRevoke={handleRevokeMonitor}
                  onAssign={handleAssignMonitor}
                  fetchMonitorDetails={fetchMonitorDetails} 
                  onUpdateMonitor={updateMonitorState}
                  onUpdateRoom={handleUpdateRoom}
                  refetchMonitors={fetchMonitors}
                />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MonitorTable;
