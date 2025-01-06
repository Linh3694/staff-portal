import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiCopy } from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import ToolProductCard from "./productcard/toolProductCard";
import * as XLSX from "xlsx";
import ReactDOM from "react-dom";
import "../css/table.css"
import { MdCancel, MdCheckCircle, MdOutlineError } from "react-icons/md";
import Dropdown from "./function/dropdown";



const ToolTable = () => {
        
        const [data, setData] = useState([]); // State cho danh sách tools
        const [users, setUsers] = useState([]); // Lưu danh sách users từ API
        const [showAddModal, setShowAddModal] = useState(false); // State để điều khiển modal 
        const [newTool, setNewTool] = useState({
            name: "",
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
        const [editingTool, setEditingTool] = useState({
            name: "",
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
        const [toolToDelete, setToolToDelete] = useState(null);
        const [selectedTool, setSelectedTool] = useState(null);
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
        const [originalData, setOriginalData] = useState([]); 
        const [filteredData, setFilteredData] = useState([]);
        const [searchTerm, setSearchTerm] = useState("");
        const [suggestions, setSuggestions] = useState([]); // Lưu danh sách gợi ý 

        
        const statusLabels = {
          Active: "Đang sử dụng",
          Standby: "Chờ Cấp Phát",
          Broken: "Hỏng",
          PendingDocumentation: "Đã bàn giao - Chưa có biên bản", // Thêm trạng thái mới
        };

        const handleUpdateSpecs = (toolId, updatedSpecs) => {
          const token = localStorage.getItem("authToken");
          return axios
            .put(`/api/tools/${toolId}/specs`, updatedSpecs, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            })
            .then((response) => {
              // Dữ liệu tool đã được cập nhật
              const updatedTool = response.data; 
              // Cập nhật state cục bộ (nếu đang giữ selectedTool)
              if (selectedTool && selectedTool._id === updatedTool._id) {
                setSelectedTool(updatedTool);
              }
              return updatedTool; 
            })
            .catch((error) => {
              console.error("Lỗi cập nhật specs:", error);
              throw error;
            });
        };

                
          const handleViewDetails = (tool) => {
            setSelectedTool(tool); // Chỉ truyền dữ liệu xuống ToolProductCard
            setRefreshKey((prevKey) => prevKey + 1); // Tăng giá trị để ép render
            setShowDetailModal(true);
          };

          const handleRefreshData = async () => {
            await fetchTools(); // Làm mới danh sách nếu cần
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

          // Hàm gọi API để lấy danh sách tools
          const fetchTools = async () => {
            try {
              const token = localStorage.getItem("authToken");
              const response = await axios.get("/api/tools", {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              // response.data.populatedTools là TẤT CẢ tools
              const rawList = response.data.populatedTools;
              
              // Nếu cần map room, assigned:
              const tools = rawList.map((tool) => ({
                ...tool,
                room: tool.room
                  ? {
                      label: tool.room.name,
                      value: tool.room._id,
                      location: tool.room.location || ["Không xác định"],
                    }
                  : { label: "Không xác định", location: ["Không xác định"] },
                assigned: tool.assigned.map((user) => ({
                  value: user._id,
                  label: user.fullname,
                  departmentName: user.department,
                })),
              }));
          
              // Bỏ setData(...) ban đầu. Thay vào:
              setOriginalData(tools);       // Lưu tất cả tools
              setFilteredData(tools);       // Mặc định chưa filter thì = tất cả
              setTotalPages(Math.ceil(tools.length / 30));
              setCurrentPage(1);
              // Hiển thị trước 30 items
              setData(tools.slice(0, 30));
          
              console.log("Fetched total tools:", tools.length);
            } catch (error) {
              console.error("Error fetching tools:", error);
            }
          };

          useEffect(() => {
            fetchTools();
          }, []);

          const applyFilters = (filters = {}) => {

            let filtered = [...originalData];  
        
            // Lọc theo trạng thái
            if (filters.status && filters.status !== "Tất cả") {
                filtered = filtered.filter((item) => item.status === filters.status);
            }
        
            // Lọc theo loại
            if (filters.type && filters.type !== "Tất cả") {
                filtered = filtered.filter((item) => item.type === filters.type);
            }
        
            // Lọc theo nhà sản xuất
            if (filters.manufacturer && filters.manufacturer !== "Tất cả") {
                filtered = filtered.filter((item) => item.manufacturer === filters.manufacturer);
            }
        
            // Lọc theo năm sản xuất
            if (filters.releaseYear && filters.releaseYear !== "Tất cả") {
                filtered = filtered.filter((item) => item.releaseYear === filters.releaseYear);
            }
        
            // Lọc theo phòng ban
            if (filters.department && filters.department !== "Tất cả") {
                filtered = filtered.filter((item) =>
                    item.assigned.some((user) => user.departmentName === filters.department)
                );
            }
            console.log("Dữ liệu sau khi lọc:", filtered);
  
            // Cập nhật dữ liệu state
            setFilteredData(filtered);
  
            const newTotalPages = Math.ceil(filtered.length / 30);
            setTotalPages(newTotalPages);
            setCurrentPage(1);
            setData(filtered.slice(0, 30)); // Hiển thị trang đầu (chỉ 30 items)
          };

          const handlePageChange = (newPage) => {
            if (newPage < 1 || newPage > totalPages) return;
            setCurrentPage(newPage);
            
            const startIndex = (newPage - 1) * 30;
            setData(filteredData.slice(startIndex, startIndex + 30));
          };

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
         
            const handleRevokeTool = async (toolId, reasons) => {
              try {
                const token = localStorage.getItem("authToken");
                const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Lấy thông tin người dùng hiện tại
                const response = await fetch(`/api/tools/${toolId}/revoke`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ revokedBy: currentUser?._id || null, reasons }),
                });
            
                if (!response.ok) throw new Error("Không thể thu hồi tool!");
            
                const updatedTool = await response.json();
                await fetchToolDetails(toolId); // Gọi API để đồng bộ lại chi tiết

            
                // Đồng bộ trạng thái với danh sách tools
                setData((prevData) =>
                  prevData.map((tool) => (tool._id === updatedTool._id ? updatedTool : tool))
                );
                setSelectedTool(updatedTool); // Cập nhật tool đang được chọn
                toast.success("Thu hồi tool thành công!");
                return updatedTool;
              } catch (error) {
                console.error("Error during revoke:", error);
                toast.error("Đã xảy ra lỗi khi thu hồi tool!");
              }
            };

            // ----------------------------------------------------
            // Gọi API “bàn giao” (POST /tools/:id/assign)
            // ----------------------------------------------------
            const handleAssignTool = async (toolId, newUserId, notes) => {
              try {
                const token = localStorage.getItem("authToken");
                const currentUser = JSON.parse(localStorage.getItem("currentUser"));
            
                const response = await fetch(`/api/tools/${toolId}/assign`, {
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
                    data.map((tool) => ({
                      ...tool,
                      room: tool.room
                        ? {
                            ...tool.room,
                            location: Array.isArray(tool.room.location)
                              ? tool.room.location.map((loc) =>
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
                console.error("Error in handleAssignTool:", error);
                throw error; // Throw lại lỗi để xử lý ở `ToolProductCard.jsx`
              }
            };

            const fetchToolDetails = async (toolId) => {
              try {
                const token = localStorage.getItem("authToken");
                const response = await axios.get(`/api/tools/${toolId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
            
                // Cập nhật dữ liệu chi tiết
                setSelectedTool(response.data);
            
                console.log("Dữ liệu backend", response.data);
              } catch (error) {
                console.error("Error fetching tool details:", error);
                toast.error("Không thể tải thông tin tool!");
              }
            };

            const updateToolState = (updatedTool) => {
              if (!updatedTool || !updatedTool._id) {
                console.error("updatedTool is invalid:", updatedTool);
                return;
              }

              setData((prevData) =>
                prevData.map((tool) =>
                  tool && tool._id === updatedTool._id ? updatedTool : tool
                )
              );
            };

            const handleUpdateRoom = (updatedTool) => {
              // Tìm thông tin phòng chi tiết
              const updatedRoom = rooms.find((room) => room.value === updatedTool.room?.value);
            
              const newToolData = {
                ...updatedTool,
                room: updatedRoom || { value: updatedTool.room, label: "Không xác định" },
              };
            
              // Cập nhật danh sách tại bảng
              setData((prevData) =>
                prevData.map((tool) =>
                  tool._id === updatedTool._id ? newToolData : tool
                )
              );
            
              // Cập nhật tool đang chọn nếu cần
              if (selectedTool && selectedTool._id === updatedTool._id) {
                setSelectedTool(newToolData);
              }
            };

            

          const handleClone = async (tool) => {
            try {
              // Payload giữ nguyên thông tin tool, chỉ thay đổi serial
              const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Lấy thông tin người dùng hiện tại
              const userId = currentUser ? currentUser._id : null; // Lấy ID người dùng
              const clonedTool = {
                ...tool,
                serial: `${tool.serial}_copy`,
                assigned: tool.assigned?.map((user) => user.value),
                room: tool.room ? tool.room.value : null,
                userId,
              };
          
              // Gửi yêu cầu POST để tạo tool mới
              const response = await axios.post(
                "/api/tools",
                clonedTool,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                  },
                }
              );
          
              if (response.status === 201) {
                const newClonedTool = response.data;

                setOriginalData((prevData) => [newClonedTool, ...prevData]);
                setFilteredData((prevData) => [newClonedTool, ...prevData]);
                setData((prevData) => [newClonedTool, ...prevData.slice(0, 29)]); // Hiển thị Tool clone ở đầu
                setTotalPages(Math.ceil((filteredData.length + 1) / 30));
                setCurrentPage(1);
                fetchTools(); // Cập nhật lại danh sách
                toast.success("Nhân bản tool thành công!", {
                  className: "toast-success",
                });
                fetchTools(); // Cập nhật lại danh sách
              }
            } catch (error) {
              console.error("Error cloning tool:", error);
              toast.error("Không thể nhân bản tool!", {
                className: "toast-error",
              });
            }
          };

          const handleDelete = async (id) => {
            if (!toolToDelete) return;

              try {
                await axios.delete(`/api/tools/${toolToDelete._id}`, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Thêm token ở đây
                  },
                }
                );
                fetchTools(); // Cập nhật lại danh sách sau khi xóa
                toast.success("Tool đã được xóa!",
                  {
                    className: "toast-success",
                  }
                );
              } catch (error) {
                console.error("Error deleting tool:", error);
                toast.error("Có lỗi xảy ra khi xóa tool!",
                  {
                    className: "toast-error",
                  }
                );
              } finally {
                setShowConfirmModal(false); // Đóng modal
                setToolToDelete(null); // Reset tool cần xóa
              }
          };

          // Xử lý trong handleEdit
              const handleEdit = (item) => {
                setEditingTool({
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

          const confirmDelete = (tool) => {
            setToolToDelete(tool); // Đặt tool cần xóa
            setShowConfirmModal(true); // Hiển thị modal xác nhận
          };
          
          const handleAddTool = async (e) => {
            e.preventDefault();
          
            try {
              // Kiểm tra dữ liệu nhập
              if (!newTool.name || !newTool.serial) {
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
                ...newTool,
                releaseYear: newTool.releaseYear || "",
                status: newTool.status || "Standby",
                specs: {
                  processor: newTool.specs?.processor || "",
                  ram: newTool.specs?.ram || "",
                  storage: newTool.specs?.storage || "",
                  display: newTool.specs?.display || "",
                },
                assigned: newTool.status === "Active" ? newTool.assigned.map((user) => user.value) : [],
                room: newTool.status !== "Active" ? newTool.room : null,
                reason: newTool.status === "Broken" ? newTool.reason : null, // Thêm lý do hỏng nếu có
                userId,
                 // Xử lý danh sách người dùng
              };
              console.log("Payload gửi lên:", payload);
        
          
              // Gửi dữ liệu lên API
              const response = await axios.post("/api/tools", payload, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Đảm bảo token được gửi kèm
                },
              });
          
              if (response.status === 201) {
                setOriginalData((prevData) => [newTool, ...prevData]);
                setFilteredData((prevData) => [newTool, ...prevData]);
                setData((prevData) => [newTool, ...prevData.slice(0, 29)]); // Hiển thị Tool mới ở đầu
                setTotalPages(Math.ceil((filteredData.length + 1) / 30));
                setCurrentPage(1);
                toast.success("Thêm tool thành công!",
                  {
                    className: "toast-success",
                    progressClassName: "Toastify__progress-bar",
                  }
                );
                
                // Cập nhật danh sách tools và đóng modal
                fetchTools();
                setShowAddModal(false);
                setNewTool({
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
              console.error("Lỗi khi thêm tool:", error);
              toast.error("Có lỗi xảy ra khi thêm tool. Vui lòng thử lại!",
                {
                  className: "toast-error",
                  progressClassName: "Toastify__progress-bar",
                }
              );
            }
          };
          
          const handleSearchChange = (e) => {
            const query = e.target.value.toLowerCase();
            setSearchTerm(query);
          
            if (!query) {
              // Người dùng xóa hết => Hiển thị all
              setFilteredData(originalData);
              setTotalPages(Math.ceil(originalData.length / 30));
              setData(originalData.slice(0, 30));
              setCurrentPage(1);
              setSuggestions([]); // Xóa gợi ý
              return;
            }
          
            // Nếu có từ khóa, lọc
            const filtered = originalData.filter((item) => {
              // Gom nhiều trường để kiểm tra (name, manufacturer, serial, assigned user, room...)
              const assignedNames = Array.isArray(item.assigned)
                ? item.assigned.map((u) => `${u.label} ${u.departmentName}`).join(" ")
                : "";
              const roomInfo = item.room
                ? `${item.room.label} ${(item.room.location || []).join(" ")}`
                : "";
          
              const combinedText = [
                item.name,
                item.manufacturer,
                item.serial,
                assignedNames,
                roomInfo,
              ]
                .join(" ")
                .toLowerCase();
          
              return combinedText.includes(query);
            });
          
            // Cập nhật filteredData
            setFilteredData(filtered);
            setTotalPages(Math.ceil(filtered.length / 30));
            setData(filtered.slice(0, 30));
            setCurrentPage(1);
          
            // Sinh mảng suggestions (10 item gợi ý đầu tiên)
            setSuggestions(filtered.slice(0, 10));
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
                  "/api/tools/bulk-upload",
                  { tools: parsedData },
                  {
                      headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                      },
                  }
              );
      
              if (response.status === 201) {
                  toast.success(`${response.data.addedTools} tool(s) đã được thêm thành công!`,
                    {
                      className: "toast-success",
                      progressClassName: "Toastify__progress-bar",
                    }
                  );
                  fetchTools();
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
          await fetchTools();
          await fetchUsers();
          await fetchRooms();
        };
      
        fetchData();
      }, []);

      // useEffect #2: Mỗi khi originalData thay đổi, tự cập nhật filteredData, totalPages, data trang đầu
      useEffect(() => {
        if (originalData.length > 0) {
          setFilteredData(originalData);
          setTotalPages(Math.ceil(originalData.length / 30));
          setData(originalData.slice(0, 30)); // Chỉ hiển thị 30 items đầu tiên
          setCurrentPage(1);                 // Reset về trang 1
        }
        console.log("Original Data updated:", originalData);
      }, [originalData]);
    
    // useEffect #3: Mỗi khi filteredData hoặc currentPage thay đổi => cắt 30 records hiển thị
      useEffect(() => {
        const startIndex = (currentPage - 1) * 30;
        const paginatedData = filteredData.slice(startIndex, startIndex + 30);
        setData(paginatedData);
        console.log("Filtered Data updated:", filteredData);
      }, [filteredData, currentPage]);;

      // useEffect #4: Nếu đang mở detail (selectedTool), thì tìm Tool mới nhất trong data
      useEffect(() => {
        if (selectedTool) {
          const updatedTool = data.find(
            (tool) => tool._id === selectedTool._id
          );
          if (updatedTool) setSelectedTool(updatedTool);
        }
      }, [data]);
      // useEffect #5: Log ra Original / Filtered / Displayed data (nếu muốn debug)
      useEffect(() => {
        console.log("Original Data:", originalData);
        console.log("Filtered Data:", filteredData);
        console.log("Displayed Data:", data);
      }, [originalData, filteredData, data]);

      

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
                  placeholder="Tìm kiếm dụng cụ..."
                  className="pl-10 pr-4 py-2 rounded-md w-100 px-3"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  // Thêm onFocus để hiện gợi ý khi focus (nếu muốn)
                  onFocus={() => {
                    if (searchTerm && suggestions.length > 0) {
                      setSuggestions(suggestions); 
                    }
                  }}
                />

                {/* Hiển thị suggestions (nếu có) */}
              </div>
                  <div className="flex space-x-2">
                        <button
                            onClick={() => {
                            setNewTool({
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
                                  applyFilters({ status: "Tất cả" });
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
                                    applyFilters({ status: option.value });
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
                                {selectedType === "Tất cả" ? "Loại: Tất cả" : `Loại: ${selectedType}`}
                              </button>
                            }
                            children={
                              <div className="flex flex-col gap-2 mt-10 bg-white rounded-lg shadow-lg p-4">
                                <button
                                  key="all"
                                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                  onClick={() => {
                                    setSelectedType("Tất cả");
                                    applyFilters({ type: "Tất cả" });
                                  }}
                                >
                                  Tất cả
                                </button>
                                {Array.from(new Set(originalData.map((item) => item.type))).map((type) => (
                                  <button
                                    key={type}
                                    className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                    onClick={() => {
                                      setSelectedType(type);
                                      applyFilters({ type });
                                    }}
                                  >
                                    {type}
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
                                        applyFilters({ manufacturer: "Tất cả" });
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
                                            applyFilters({ manufacturer });
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
                                        applyFilters({ releaseYear: "Tất cả" });
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
                                            applyFilters({ releaseYear: year });
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
        onClick={() => handlePageChange(currentPage - 1)}
        className="px-3 py-1 bg-[#FF5733] text-white text-sm  font-bold rounded-lg hover:bg-[#ff6b4a] disabled:bg-[#002147] disabled:cursor-not-allowed"
      >
        Trước
      </button>
      <span className="mx-4 text-xs font-bold">
        {currentPage} / {totalPages}
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
        className="px-3 py-1 bg-[#FF5733] text-white text-sm font-bold rounded-lg hover:bg-[#ff6b4a] disabled:bg-[#002147] disabled:cursor-not-allowed"
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
                  <h3 className="text-2xl font-bold mb-6 text-[#002147]">Thêm mới tool</h3>
                  <form onSubmit={handleAddTool}>
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
                            value={newTool.name}
                            onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Nhà sản xuất</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập nhà sản xuất"
                            value={newTool.manufacturer}
                            onChange={(e) => setNewTool({ ...newTool, manufacturer: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Serial</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập số serial"
                            value={newTool.serial}
                            onChange={(e) => setNewTool({ ...newTool, serial: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Năm sản xuất</label>
                          <input
                            type="number"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập năm sản xuất"
                            value={newTool.releaseYear}
                            onChange={(e) => setNewTool({ ...newTool, releaseYear: e.target.value })}
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
                      href="/tool-sample-upload.xlsx"
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
                <h3 className="text-2xl font-semibold mb-8 text-[#002147]">Cập nhật thông tin Tool</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const payload = {
                        ...editingTool,
                        releaseYear: editingTool.releaseYear || "",
                        reason: editingTool.reason || "",
                        specs: {
                          processor: editingTool.specs?.processor || "",
                          ram: editingTool.specs?.ram || "",
                          storage: editingTool.specs?.storage || "",
                          display: editingTool.specs?.display || "",
                        },
                        assigned: Array.isArray(editingTool.assigned)
                          ? editingTool.assigned
                              .filter((user) => user.value) // Lọc bỏ user không có ID
                              .map((user) => user.value) // Chỉ lấy ID
                          : [],
                        room: editingTool.room?.value || null, // Chỉ lấy ID phòng
                      };
                  
                      console.log("Payload gửi lên server:", payload);
                  
                      await axios.put(
                        `/api/tools/${editingTool._id}`,
                        payload,
                        {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                          },
                        }
                      );
                      setShowEditModal(false);
                      fetchTools(); // Làm mới danh sách sau khi lưu
                      toast.success("Cập nhật tool thành công!");
                    } catch (error) {
                      console.error("Error updating tool:", error);
                      toast.error("Không thể cập nhật tool!");
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
                          value={editingTool.name}
                          onChange={(e) => setEditingTool({ ...editingTool, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Nhà sản xuất</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập nhà sản xuất"
                          value={editingTool.manufacturer}
                          onChange={(e) => setEditingTool({ ...editingTool, manufacturer: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Serial</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập số serial"
                          value={editingTool.serial}
                          onChange={(e) => setEditingTool({ ...editingTool, serial: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Năm sản xuất</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập năm sản xuất"
                          value={editingTool.releaseYear}
                          onChange={(e) => setEditingTool({ ...editingTool, releaseYear: e.target.value })}
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
                          value={editingTool.specs?.processor || ""}
                          onChange={(e) =>
                            setEditingTool({ ...editingTool, specs: { ...editingTool.specs, processor: e.target.value } })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">RAM</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập dung lượng RAM"
                          value={editingTool.specs?.ram || ""}
                          onChange={(e) =>
                            setEditingTool({ ...editingTool, specs: { ...editingTool.specs, ram: e.target.value } })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Bộ Nhớ</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập dung lượng bộ nhớ"
                          value={editingTool.specs?.storage || ""}
                          onChange={(e) =>
                            setEditingTool({ ...editingTool, specs: { ...editingTool.specs, storage: e.target.value } })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Màn hình</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập kích thước màn hình"
                          value={editingTool.specs?.display || ""}
                          onChange={(e) =>
                            setEditingTool({ ...editingTool, specs: { ...editingTool.specs, display: e.target.value } })
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
                            value={editingTool.status}
                            onChange={(e) => setEditingTool({ ...editingTool, status: e.target.value })}
                          >
                            <option value="Active">Đang sử dụng</option>
                            <option value="Standby">Chờ Cấp Phát</option>
                            <option value="Broken">Hỏng</option>
                          </select>
                         </div>
                        
                        {/* Ô người sử dụng khi trạng thái là "Đang sử dụng" */}
                        {editingTool.status === "Active" && (
                          <div>
                            <input
                              type="text"
                              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                              placeholder="Nhập tên người sử dụng"
                              value={editingTool.assigned[0]?.label || ""}
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
                                setEditingTool({
                                  ...editingTool,
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
                                      setEditingTool({ ...editingTool, assigned: [user] });
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
                            {editingTool.status === "Broken" && (
                                <div>
                                  <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                                    placeholder="Nhập lý do hỏng"
                                    value={editingTool.reason || ""}
                                    onChange={(e) =>
                                      setEditingTool({ ...editingTool, reason: e.target.value })
                                    }
                                  />
                                </div>
                              )}
                          </div>
                       <div>   
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
                Bạn có chắc chắn muốn xóa tool <strong>{toolToDelete?.name}</strong> không?
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
      {showDetailModal && selectedTool && ReactDOM.createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          style={{ zIndex: 1050 }}
          onClick={(e) => {
            // Đóng modal nếu người dùng nhấp ra ngoài modal
            if (e.target === e.currentTarget) {
              setSelectedTool(null);
            }
          }}
          >
            <div className="  w-4/5 max-w-7xl rounded-lg shadow-lg relative overflow-y-auto max-h-[90vh]"
            style={{ zIndex: 1990 }}
            onClick={(e) => e.stopPropagation()}>
              <ToolProductCard
                  key={refreshKey} // Force re-render khi refreshKey thay đổi
                  toolData={{
                    ...selectedTool,
                    releaseYear: selectedTool.releaseYear || "Không có",
                  }}
                  setSelectedTool={setSelectedTool}
                  onUpdateSpecs={handleUpdateSpecs} // Bổ sung prop này
                  onCloseModal={() => {
                    setSelectedTool(null); // Reset tool đã chọn
                    setShowDetailModal(false); // Đóng modal
                    fetchTools(); // refresh sau khi thao tác
                  }} // Truyền hàm đóng modal
                  // Truyền vào 2 hàm thu hồi / bàn giao
                  onRevoke={handleRevokeTool}
                  onAssign={handleAssignTool}
                  fetchToolDetails={fetchToolDetails} 
                  onUpdateTool={updateToolState}
                  onUpdateRoom={handleUpdateRoom}
                  refetchTools={fetchTools}
                />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ToolTable;
