import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../../config"; // import từ file config
import { FaUpload, FaXmark } from "react-icons/fa6";
import ReactDOM from "react-dom";
import { FiEdit, FiTrash2} from "react-icons/fi";
import { toast } from "react-toastify";
import Switch from "react-switch";


function FlippageAdmin({currentUser}) {
  console.log("AdminPage Loaded");
  const [selectedFile, setSelectedFile] = useState(null);
  const [customName, setCustomName] = useState("");
  const [fileList, setFileList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newCustomName, setNewCustomName] = useState("");
  const [editingFile, setEditingFile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingFile, setDeletingFile] = useState(null);
  const fileInputRef = useRef(null); // Ref cho input file
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Gọi API lấy danh sách tất cả file PDF từ MongoDB
  useEffect(() => {
    const token = localStorage.getItem("authToken"); // 🔥 Lấy token từ localStorage
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }
  
    fetch(`${API_URL}/flippage/get-all-pdfs`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`, // 🔥 Thêm token vào headers
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        console.log("🔍 API Response:", data);
        if (Array.isArray(data)) {
          setFileList(data);
        }
      })
      .catch((err) => {
        console.error("❌ Lỗi khi tải danh sách file:", err);
        toast.error("Bạn không có quyền truy cập hoặc token hết hạn.");
      });
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset giá trị input file
    }
  };

  const handleEdit = (file) => {
    setEditingFile(file);
    setNewCustomName(file.customName);
    setShowEditModal(true);
  };

  const handleUpdateCustomName = async () => {
    if (!editingFile) return;
  
    const token = localStorage.getItem("authToken"); // 🔥 Lấy token từ localStorage
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }
  
    try {
      const res = await fetch(
        `${API_URL}/flippage/update-customname/${editingFile._id}`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`, // 🔥 Thêm token vào headers
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newCustomName }),
        }
      );
  
      if (!res.ok) {
        throw new Error("Cập nhật thất bại");
      }
  
      const data = await res.json();
      console.log("✅ Cập nhật thành công:", data);
  
      setFileList((prev) =>
        prev.map((file) =>
          file._id === editingFile._id
            ? { ...file, customName: newCustomName }
            : file
        )
      );
      toast.success("Cập nhật thành công!");
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi cập nhật customName");
    }
  };

  // Khi nhấn nút xoá: mở modal xác nhận xoá
  const handleDeleteClick = (file) => {
    if (!file._id) {
      toast.error("Lỗi: Không tìm thấy ID tài liệu.");
      return;
    }
    setDeletingFile(file);
    setShowDeleteModal(true);
  };

  // Hàm gọi API xoá sau khi người dùng xác nhận
  const confirmDelete = async (id) => {
    try {
      const token = localStorage.getItem("authToken"); // 🔥 Lấy token từ localStorage
      const res = await fetch(`${API_URL}/flippage/delete-pdf/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`, // 🔥 Thêm token vào headers
          "Content-Type": "application/json",
        },
      });
      const text = await res.text();
      if (!res.ok) {
        toast.error("Xóa thất bại: " + text);
        throw new Error("Xóa thất bại: " + text);
      }
      setFileList((prev) => prev.filter((file) => file._id !== id));
      toast.success("Xóa tài liệu thành công!");
    } catch (err) {
      console.error("❌ Lỗi khi xóa tài liệu:", err);
      toast.error(err.message);
    } finally {
      setShowDeleteModal(false);
      setDeletingFile(null);
    }
  };


  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn file PDF!");
      return;
    }
  
    const token = localStorage.getItem("authToken"); // 🔥 Lấy token từ localStorage
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }
  
    const formData = new FormData();
    formData.append("pdfFile", selectedFile);
    formData.append("customName", customName);
    formData.append("uploaderID", currentUser._id);
  
    try {
      const res = await fetch(`${API_URL}/flippage/upload-pdf`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}` // 🔥 Gửi token trong headers
        },
        body: formData,
      });
  
      if (!res.ok) {
        throw new Error("Upload thất bại");
      }
  
      const data = await res.json();
      toast.success("Tải lên thành công!");
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi upload PDF");
    }
  };

  const toggleActiveStatus = async (id, newStatus) => {
    const token = localStorage.getItem("authToken"); // 🔥 Lấy token từ localStorage
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }
  
    try {
      const res = await fetch(`${API_URL}/flippage/toggle-active/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`, // 🔥 Thêm token vào headers
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: newStatus }),
      });
  
      if (!res.ok) {
        throw new Error("Không thể cập nhật trạng thái");
      }
  
      setFileList((prev) =>
        prev.map((file) =>
          file._id === id ? { ...file, active: newStatus } : file
        )
      );
      toast.success("Cập nhật trạng thái thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi cập nhật trạng thái");
    }
  };

  return (
    <div className="min-h-screen p-6">
      
      <div className="w-full h-full p-6 bg-white rounded-xl shadow-md border">
        <div className="flex flex-row justify-between items-center">
        <h2 className="font-bold text-lg mb-4">Danh sách PDF đã upload</h2>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-[#002147] text-white font-bold rounded-lg shadow-md hover:bg-[#001b33] transition-all"
        >
          Tạo mới
        </button>
        </div>
        {fileList.length > 0 ? (
          <table className="w-full">
            <thead>
            <tr className="!border-px !border-gray-400" >
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                    <p className="text-sm font-bold text-gray-500">STT
                    </p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                    <p className="text-sm font-bold text-gray-500">Tên File
                    </p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                    <p className="text-sm font-bold text-gray-500">URL
                    </p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                    <p className="text-sm font-bold text-gray-500">Ngày tạo
                    </p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">Người tạo</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">Active</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                    <p className="text-sm font-bold text-gray-500">Hành Động
                    </p>
                </th>
              </tr>
            </thead>
            <tbody>
              {fileList.map((file, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="text-[#002147] border-white/0 py-3 pr-4 ">
                    <p className="text-sm font-bold text-navy-700">{index + 1}</p>
                  </td>
                  <td className="max-w-[400px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">{file.fileName}</p>
                  </td>
                  <td className="max-w-[400px] border-white/0 py-3 pr-4">
                    <a href={`/${file.customName}`} target="_blank" rel="noopener noreferrer">
                      <p className="text-sm font-bold text-navy-700">{file.customName}</p>
                    </a>
                  </td>
                  <td className="border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">{file.uploadDate}</p>
                  </td>
                  {/* Cột Người Tạo */}
                  <td className="border-white/0 py-3 pr-4 flex items-center gap-3">
                    <img src={file.uploader?.avatar || "/default-avatar.png"} 
                        alt="Avatar" className="w-8 h-8 rounded-full border object-cover" />
                    <div>
                      <p className="text-sm font-bold text-navy-700">{file.uploader?.fullname || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{file.uploader?.email || ""}</p>
                    </div>
                  </td>

                  {/* Cột Active (Switch On/Off) */}
                  <td className="border-white/0 py-3 pr-4">
                      <Switch
                        onChange={() => toggleActiveStatus(file._id, !file.active)}
                        checked={file.active}
                        onColor="#4caf50" // Màu xanh khi bật
                        offColor="#ccc"   // Màu xám khi tắt
                        uncheckedIcon={false}
                        checkedIcon={false}
                        height={20}
                        width={40}
                      />
                    </td>
                  <td className="border-white/0 py-3 pr-4">
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(file)} 
                            className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105">
                      <FiEdit size={14} />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(file)}
                        className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg transform transition-transform duration-300 hover:scale-105"
                      >
                        <FiTrash2 size={14} />
                      </button>
                  </div>
                  </td>
                </tr>
              ))}
            </tbody>
              {showEditModal && editingFile && ReactDOM.createPortal(
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowEditModal(false)}>
                  <div className="bg-white p-6 rounded-lg shadow-lg w-1/3"
                      onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-[#002147] mb-4">Cập nhật Custom Name</h3>
                    
                    <label className="block text-gray-600 font-medium mb-2">Đường dẫn mới</label>
                    <input
                      type="text"
                      value={newCustomName}
                      onChange={(e) => setNewCustomName(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                    />

                    <div className="flex justify-end mt-4 space-x-2">
                      <button onClick={() => setShowEditModal(false)}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg">
                        Hủy
                      </button>
                      <button onClick={handleUpdateCustomName}
                              className="px-4 py-2 bg-[#002147] text-white rounded-lg">
                        Cập nhật
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

              {/* Modal xác nhận xoá */}
              {showDeleteModal &&
                deletingFile &&
                ReactDOM.createPortal(
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                      <h3 className="text-xl font-bold text-[#002147] mb-4">
                        Xác nhận xóa
                      </h3>
                      <p>
                        Bạn có chắc chắn muốn xóa tài liệu{" "}
                        <strong>{deletingFile.fileName}</strong> không?
                      </p>
                      <div className="flex justify-end mt-4 space-x-2">
                        <button
                          onClick={() => setShowDeleteModal(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => confirmDelete(deletingFile._id)}
                          className="px-4 py-2 bg-orange-red text-white rounded-lg"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
          </table>
        ) : (
          <p>Chưa có file nào được upload.</p>
        )}
        {isUploadModalOpen &&
  ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-2xl">
        <h2 className="text-xl font-bold text-[#002147] mb-4">Tải lên tài liệu PDF</h2>

        {/* Nội dung form upload */}
        <div className="flex flex-col gap-6">
          {/* Nhập đường dẫn */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Bước 1: Nhập đường dẫn</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="duong-dan-file"
              className="w-full px-4 py-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002147] focus:outline-none"
            />
            <p className="mt-2 text-sm font-semibold text-gray-600">
              Preview: <span className="text-[#002147] font-bold">
                https://360wiser.wellspring.edu.vn/{customName || "duong-dan-file"}
              </span>
            </p>
          </div>

          {/* Chọn file */}
          <div className="flex flex-col">
            <label className="block text-gray-700 font-medium mb-2">Bước 2: Chọn file</label>
            <input
              type="file"
              id="fileUpload"
              accept="application/pdf"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="fileUpload"
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-300 hover:bg-gray-200 transition-all"
            >
              <FaUpload size={16} /> Chọn tệp
            </label>
            {selectedFile && (
              <div className="flex items-center justify-between mt-2 p-2 bg-gray-50 rounded-lg border border-gray-300">
                <span className="text-gray-600 text-sm truncate">{selectedFile.name}</span>
                <button className="ml-2 text-red-500 hover:text-red-700" onClick={handleRemoveFile}>
                  <FaXmark />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nút xác nhận và đóng */}
        <div className="flex justify-end mt-6 space-x-4">
          <button
            onClick={() => setIsUploadModalOpen(false)}
            className="px-4 py-2 bg-gray-300 text-gray-700 font-bold rounded-lg"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#FF5733] text-white font-bold rounded-lg shadow-md hover:bg-[#ff6b4a] transition-all"
          >
            Tải lên
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
        </div>
    </div>

    
  );
}



export default FlippageAdmin;