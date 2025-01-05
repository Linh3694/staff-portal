import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiCopy } from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import PrinterProductCard from "./productcard/printerProductCard";
import * as XLSX from "xlsx";
import ReactDOM from "react-dom";
import "../css/table.css"
import { MdCancel, MdCheckCircle, MdOutlineError } from "react-icons/md";
import Dropdown from "./function/dropdown";



const PrinterTable = () => {
        
        const [data, setData] = useState([]); // State cho danh sách printers
        const [users, setUsers] = useState([]); // Lưu danh sách users từ API
        const [showAddModal, setShowAddModal] = useState(false); // State để điều khiển modal 
        const [newPrinter, setNewPrinter] = useState({
            name: "",
            type: "Máy in Màu",
            manufacturer: "",
            serial: "",
            assigned: [],
            room: "",
            status: "Standby",
            reason: "",
            releaseYear: "",
            specs: {
              ip: "",
              ram: "",
              storage: "",
              display: "",
          },
          }); 
        const [editingPrinter, setEditingPrinter] = useState({
            name: "",
            type: "Máy in Màu",
            manufacturer: "",
            serial: "",
            assigned: [],
            room: "",
            status: "Active",
            reason: "",
            releaseYear: "",
            specs: {
              ip: "",
              ram: "",
              storage: "",
              display: "",
          },
          });
        const [showEditModal, setShowEditModal] = useState(false);
        const [filteredUsers, setFilteredUsers] = useState([]); // Lưu danh sách gợi ý tạm thời
        const [showSuggestions, setShowSuggestions] = useState(false); // Kiểm soát hiển thị gợi ý
        const [showConfirmModal, setShowConfirmModal] = useState(false);
        const [printerToDelete, setPrinterToDelete] = useState(null);
        const [selectedPrinter, setSelectedPrinter] = useState(null);
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

        const handleUpdateSpecs = (printerId, updatedSpecs) => {
          console.log("Dữ liệu cập nhật specs:", updatedSpecs);
          const token = localStorage.getItem("authToken");
          return axios
            .put(`/api/printers/${printerId}/specs`, updatedSpecs, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            })
            .then((response) => {
              // Dữ liệu printer đã được cập nhật
              const updatedPrinter = response.data; 
              // Cập nhật state cục bộ (nếu đang giữ selectedPrinter)
              if (selectedPrinter && selectedPrinter._id === updatedPrinter._id) {
                setSelectedPrinter(updatedPrinter);
              }
              return updatedPrinter; 
            })
            .catch((error) => {
              console.error("Lỗi cập nhật specs:", error);
              throw error;
            });
        };

                
          const handleViewDetails = (printer) => {
            setSelectedPrinter(printer); // Chỉ truyền dữ liệu xuống PrinterProductCard
            setRefreshKey((prevKey) => prevKey + 1); // Tăng giá trị để ép render
            setShowDetailModal(true);
          };

          const handleRefreshData = async () => {
            await fetchPrinters(); // Làm mới danh sách nếu cần
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

          // Hàm gọi API để lấy danh sách printers
          const fetchPrinters = async (page = 1) => {
            try {
              const token = localStorage.getItem("authToken");
              const response = await axios.get(`/api/printers?page=${page}&limit=30`, {
                headers: { Authorization: `Bearer ${token}` },
              });
          
              // Ghi log để kiểm tra dữ liệu trả về
              console.log("Dữ liệu API printers:", response.data);
          
              // Cập nhật state
              setData(
                response.data.populatedPrinters.map((printer) => ({
                  ...printer,
                  room: printer.room
                    ? {
                        label: printer.room.name,
                        value: printer.room._id,
                        location: printer.room.location || ["Không xác định"],
                        status: printer.room.status,
                      }
                    : { label: "Không xác định", location: ["Không xác định"] },
                  assigned: Array.isArray(printer.assigned)
                    ? printer.assigned.map((user) => ({
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
              console.error("Error fetching printers:", error);
            }
          };

          useEffect(() => {
            fetchPrinters(currentPage);
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
            // Gọi API “thu hồi” (POST /printers/:id/revoke)
            // ----------------------------------------------------
            const handleRevokePrinter = async (printerId, reasons) => {
              try {
                const token = localStorage.getItem("authToken");
                const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Lấy thông tin người dùng hiện tại
                const response = await fetch(`/api/printers/${printerId}/revoke`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ revokedBy: currentUser?._id || null, reasons }),
                });
            
                if (!response.ok) throw new Error("Không thể thu hồi printer!");
            
                const updatedPrinter = await response.json();
                await fetchPrinterDetails(printerId); // Gọi API để đồng bộ lại chi tiết

            
                // Đồng bộ trạng thái với danh sách printers
                setData((prevData) =>
                  prevData.map((printer) => (printer._id === updatedPrinter._id ? updatedPrinter : printer))
                );
                setSelectedPrinter(updatedPrinter); // Cập nhật printer đang được chọn
                toast.success("Thu hồi printer thành công!");
                return updatedPrinter;
              } catch (error) {
                console.error("Error during revoke:", error);
                toast.error("Đã xảy ra lỗi khi thu hồi printer!");
              }
            };

            // ----------------------------------------------------
            // Gọi API “bàn giao” (POST /printers/:id/assign)
            // ----------------------------------------------------
            const handleAssignPrinter = async (printerId, newUserId, notes) => {
              try {
                const token = localStorage.getItem("authToken");
                const currentUser = JSON.parse(localStorage.getItem("currentUser"));
            
                const response = await fetch(`/api/printers/${printerId}/assign`, {
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
                    data.map((printer) => ({
                      ...printer,
                      room: printer.room
                        ? {
                            ...printer.room,
                            location: Array.isArray(printer.room.location)
                              ? printer.room.location.map((loc) =>
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
                console.error("Error in handleAssignPrinter:", error);
                throw error; // Throw lại lỗi để xử lý ở `PrinterProductCard.jsx`
              }
            };

            const fetchPrinterDetails = async (printerId) => {
              try {
                const token = localStorage.getItem("authToken");
                const response = await axios.get(`/api/printers/${printerId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
            
                // Cập nhật dữ liệu chi tiết
                setSelectedPrinter(response.data);
            
                console.log("Dữ liệu backend", response.data);
              } catch (error) {
                console.error("Error fetching printer details:", error);
                toast.error("Không thể tải thông tin printer!");
              }
            };

            const updatePrinterState = (updatedPrinter) => {
              if (!updatedPrinter || !updatedPrinter._id) {
                console.error("updatedPrinter is invalid:", updatedPrinter);
                return;
              }

              setData((prevData) =>
                prevData.map((printer) =>
                  printer && printer._id === updatedPrinter._id ? updatedPrinter : printer
                )
              );
            };

            const handleUpdateRoom = (updatedPrinter) => {
              // Tìm thông tin phòng chi tiết
              const updatedRoom = rooms.find((room) => room.value === updatedPrinter.room?.value);
            
              const newPrinterData = {
                ...updatedPrinter,
                room: updatedRoom || { value: updatedPrinter.room, label: "Không xác định" },
              };
            
              // Cập nhật danh sách tại bảng
              setData((prevData) =>
                prevData.map((printer) =>
                  printer._id === updatedPrinter._id ? newPrinterData : printer
                )
              );
            
              // Cập nhật printer đang chọn nếu cần
              if (selectedPrinter && selectedPrinter._id === updatedPrinter._id) {
                setSelectedPrinter(newPrinterData);
              }
            };

            

          const handleClone = async (printer) => {
            try {
              // Payload giữ nguyên thông tin printer, chỉ thay đổi serial
              const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Lấy thông tin người dùng hiện tại
              const userId = currentUser ? currentUser._id : null; // Lấy ID người dùng
              const clonedPrinter = {
                ...printer,
                serial: `${printer.serial}_copy`,
                assigned: printer.assigned?.map((user) => user.value),
                room: printer.room ? printer.room.value : null,
                userId,
              };
          
              // Gửi yêu cầu POST để tạo printer mới
              const response = await axios.post(
                "/api/printers",
                clonedPrinter,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                  },
                }
              );
          
              if (response.status === 201) {
                toast.success("Nhân bản printer thành công!", {
                  className: "toast-success",
                });
                fetchPrinters(); // Cập nhật lại danh sách
              }
            } catch (error) {
              console.error("Error cloning printer:", error);
              toast.error("Không thể nhân bản printer!", {
                className: "toast-error",
              });
            }
          };

          const handleDelete = async (id) => {
            if (!printerToDelete) return;

              try {
                await axios.delete(`/api/printers/${printerToDelete._id}`, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Thêm token ở đây
                  },
                }
                );
                fetchPrinters(); // Cập nhật lại danh sách sau khi xóa
                toast.success("Printer đã được xóa!",
                  {
                    className: "toast-success",
                  }
                );
              } catch (error) {
                console.error("Error deleting printer:", error);
                toast.error("Có lỗi xảy ra khi xóa printer!",
                  {
                    className: "toast-error",
                  }
                );
              } finally {
                setShowConfirmModal(false); // Đóng modal
                setPrinterToDelete(null); // Reset printer cần xóa
              }
          };

          // Xử lý trong handleEdit
              const handleEdit = (item) => {
                setEditingPrinter({
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

          const confirmDelete = (printer) => {
            setPrinterToDelete(printer); // Đặt printer cần xóa
            setShowConfirmModal(true); // Hiển thị modal xác nhận
          };
          
          const handleAddPrinter = async (e) => {
            e.preventDefault();
          
            try {
              // Kiểm tra dữ liệu nhập
              if (!newPrinter.name || !newPrinter.serial) {
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
                ...newPrinter,
                releaseYear: newPrinter.releaseYear || "",
                status: newPrinter.status || "Standby",
                type: newPrinter.type || "Printer",
                specs: {
                  ip: newPrinter.specs?.ip || "",
                  ram: newPrinter.specs?.ram || "",
                  storage: newPrinter.specs?.storage || "",
                  display: newPrinter.specs?.display || "",
                },
                assigned: newPrinter.status === "Active" ? newPrinter.assigned.map((user) => user.value) : [],
                room: newPrinter.status !== "Active" ? newPrinter.room : null,
                reason: newPrinter.status === "Broken" ? newPrinter.reason : null, // Thêm lý do hỏng nếu có
                userId,
                 // Xử lý danh sách người dùng
              };
        
          
              // Gửi dữ liệu lên API
              const response = await axios.post("/api/printers", payload, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Đảm bảo token được gửi kèm
                },
              });
          
              if (response.status === 201) {
                toast.success("Thêm printer thành công!",
                  {
                    className: "toast-success",
                    progressClassName: "Toastify__progress-bar",
                  }
                );
                
                // Cập nhật danh sách printers và đóng modal
                fetchPrinters();
                setShowAddModal(false);
                setNewPrinter({
                  name: "",
                  manufacturer: "",
                  serial: "",
                  releaseYear: "",
                  specs: {
                    ip: "",
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
              console.error("Lỗi khi thêm printer:", error);
              toast.error("Có lỗi xảy ra khi thêm printer. Vui lòng thử lại!",
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
                                ip: typeof row["Bộ Xử Lý (ip)"] === "string" ? row["Bộ Xử Lý (ip)"].trim() : "",
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
                                type: typeof row["Loại (type)"] === "string" ? row["Loại (type)"].trim() : "Printer", // Mặc định là Printer
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
                  "/api/printers/bulk-upload",
                  { printers: parsedData },
                  {
                      headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                      },
                  }
              );
      
              if (response.status === 201) {
                  toast.success(`${response.data.addedPrinters} printer(s) đã được thêm thành công!`,
                    {
                      className: "toast-success",
                      progressClassName: "Toastify__progress-bar",
                    }
                  );
                  fetchPrinters();
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
          await fetchPrinters();
          await fetchUsers();
          await fetchRooms();
        };
      
        fetchData();
      }, []);

      useEffect(() => {
        if (selectedPrinter) {
          const updatedPrinter = data.find((printer) => printer._id === selectedPrinter._id);
          if (updatedPrinter) setSelectedPrinter(updatedPrinter); // Đồng bộ dữ liệu mới
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
                          placeholder="Tìm kiếm printer..."
                          className="pl-10 pr-4 py-2 rounded-md w-100 px-3 "
                          onChange={(e) => {
                            const query = e.target.value.toLowerCase();
                            if (query === "") {
                              // Nếu ô tìm kiếm rỗng, khôi phục dữ liệu gốc
                              fetchPrinters();
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
                            setNewPrinter({
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
                                  fetchPrinters(); // Lấy lại toàn bộ dữ liệu
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
                                {selectedType === "Tất cả" 
                                ? "Loại: Tất cả" 
                                : `Loại: ${selectedType}`}
                              </button>
                            }
                            children={
                              <div className="flex flex-col gap-2 mt-10 bg-white rounded-lg shadow-lg p-4">
                                {/* Tùy chọn Tất cả */}
                                <button
                                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                  onClick={() => {
                                    setSelectedType("Tất cả");
                                    fetchPrinters(); // Hiển thị toàn bộ dữ liệu
                                  }}
                                >
                                  Tất cả
                                </button>

                                {/* Tùy chọn Máy in Màu */}
                                <button
                                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                  onClick={() => {
                                    setSelectedType("Máy in Màu");
                                    setData(data.filter((item) => item.type === "Máy in Màu")); // Lọc theo Printer
                                  }}
                                >
                                  Máy in Màu
                                </button>

                                {/* Tùy chọn Máy in Đen trắng */}
                                <button
                                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                  onClick={() => {
                                    setSelectedType("Máy in Đen trắng");
                                    setData(data.filter((item) => item.type === "Máy in Đen trắng")); // Lọc theo Desktop
                                  }}
                                >
                                  Máy in Đen trắng
                                </button>
                                {/* Tùy chọn Máy Scan */}
                                <button
                                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                  onClick={() => {
                                    setSelectedType("Máy Scan");
                                    setData(data.filter((item) => item.type === "Máy Scan")); // Lọc theo Desktop
                                  }}
                                >
                                  Máy Scan
                                </button>
                                {/* Tùy chọn Máy Scan */}
                                <button
                                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                  onClick={() => {
                                    setSelectedType("Máy Photocopier");
                                    setData(data.filter((item) => item.type === "Máy Photocopier")); // Lọc theo Desktop
                                  }}
                                >
                                  Máy Photocopier
                                </button>
                                {/* Tùy chọn Máy Scan */}
                                <button
                                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                  onClick={() => {
                                    setSelectedType("Máy đa chức năng");
                                    setData(data.filter((item) => item.type === "Máy đa chức năng")); // Lọc theo Desktop
                                  }}
                                >
                                  Máy đa chức năng
                                </button>
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
                                    fetchPrinters(); // Hiển thị toàn bộ dữ liệu
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
                                        fetchPrinters(); // Lấy lại toàn bộ dữ liệu
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
                                        fetchPrinters(); // Lấy lại toàn bộ dữ liệu
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
                        <p className="text-sm font-bold text-gray-500">LOẠI
                        </p>
                    </th>
                    <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                        <p className="text-sm font-bold text-gray-500">ĐỊA CHỈ IP
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
                    <p className="text-sm font-bold text-navy-700">{item.type}</p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                   {item.specs?.ip ? (
                      <a
                        href={`http://${item.specs.ip}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-navy-700 underline"
                      >
                        {item.specs.ip}
                      </a>
                    ) : (
                      <p className="text-sm italic text-gray-500">Không xác định</p>
                    )}
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
          fetchPrinters(newPage);
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
          fetchPrinters(newPage);
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
                  <h3 className="text-2xl font-bold mb-6 text-[#002147]">Thêm mới printer</h3>
                  <form onSubmit={handleAddPrinter}>
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
                            value={newPrinter.name}
                            onChange={(e) => setNewPrinter({ ...newPrinter, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Phân loại</label>
                          <select
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            value={newPrinter.type}
                            onChange={(e) => setNewPrinter({ ...newPrinter, type: e.target.value })}
                          >
                            <option value="Máy in Màu">Máy in Màu</option>
                            <option value="Máy in Đen trắng">Máy in Đen trắng</option>
                            <option value="Máy Scan">Máy Scan</option>
                            <option value="Máy Photocopier">Máy Photocopier</option>
                            <option value="Máy đa chức năng">Máy đa chức năng</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Nhà sản xuất</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập nhà sản xuất"
                            value={newPrinter.manufacturer}
                            onChange={(e) => setNewPrinter({ ...newPrinter, manufacturer: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Serial</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập số serial"
                            value={newPrinter.serial}
                            onChange={(e) => setNewPrinter({ ...newPrinter, serial: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Năm sản xuất</label>
                          <input
                            type="number"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập năm sản xuất"
                            value={newPrinter.releaseYear}
                            onChange={(e) => setNewPrinter({ ...newPrinter, releaseYear: e.target.value })}
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
                            value={newPrinter.specs?.ip || ""}
                            onChange={(e) =>
                              setNewPrinter({ ...newPrinter, specs: { ...newPrinter.specs, ip: e.target.value } })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">RAM</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập dung lượng RAM"
                            value={newPrinter.specs?.ram || ""}
                            onChange={(e) =>
                              setNewPrinter({ ...newPrinter, specs: { ...newPrinter.specs, ram: e.target.value } })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Bộ Nhớ</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập dung lượng Bộ nhớ"
                            value={newPrinter.specs?.storage || ""}
                            onChange={(e) =>
                              setNewPrinter({ ...newPrinter, specs: { ...newPrinter.specs, storage: e.target.value } })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Màn hình</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập kích thước màn hình"
                            value={newPrinter.specs?.display || ""}
                            onChange={(e) =>
                              setNewPrinter({ ...newPrinter, specs: { ...newPrinter.specs, display: e.target.value } })
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
                      href="/printer-sample-upload.xlsx"
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
                <h3 className="text-2xl font-semibold mb-8 text-[#002147]">Cập nhật thông tin Printer</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const payload = {
                        ...editingPrinter,
                        releaseYear: editingPrinter.releaseYear || "",
                        type: editingPrinter.type || "Printer",
                        reason: editingPrinter.reason || "",
                        specs: {
                          ip: editingPrinter.specs?.ip || "",
                          ram: editingPrinter.specs?.ram || "",
                          storage: editingPrinter.specs?.storage || "",
                          display: editingPrinter.specs?.display || "",
                        },
                        assigned: Array.isArray(editingPrinter.assigned)
                          ? editingPrinter.assigned
                              .filter((user) => user.value) // Lọc bỏ user không có ID
                              .map((user) => user.value) // Chỉ lấy ID
                          : [],
                        room: editingPrinter.room?.value || null, // Chỉ lấy ID phòng
                      };
                  
                      console.log("Payload gửi lên server:", payload);
                  
                      await axios.put(
                        `/api/printers/${editingPrinter._id}`,
                        payload,
                        {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                          },
                        }
                      );
                      setShowEditModal(false);
                      fetchPrinters(); // Làm mới danh sách sau khi lưu
                      toast.success("Cập nhật printer thành công!");
                    } catch (error) {
                      console.error("Error updating printer:", error);
                      toast.error("Không thể cập nhật printer!");
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
                          value={editingPrinter.name}
                          onChange={(e) => setEditingPrinter({ ...editingPrinter, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Nhà sản xuất</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập nhà sản xuất"
                          value={editingPrinter.manufacturer}
                          onChange={(e) => setEditingPrinter({ ...editingPrinter, manufacturer: e.target.value })}
                        />
                      </div>
                      <div>
                          <label className="block text-gray-600 font-medium mb-2">Phân loại</label>
                          <select
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            value={editingPrinter.type}
                            onChange={(e) => setEditingPrinter({ ...editingPrinter, type: e.target.value })}
                          >
                            <option value="Máy in Màu">Máy in Màu</option>
                            <option value="Máy in Đen trắng">Máy in Đen trắng</option>
                            <option value="Máy Scan">Máy Scan</option>
                            <option value="Máy Photocopier">Máy Photocopier</option>
                            <option value="Máy đa chức năng">Máy đa chức năng</option>
                          </select>
                        </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Serial</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập số serial"
                          value={editingPrinter.serial}
                          onChange={(e) => setEditingPrinter({ ...editingPrinter, serial: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Năm sản xuất</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập năm sản xuất"
                          value={editingPrinter.releaseYear}
                          onChange={(e) => setEditingPrinter({ ...editingPrinter, releaseYear: e.target.value })}
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
                          value={editingPrinter.specs?.ip || ""}
                          onChange={(e) =>
                            setEditingPrinter({ ...editingPrinter, specs: { ...editingPrinter.specs, ip: e.target.value } })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">RAM</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập dung lượng RAM"
                          value={editingPrinter.specs?.ram || ""}
                          onChange={(e) =>
                            setEditingPrinter({ ...editingPrinter, specs: { ...editingPrinter.specs, ram: e.target.value } })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Bộ Nhớ</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập dung lượng bộ nhớ"
                          value={editingPrinter.specs?.storage || ""}
                          onChange={(e) =>
                            setEditingPrinter({ ...editingPrinter, specs: { ...editingPrinter.specs, storage: e.target.value } })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Màn hình</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập kích thước màn hình"
                          value={editingPrinter.specs?.display || ""}
                          onChange={(e) =>
                            setEditingPrinter({ ...editingPrinter, specs: { ...editingPrinter.specs, display: e.target.value } })
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
                            value={editingPrinter.status}
                            onChange={(e) => setEditingPrinter({ ...editingPrinter, status: e.target.value })}
                          >
                            <option value="Active">Đang sử dụng</option>
                            <option value="Standby">Chờ Cấp Phát</option>
                            <option value="Broken">Hỏng</option>
                          </select>
                         </div>
                        
                        {/* Ô người sử dụng khi trạng thái là "Đang sử dụng" */}
                        {editingPrinter.status === "Active" && (
                          <div>
                            <input
                              type="text"
                              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                              placeholder="Nhập tên người sử dụng"
                              value={editingPrinter.assigned[0]?.label || ""}
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
                                setEditingPrinter({
                                  ...editingPrinter,
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
                                      setEditingPrinter({ ...editingPrinter, assigned: [user] });
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
                            {editingPrinter.status === "Broken" && (
                                <div>
                                  <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                                    placeholder="Nhập lý do hỏng"
                                    value={editingPrinter.reason || ""}
                                    onChange={(e) =>
                                      setEditingPrinter({ ...editingPrinter, reason: e.target.value })
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
                            value={editingPrinter.room?.label || ""}
                            onChange={(e) => {
                              const query = e.target.value.toLowerCase();

                              // Lọc danh sách rooms phù hợp
                              const filtered = rooms.filter((room) =>
                                room.label.toLowerCase().includes(query)
                              );

                              setFilteredRooms(filtered);
                              setShowRoomSuggestions(true);

                              // Tạm thời gắn giá trị nhập vào room
                              setEditingPrinter({
                                ...editingPrinter,
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
                                    setEditingPrinter({
                                      ...editingPrinter,
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
                Bạn có chắc chắn muốn xóa printer <strong>{printerToDelete?.name}</strong> không?
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
      {showDetailModal && selectedPrinter && ReactDOM.createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          style={{ zIndex: 1050 }}
          onClick={(e) => {
            // Đóng modal nếu người dùng nhấp ra ngoài modal
            if (e.target === e.currentTarget) {
              setSelectedPrinter(null);
            }
          }}
          >
            <div className="  w-4/5 max-w-7xl rounded-lg shadow-lg relative overflow-y-auto max-h-[90vh]"
            style={{ zIndex: 1990 }}
            onClick={(e) => e.stopPropagation()}>
              <PrinterProductCard
                  key={refreshKey} // Force re-render khi refreshKey thay đổi
                  printerData={{
                    ...selectedPrinter,
                    releaseYear: selectedPrinter.releaseYear || "Không có",
                  }}
                  setSelectedPrinter={setSelectedPrinter}
                  onUpdateSpecs={handleUpdateSpecs} // Bổ sung prop này
                  onCloseModal={() => {
                    setSelectedPrinter(null); // Reset printer đã chọn
                    setShowDetailModal(false); // Đóng modal
                    fetchPrinters(); // refresh sau khi thao tác
                  }} // Truyền hàm đóng modal
                  // Truyền vào 2 hàm thu hồi / bàn giao
                  onRevoke={handleRevokePrinter}
                  onAssign={handleAssignPrinter}
                  fetchPrinterDetails={fetchPrinterDetails} 
                  onUpdatePrinter={updatePrinterState}
                  onUpdateRoom={handleUpdateRoom}
                  refetchPrinters={fetchPrinters}
                />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default PrinterTable;
