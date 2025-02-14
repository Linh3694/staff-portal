import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../../config"; // import từ file config
import { FaUpload, FaXmark, FaPlus } from "react-icons/fa6";
import ReactDOM from "react-dom";
import { FiEdit, FiTrash2} from "react-icons/fi";
import { toast } from "react-toastify";
import Switch from "react-switch";


function FlippageAdmin({currentUser}) {
  console.log("AdminPage Loaded");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newCustomName, setNewCustomName] = useState("");
  const [editingFile, setEditingFile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [deletingFile, setDeletingFile] = useState(null);
  const fileInputRef = useRef(null); // Ref cho input file
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState([{ title: "", page: 1 }]);
  const [customName, setCustomName] = useState("");
  const [customNameMessage, setCustomNameMessage] = useState("");
  const [isCustomNameValid, setIsCustomNameValid] = useState(null);
  const [editBookmarks, setEditBookmarks] = useState([]);


  // Định nghĩa hàm fetchFileList (bạn có thể chuyển đoạn này lên trên cùng, bên cạnh useEffect)
  const fetchFileList = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }
    fetch(`${API_URL}/flippage/get-all-pdfs`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
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
        if (Array.isArray(data)) {
          setFileList(data);
        }
      })
      .catch((err) => {
        console.error("❌ Lỗi khi tải danh sách file:", err);
        toast.error("Bạn không có quyền truy cập hoặc token hết hạn.");
      });
  };

  // Sửa lại useEffect ban đầu để dùng fetchFileList:
  useEffect(() => {
    fetchFileList();
  }, []);

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
    setEditBookmarks(file.bookmarks ? [...file.bookmarks] : []);
    setShowEditModal(true);
  };

  const checkCustomName = async (name) => {
    if (!name.trim()) {
      setCustomNameMessage("Đường dẫn không được để trống.");
      setIsCustomNameValid(false);
      return;
    }
  
    try {
      const res = await fetch(`${API_URL}/flippage/check-customname/${encodeURIComponent(name)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });
  
      const data = await res.json();
  
      if (res.ok) {
        setCustomNameMessage(data.message);
        setIsCustomNameValid(true);
      } else {
        setCustomNameMessage(data.message);
        setIsCustomNameValid(false);
      }
    } catch (err) {
      console.error("❌ Lỗi khi kiểm tra customName:", err);
      setCustomNameMessage("Lỗi server khi kiểm tra.");
      setIsCustomNameValid(false);
    }
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
  const handlePermanentDelete = (file) => {
    if (!file._id) {
      toast.error("Lỗi: Không tìm thấy ID tài liệu.");
      return;
    }
    setDeletingFile(file);
    setShowPermanentDeleteModal(true);
  };
  
  const confirmPermanentDelete = async (id) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Bạn chưa đăng nhập!");
        return;
      }
  
      const res = await fetch(`${API_URL}/flippage/delete-permanently/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!res.ok) {
        throw new Error("Xóa vĩnh viễn thất bại!");
      }
  
      setFileList((prev) => prev.filter((file) => file._id !== id));
      toast.success("Tài liệu đã bị xóa vĩnh viễn!");
    } catch (err) {
      console.error("❌ Lỗi khi xóa vĩnh viễn tài liệu:", err);
      toast.error("Không thể xóa tài liệu!");
    } finally {
      setShowPermanentDeleteModal(false);
      setDeletingFile(null);
    }
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
      // Tạo mảng bookmarks mới, +1 vào page
    const adjustedBookmarks = bookmarks.map((bm) => ({
      ...bm,
      page: bm.page + 1,
    }));


    const formData = new FormData();
    formData.append("pdfFile", selectedFile);
    formData.append("customName", customName);
    formData.append("uploaderID", currentUser._id);
    formData.append("bookmarks", JSON.stringify(adjustedBookmarks));
    console.log(formData)
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
      fetchFileList();
      resetUploadState();
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

  const handleBookmarkChange = (index, field, value) => {
    const updatedBookmarks = [...bookmarks];
    updatedBookmarks[index][field] = value;
    setBookmarks(updatedBookmarks);
  };
  
  const addBookmark = () => {
    setBookmarks([...bookmarks, { title: "", page: 1 }]);
  };

  const handleRemoveBookmark = (index) => {
    const updatedBookmarks = bookmarks.filter((_, i) => i !== index);
    setBookmarks(updatedBookmarks);
  };

  // Cập nhật trường (title hoặc page) của bookmark trong editBookmarks
  const handleEditBookmarkChange = (index, field, value) => {
    const updated = [...editBookmarks];
    updated[index][field] = value;
    setEditBookmarks(updated);
  };  

  const handleUpdateFile = async () => {
    if (!editingFile) return;
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }
  
    try {
      // Nếu bạn có endpoint chung để update cả customName và bookmarks:
      const res = await fetch(`${API_URL}/flippage/update-pdf/${editingFile._id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customName: newCustomName,
          bookmarks: editBookmarks, 
        }),
      });
  
      if (!res.ok) {
        throw new Error("Cập nhật thất bại");
      }
  
      const data = await res.json();
      console.log("✅ Cập nhật thành công:", data);
      toast.success("Cập nhật thành công!");
  
      // Cập nhật lại fileList trong state để hiển thị thay đổi
      setFileList((prev) =>
        prev.map((file) =>
          file._id === editingFile._id
            ? { ...file, customName: newCustomName, bookmarks: editBookmarks }
            : file
        )
      );
  
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi cập nhật PDF");
    }
  };
  // Thêm mới bookmark vào editBookmarks
  const handleAddEditBookmark = () => {
    setEditBookmarks([...editBookmarks, { title: "", page: 1 }]);
  };

  // Xoá bookmark khỏi editBookmarks
  const handleRemoveEditBookmark = (index) => {
    setEditBookmarks(editBookmarks.filter((_, i) => i !== index));
  };

  const resetUploadState = () => {
    setSelectedFile(null);
    setCustomName("");
    setCustomNameMessage("");
    setIsCustomNameValid(null);
    setBookmarks([{ title: "", page: 1 }]); // Reset bookmarks về danh sách trống
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset giá trị input file
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  
    // Lấy file đầu tiên mà người dùng thả vào
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setSelectedFile(droppedFile);
      e.dataTransfer.clearData(); // Xoá dữ liệu kéo thả để tránh lỗi
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
                        onClick={() => handlePermanentDelete(file)}
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
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={() => setShowEditModal(false)}
              >
                <div
                  className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="border-b-2 border-gray-100 pb-3 mb-4">
                    <h3 className="text-xl font-bold text-[#002147]">Cập nhật PDF</h3>
                  </div>

                  {/* Trường sửa Custom Name */}
                  <div className="mb-6">
                    <label className="block text-gray-700 font-bold mb-2">Đường dẫn mới</label>
                    <input
                      type="text"
                      value={newCustomName}
                      onChange={(e) => setNewCustomName(e.target.value)}
                      className="w-full px-4 py-2 bg-[#F8F8F8] border-none  rounded-full focus:outline-none focus:ring-[#002147]"
                    />
                  </div>

                  {/* Bảng sửa Bookmarks */}
                  <h3 className="block text-gray-700 font-bold mb-2">Cập nhật Bookmarks</h3>
                  <div className="border rounded-lg overflow-hidden">
                  <table className="w-full border-collapse">
                      <thead className="bg-[#EEF1F5] border-b">
                        <tr>
                          <th className="py-2 px-4 text-left text-sm font-semibold text-[#002147]">Tiêu đề</th>
                          <th className="py-2 px-4 text-left text-sm font-semibold text-[#002147]">Số trang</th>
                          <th className="py-2 px-4 text-left text-sm font-semibold text-[#002147]"></th>
                        </tr>
                      </thead>  
                      <tbody>
                        {editBookmarks.map((bm, idx) => (
                          <tr key={idx}>
                            <td className="border-r border-b text-sm">
                              <input
                                type="text"
                                value={bm.title}
                                onChange={(e) => handleEditBookmarkChange(idx, "title", e.target.value)}
                                className="w-full px-2 py-1 border-none text-sm rounded focus:outline-none focus:ring-2 focus:ring-[#002147]"
                                placeholder="Nhập tiêu đề..."
                              />
                            </td>
                            <td className="border-r border-b text-sm max-w-sm">
                              <input
                                type="number"
                                value={bm.page}
                                onChange={(e) => handleEditBookmarkChange(idx, "page", Number(e.target.value))}
                                className="w-20 px-2 py-1 border-none rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#002147]"
                                min="1"
                              />
                            </td>
                            <td className="border-b text-center">
                              <button
                                onClick={() => handleRemoveEditBookmark(idx)}
                                className="bg-[#FF5733] text-white text-center px-2 py-1 rounded hover:bg-[#ff6b4a] transition"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Nút thêm Bookmark */}
                    <button
                      onClick={handleAddEditBookmark}
                      className="flex flex-row text-sm items-center gap-2 w-full pl-4 py-2 bg-[#EEF1F5] text-[#002147] font-semibold hover:bg-gray-200 transition"
                    >
                      <FaPlus size={12} /> Thêm Bookmark
                    </button>
                  </div>

                  {/* Nút Hủy + Lưu */}
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleUpdateFile}
                      className="px-4 py-2 bg-[#002147] text-white rounded-lg"
                    >
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
                <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-5xl">
                  <div className="border-b-2 border-gray-100">
                  <h2 className="text-xl font-bold text-[#002147] mb-4">Tải lên tài liệu PDF</h2>
                  </div>
                  {/* Nội dung form upload */}
                  <div className="flex flex-row gap-6 p-2">
                   {/* Left */}
                    <div className="w-1/2 flex flex-col space-y-4 border-r-2 border-gray-100 pr-4">
                      {/* Upload */}
                      <div className="border-b-2 border-gray-100 pb-3 mt-2">
                        <label className="block text-gray-700 font-bold">Nhập đường dẫn</label>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setCustomName(newName);
                              checkCustomName(newName);
                            }}
                            placeholder="duong-dan-file"
                            className="w-full px-4 py-2 border-none bg-[#F8F8F8] rounded-full focus:ring-2 focus:ring-[#002147] focus:outline-none"
                          />
                        <p className="mt-2 text-sm font-semibold text-gray-600">
                          Preview: <span className="text-[#002147] font-bold">
                            https://360wiser.wellspring.edu.vn/{customName || "duong-dan-file"}
                          </span>
                        </p>
                        <p className={`mt-2 mb-2 text-sm font-semibold ${isCustomNameValid === false ? "text-red-600" : isCustomNameValid === true ? "text-green-600" : "text-gray-600"}`}>
                          {customNameMessage}
                        </p>
                      </div>
                     {/* Bookmark*/}
                     <div>
                        <h2 className="text-lg font-semibold text-[#002147] mb-2">Tạo Mục lục</h2>
                        <p className="text-gray-600 text-sm mb-3">Tạo mục lục để người đọc có thể dễ dàng tìm kiếm thông tin trong tài liệu</p>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-[#EEF1F5] border-b">
                                <th className="py-2 px-4 text-left text-sm font-semibold text-[#002147]">Tiêu đề</th>
                                <th className="py-2 px-4 text-left text-sm font-semibold text-[#002147]">Số trang</th>
                                <th className="py-2 px-4 text-center text-sm font-semibold text-[#002147]"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {bookmarks.map((bookmark, index) => (
                                <tr key={index} >
                                  {/* Input Tiêu đề */}
                                  <td className="border-r border-b">
                                    <input
                                      type="text"
                                      value={bookmark.title}
                                      onChange={(e) => handleBookmarkChange(index, "title", e.target.value)}
                                      placeholder="Nhập tiêu đề..."
                                      className="w-full px-2 py-1 border-none rounded focus:outline-none focus:ring-2 focus:ring-[#002147]"
                                    />
                                  </td>

                                  {/* Input Số trang */}
                                  <td className="border-r border-b">
                                    <input
                                      type="number"
                                      value={bookmark.page}
                                      onChange={(e) => handleBookmarkChange(index, "page", parseInt(e.target.value, 10))}
                                      min="1"
                                      className="w-20 px-2 py-1 border-none rounded text-center focus:outline-none focus:ring-2 focus:ring-[#002147]"
                                    />
                                  </td>

                                  {/* Nút Xóa */}
                                  <td className="px-2 py-2 text-center border-b">
                                    <button
                                      onClick={() => handleRemoveBookmark(index)}
                                      className="bg-[#FF5733] text-white px-1 py-1 rounded hover:bg-[#ff6b4a] transition"
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Nút Thêm Mới */}
                          <button
                            onClick={addBookmark}
                            className="flex flex-row items-center gap-2 pl-5 w-full py-3 bg-[#EEF1F5] text-[#002147] font-semibold hover:bg-gray-200 transition"
                          >
                            <FaPlus size={12} /> Thêm mới
                          </button>
                        </div>
                      </div>
                  </div>
                  {/* Right */}
                  <div className="w-1/2 flex flex-col gap-6">
                    {/* Chọn file */}
                    <div className="mt-2 space-y-3">
                      <label className="block text-gray-700 font-bold">Chọn file</label>
                      <h2 className="text-[#002147] font-semibold">File PDF</h2>
                      <div
                          className="relative flex flex-col items-center justify-center border-dashed border-2 border-gray-300 bg-[#F8F8F8] p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                          onClick={() => fileInputRef.current.click()}
                          onDragOver={handleDragOver}   // Cho phép thả vào khu vực này
                          onDrop={handleDrop}           // Xử lý khi người dùng thả file
                        >
                          <div className="w-full flex flex-row items-start gap-2">
                            <img src={`/pdf/upload.png`} alt="upload icon"/>
                            <div className="w-full flex flex-col items-start justify-between gap-2">
                              <p className="text-gray-600 text-sm">Kéo thả hoặc chọn tệp từ máy tính</p>
                              <div className="w-full flex flex-row items-center justify-between">
                                <p className="text-gray-400 text-xs">Định dạng hỗ trợ: PDF</p>
                                <p className="text-gray-400 text-xs">Dung lượng tối đa: 50mb</p>
                              </div>
                            </div>
                          </div>

                          {/* Input file ẩn */}
                          <input
                            type="file"
                            accept="application/pdf"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </div>

                      {/* Hiển thị file đã chọn */}
                      {selectedFile && (
                        <div className="flex items-center justify-between mt-3 p-3 bg-[#E4E9EF] rounded-lg">
                          <div className="w-full flex flex-row justify-between items-center">
                            <a href="#" className="text-[#002147] font-medium truncate max-w-[200px]">
                              {selectedFile.name}
                            </a>
                            <p className="text-gray-500 text-sm">Size: {(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                          
                          <button className="ml-2 text-red-500 hover:text-red-700" onClick={handleRemoveFile}>
                            <FaXmark />
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Chọn back */}
                  </div> 
                  </div>

                  
                  {/* Nút xác nhận và đóng */}
                  <div className="flex justify-end mt-6 space-x-4">
                  <button
                    onClick={() => {
                      resetUploadState();
                      setIsUploadModalOpen(false);
                    }}
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
          {showPermanentDeleteModal && deletingFile && ReactDOM.createPortal(
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Xác nhận xóa vĩnh viễn</h3>
                <p>Bạn có chắc chắn muốn **xoá vĩnh viễn** tài liệu <strong>{deletingFile.fileName}</strong>?<br />Thao tác này không thể hoàn tác!</p>
                <div className="flex justify-end mt-4 space-x-2">
                  <button onClick={() => setShowPermanentDeleteModal(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg">Hủy</button>
                  <button onClick={() => confirmPermanentDelete(deletingFile._id)}
                          className="px-4 py-2 bg-[#FF5733] text-white rounded-lg">Xóa vĩnh viễn</button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
    </div>

    
  );
}



export default FlippageAdmin;