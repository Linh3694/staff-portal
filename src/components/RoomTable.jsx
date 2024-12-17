import React, { useState, useEffect, useMemo } from "react";
import { MdCancel, MdCheckCircle, } from "react-icons/md";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";



const RoomTable = ({ handleSyncClients }) => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null); // Dùng để sửa

  // Lấy dữ liệu từ /api//users
  const fetchRooms = async (page = 1) => {
    try {
      const response = await fetch(
        `/api/rooms?page=${page}&limit=${itemsPerPage}`
      );
      if (!response.ok) throw new Error("Lỗi khi tải danh sách phòng");
  
      const data = await response.json();
      setRooms(data.rooms);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Lỗi khi tải danh sách phòng:", error.message);
      alert("Không thể tải danh sách phòng.");
    }
  };

  // Gọi fetchUsers khi component được mount
  useEffect(() => {
    fetchRooms(currentPage);
  }, [currentPage, itemsPerPage]);

  const statusClasses = {
    Active: "text-green-500 flex items-center",
    Inactive: "text-gray-400 flex items-center",
  };
  
  const statusLabels = {
    Active: "Active",
    Inactive: "Inactive",
  };


  const handleAddRoom = async () => {
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedRoom.name,
          location: selectedRoom.location,
          status: selectedRoom.status || "Hoạt động",
        }),
      });
  
      if (!response.ok) throw new Error("Lỗi khi thêm phòng mới");
  
      const newRoom = await response.json();
      setRooms([...rooms, newRoom]);
      setIsModalOpen(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error("Lỗi khi thêm phòng:", error.message);
      alert("Không thể thêm phòng mới.");
    }
  };

  const handleUpdateRoom = async (updatedRoom) => {
    try {
      const response = await fetch(`/api/rooms/${updatedRoom._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: updatedRoom.name,
          location: updatedRoom.location,
          status: updatedRoom.status,
        }),
      });
  
      if (!response.ok) throw new Error("Lỗi khi cập nhật phòng");
  
      const updated = await response.json();
      setRooms(
        rooms.map((room) => (room._id === updated._id ? updated : room))
      );
      setIsModalOpen(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error("Lỗi khi cập nhật phòng:", error.message);
      alert("Không thể cập nhật phòng.");
    }
  };

  const handleDeleteRoom = async (id) => {
    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
      });
  
      if (!response.ok) throw new Error("Lỗi khi xóa phòng");
  
      setRooms(rooms.filter((room) => room._id !== id));
    } catch (error) {
      console.error("Lỗi khi xóa phòng:", error.message);
      alert("Không thể xóa phòng.");
    }
  };

  const handleImportFromExcel = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
  
    reader.onload = (event) => {
      const binaryData = event.target.result;
      const workbook = XLSX.read(binaryData, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const importedData = XLSX.utils.sheet_to_json(sheet);
  
      const formattedRooms = importedData.map((room) => ({
        name: room["Tên phòng"] || "Không có tên",
        location: room["Địa điểm"] || "Không có địa điểm",
        status: room["Tình trạng"] || "Chưa xác định",
      }));
  
      setRooms([...rooms, ...formattedRooms]);
    };
  
    reader.readAsBinaryString(file);
  };

  const handleExportToExcel = () => {
    // Tạo dữ liệu export
    const dataToExport = clients.map((client) => ({
      Tên: client.fullname,
      Email: client.email || "Không có",
      Chức_Vụ: client.jobTitle || "Không có",
      Phòng_Ban: client.department || "Không có",
      Vai_Trò: client.role,
      Tình_Trạng: client.disabled ? "Inactive" : "Active",
    }));
  
    // Tạo worksheet từ dữ liệu
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  
    // Tạo workbook và thêm worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách người dùng");
  
    // Ghi workbook ra file Excel
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  
    // Tải file xuống
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Danh_sach_nguoi_dung.xlsx");
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const keyword = searchTerm.toLowerCase();
      return room.name?.toLowerCase().includes(keyword) || room.location?.toLowerCase().includes(keyword);
    });
  }, [rooms, searchTerm]);

  // Phân trang dữ liệu
const paginatedRooms = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredRooms.slice(start, end);
}, [filteredRooms, currentPage, itemsPerPage]);

  // Tổng số trang
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

  return (
    <div className="w-full h-full px-6 pb-6 border sm:overflow-x-auto bg-white rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-4 mt-3">
            <div className="text-2xl font-bold text-navy-700">Danh sách phòng</div>
          </div>

      {/* Thanh tìm kiếm */}
      <div className="flex justify-between items-center mb-2 mt-1">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên khu vực"
            className="border border-gray-300 rounded-md px-4 py-2 w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center space-x-2">
            {/* Nút Import dữ liệu */}    

            {/* Nút Thêm mới */}
            <button
              onClick={() => {
                setSelectedRoom(null);
                setIsModalOpen(true);
              }}
              className="px-3 py-2 bg-[#FF5733] text-sm font-bold text-white rounded-lg shadow-md hover:bg-[#002147]"
            >
              Thêm mới
            </button>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImportFromExcel}
              id="fileInput"
              className="hidden"
            />
            <label
              htmlFor="fileInput"
              className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-md hover:bg-[#001635] cursor-pointer"
            >
              Nhập dữ liệu
            </label>

            {/* Nút Xuất dữ liệu */}
            <button
              onClick={handleExportToExcel}
              className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-md hover:bg-[#001635]"
            >
              Xuất dữ liệu
            </button>
          </div>
        </div>

      {/* Bảng */}
      <div className="mt-1 overflow-x-scroll xl:overflow-x-hidden">
        <table className="w-full">
          <thead>
            <tr className="!border-px !border-gray-400">
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">TÊN PHÒNG</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">ĐỊA ĐIỂM</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">TÌNH TRẠNG</p>
              </th>
            </tr>
          </thead>
          <tbody>
              {paginatedRooms.map((room) => (
                <tr key={room._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">{room.name || "Không có tên"}</p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-semibold text-navy-700">{room.location || "Không có địa điểm"}</p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <span
                      className={`px-2 py-1 rounded-full ${
                        room.status === "Hoạt động" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {room.status || "Không xác định"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>

        {/* Modal thêm/sửa phòng */}
            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-[500px]">
                  <h3 className="text-xl font-bold mb-4">
                    {selectedRoom ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
                  </h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (selectedRoom) handleUpdateRoom(selectedRoom);
                      else handleAddRoom();
                    }}
                  >
                    <label className="block mb-2">Tên phòng:</label>
                    <input
                      type="text"
                      value={selectedRoom?.name || ""}
                      onChange={(e) => setSelectedRoom({ ...selectedRoom, name: e.target.value })}
                      className="border rounded-md px-4 py-2 w-full mb-4"
                      required
                    />

                    <label className="block mb-2">Loại phòng:</label>
                    <input
                      type="text"
                      value={selectedRoom?.type || ""}
                      onChange={(e) => setSelectedRoom({ ...selectedRoom, type: e.target.value })}
                      className="border rounded-md px-4 py-2 w-full mb-4"
                      required
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md mr-2"
                      >
                        Hủy
                      </button>
                      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md">
                        Lưu
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
      </div>
      {/* Pagination */}
      <div className="flex justify-end items-center mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-2 py-1 text-xs font-semibold text-white border rounded bg-[#FF5733] hover:bg-[#002147] disabled:bg-[#002147] disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="text-xs px-4 py-2">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-2 py-1 text-xs font-semibold text-white border rounded bg-[#FF5733] hover:bg-[#002147] disabled:bg-[#002147] disabled:cursor-not-allowed"
          >
            Tiếp
          </button>
        </div>
    </div>

    
  );
};

export default RoomTable;