import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEdit, FiTrash2, FiCopy } from "react-icons/fi";
import * as XLSX from "xlsx";
import Dropdown from "./function/dropdown";


const RoomTable = () => {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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



  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
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
      const response = await fetch("/api/users", {
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
  
      const response = await fetch("/api/rooms", {
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
  
      const response = await fetch(`/api/rooms/${selectedRoom._id}`, {
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
  
        const response = await fetch("/api/rooms/bulk", {
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

  const filteredRooms = rooms
  .filter((room) => room && room.name && room.name.toLowerCase().includes(searchTerm.toLowerCase()));


  return (
    <div className="w-full h-full px-6 pb-6 border sm:overflow-x-auto bg-white rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-4 mt-3">
            <div className="text-2xl font-bold text-navy-700">Danh sách phòng</div>
        </div>
        
    <div className="flex justify-between items-center mb-2 mt-1">
      <input
        type="text"
        placeholder="Tìm kiếm phòng..."
        className="border border-gray-300 rounded-md px-4 py-2 w-[300px]"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    
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
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-semibold text-navy-700">{room.name || "Not Provided"}</p>
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
                            <option value="Phòng máy">Phòng máy</option>
                            <option value="Phòng giáo viên">Phòng giáo viên</option>
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
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-4 py-2 bg-orange-red text-gray-700 rounded"
                      >
                        Hủy
                      </button>
                      <button
                          type="submit" // Loại bỏ onClick tại đây
                          className="px-4 py-2 bg-[#002147] text-white rounded"
                        >
                          Lưu
                        </button>
                    </div>
                  </form>
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
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 bg-[#FF5733] text-white rounded-lg"
                  onClick={async () => {
                    await fetch(`/api/rooms/${selectedRoom?._id}`, {
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
                    className="px-4 py-2 bg-orange-red text-white rounded-lg"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="px-4 py-2 bg-[#002147] text-white rounded-lg"
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