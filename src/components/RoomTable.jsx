import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEdit, FiTrash2, FiCopy } from "react-icons/fi";
import * as XLSX from "xlsx";
import { IoLocationOutline } from "react-icons/io5";
import LaptopProductCard from "./inventory/productcard/laptopProductCard";
import MonitorProductCard from "./inventory/productcard/monitorProductCard";
import PrinterProductCard from "./inventory/productcard/printerProductCard";
import ProjectorProductCard from "./inventory/productcard/projectorProductCard";
import ToolProductCard from "./inventory/productcard/toolProductCard";
import { API_URL, UPLOAD_URL, BASE_URL } from "../config"; // import từ file config



const RoomTable = () => {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [clients, setClients] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoom, setNewRoom] = useState({
    name: "",
    location: [{ building: "", floor: "" }],
    capacity: "",
    status: "Lớp học", // Giá trị mặc định
  });
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRoomDevices, setSelectedRoomDevices] = useState([]);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isLaptopModalOpen, setIsLaptopModalOpen] = useState(false);
  const [isMonitorModalOpen, setIsMonitorModalOpen] = useState(false);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isProjectorModalOpen, setIsProjectorModalOpen] = useState(false);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [selectedLaptopData, setSelectedLaptopData] = useState(null);
  const [selectedMonitorData, setSelectedMonitorData] = useState(null);
  const [selectedProjectorData, setSelectedProjectorData] = useState(null);
  const [selectedPrinterData, setSelectedPrinterData] = useState(null);
  const [selectedToolData, setSelectedToolData] = useState(null);
  
  const handleOpenModal = (type, data) => {
    switch (type) {
      case "Laptop":
        setSelectedLaptopData(data);
        setIsLaptopModalOpen(true);
        break;
      case "Monitor":
        setSelectedMonitorData(data);
        setIsMonitorModalOpen(true);
        break;
      case "Printer":
        setSelectedPrinterData(data);
        setIsPrinterModalOpen(true);
        break;
      case "Projector":
        setSelectedProjectorData(data);
        setIsProjectorModalOpen(true);
        break;
      case "Tool":
        setSelectedToolData(data);
        setIsToolModalOpen(true);
        break;
      default:
        console.warn("Unknown device type:", type);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/rooms`);
      const data = await response.json();
  
      const validRooms = (data.rooms || []).filter((room) => room && room.name); // Loại bỏ phần tử không hợp lệ
      setRooms(validRooms);
    } catch (error) {
      console.error("Lỗi khi tải danh sách phòng:", error.message);
      setRooms([]);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Đảm bảo token đúng
        },
      });
      // console.error("Token không tồn tại, vui lòng đăng nhập lại.");
      // toast.error("Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.");
  
      if (!response.ok) {
        const errorText = await response.text(); // Đọc nội dung lỗi từ backend
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
  
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching users:", error.message);
      toast.error(`Lỗi khi tải danh sách người dùng: ${error.message}`);
    }
  };

  // Gọi fetchUsers khi component được mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchDevicesByRoom = async (roomId) => {
    try {
      const response = await fetch(`${API_URL}/rooms/${roomId}/devices`);
      if (!response.ok) throw new Error("Không thể tải danh sách thiết bị.");
    
      const data = await response.json();
  
      console.log("Dữ liệu phòng:", data.room); // Kiểm tra dữ liệu phòng
      console.log("Danh sách thiết bị:", data.devices); // Kiểm tra danh sách thiết bị
  
      // Cập nhật state
      setSelectedRoom(data.room); // Đảm bảo room được gán đúng
      setSelectedRoomDevices(data.devices); // Cập nhật danh sách thiết bị
      setIsDeviceModalOpen(true); // Hiển thị modal
    } catch (error) {
      console.error("Error fetching devices by room:", error.message);
      toast.error(`Lỗi khi tải danh sách thiết bị: ${error.message}`);
    }
  };

  const fetchLaptopDetails = async (laptopId) => {
    try {
      const response = await fetch(`${API_URL}/laptops/${laptopId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
  
      if (!response.ok) throw new Error("Không thể tải thông tin laptop!");
  
      const data = await response.json();
      setSelectedLaptopData(data);
    } catch (error) {
      console.error("Error fetching laptop details:", error.message);
      toast.error("Không thể tải thông tin laptop!");
    }
  };
  const fetchMonitorDetails = async (monitorId) => {
    try {
      const response = await fetch(`${API_URL}/monitors/${monitorId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
  
      if (!response.ok) throw new Error("Không thể tải thông tin Monitor!");
  
      const data = await response.json();
      setSelectedMonitorData(data);
    } catch (error) {
      console.error("Error fetching Monitor details:", error.message);
      toast.error("Không thể tải thông tin Monitor!");
    }
  };
  const fetchPrinterDetails = async (printerId) => {
    try {
      const response = await fetch(`${API_URL}/printers/${printerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
  
      if (!response.ok) throw new Error("Không thể tải thông tin Printer!");
  
      const data = await response.json();
      setSelectedPrinterData(data);
    } catch (error) {
      console.error("Error fetching Printer details:", error.message);
      toast.error("Không thể tải thông tin Printer!");
    }
  };
  const fetchProjectorDetails = async (projectorId) => {
    try {
      const response = await fetch(`${API_URL}/projectors/${projectorId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
  
      if (!response.ok) throw new Error("Không thể tải thông tin Projector!");
  
      const data = await response.json();
      setSelectedProjectorData(data);
    } catch (error) {
      console.error("Error fetching Projector details:", error.message);
      toast.error("Không thể tải thông tin Projector!");
    }
  };
  const fetchToolDetails = async (toolId) => {
    try {
      const response = await fetch(`${API_URL}/tools/${toolId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
  
      if (!response.ok) throw new Error("Không thể tải thông tin Tool!");
  
      const data = await response.json();
      setSelectedToolData(data);
    } catch (error) {
      console.error("Error fetching Tool details:", error.message);
      toast.error("Không thể tải thông tin Tool!");
    }
  };

  const handleAddRoom = async () => {
    try {
      if (!newRoom.name) {
        throw new Error("Tên phòng là bắt buộc.");
      }
  
      const formattedRoom = {
        ...newRoom,
        capacity: Number(newRoom.capacity),
        status: newRoom.status || "Không xác định",
      };
  
      const response = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedRoom),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Thêm phòng thất bại: ${errorText}`);
      }
  
      const { room } = await response.json();
      setRooms((prevRooms) => [...prevRooms, room]); // Thêm phòng vào danh sách
      toast.success("Thêm phòng thành công!");
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi thêm phòng:", error.message);
      toast.error(`Có lỗi xảy ra khi thêm phòng: ${error.message}`);
    }
  };

  const handleEditRoom = async () => {
    try {
      // Chuẩn bị dữ liệu để gửi
      const formattedRoom = {
        ...selectedRoom,
        capacity: Number(selectedRoom.capacity), // Đảm bảo capacity là số
        location: [
          {
            building: selectedRoom.location?.[0]?.building || "",
            floor: selectedRoom.location?.[0]?.floor || "",
          },
        ],
      };
  
      console.log("Dữ liệu gửi cập nhật:", formattedRoom);
  
      const response = await fetch(`${API_URL}/rooms/${selectedRoom._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedRoom),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cập nhật phòng thất bại: ${errorText}`);
      }
  
      const updatedRoom = await response.json();
      setRooms(rooms.map((room) => (room._id === updatedRoom._id ? updatedRoom : room)));
  
      toast.success("Cập nhật phòng thành công!");
      setIsEditModalOpen(false); // Đóng modal
    } catch (error) {
      console.error("Lỗi khi cập nhật phòng:", error.message);
      toast.error(`Không thể cập nhật phòng: ${error.message}`);
    }
  };
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchTerm(query);

    if (!query) {
      setSuggestions([]);
      return;
    }

    // Lọc rooms theo nhiều trường (tên phòng, toà nhà, etc.)
    const filtered = rooms.filter((room) => {
      const combinedText = [
        room.name || "",
        ...(room.location || []), // location là mảng
        room.status || "",
      ]
        .join(" ")
        .toLowerCase();

      return combinedText.includes(query);
    });

    setSuggestions(filtered.slice(0, 5));
  };
  // Xử lý upload file Excel
  const handleUploadExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
      try {
        const formattedRooms = jsonData.map((row, index) => {
          if (!row["Tên phòng"] || !row["Toà nhà"] || !row["Tầng"] || !row["Sức chứa"] || !row["Công năng"]) {
            throw new Error(
              `Dòng ${index + 2} trong file Excel thiếu trường dữ liệu bắt buộc. Vui lòng kiểm tra lại.`
            );
          }
          return {
            name: row["Tên phòng"],
            location: [{ building: row["Toà nhà"], floor: row["Tầng"].toString() }],
            capacity: Number(row["Sức chứa"]),
            status: row["Công năng"],
          };
        });
  
        const response = await fetch(`${API_URL}/rooms/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rooms: formattedRooms }),
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Tải lên thất bại: ${errorText}`);
        }
  
        toast.success("File Excel đã được tải lên và lưu thành công!");
        fetchRooms(); // Refresh danh sách phòng sau khi lưu
      } catch (error) {
        console.error("Lỗi khi xử lý file Excel:", error.message);
        toast.error(`Lỗi khi tải file Excel: ${error.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredRooms = useMemo(() => {
    if (!searchTerm) return rooms;

    const keyword = searchTerm.toLowerCase();
    return rooms.filter((room) => {
      const combinedText = [
        room.name || "",
        ...(room.location || []),
        room.status || "",
      ]
        .join(" ")
        .toLowerCase();
      return combinedText.includes(keyword);
    });
  }, [rooms, searchTerm]);


  return (
    <div className="w-full h-full px-6 pb-6 border sm:overflow-x-auto bg-white rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-4 mt-3">
            <div className="text-2xl font-bold text-navy-700">Danh sách phòng</div>
        </div>
        
    <div className="flex justify-between items-center mb-2 mt-1">
        <div className="relative w-1/3 rounded-lg">
              <input
                type="text"
                placeholder="Tìm kiếm phòng..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchTerm && suggestions.length > 0) {
                    setSuggestions(suggestions);
                  }
                }}
                className="border border-gray-300 rounded-md px-4 py-2 w-[300px]"
              />
        </div>
              <div className="flex justify-between items-right space-x-2 ">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-md hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105"
              >
                Thêm mới
              </button>
              {/* Thêm nút Upload Excel */}
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                id="upload-excel"
                onChange={handleUploadExcel}
              />
              <label
                htmlFor="upload-excel"
                className="px-3 py-2 bg-[#FF5733] text-sm font-bold text-white rounded-lg shadow-md  cursor-pointer transform transition-transform duration-300 hover:scale-105"
              >
                Tải lên Excel
              </label>
              <a
                href="/room-template.xlsx"
                download
                className="px-3 py-2  bg-[#009483] text-sm font-bold text-white rounded-lg shadow-md transform transition-transform duration-300 hover:scale-105"
              >
                Tải file mẫu
              </a>
        </div>
      </div>
    <div className="mt-1 overflow-x-scroll xl:overflow-x-hidden"> 
      <table className="w-full">
        <thead>
          <tr>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">TÊN PHÒNG</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">ĐỊA ĐIỂM</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">SỨC CHỨA</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">CÔNG NĂNG</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-center">
                <p className="text-sm font-bold text-gray-600">HÀNH ĐỘNG</p>
              </th>
          </tr>
        </thead>
        <tbody>
          {filteredRooms.map((room) => (
            <tr key={room._id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="min-w-[150px] border-white/0 py-3 pr-4 cursor-pointer">
                  <p
                    className="text-sm font-bold text-[#002147] hover:underline"
                    onClick={() => fetchDevicesByRoom(room._id)} // Gọi API
                  >
                    {room.name || "Chưa xác định"}
                  </p>
                </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                {room.location && room.location.length > 0 ? (
                  <>
                    <p className="text-sm font-semibold text-navy-700">
                      Toà Nhà : {room.location[0].building}
                    </p>
                    <p className="text-xs italic text-gray-500">
                      Tầng : {room.location[0].floor}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Chưa xác định</p>
                )}
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-semibold text-navy-700">{room.capacity || "Not Provided"}</p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-semibold text-navy-700">{room.status || "Not Provided"}</p>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4 text-center">
                        <div className="flex justify-center space-x-2">
                          
                          {/* Nút Edit */}
                          <button
                          onClick={() => {
                            setSelectedRoom(room);
                            setIsEditModalOpen(true);
                          }}
                          className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiEdit size={14} />
                          </button>
                          <button
                          onClick={() => {
                            setSelectedRoom(room);
                            setIsDeleteModalOpen(true);
                          }}
                          className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg  transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiTrash2 size={14} />
                        </button>
                        </div>
                      </td>
            </tr>
          ))}
        </tbody>
      </table>
            {isAddModalOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 space-y-6 z-1000"
                onClick={() => setIsAddModalOpen(false)}
              >
                <div
                  className="bg-white rounded-lg shadow-lg p-6 w-[50%]"
                  onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
                >
                  <h3 className="text-2xl font-bold mb-6 text-[#002147]">Thêm mới phòng</h3>
                  <form
                      onSubmit={(e) => {
                        e.preventDefault(); // Ngăn chặn reload trang
                        handleAddRoom(); // Gọi hàm thêm phòng
                      }}
                    >
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
                          <label className="block text-gray-600 font-medium mb-2">Tên phòng</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập tên phòng"
                            value={newRoom.name}
                            onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Toà Nhà</label>
                          <input
                              type="text"
                              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                              placeholder="Nhập tên toà nhà"
                              value={newRoom.location[0]?.building || ""}
                              onChange={(e) =>
                                setNewRoom((prev) => ({
                                  ...prev,
                                  location: [{ ...prev.location[0], building: e.target.value }],
                                }))
                              }
                            />
                  
                        </div>
                        <div> 
                          <label className="block text-gray-600 font-medium mb-2">Tầng </label>
                          <input
                              type="number"
                              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                              placeholder="Nhập tầng"
                              value={newRoom.location[0]?.floor || ""}
                              onChange={(e) =>
                                setNewRoom((prev) => ({
                                  ...prev,
                                  location: [{ ...prev.location[0], floor: e.target.value }],
                                }))
                              }
                            />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Công Năng </label>
                          <select
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            value={newRoom.status || ""}
                            onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value })}
                          >
                            <option value="Lớp học">Lớp học</option>
                            <option value="Phòng chức năng">Phòng chức năng</option>
                            <option value="Phòng họp">Phòng họp</option>
                            <option value="Phòng máy">Phòng máy ICT</option>
                            <option value="Phòng giáo viên">Phòng giáo viên</option>
                            <option value="Khác">Phòng làm việc</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Công suất</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập công suất"
                            value={newRoom.capacity}
                            onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                          />
                        </div>
                        
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="bg-[#FF5733] text-white text-sm font-bold px-3 py-2 rounded-md transform transition-transform duration-300 hover:scale-105"
                      >
                        Hủy
                      </button>
                      <button
                          type="submit" // Loại bỏ onClick tại đây
                          className={`px-3 py-2 rounded-md text-white text-sm font-bold ${
                            isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-[#002147] hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105"
                          }`}
                        >
                          Lưu
                        </button>
                    </div>
                  </form>
                </div>
              </div>
          )}

          {isDeviceModalOpen && selectedRoom && (
            <div
              className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
              onClick={() => setIsDeviceModalOpen(false)}
            >
              <div
                className="bg-white rounded-lg shadow-lg p-6 w-[500px] max-h-[70%] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-bold mb-6 text-[#002147]">
                  Phòng: {selectedRoom?.name || "Không xác định"}
                </h3>

                {/* Hiển thị thông tin phòng */}
                <h5 className=" font-bold mb-2 text-[#002147]"> Thông tin phòng</h5>
                <div className="bg-gray-100 text-[#002147] rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 p-4 mb-6">  
                  <div className="flex justify-between items-center mb-4">
                  
                    <div className="flex items-center space-x-4">
                      <IoLocationOutline size={24} className="text-[#002147]" />
                      <div>
                        <p className="font-bold text-base">{selectedRoom?.name || "Không xác định"}</p>
                        {Array.isArray(selectedRoom?.location) && selectedRoom.location.length > 0 ? (
                          selectedRoom.location.map((loc, index) => (
                            <div key={index}>
                              Toà nhà: {loc.building || "Không xác định"} || Tầng: {loc.floor || "Không xác định"}
                            </div>
                          ))
                        ) : (
                          <div>Không có thông tin vị trí</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <hr className="my-2 border-t border-gray-300" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <p>Công năng hiện tại:</p>
                      <span className="px-3 py-1 bg-[#002147] text-white text-sm rounded-full">
                        {selectedRoom?.status || "Không xác định trạng thái"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hiển thị danh sách thiết bị */}
                <h5 className="font-bold mb-4 text-[#002147]">Thiết bị sử dụng</h5>
                <div className="max-h-60 overflow-y-auto px-3 py-2 border rounded-lg bg-gray-50">                
                  {/* Laptops */}
                  {selectedRoomDevices.laptops?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-[#002147] mb-2">Máy tính</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedRoomDevices.laptops.map((laptop) => (
                          <div
                            key={laptop._id}
                            className="bg-[#002147] text-white rounded-lg px-3 py-1 text-sm font-bold cursor-pointer hover:opacity-90"
                            onClick={() => handleOpenModal("Laptop", laptop)}
                          >
                            {laptop.name} (SN: {laptop.serial || "N/A"})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monitors */}
                  {selectedRoomDevices.monitors?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-[#009483] mb-1">Màn hình</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedRoomDevices.monitors.map((monitor) => (
                          <div
                            key={monitor._id}
                            className="bg-[#009483] text-white rounded-lg px-3 py-2 text-sm font-bold cursor-pointer hover:opacity-90"
                            onClick={() => handleOpenModal("Monitor", monitor)}
                          >
                            {monitor.name} (SN: {monitor.serial || "N/A"})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Các loại thiết bị khác */}
                  {/* Printers */}
                  {selectedRoomDevices.printers?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-[#FF5733] mb-1">Máy in</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedRoomDevices.printers.map((printer) => (
                          <div
                            key={printer._id}
                            className="bg-[#FF5733] text-white rounded-lg px-3 py-2 text-sm font-bold cursor-pointer hover:opacity-90"
                            onClick={() => handleOpenModal("Printer", printer)}
                          >
                            {printer.name} (SN: {printer.serial || "N/A"})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projectors */}
                  {selectedRoomDevices.projectors?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-[#F39C12] mb-1">Thiết bị trình chiếu</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedRoomDevices.projectors.map((projector) => (
                          <div
                            key={projector._id}
                            className="bg-[#F39C12] text-white rounded-lg px-3 py-2 text-sm font-bold cursor-pointer hover:opacity-90"
                            onClick={() => handleOpenModal("Projector", projector)}
                          >
                            {projector.name} (SN: {projector.serial || "N/A"})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tools */}
                  {selectedRoomDevices.tools?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-[#6A1B9A] mb-1">Công cụ khác</h4>
                      <div className="flex flex-wrap gap-2 mb-3 ">
                        {selectedRoomDevices.tools.map((tool) => (
                          <div
                            key={tool._id}
                            className="bg-[#6A1B9A] text-white rounded-lg px-3 py-2 text-sm font-bold cursor-pointer hover:opacity-90"
                            onClick={() => handleOpenModal("Tool", tool)}
                          >
                            {tool.name} (SN: {tool.serial || "N/A"})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setIsDeviceModalOpen(false)}
                    className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

{isLaptopModalOpen && selectedLaptopData && (
                              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={() => setIsLaptopModalOpen(false)}>
                                <div  onClick={(e) => e.stopPropagation()}>
                                  <LaptopProductCard
                                    laptopData={selectedLaptopData}
                                    onAddRepair={(newRepair) => console.log("Thêm sửa chữa", newRepair)}
                                    onDeleteRepair={(laptopId, repairId) =>
                                      console.log("Xóa sửa chữa", laptopId, repairId)
                                    }
                                    onCloseModal={() => setIsLaptopModalOpen(false)}
                                    fetchLaptopDetails={fetchLaptopDetails}
                                  />
                                </div>
                              </div>
                            )}
                          {isMonitorModalOpen && selectedMonitorData && (
                            <div
                              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                              onClick={() => setIsMonitorModalOpen(false)}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                <MonitorProductCard
                                  monitorData={selectedMonitorData}
                                  onCloseModal={() => setIsMonitorModalOpen(false)}
                                  fetchMonitorDetails={fetchMonitorDetails}

                                />
                              </div>
                            </div>
                          )}
                          {isPrinterModalOpen && selectedPrinterData && (
                            <div
                              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                              onClick={() => setIsPrinterModalOpen(false)}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                <PrinterProductCard
                                  printerData={selectedPrinterData}
                                  onCloseModal={() => setIsPrinterModalOpen(false)}
                                  fetchPrinterDetails={fetchPrinterDetails}

                                />
                              </div>
                            </div>
                          )}
                          {isProjectorModalOpen && selectedProjectorData && (
                            <div
                              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                              onClick={() => setIsProjectorModalOpen(false)}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                <ProjectorProductCard
                                  projectorData={selectedProjectorData}
                                  onCloseModal={() => setIsProjectorModalOpen(false)}
                                  fetchProjectorDetails={fetchProjectorDetails}

                                />
                              </div>
                            </div>
                          )}
                          {isToolModalOpen && selectedToolData && (
                            <div
                              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                              onClick={() => setIsToolModalOpen(false)}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                <ToolProductCard
                                  toolData={selectedToolData}
                                  onCloseModal={() => setIsToolModalOpen(false)}
                                  fetchToolDetails={fetchToolDetails}

                                />
                              </div>
                            </div>
                          )}


              {isDeleteModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-bold mb-4">Xác nhận xóa phòng</h2>
              <p>Bạn có chắc chắn muốn xóa phòng <strong>{selectedRoom?.name}</strong> không?</p>
              <div className="flex justify-end space-x-4 mt-4 gap-2">
                <button
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg transform transition-transform duration-300 hover:scale-105"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 bg-[#FF5733] text-white rounded-lg transform transition-transform duration-300 hover:scale-105"
                  onClick={async () => {
                    await fetch(`${API_URL}/rooms/${selectedRoom?._id}`, {
                      method: "DELETE",
                    });
                    toast.success("Xóa phòng thành công!");
                    fetchRooms(); // Cập nhật danh sách sau khi xóa
                    setIsDeleteModalOpen(false);
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

            {isEditModalOpen && (
              <div
              className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
              onClick={() => setIsEditModalOpen(false)}
            >
              <div
                className="bg-white rounded-lg shadow-lg p-8 w-[50%]"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-bold mb-6 text-[#002147]">
                  Chỉnh sửa phòng
                </h3>
                <div className="border rounded-lg p-6 mb-2 relative">
                  <span
                    className="absolute -top-3 left-4 bg-white px-2 text-[#002147] font-bold"
                  >
                    Thông tin chung
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Tên phòng
                      </label>
                      <input
                        type="text"
                        className="border px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Tên phòng"
                        value={selectedRoom?.name || ""}
                        onChange={(e) => setSelectedRoom({ ...selectedRoom, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Toà Nhà
                      </label>
                      <input
                        type="text"
                        className="border px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Toà nhà"
                        value={selectedRoom?.location?.[0]?.building || ""}
                        onChange={(e) =>
                          setSelectedRoom((prev) => ({
                            ...prev,
                            location: [
                              {
                                ...prev.location?.[0],
                                building: e.target.value,
                              },
                            ],
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">Tầng</label>
                      <input
                        type="number"
                        className="border px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Tầng"
                        value={selectedRoom?.location?.[0]?.floor || ""}
                        onChange={(e) =>
                          setSelectedRoom((prev) => ({
                            ...prev,
                            location: [
                              {
                                ...prev.location?.[0],
                                floor: e.target.value,
                              },
                            ],
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Công năng
                      </label>
                      <select
                        className="border px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        value={selectedRoom?.status || ""}
                        onChange={(e) => setSelectedRoom({ ...selectedRoom, status: e.target.value })}
                      >
                        <option value="Lớp học">Lớp học</option>
                        <option value="Phòng chức năng">Phòng chức năng</option>
                        <option value="Phòng họp">Phòng họp</option>
                        <option value="Phòng máy">Phòng máy</option>
                        <option value="Phòng giáo viên">Phòng giáo viên</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Công suất
                      </label>
                      <input
                        type="number"
                        className="border px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Công suất"
                        value={selectedRoom?.capacity || ""}
                        onChange={(e) => setSelectedRoom({ ...selectedRoom, capacity: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    className="px-4 py-2 bg-orange-red text-white rounded-lg transform transition-transform duration-300 hover:scale-105"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="px-4 py-2 bg-[#002147] text-white rounded-lg transform transition-transform duration-300 hover:scale-105"
                    onClick={handleEditRoom}
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
            )}
      </div>
    </div>
    
  );
};

export default RoomTable;