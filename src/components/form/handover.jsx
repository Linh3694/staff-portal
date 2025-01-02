import React, { useState, useEffect } from "react";
import axios from 'axios';
import { debounce } from 'lodash';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from "file-saver";
import Fuse from 'fuse.js';


// Mẫu user:
// { _id, fullname, email, jobTitle, avatarUrl, ... }

const HandoverModal = ({
  isOpen,
  onClose,
  currentUser,       // Người đang dùng laptop (bên giao)
  onConfirmAssign,   // Xác nhận bàn giao (gửi API)
  laptopData, 
  activityData       // Thông tin laptop, nếu cần hiển thị
}) => {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [notes, setNotes] = useState("");
  const [allUsers, setAllUsers] = useState([]);

  console.log("Dữ liệu laptop", laptopData); // Debug dữ liệu

  useEffect(() => {
    if (!isOpen) {
      // reset khi đóng modal
      setSearchText("");
      setSearchResults([]);
      setSelectedUser(null);
      setNotes("");
    }
  }, [isOpen]);
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        console.log("Fetched users:", data); // Debug dữ liệu
        setAllUsers(data); // Lưu danh sách người dùng
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
  
    fetchAllUsers();
  }, []);

  const debouncedSearch = debounce(() => {
    handleSearch();
  }, 300); // Chỉ gọi API sau 300ms kể từ lần gõ cuối cùng.

  const options = {
    keys: ['fullname', 'email', 'jobTitle'], // Các trường để tìm kiếm
    threshold: 0.4, // Độ chính xác khớp
  };
  const fuse = new Fuse(allUsers, options);

  const handleSearch = () => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    const results = fuse.search(searchText);
    const formattedResults = results.map((result) => result.item);
    setSearchResults(formattedResults);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchText('');
    setSearchResults([]);
  };

  // Khi nhấn "Xác nhận"
  const handleConfirm = () => {
    if (!selectedUser) {
      alert("Chưa chọn người nhận!");
      return;
    }
    onConfirmAssign(laptopData._id, selectedUser._id, notes);
    onClose();
  };


    const handleGenerateDocument = async () => {
      try {
        // 1. Tải file mẫu từ /public
        const response = await fetch("/handover_template.docx");
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
  
        // 2. Tạo PizZip instance từ file mẫu
        const zip = new PizZip(arrayBuffer);
  
        // 3. Khởi tạo Docxtemplater
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });
        // 4. Lấy ngày hiện tại
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1)
          .toString()
          .padStart(2, '0')}/${today.getFullYear()}`;

        // 4. Gán dữ liệu động vào file mẫu
        doc.setData({
          today: formattedDate, // Ngày hiện tại
          //// Thông tin người dùng
          currentUser: currentUser?.fullname || "Không xác định",
          currentUserTitle: currentUser?.jobTitle || "Không xác định",
          nextUser: selectedUser?.fullname || "Không xác định",
          nextUserTitle: selectedUser?.jobTitle || "Không xác định",
          //// Thông tin laptop
          laptopName: laptopData.name || "Không xác định",
          laptopSerial: laptopData.serial,
          laptopProcessor: laptopData.specs.processor,
          laptopRam: laptopData.specs.ram,
          laptopStorage: laptopData.specs.storage,
          laptopreleaseYear: laptopData.releaseYear,
          notes: notes || "Không có ghi chú.",
        });
      
        // 5. Render tài liệu
        doc.render();
  
        // 6. Tạo file output
        const output = doc.getZip().generate({ type: "blob" });
        saveAs(output, "handover_form.docx");
      } catch (error) {
        console.error("Error generating document:", error);
      }
    };
 


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-[100%] max-w-6xl p-6 rounded-lg shadow-lg relative">
        <h2 className="text-xl font-bold mb-4">Bàn giao thiết bị</h2>
        {/* <button
          onClick={handleGenerateDocument}
          className="px-3 py-1 text-sm bg-[#009483] text-white rounded hover:bg-[#006653]"
        >
          In biên bản
        </button> */}
        <div className="grid grid-cols-[2fr,3fr] gap-4">
          {/* CỘT TRÁI: Bên Giao + Bên Nhận */}
          <div className="flex flex-col w-auto space-y-4">
            {/* BÊN GIAO */}
            <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-3 text-[#002147]">Bên Giao</h3>
            <div className="bg-[#002147] text-white p-4 rounded-lg flex items-center space-x-4">
                <img
                    src={currentUser.avatarUrl || "https://via.placeholder.com/150"}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                    <p className="text-xs font-bold">{currentUser.fullname}</p>
                    <p className="text-xs text-gray-300">{currentUser.jobTitle || "Không xác định"}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{currentUser.email}</p>
                </div>
            </div>
          </div>

            {/* BÊN NHẬN */}
                <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-3 text-[#002147]">Bên Nhận</h3>
                
                {/* Tìm kiếm */}
                <div className="relative">
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  placeholder="Tìm theo tên hoặc email..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    debouncedSearch();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      console.log("Executing search with text:", searchText); // Kiểm tra khi nhấn Enter
                      handleSearch(); // Gọi hàm tìm kiếm
                    }
                  }}
                />
                      {/* Gợi ý tìm kiếm */}
                      {searchText.trim() && (
                        <div className="absolute z-10 bg-white border rounded mt-1 max-h-48 w-full overflow-y-auto shadow-lg">
                          {searchResults.length > 0 ? (
                            <ul>
                              {searchResults.map((user) => (
                                <li
                                  key={user._id}
                                  className="p-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => handleSelectUser(user)}
                                >
                                  <p className="font-bold">{user.fullname}</p>
                                  <p className="text-sm italic text-gray-600">{user.email}</p>
                                  <p className="text-sm italic text-gray-500">{user.jobTitle || "Không xác định"}</p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 p-2">Không tìm thấy kết quả nào!</p>
                          )}
                        </div>
                      )}
                    </div>

                {/* Hiển thị thông tin người nhận đã chọn */}
                {selectedUser && (
                    <div className="mt-4 bg-[#002147] text-white p-4 rounded-lg flex items-center space-x-4">
                    <img
                        src={selectedUser.avatarUrl || "https://via.placeholder.com/150"}
                        alt="Avatar"
                        className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                        <p className="text-sm font-bold">{selectedUser.fullname}</p>
                        <p className="text-xs text-gray-300">{selectedUser.jobTitle || "Không xác định"}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{selectedUser.email}</p>
                    </div>
                    </div>
                )}
                </div>
                </div>

          {/* CỘT PHẢI: Nội dung bàn giao (ghi chú) */}
          <div className="bg-gray-100 p-6 rounded-lg shadow-md">
            <p className="font-semibold mb-3">
              Thông tin bàn giao
            </p>
              {/* Block 1: Thông tin máy */}
              <div className="bg-[#E4E9EF] p-4 rounded-lg shadow-md mb-4">
                <h2 className="text-sm font-bold text-[#002147] mb-2">Thông tin máy</h2>
                  <span className="text-lg font-bold mb-6 tex-[#002147] ">
                    {laptopData.name || "N/A"}
                  </span>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                  <p>
                    <span className="text-[#757575] text-sm font-semibold">Bộ xử lý:</span> {laptopData.specs.processor || "N/A"}
                  </p>
                  <p>
                    <span className="text-[#757575] text-sm  font-semibold">RAM:</span> {laptopData.specs.ram || "N/A"}
                  </p>
                  <p>
                    <span className="text-[#757575] text-sm  font-semibold">Bộ nhớ:</span> {laptopData.specs.storage || "N/A"}
                  </p>
                  <p>
                    <span className="text-[#757575] text-sm  font-semibold">Màn hình:</span> {laptopData.specs.display || "N/A"}
                  </p>
                  <p>
                    <span className="text-[#757575] text-sm  font-semibold">Năm sản xuất:</span> {laptopData.releaseYear || "N/A"}
                  </p>
                </div>
              </div>

                {/* Block 2: Lịch sử */}
                <div className="bg-[#E4E9EF] p-4 rounded-lg shadow-md mb-4">
                  <h2 className="text-sm font-semibold mb-4">Lịch sử hoạt động</h2>
                    <table className="bg-white w-full text-xs rounded-lg shadow-md">
                    <thead className="bg-[#002147] h-8 text-white rounded-t-lg">
                      <tr>
                        <th className=" text-center uppercase font-semibold rounded-tl-lg">Tiêu đề</th>
                        <th className=" text-center uppercase font-semibold">Thời gian</th>
                        <th className=" text-center uppercase font-semibold">Kỹ thuật viên</th>
                        <th className=" text-center uppercase font-semibold rounded-tr-lg">Phân loại</th>
                      </tr>
                    </thead>
                      <tbody className="border-b border-gray-200">
                        {activityData.map((activity, index) => (
                            <tr>
                              <td className="p-2 font-semibold">
                                {activity.description || "Không có mô tả"}
                                    <p className="italic text-gray-500 text-xs mt-1">
                                      {activity.details || "Không có chi tiết"}
                                    </p>
                              </td>
                              <td className="p-2">{new Date(activity.date).toLocaleString("vi-VN")}</td>
                              <td className="p-2">{activity.updatedBy || "Không xác định"}</td>
                              <td className="p-2">
                                {activity.type === "repair" ? "Sửa chữa" : "Cập nhật phần mềm"}
                              </td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>  
                  <div className="bg-[#E4E9EF] p-4 rounded-lg shadow-md">
                    <h2 className="text-sm font-semibold mb-4">Ghi chú</h2>
                    <textarea
                      className="w-full p-2 border rounded-lg h-20"
                      placeholder="Nhập ghi chú..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
          </div>
      
    </div>
    {/* Nút action */}
    <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={onClose}
                className="px-3 py-1 text-sm bg-gray-300 text-black rounded hover:bg-gray-400"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirm}
                className="px-3 py-1 text-sm bg-[#FF5733] text-white rounded hover:bg-[#FF6B3D]"
              >
                Xác nhận
              </button>
            </div>
    </div>
    
    </div>
    
  );
};

export default HandoverModal;