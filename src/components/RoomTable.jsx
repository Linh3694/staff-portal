import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEdit, FiTrash2, FiCopy } from "react-icons/fi";
import * as XLSX from "xlsx";


const RoomTable = () => {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [clients, setClients] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoom, setNewRoom] = useState({ name: "", location: "", capacity: "" });



  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      setRooms(Array.isArray(data.rooms) ? data.rooms : []);
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
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRoom),
      });
  
      if (!response.ok) throw new Error("Thêm phòng thất bại!");
  
      const result = await response.json();
      toast.success("Thêm phòng thành công!");
      fetchRooms(); // Refresh lại danh sách phòng
      setIsAddModalOpen(false); // Đóng modal
    } catch (error) {
      console.error("Lỗi khi thêm phòng:", error);
      toast.error("Có lỗi xảy ra khi thêm phòng.");
    }
  };

  const handleEditRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${selectedRoom._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedRoom),
      });
      if (response.ok) {
        const updatedRoom = await response.json();
        setRooms(rooms.map((room) => (room._id === updatedRoom._id ? updatedRoom : room)));
        toast.success("Cập nhật phòng thành công!");
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật phòng:", error.message);
      toast.error("Không thể cập nhật phòng.");
    }
  };

  // Xử lý upload file Excel
const handleUploadExcel = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Thêm dữ liệu vào danh sách phòng
    const formattedRooms = jsonData.map((row) => ({
      name: row["Tên phòng"] || "Không xác định",
      location: row["Địa điểm"] || "Không xác định",
      capacity: row["Sức chứa"] || 0,
      id: Date.now() + Math.random(),
    }));

    setRooms([...rooms, ...formattedRooms]);
    toast.success("File Excel đã được tải lên thành công!");
  };
  reader.readAsArrayBuffer(file);
};

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRoom = currentPage * itemsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - itemsPerPage;

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
                className="px-3 py-2 bg-[#009483] text-sm font-bold text-white rounded-lg shadow-md hover:bg-[#196619] cursor-pointer transform transition-transform duration-300 hover:scale-105"
              >
                Tải lên Excel
              </label>
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
          {filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom).map((room) => (
            <tr key={room._id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-semibold text-navy-700">{room.name || "Not Provided"}</p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                {room.location && room.location.length > 0 ? (
                  <>
                    <p className="text-sm font-semibold text-navy-700">
                      Toà Nhà {room.location[0].building}
                    </p>
                    <p className="text-xs italic text-gray-500">
                      {room.location[0].floor}
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
                  <form onSubmit={handleAddRoom}>
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
                            placeholder="Nhập tên thiết bị"
                            value={newRoom.name}
                            onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Công năng</label>
                          <select
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập công năng hiện tại"
                            value={newRoom.status}
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
                          <label className="block text-gray-600 font-medium mb-2">Tầng </label>
                          <input
                            type="number"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập tên toà nhà"
                            value={newRoom.location[0]?.floor}
                            onChange={(e) =>
                                setNewRoom((prevRoom) => ({
                                  ...prevRoom,
                                  location: [
                                    {
                                      ...prevRoom.location?.[0],
                                      floor: e.target.value,
                                    },
                                  ],
                                }))
                              }
                            />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Toà Nhà </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập tên toà nhà"
                            value={newRoom.location[0]?.building}
                            onChange={(e) =>
                              setNewRoom((prevRoom) => ({
                                ...prevRoom,
                                location: [
                                  {
                                    ...prevRoom.location?.[0],
                                    floor: e.target.value,
                                  },
                                ],
                              }))
                            }
                            />
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
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        onClick={handleAddRoom}
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
          <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-bold mb-4">Chỉnh sửa thông tin phòng</h2>
              <div className="flex flex-col space-y-4">
                <input
                  type="text"
                  className="border px-4 py-2 rounded-md"
                  placeholder="Tên phòng"
                  value={selectedRoom?.name || ""}
                  onChange={(e) => setSelectedRoom({ ...selectedRoom, name: e.target.value })}
                />
                <input
                  type="text"
                  className="border px-4 py-2 rounded-md"
                  placeholder="Địa điểm"
                  value={selectedRoom?.location || ""}
                  onChange={(e) => setSelectedRoom({ ...selectedRoom, location: e.target.value })}
                />
                <input
                  type="number"
                  className="border px-4 py-2 rounded-md"
                  placeholder="Sức chứa"
                  value={selectedRoom?.capacity || ""}
                  onChange={(e) => setSelectedRoom({ ...selectedRoom, capacity: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg"
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