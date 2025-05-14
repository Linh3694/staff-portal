import React, { useState, useEffect, useRef } from "react";
import { API_URL, BASE_URL } from "../../core/config";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";

// ------------------- CÁC SUB-COMPONENT ------------------- //

// 1) DocumentType - Phân loại tài liệu
function DocumentType() {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  // Dùng để edit inline
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const fetchData = () => {
    fetch(`${API_URL}/libraries/document-types`)
      .then((res) => res.json())
      .then(setData)
      .catch((error) => {
        console.error("Error fetching document types:", error);
      });
  };

  useEffect(fetchData, []);

  // Khi bấm Edit, bật chế độ editing
  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditName(item.name);
    setEditCode(item.code);
  };

  // Khi bấm Save, gọi API PUT
  const handleSaveEdit = (id) => {
    fetch(`${API_URL}/libraries/document-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, code: editCode }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi cập nhật document type");
        }
        return res.json();
      })
      .then(() => {
        setEditingId(null);
        fetchData();
      })
      .catch((error) => {
        console.error("Error updating document type:", error);
        toast.error(error.message);
      });
  };

  // Khi bấm Cancel
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // Tạo mới DocumentType
  const handleCreate = () => {
    if (!name || !code) return;
    fetch(`${API_URL}/libraries/document-types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi tạo document type");
        }
        return res.json();
      })
      .then(() => {
        setName("");
        setCode("");
        fetchData();
      })
      .catch((error) => {
        console.error("Error creating document type:", error);
        toast.error(error.message);
      });
  };

  const handleDelete = (item) => {
    fetch(`${API_URL}/libraries/document-types/${item._id}`, {
      method: "DELETE",
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi xóa document type");
        }
        return res.json();
      })
      .then(fetchData)
      .catch((error) => {
        console.error("Error deleting document type:", error);
        toast.error(error.message);
      });
  };

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-4 border">
        <h2 className="text-[24px] font-bold">Phân loại tài liệu</h2>
        <div className="flex gap-2 items-center justify-center text-sm">
          <label className="text-sm">Tên:</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên đầu mục..."
            className="border border-gray-200 px-2 py-1 rounded-2xl text-sm"
          />

          <label className="text-sm">Mã:</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Nhập mã đầu mục..."
            className="border border-gray-200 px-2 py-1 rounded-2xl text-sm"
          />
          <button
            onClick={handleCreate}
            className="px-3 py-1 bg-[#002147] text-sm font-bold text-white rounded-lg hover:bg-[#001635]"
          >
            Thêm mới
          </button>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">STT</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">TÊN ĐẦU MỤC</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">MÃ</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-end">
              <p className="text-sm font-bold text-gray-600">HÀNH ĐỘNG</p>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => {
            const isEditing = editingId === item._id;
            return (
              <tr key={item._id}>
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">{idx + 1}</p>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  {isEditing ? (
                    <input
                      className="border border-gray-300 px-2 py-1 rounded-2xl text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-bold text-navy-700">
                      {item.name}
                    </p>
                  )}
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  {isEditing ? (
                    <input
                      className="border border-gray-300 px-2 py-1 rounded-2xl text-sm"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-bold text-navy-700">
                      {item.code}
                    </p>
                  )}
                </td>

                <td className="max-w-[150px] border-white/0 py-3 pr-4 justify-end">
                  <div className="flex justify-end space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(item._id)}
                          className="flex items-center justify-center px-2 py-1 text-sm text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center justify-center px-2 py-1 text-sm text-white bg-orange-red rounded-lg  transform transition-transform duration-300 hover:scale-105"
                        >
                          Huỷ
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiEdit size={14} />
                        </button>
                        <button
                          className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg  transform transition-transform duration-300 hover:scale-105"
                          onClick={() => handleDelete(item)}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ------------------- COMPONENT SeriesName ------------------- //

// Updated SeriesName Component
function SeriesName() {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  // Dùng để edit inline
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const fetchData = () => {
    fetch(`${API_URL}/libraries/series-names`)
      .then((res) => res.json())
      .then(setData)
      .catch((error) => {
        console.error("Error fetching series names:", error);
      });
  };

  useEffect(fetchData, []);

  const handleCreate = () => {
    if (!name) return;
    fetch(`${API_URL}/libraries/series-names`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi tạo series name");
        }
        return res.json();
      })
      .then(() => {
        setName("");
        fetchData();
      })
      .catch((error) => {
        console.error("Error creating series name:", error);
        toast.error(error.message);
      });
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditName(item.name);
  };

  const handleSaveEdit = (id) => {
    fetch(`${API_URL}/libraries/series-names/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi cập nhật series name");
        }
        return res.json();
      })
      .then(() => {
        setEditingId(null);
        fetchData();
      })
      .catch((error) => {
        console.error("Error updating series name:", error);
        toast.error(error.message);
      });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = (item) => {
    fetch(`${API_URL}/libraries/series-names/${item._id}`, {
      method: "DELETE",
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi xóa series name");
        }
        return res.json();
      })
      .then(fetchData)
      .catch((error) => {
        console.error("Error deleting series name:", error);
        toast.error(error.message);
      });
  };

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-4">
        <h2 className="text-[24px] font-bold">Tùng thư</h2>
        <div className="flex gap-2 items-center justify-center text-sm">
          <label className="text-sm">Tên:</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên tùng thư..."
            className="border border-gray-200 px-2 py-1 rounded-2xl text-sm"
          />
          <button
            onClick={handleCreate}
            className="px-3 py-1 bg-[#002147] text-sm font-bold text-white rounded-lg hover:bg-[#001635]"
          >
            Thêm mới
          </button>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="border-b border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">STT</p>
            </th>
            <th className="border-b border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">TÊN TÙNG THƯ</p>
            </th>
            <th className="border-b border-gray-200 pt-4 pb-2 pr-4 text-end">
              <p className="text-sm font-bold text-gray-600">HÀNH ĐỘNG</p>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => {
            const isEditing = editingId === item._id;
            return (
              <tr key={item._id}>
                <td className="py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">{idx + 1}</p>
                </td>
                <td className="py-3 pr-4">
                  {isEditing ? (
                    <input
                      className="border border-gray-300 px-2 py-1 rounded-xl text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-bold text-navy-700">
                      {item.name}
                    </p>
                  )}
                </td>
                <td className="py-3 pr-4 text-right">
                  <div className="flex justify-end space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(item._id)}
                          className="px-2 py-1 text-sm text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 text-sm text-white bg-orange-red rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          Huỷ
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-7 h-7 flex items-center justify-center text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="w-7 h-7 flex items-center justify-center text-white bg-orange-red rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ------------------- COMPONENT SpecialCode ------------------- //
function SpecialCode() {
  const [data, setData] = useState([]);
  // State cho tạo mới Special Code (bao gồm cả name và code)
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  // State cho inline editing
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const fetchData = () => {
    fetch(`${API_URL}/libraries/special-codes`)
      .then((res) => res.json())
      .then(setData)
      .catch((error) => {
        console.error("Error fetching special codes:", error);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tạo mới SpecialCode
  const handleCreate = () => {
    if (!newName.trim() || !newCode.trim()) return;
    fetch(`${API_URL}/libraries/special-codes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), code: newCode.trim() }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi tạo special code");
        }
        return res.json();
      })
      .then(() => {
        setNewName("");
        setNewCode("");
        fetchData();
      })
      .catch((error) => {
        console.error("Error creating special code:", error);
        toast.error(error.message);
      });
  };

  // Bật chế độ Edit
  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditName(item.name);
    setEditCode(item.code);
  };

  // Lưu thay đổi sau khi edit
  const handleSaveEdit = (id) => {
    fetch(`${API_URL}/libraries/special-codes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, code: editCode }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi cập nhật special code");
        }
        return res.json();
      })
      .then(() => {
        setEditingId(null);
        fetchData();
      })
      .catch((error) => {
        console.error("Error updating special code:", error);
        toast.error(error.message);
      });
  };

  // Hủy bỏ chế độ Edit
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // Xóa SpecialCode
  const handleDelete = (item) => {
    fetch(`${API_URL}/libraries/special-codes/${item._id}`, {
      method: "DELETE",
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi xóa special code");
        }
        return res.json();
      })
      .then(() => {
        fetchData();
      })
      .catch((error) => {
        console.error("Error deleting special code:", error);
        toast.error(error.message);
      });
  };

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-4">
        <h2 className="text-[24px] font-bold">Đăng kí cá biệt</h2>
        <div className="flex gap-2 items-center justify-center text-sm">
          <label className="text-sm">Tên:</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nhập tên..."
            className="border border-gray-200 px-2 py-1 rounded-2xl text-sm"
          />
          <label className="text-sm">Mã:</label>

          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Nhập mã cá biệt..."
            className="border border-gray-200 px-2 py-1 rounded-2xl text-sm"
          />
          <button
            onClick={handleCreate}
            className="px-3 py-1 bg-[#002147] text-sm font-bold text-white rounded-lg hover:bg-[#001635]"
          >
            Thêm mới
          </button>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">STT</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">TÊN</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">MÃ</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-end">
              <p className="text-sm font-bold text-gray-600">HÀNH ĐỘNG</p>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => {
            const isEditing = editingId === item._id;
            return (
              <tr key={item._id}>
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">{idx + 1}</p>
                </td>
                <td className="min-w-[150px] font-bold border-white/0 py-3 pr-4">
                  {isEditing ? (
                    <input
                      className="border border-gray-300 px-2 py-1 font-bold rounded-2xl text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-bold  text-navy-700">
                      {item.name}
                    </p>
                  )}
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  {isEditing ? (
                    <input
                      className="border border-gray-300 px-2 py-1 rounded-2xl text-sm"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-bold text-navy-700">
                      {item.code}
                    </p>
                  )}
                </td>
                <td className="max-w-[150px] border-white/0 py-3 pr-4 justify-end">
                  <div className="flex justify-end space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(item._id)}
                          className="flex items-center justify-center px-2 py-1 text-sm text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center justify-center px-2 py-1 text-sm text-white bg-orange-red rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          Huỷ
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

///// ĐẦU SÁCH COMPONENT /////
function LibraryInformation() {
  const [libraries, setLibraries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" hoặc "edit"

  const [currentLibrary, setCurrentLibrary] = useState({
    authors: [],
    title: "",
    coverImage: "",
    category: "",
    language: "",
    description: "",
    documentType: "",
    specialCode: "",
    seriesName: "",
  });

  // Quản lý file ảnh bìa
  const coverImageInputRef = useRef(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);

  // Lấy danh sách Library
  const fetchLibraries = () => {
    fetch(`${API_URL}/libraries`)
      .then((res) => res.json())
      .then(setLibraries)
      .catch((err) => console.error("Error fetching libraries:", err));
  };

  useEffect(() => {
    fetchLibraries();
  }, []);

  // ========================= Mở modal tạo/sửa =========================
  const openCreateModal = () => {
    setModalMode("create");
    setCurrentLibrary({
      authors: [],
      title: "",
      coverImage: "",
      category: "",
      language: "",
      description: "",
      documentType: "",
      specialCode: "",
      seriesName: "",
    });
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (library) => {
    setModalMode("edit");
    // Gộp authors[] -> authors string
    setCurrentLibrary({
      ...library,
      authors: library.authors || [],
      documentType: library.documentType || "",
      specialCode: library.specialCode || "",
      seriesName: library.seriesName || "",
    });
    if (library.coverImage) {
      // Hiển thị ảnh bìa cũ
      setCoverImageFile(null);
      setCoverImagePreview(`${BASE_URL}/${library.coverImage}`);
      // hoặc library.coverImage nếu nó đã là URL đầy đủ
    } else {
      setCoverImageFile(null);
      setCoverImagePreview(null);
    }
    setIsModalOpen(true);
  };

  // ========================= Nhập dữ liệu trong modal =========================
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setCurrentLibrary((prev) => ({ ...prev, [name]: value }));
  };

  // ========================= Lưu (Create/Update) =========================
  const handleModalSave = async () => {
    try {
      // Chuẩn bị FormData cho các trường dữ liệu cần gửi (chỉ cho upload file)
      const formData = new FormData();
      if (coverImageFile) {
        formData.append("file", coverImageFile);
      }

      if (modalMode === "create") {
        // Nếu ở chế độ tạo mới, gửi tất cả dữ liệu (có FormData nếu có file ảnh)
        // Bạn có thể giữ nguyên branch này nếu nó hoạt động đúng
        // Lưu ý: Khi tạo mới, dữ liệu được gửi dưới dạng FormData
        // Nếu bạn đã đảm bảo backend nhận FormData cho tạo mới, thì không cần thay đổi gì.
        // Ví dụ:
        formData.append(
          "authors",
          Array.isArray(currentLibrary.authors)
            ? currentLibrary.authors.join(",")
            : currentLibrary.authors
        );
        formData.append("title", currentLibrary.title);
        formData.append("category", currentLibrary.category);
        formData.append("language", currentLibrary.language);
        formData.append("documentType", currentLibrary.documentType);
        formData.append("specialCode", currentLibrary.specialCode);
        formData.append("seriesName", currentLibrary.seriesName);
        formData.append("description", currentLibrary.description);

        const res = await fetch(`${API_URL}/libraries`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Error creating library");
          return;
        }
      } else {
        // Chế độ edit: cập nhật record cũ
        // 1) Lấy Library gốc để biết giá trị hiện tại của coverImage
        const oldLibRes = await fetch(
          `${API_URL}/libraries/${currentLibrary._id}`
        );
        const oldLib = await oldLibRes.json();
        if (!oldLibRes.ok) {
          toast.error("Không tìm thấy Library cần sửa");
          return;
        }
        let updatedCover = oldLib.coverImage || "";

        // 2) Nếu có file ảnh mới, gọi endpoint upload riêng (chỉ upload file, không tạo record mới)
        if (coverImageFile) {
          const uploadRes = await fetch(
            `${API_URL}/libraries/${currentLibrary._id}`,
            {
              method: "PUT",
              body: formData,
            }
          );
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.filePath) {
            updatedCover = uploadData.filePath;
          } else {
            toast.error("Upload coverImage thất bại!");
            return;
          }
        }

        // 3) Chuẩn bị payload JSON cho PUT (các trường text)
        // Chuyển authors về dạng mảng
        const authorsArr = Array.isArray(currentLibrary.authors)
          ? currentLibrary.authors
          : currentLibrary.authors
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean);
        const payload = {
          authors: authorsArr,
          title: currentLibrary.title,
          category: currentLibrary.category,
          language: currentLibrary.language,
          description: currentLibrary.description,
          documentType: currentLibrary.documentType,
          specialCode: currentLibrary.specialCode,
          seriesName: currentLibrary.seriesName,
          coverImage: updatedCover,
        };

        // 4) Gửi PUT request cập nhật Library record cũ
        const updateRes = await fetch(
          `${API_URL}/libraries/${currentLibrary._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const updateData = await updateRes.json();
        if (!updateRes.ok) {
          toast.error(updateData.error || "Error updating library");
          return;
        }
      }

      setIsModalOpen(false);
      fetchLibraries();
      toast.success("Lưu library thành công!");
    } catch (err) {
      console.error("Error saving library:", err);
      toast.error("Error saving library");
    }
  };

  // ========================= Xoá Library =========================
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/libraries/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error deleting library");
      } else {
        fetchLibraries();
      }
    } catch (err) {
      console.error("Error deleting library:", err);
    }
  };

  return (
    <div>
      {/* Nút tạo mới */}
      <div className="flex flex-row items-center justify-between mb-4">
        <h2 className="text-[24px] font-bold">Đầu sách</h2>
        <button
          onClick={openCreateModal}
          className="px-3 py-1 bg-[#002147] text-sm font-bold text-white rounded-lg hover:bg-[#001635]"
        >
          Thêm mới
        </button>
      </div>

      {/* Bảng hiển thị Đầu sách */}
      <table className="w-full">
        <thead>
          <tr>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-start text-sm font-bold text-gray-600">
              Mã định danh
            </th>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-start text-sm font-bold text-gray-600">
              Tên sách
            </th>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-start text-sm font-bold text-gray-600">
              Tác giả
            </th>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-start text-sm font-bold text-gray-600">
              Thể loại
            </th>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-start text-sm font-bold text-gray-600">
              Ngôn ngữ
            </th>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-start text-sm font-bold text-gray-600">
              Mô tả
            </th>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-end text-sm font-bold text-gray-600">
              HÀNH ĐỘNG
            </th>
          </tr>
        </thead>
        <tbody>
          {libraries.map((lib, idx) => (
            <tr key={lib._id}>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">
                  {" "}
                  {lib.libraryCode}
                </p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">{lib.title}</p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">
                  {lib.authors?.join(", ")}
                </p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">
                  {lib.category}
                </p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">
                  {lib.language}
                </p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">
                  {lib.description}
                </p>
              </td>
              <td className="py-2 px-3 font-semibold text-right">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => openEditModal(lib)}
                    className="flex items-center justify-center px-2 py-1 text-sm text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(lib._id)}
                    className="flex items-center justify-center px-2 py-1 text-sm text-white bg-orange-red rounded-lg transform transition-transform duration-300 hover:scale-105"
                  >
                    Xoá
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Tạo/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-[20px] p-6 w-[60%]">
            <h3 className="text-xl font-bold mb-4">
              {modalMode === "create"
                ? "Tạo mới đầu sách"
                : "Chỉnh sửa đầu sách"}
            </h3>
            <div className="flex gap-4">
              {/* Left Column */}
              <div className="flex-1">
                <div className="mb-3">
                  <label className="block mb-1">
                    Tên sách <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Nhập tên sách..."
                    value={currentLibrary.title}
                    onChange={handleModalChange}
                    className="w-full border border-gray-300 px-2 py-1 rounded-xl"
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1">Tác giả:</label>
                  <AuthorSelector
                    selectedAuthors={currentLibrary.authors}
                    onChange={(newAuthors) =>
                      setCurrentLibrary((prev) => ({
                        ...prev,
                        authors: newAuthors,
                      }))
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1">Thể loại:</label>
                  <input
                    type="text"
                    name="category"
                    placeholder="Nhập thể loại..."
                    value={currentLibrary.category}
                    onChange={handleModalChange}
                    className="w-full border border-gray-300 px-2 py-1 rounded-xl"
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1">Ngôn ngữ:</label>
                  <input
                    type="text"
                    name="language"
                    placeholder="Nhập ngôn ngữ..."
                    value={currentLibrary.language}
                    onChange={handleModalChange}
                    className="w-full border border-gray-300 px-2 py-1 rounded-xl"
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1">Mô tả:</label>
                  <textarea
                    name="description"
                    placeholder="Nhập mô tả..."
                    value={currentLibrary.description}
                    onChange={handleModalChange}
                    rows="3"
                    className="w-full border border-gray-300 px-2 py-1 rounded-xl"
                  />
                </div>
              </div>
              {/* Right Column */}
              <div className="flex-1">
                {" "}
                {/* Các trường mới */}
                <div className="mb-3">
                  <AutoCompleteSelect
                    label="Phân loại tài liệu:"
                    name="documentType"
                    selectedValue={currentLibrary.documentType}
                    onChange={(val) =>
                      setCurrentLibrary((prev) => ({
                        ...prev,
                        documentType: val,
                      }))
                    }
                    fetchUrl={`${API_URL}/libraries/document-types`}
                    placeholder="Chọn phân loại tài liệu..."
                  />
                </div>
                <div className="mb-3">
                  <AutoCompleteSelect
                    label="Quy ước sách:"
                    name="specialCode"
                    selectedValue={currentLibrary.specialCode}
                    onChange={(val) =>
                      setCurrentLibrary((prev) => ({
                        ...prev,
                        specialCode: val,
                      }))
                    }
                    fetchUrl={`${API_URL}/libraries/special-codes`}
                    placeholder="Chọn quy ước sách..."
                  />
                </div>
                <div className="mb-3">
                  <AutoCompleteSelect
                    label="Tùng thư:"
                    name="seriesName"
                    selectedValue={currentLibrary.seriesName}
                    onChange={(val) =>
                      setCurrentLibrary((prev) => ({
                        ...prev,
                        seriesName: val,
                      }))
                    }
                    fetchUrl={`${API_URL}/libraries/series-names`}
                    placeholder="Chọn tùng thư..."
                  />
                </div>
                <div>
                  <label className="block mb-1">Ảnh bìa:</label>
                  <div
                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 bg-gray-50 text-center text-gray-500 cursor-pointer hover:border-[#002147] transition mt-2"
                    onClick={() =>
                      coverImageInputRef.current &&
                      coverImageInputRef.current.click()
                    }
                  >
                    {coverImagePreview ? (
                      <img
                        src={coverImagePreview}
                        alt="Preview"
                        className="h-32 object-contain"
                      />
                    ) : (
                      <>
                        <p className="text-sm font-medium">
                          Kéo thả hoặc chọn ảnh bìa từ máy tính
                        </p>
                        <p className="text-xs italic mt-1">
                          Định dạng hỗ trợ: <b>.jpg, .jpeg, .png</b>
                        </p>
                      </>
                    )}
                    <input
                      ref={coverImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setCoverImageFile(file);
                        setCoverImagePreview(URL.createObjectURL(file));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1 bg-gray-400 text-white rounded-lg text-base font-semibold transform transition-transform duration-300 hover:scale-105"
              >
                Huỷ
              </button>
              <button
                onClick={handleModalSave}
                className="px-3 py-1 bg-[#002147] text-white rounded-lg text-base font-semibold transform transition-transform duration-300 hover:scale-105"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ------------------- COMPONENT Authors ------------------- //

function AuthorList() {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const fetchData = () => {
    fetch(`${API_URL}/libraries/authors`)
      .then((res) => res.json())
      .then(setData)
      .catch((error) => {
        console.error("Error fetching authors:", error);
      });
  };

  useEffect(fetchData, []);

  const handleCreate = () => {
    if (!name) return;
    fetch(`${API_URL}/libraries/authors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi tạo tác giả");
        }
        return res.json();
      })
      .then(() => {
        setName("");
        fetchData();
      })
      .catch((error) => {
        console.error("Error creating author:", error);
        toast.error(error.message);
      });
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditName(item.name);
  };

  const handleSaveEdit = (id) => {
    fetch(`${API_URL}/libraries/authors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi cập nhật tác giả");
        }
        return res.json();
      })
      .then(() => {
        setEditingId(null);
        fetchData();
      })
      .catch((error) => {
        console.error("Error updating author:", error);
        toast.error(error.message);
      });
  };

  const handleDelete = (item) => {
    fetch(`${API_URL}/libraries/authors/${item._id}`, {
      method: "DELETE",
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi xóa tác giả");
        }
        return res.json();
      })
      .then(fetchData)
      .catch((error) => {
        console.error("Error deleting author:", error);
        toast.error(error.message);
      });
  };

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-4">
        <h2 className="text-[24px] font-bold">Danh sách tác giả</h2>
        <div className="flex gap-2 items-center justify-center text-sm">
          <label className="text-sm">Tên:</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên tác giả..."
            className="border border-gray-200 px-2 py-1 rounded-2xl text-sm"
          />
          <button
            onClick={handleCreate}
            className="px-3 py-1 bg-[#002147] text-sm font-bold text-white rounded-lg hover:bg-[#001635]"
          >
            Thêm mới
          </button>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="border-b border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">STT</p>
            </th>
            <th className="border-b border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">TÊN TÁC GIẢ</p>
            </th>
            <th className="border-b border-gray-200 pt-4 pb-2 pr-4 text-end">
              <p className="text-sm font-bold text-gray-600">HÀNH ĐỘNG</p>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => {
            const isEditing = editingId === item._id;
            return (
              <tr key={item._id}>
                <td className="py-3 pr-4">
                  <p className="text-sm font-semibold text-navy-700">
                    {idx + 1}
                  </p>
                </td>
                <td className="py-3 pr-4">
                  {isEditing ? (
                    <input
                      className="border border-gray-300 px-2 py-1 rounded-2xl text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-navy-700">
                      {item.name}
                    </p>
                  )}
                </td>
                <td className="py-3 pr-4 text-right">
                  <div className="flex justify-end space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(item._id)}
                          className="px-2 py-1 text-sm text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-sm text-white bg-orange-red rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          Huỷ
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-7 h-7 flex items-center justify-center text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="w-7 h-7 flex items-center justify-center text-white bg-orange-red rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ------------------- COMPONENT BookDetail ------------------- //
function BookDetail() {
  const [libraryList, setLibraryList] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(null);

  // Tìm kiếm Library
  const [librarySearchTerm, setLibrarySearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Danh sách Book => hiển thị books của selectedLibrary
  const [allBooks, setAllBooks] = useState([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentBook, setCurrentBook] = useState({
    isbn: "",
    documentIdentifier: "",
    bookTitle: "",
    classificationSign: "",
    publisherPlaceName: "",
    publisherName: "",
    publishYear: "",
    pages: "",
    attachments: [],
    documentType: "",
    coverPrice: "",
    language: "",
    catalogingAgency: "",
    storageLocation: "",
    seriesName: "",
  });

  // Hàm fetchAllBooks (có sẵn trong code)
  const fetchAllBooks = () => {
    fetch(`${API_URL}/libraries/books`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Tất cả sách:", data);
        setAllBooks(data); // Lưu toàn bộ sách vào state
      })
      .catch((error) => {
        console.error("Lỗi khi lấy tất cả sách:", error);
      });
  };

  // Gọi khi component mount
  useEffect(() => {
    fetchAllBooks();
  }, []);

  // Lấy toàn bộ Library => cho tính năng search
  useEffect(() => {
    fetch(`${API_URL}/libraries`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLibraryList(data);
        }
      })
      .catch((err) => console.error("Error fetching library list:", err));
  }, []);

  // ============== Search Library: Hiển thị 5 match ==============
  const handleLibrarySearch = (term) => {
    setLibrarySearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      setSelectedLibrary(null);
      return;
    }
    const lower = term.toLowerCase();
    const matched = libraryList
      .filter((lib) => lib.title.toLowerCase().includes(lower))
      .slice(0, 5);
    setSearchResults(matched);
  };

  // Khi chọn 1 library trong gợi ý
  const handleSelectLibrary = (lib) => {
    setSelectedLibrary(lib);
    setLibrarySearchTerm(lib.title);
    setSearchResults([]);
  };

  // ============== Tạo mới Book ==============
  const openCreateModal = () => {
    setModalMode("create");
    setCurrentBook({
      isbn: "",
      documentIdentifier: "",
      bookTitle: "",
      classificationSign: "",
      publisherPlaceName: "",
      publisherName: "",
      publishYear: "",
      pages: "",
      attachments: [],
      documentType: "",
      coverPrice: "",
      language: "",
      catalogingAgency: "",
      storageLocation: "",
      seriesName: "",
    });
    setIsModalOpen(true);
  };

  // ============== Sửa Book ==============
  const openEditModal = (book, idx) => {
    setModalMode("edit");
    setCurrentBook({
      ...book,
      _index: idx, // để biết index khi update
    });
    setIsModalOpen(true);
  };

  // ============== Nhập form trong modal ==============
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentBook((prev) => ({ ...prev, [name]: value }));
  };

  // ============== Lưu Book (Create/Edit) ==============
  // Tạo/sửa 1 book
  const handleSaveModal = async () => {
    if (!selectedLibrary) {
      toast.error("Vui lòng chọn Library trước!");
      return;
    }

    try {
      // Chuẩn bị data
      let newAttachments = currentBook.attachments;
      if (typeof newAttachments === "string") {
        newAttachments = newAttachments
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      }

      const payload = {
        ...currentBook,
        attachments: newAttachments,
        publishYear: currentBook.publishYear
          ? Number(currentBook.publishYear)
          : null,
        pages: currentBook.pages ? Number(currentBook.pages) : null,
        coverPrice: currentBook.coverPrice
          ? Number(currentBook.coverPrice)
          : null,
      };

      if (modalMode === "create") {
        // Tạo mới (POST /libraries/:libraryId/books)
        const res = await fetch(
          `${API_URL}/libraries/${selectedLibrary._id}/books`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Error adding new book");
          return;
        }
        setSelectedLibrary(data); // data = library sau khi thêm book
      } else {
        // Chỉnh sửa (PUT /libraries/:libraryId/books/:bookIndex)
        const bookIndex = currentBook._index;
        if (bookIndex == null) {
          toast.error("Không xác định index của book để sửa");
          return;
        }

        const res = await fetch(
          `${API_URL}/libraries/${selectedLibrary._id}/books/${bookIndex}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Error updating book");
          return;
        }
        setSelectedLibrary(data); // data = library sau khi update
      }

      setIsModalOpen(false);
      toast.success("Lưu sách thành công!");
      fetchAllBooks(); // Cập nhật lại danh sách books
    } catch (err) {
      console.error("Error saving book:", err);
      toast.error("Error saving book");
    }
  };

  // ============== Xoá Book ==============
  const handleDelete = async (idx) => {
    const book = allBooks[idx];
    if (!book || !book.generatedCode) {
      toast.error("Không tìm thấy mã sách để xoá");
      return;
    }

    try {
      // Xoá 1 book theo mã (DELETE /libraries/books/:bookCode)
      const res = await fetch(
        `${API_URL}/libraries/books/${book.generatedCode}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Lỗi khi xoá sách");
        return;
      }

      toast.success("Xoá sách thành công!");
      fetchAllBooks(); // Reload lại danh sách
    } catch (err) {
      console.error("Lỗi khi xoá sách:", err);
      toast.error("Lỗi khi xoá sách");
    }
  };

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-4">
        <h2 className="text-[24px] font-bold">Sách</h2>
        <button
          onClick={openCreateModal}
          className="px-3 py-1 bg-[#002147] text-sm font-bold text-white rounded-lg hover:bg-[#001635]"
        >
          Thêm mới
        </button>
      </div>

      {/* Bảng Books */}
      <table className="w-full">
        <thead>
          <tr>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-start text-sm font-bold text-gray-600">
              Mã sách
            </th>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-start text-sm font-bold text-gray-600">
              ISBN
            </th>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-start text-sm font-bold text-gray-600">
              Tên Sách
            </th>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-center text-sm font-bold text-gray-600">
              Năm XB
            </th>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-center text-sm font-bold text-gray-600">
              Tình trạng
            </th>
            <th className="border-b-[1px] border-gray-200 py-2 px-3 text-end text-sm font-bold text-gray-600">
              HÀNH ĐỘNG
            </th>
          </tr>
        </thead>
        <tbody>
          {allBooks.map((b, idx) => (
            <tr key={idx}>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">
                  {b.generatedCode}
                </p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">{b.isbn}</p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">{b.bookTitle}</p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4 text-center">
                <p className="text-sm font-bold text-navy-700">
                  {b.publishYear}
                </p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4 text-center">
                <p className="text-sm font-bold text-navy-700">{b.status}</p>
              </td>
              <td className="py-2 px-3 font-semibold text-right">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => openEditModal(b, idx)}
                    className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                  >
                    <FiEdit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(idx)}
                    className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg transform transition-transform duration-300 hover:scale-105"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {allBooks.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-sm text-gray-500">
                Hiện chưa có sách nào trong hệ thống
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Create/Edit Book */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-[20px] p-8 w-[40%] max-h-[93%]">
            <h3 className="text-xl font-bold mb-4">
              {modalMode === "create" ? "Thêm sách mới" : "Chỉnh sửa sách"}
            </h3>
            <div className="w-full flex flex-row items-start gap-4">
              <div className="flex-1">
                <label className="block mb-1">
                  Chọn Đầu Sách <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                  placeholder="Nhập đầu sách..."
                  value={librarySearchTerm}
                  onChange={(e) => handleLibrarySearch(e.target.value)}
                  disabled={modalMode === "edit"}
                />
                {searchResults.length > 0 && (
                  <div className="border border-gray-200 mt-1 rounded bg-white shadow-md">
                    {searchResults.map((lib) => (
                      <div
                        key={lib._id}
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSelectLibrary(lib)}
                      >
                        {lib.title}
                      </div>
                    ))}
                  </div>
                )}
                {selectedLibrary && (
                  <div className="mt-2 text-sm text-gray-600">
                    Đã chọn: <b>{selectedLibrary.title}</b>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block mb-1">
                  Chọn Quy ước sách <span className="text-red-500">*</span>
                </label>
                <AutoCompleteSelect
                  name="specialCode"
                  selectedValue={currentBook.specialCode || ""}
                  onChange={(val) =>
                    setCurrentBook((prev) => ({
                      ...prev,
                      specialCode: val,
                    }))
                  }
                  fetchUrl={`${API_URL}/libraries/special-codes`}
                  placeholder="Chọn quy ước sách..."
                  className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <hr className="border-gray-100 mt-3 mb-1" />
                <label className="text-lg text-[#002855]">
                  Thông tin tài liệu
                </label>
                <div className="w-full grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                  <div className="mb-3">
                    <label className="block mb-1 text-sm">
                      ISBN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="isbn"
                      placeholder="Nhập mã ISBN"
                      value={currentBook.isbn}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block mb-1 text-sm">
                      Định danh tài liệu:{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="documentIdentifier"
                      placeholder="Nhập định danh tài liệu"
                      value={currentBook.documentIdentifier}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">
                      Tên sách <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bookTitle"
                      placeholder="Nhập tên sách"
                      value={currentBook.bookTitle}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm">
                      Ký hiệu phân loại: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="classificationSign"
                      placeholder="Nhập ký hiệu phân loại"
                      value={currentBook.classificationSign}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <hr className="border-gray-100 mt-3 mb-1" />
                <label className="text-lg text-[#002855]">
                  Thông tin xuất bản
                </label>
                <div className="w-full grid grid-cols-3 gap-x-4 mt-2">
                  <div>
                    <label className="block mb-1 text-sm">
                      Năm Xuất Bản: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="publishYear"
                      placeholder="Nhập năm xuất bản"
                      value={currentBook.publishYear}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">
                      Nhà Xuất Bản: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="publisherName"
                      placeholder="Nhập tên nhà xuất bản"
                      value={currentBook.publisherName}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">
                      Nơi Xuất Bản: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="publisherPlaceName"
                      placeholder="Nhập nơi xuất bản"
                      value={currentBook.publisherPlaceName}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <hr className="border-gray-100 mt-3 mb-1" />

                <label className="text-lg text-[#002855]">Mô tả</label>
                <div className="w-full grid grid-cols-3 gap-x-4 mt-2">
                  <div className="mb-3">
                    <label className="block mb-1 text-sm">
                      Số trang: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="pages"
                      placeholder="Nhập số trang"
                      value={currentBook.pages}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block mb-1 text-sm">
                      Giá bìa: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="coverPrice"
                      placeholder="Nhập giá bìa"
                      value={currentBook.coverPrice}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block mb-1 text-sm">
                      Ngôn ngữ: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="language"
                      value={currentBook.language}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block mb-1 text-sm">
                      Tùng thư: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="seriesName"
                      value={currentBook.seriesName}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block mb-1 text-sm">
                      Cơ quan biên mục: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="catalogingAgency"
                      value={currentBook.catalogingAgency}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block mb-1 text-sm">
                      Kho lưu trữ: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="storageLocation"
                      value={currentBook.storageLocation}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block mb-1 text-sm">
                      Loại tài liệu: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="documentType"
                      value={currentBook.documentType}
                      onChange={handleChange}
                      className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-9 py-2 bg-[#EBEBEB] text-[#757575] rounded-lg text-sm font-semibold transform transition-transform duration-300 hover:scale-105"
              >
                Huỷ
              </button>
              <button
                onClick={handleSaveModal}
                className="px-5 py-2 bg-[#F05023] text-white rounded-lg text-sm font-semibold transform transition-transform duration-300 hover:scale-105"
              >
                Thêm mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------- COMPONENT CHÍNH ------------------- //

function LibraryData() {
  // State xác định đang xem tab nào
  const [activeTab, setActiveTab] = useState("bookDetail");

  return (
    <div className="flex p-8">
      {/* Sidebar bên trái */}
      <aside className="w-[15%] h-[20%] bg-white rounded-2xl p-6 font-bold mr-4">
        <ul>
          <li className="mt-2">
            <button onClick={() => setActiveTab("documentType")}>
              Phân loại tài liệu
            </button>
          </li>
          <li className="mt-6">
            <button onClick={() => setActiveTab("seriesName")}>Tùng thư</button>
          </li>
          <li className="mt-6">
            <button onClick={() => setActiveTab("specialCode")}>
              Mã quy ước
            </button>
          </li>
          <li className="mt-6">
            <button onClick={() => setActiveTab("authorList")}>
              Danh sách tác giả
            </button>
          </li>
          <li className="mt-6">Dữ liệu sách</li>
          <ul>
            <li className="mt-6 ml-5">
              <button onClick={() => setActiveTab("bookInformation")}>
                Đầu sách
              </button>
            </li>
            <li className="mt-6 ml-5">
              <button onClick={() => setActiveTab("bookDetail")}>Sách</button>
            </li>
          </ul>
        </ul>
      </aside>

      {/* Khu vực hiển thị nội dung tương ứng tab */}
      <main className="h-screen flex-1 bg-white rounded-2xl p-6">
        {activeTab === "documentType" && <DocumentType />}
        {activeTab === "seriesName" && <SeriesName />}
        {activeTab === "specialCode" && <SpecialCode />}
        {activeTab === "authorList" && <AuthorList />}
        {activeTab === "bookInformation" && <LibraryInformation />}
        {activeTab === "bookDetail" && <BookDetail />}
      </main>
    </div>
  );
}

export default LibraryData;

// ------------------- COMPONENT AuthorSelector ------------------- //
function AuthorSelector({ selectedAuthors, onChange }) {
  const [allAuthors, setAllAuthors] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);

  // Thêm dòng này để khai báo ref
  const containerRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/libraries/authors`)
      .then((res) => res.json())
      .then((data) => setAllAuthors(data))
      .catch((error) => console.error("Error fetching authors:", error));
  }, []);

  const tokens = inputValue
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const currentToken = inputValue.endsWith(",")
    ? ""
    : tokens[tokens.length - 1] || "";

  useEffect(() => {
    if (!focused) {
      setSuggestions([]);
      return;
    }
    if (!currentToken.trim()) {
      setSuggestions([]);
      return;
    }
    const existingNames = new Set(selectedAuthors.map((t) => t.toLowerCase()));
    const filtered = allAuthors.filter(
      (author) =>
        author.name.toLowerCase().includes(currentToken.toLowerCase()) &&
        !existingNames.has(author.name.toLowerCase())
    );
    if (filtered.length === 0) {
      setSuggestions([{ name: currentToken, isNew: true }]);
    } else {
      const exactMatch = filtered.find(
        (author) => author.name.toLowerCase() === currentToken.toLowerCase()
      );
      if (!exactMatch) {
        filtered.push({ name: currentToken, isNew: true });
      }
      setSuggestions(filtered);
    }
  }, [currentToken, selectedAuthors, allAuthors, focused]);

  const handleSelect = (name) => {
    onChange([...selectedAuthors, name]);
    setInputValue("");
    setSuggestions([]);
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  // Click ngoài component để ẩn gợi ý
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-wrap items-center gap-2 border border-gray-300 px-2 py-1 rounded-xl min-h-[42px] cursor-text">
        {selectedAuthors.map((author, idx) => (
          <span
            key={idx}
            className="flex items-center bg-[#002855] text-white px-2 py-1 rounded-2xl text-sm"
          >
            {author}
            <button
              onClick={() =>
                onChange(selectedAuthors.filter((a) => a !== author))
              }
              className="ml-1 text-white font-bold"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onFocus={() => setFocused(true)}
          onChange={handleChange}
          placeholder="Thêm tác giả..."
          className="flex-1 border-none focus:outline-none bg-transparent text-base"
        />
      </div>
      {focused && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(suggestion.name);
              }}
            >
              {suggestion.isNew
                ? `Thêm mới "${suggestion.name}"`
                : suggestion.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AutoCompleteSelect({
  label,
  name,
  selectedValue,
  onChange,
  fetchUrl,
  placeholder,
}) {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState(selectedValue || "");
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false); // Xác định ô input có đang focus hay không

  const containerRef = useRef(null);

  // Lấy dữ liệu (DocumentType, SpecialCode, SeriesName...) từ backend
  useEffect(() => {
    fetch(fetchUrl)
      .then((res) => res.json())
      .then(setOptions)
      .catch((err) => console.error("Error fetching options:", err));
  }, [fetchUrl]);

  // Cập nhật suggestions mỗi khi inputValue, options hoặc focus thay đổi
  useEffect(() => {
    // Nếu ô input chưa focus, ta ẩn gợi ý
    if (!focused) {
      setSuggestions([]);
      return;
    }

    // Nếu người dùng chưa nhập gì, hiển thị toàn bộ options
    if (!inputValue.trim()) {
      setSuggestions(options);
      return;
    }

    // Nếu có nhập, lọc danh sách
    const filtered = options.filter((opt) =>
      opt.name.toLowerCase().includes(inputValue.toLowerCase())
    );
    setSuggestions(filtered);
  }, [inputValue, options, focused]);

  // Khi chọn 1 gợi ý
  const handleSelect = (val) => {
    setInputValue(val);
    onChange(val);
    setSuggestions([]);
  };

  // Ẩn gợi ý nếu click ra ngoài component
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={inputValue}
        // Chỉ khi người dùng focus ô input, ta mới bật cờ focus
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value); // Báo ngược lên cha
        }}
        placeholder={placeholder}
        className="w-full border-none bg-[#f8f8f8] px-2 py-2 rounded-xl text-sm"
      />

      {/* Chỉ hiển thị suggestions nếu đang focus và mảng suggestions có dữ liệu */}
      {focused && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1  max-h-60 overflow-y-auto">
          {suggestions.map((s) => (
            <div
              key={s._id}
              className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(s.name)}
            >
              {s.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
