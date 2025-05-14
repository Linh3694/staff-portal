// src/components/document/DocumentTable.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../core/config"; // Import từ file config
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEdit, FiTrash2 } from "react-icons/fi";

// Hàm format số tiền sang dạng có dấu chấm phần thập phân (theo chuẩn vi-VN)
const formatChiPhi = (value) => {
  if (!value) return "Chưa cập nhật";
  const numberVal = Number(value);
  if (isNaN(numberVal)) return value;
  return numberVal.toLocaleString("vi-VN");
};

const DocumentTable = () => {
  const [documents, setDocuments] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  // Phân trang
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal EDIT
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedFileEdit, setSelectedFileEdit] = useState(null); // Cho modal Edit

  // Modal DELETE
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentIdToDelete, setDocumentIdToDelete] = useState(null);

  // Modal CREATE
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    ten: "",
    loai: "",
    phongBan: "",
    chiPhi: "",
    // file: "", // Nếu muốn lưu link file tạm
  });
  const [selectedFileCreate, setSelectedFileCreate] = useState(null); // Cho modal Create

  const [selectedFilter, setSelectedFilter] = useState("Tất cả");

  // Lấy danh sách tài liệu từ API
  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_URL}/documents`);
      setDocuments(res.data);
      console.log(res.data);
    } catch (error) {
      console.error("Lỗi khi tải tài liệu:", error.message);
      toast.error("Lỗi khi tải danh sách tài liệu.");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Tìm kiếm
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Áp dụng tìm kiếm
    if (searchKeyword) {
      filtered = filtered.filter((doc) =>
        doc.ten?.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    // Áp dụng filter theo loại tài liệu (trừ khi chọn "Tất cả")
    if (selectedFilter !== "Tất cả") {
      filtered = filtered.filter((doc) => doc.loai === selectedFilter);
    }

    return filtered;
  }, [documents, searchKeyword, selectedFilter]);

  // Sắp xếp
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const sortedDocuments = useMemo(() => {
    let sortableDocs = [...filteredDocuments];
    if (sortConfig.key) {
      sortableDocs.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableDocs;
  }, [filteredDocuments, sortConfig]);

  // Phân trang
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedDocuments.slice(start, start + itemsPerPage);
  }, [sortedDocuments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

  // ----- THÊM MỚI TÀI LIỆU -----
  const openCreateModal = () => {
    // Reset form về rỗng
    setNewDocument({
      ten: "",
      loai: "",
      phongBan: "",
      chiPhi: "",
      // file: ""
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateDocument = async () => {
    try {
      const formData = new FormData();
      formData.append("ten", newDocument.ten);
      formData.append("loai", newDocument.loai);
      formData.append("phongBan", newDocument.phongBan);
      formData.append("thangSuDung", newDocument.thangSuDung || "");

      // parse chiPhi thành number
      formData.append("chiPhi", Number(newDocument.chiPhi) || 0);
      // Append file nếu có
      if (selectedFileCreate) {
        formData.append("file", selectedFileCreate);
      }

      // Gửi với Content-Type: multipart/form-data
      await axios.post(`${API_URL}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Thêm tài liệu thành công!");
      setIsCreateModalOpen(false);
      // Reset lại state
      setSelectedFileCreate(null);
      fetchDocuments();
    } catch (error) {
      console.error("Lỗi khi thêm tài liệu:", error);
      toast.error("Lỗi khi thêm tài liệu.");
    }
  };

  // ----- CHỈNH SỬA TÀI LIỆU -----
  const handleEditDocument = (document) => {
    // Sao chép document sang selectedDocument
    setSelectedDocument({
      ...document,
      chiPhi: document.chiPhi ? String(document.chiPhi) : "", // chuyển về string để hiển thị trong input
    });
    setIsModalOpen(true);
  };

  const handleSaveDocument = async () => {
    try {
      const formData = new FormData();
      formData.append("_id", selectedDocument._id);
      formData.append("ten", selectedDocument.ten);
      formData.append("loai", selectedDocument.loai || "");
      formData.append("phongBan", selectedDocument.phongBan || "");
      formData.append("chiPhi", Number(selectedDocument.chiPhi) || 0);
      formData.append("thangSuDung", selectedDocument.thangSuDung || "");

      // Append file nếu có
      if (selectedFileEdit) {
        formData.append("file", selectedFileEdit);
      }

      await axios.put(
        `${API_URL}/documents/${selectedDocument._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.success("Cập nhật tài liệu thành công!");
      setIsModalOpen(false);
      setSelectedFileEdit(null);
      fetchDocuments();
    } catch (error) {
      console.error("Lỗi khi cập nhật tài liệu:", error);
      toast.error("Lỗi khi cập nhật tài liệu.");
    }
  };

  // ----- XÓA TÀI LIỆU -----
  const handleDeleteDocument = (documentId) => {
    setDocumentIdToDelete(documentId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDocument = async () => {
    try {
      await axios.delete(`${API_URL}/documents/${documentIdToDelete}`);
      toast.success("Xóa tài liệu thành công!");
      setIsDeleteModalOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error("Lỗi khi xóa tài liệu:", error.message);
      toast.error("Lỗi khi xóa tài liệu.");
    }
  };
  return (
    <div className="p-8">
      <div className="w-full h-full px-6 pb-6 border sm:overflow-x-auto bg-white rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-4 mt-3">
          <div className="text-2xl font-bold text-navy-700">
            Danh sách tài liệu
          </div>
          {/* Nút thêm mới */}
          <button
            onClick={openCreateModal}
            className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
          >
            Thêm mới
          </button>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="flex flex-row justify-start gap-4 mb-4">
          <div className="flex justify-between items-center">
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              className="border border-gray-300 rounded-md px-4 py-1 w-[300px]"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            {["Tất cả", "Tờ Trình/PR", "Biên bản", "Hợp đồng", "Hoàn công"].map(
              (type) => (
                <button
                  key={type}
                  onClick={() =>
                    setSelectedFilter(type === selectedFilter ? null : type)
                  }
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                    selectedFilter === type
                      ? "bg-[#002147] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {type}
                </button>
              )
            )}
          </div>
        </div>

        {/* Bảng tài liệu */}
        <div className="mt-1 p-3 overflow-x-scroll xl:overflow-x-hidden">
          <table className="w-full">
            <thead>
              <tr className="!border-px !border-gray-400">
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p
                    className="text-sm font-bold text-gray-600 cursor-pointer"
                    onClick={() =>
                      setSortConfig((prev) => ({
                        key: "ten",
                        direction:
                          prev.key === "ten" && prev.direction === "asc"
                            ? "desc"
                            : "asc",
                      }))
                    }
                  >
                    TÊN TÀI LIỆU
                  </p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-600">LOẠI</p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-600">PHÒNG BAN</p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-600">NGÀY TẠO</p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-600">
                    THÁNG SỬ DỤNG
                  </p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-600">TỔNG TIỀN</p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-center">
                  <p className="text-sm font-bold text-gray-600">HÀNH ĐỘNG</p>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedDocuments.map((doc) => (
                <tr key={doc._id} className="border-b hover:bg-gray-50">
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    {doc.file ? (
                      <a
                        href={`${BASE_URL}/${doc.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-md  font-bold text-[#002147] "
                      >
                        {doc.ten}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-navy-700">
                        {doc.ten}
                      </p>
                    )}
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-semibold text-navy-700">
                      {doc.loai || "Không có"}
                    </p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-semibold text-navy-700">
                      {doc.phongBan || "Không có"}
                    </p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-semibold text-navy-700">
                      {doc.ngayTao
                        ? new Date(doc.ngayTao).toLocaleDateString("vi-VN")
                        : "Không có"}
                    </p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-semibold text-navy-700">
                      {doc.thangSuDung || "Chưa cập nhật"}
                    </p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-semibold text-navy-700">
                      {formatChiPhi(doc.chiPhi)}
                    </p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEditDocument(doc)}
                        className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc._id)}
                        className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg transform transition-transform duration-300 hover:scale-105"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-2 py-1 text-xs font-semibold text-white border rounded bg-[#FF5733] hover:bg-[#002147]"
            >
              Trước
            </button>
            <span className="text-xs px-4 py-2">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-2 py-1 text-xs font-semibold text-white border rounded bg-[#FF5733] hover:bg-[#002147]"
            >
              Tiếp
            </button>
          </div>
        </div>

        {/* Modal CREATE (Thêm tài liệu) */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-md shadow-lg w-[500px]">
              <h3 className="text-xl font-bold mb-4">Thêm tài liệu mới</h3>

              {/* TÊN */}
              <label className="block mb-2">Tên tài liệu</label>
              <input
                type="text"
                placeholder="Tên tài liệu"
                value={newDocument.ten}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, ten: e.target.value })
                }
                className="border p-2 rounded-md w-full mb-4"
              />

              {/* LOẠI */}
              <label className="block mb-2">Loại tài liệu</label>
              <select
                value={newDocument.loai}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, loai: e.target.value })
                }
                className="border p-2 rounded-md w-full mb-4"
              >
                <option value="">Chọn loại tài liệu</option>
                <option value="Tờ Trình/PR">Tờ Trình/PR</option>
                <option value="Biên bản">Biên bản</option>
                <option value="Hợp đồng">Hợp đồng</option>
                <option value="Hoàn công">Hoàn công</option>
              </select>

              {/* THÁNG SỬ DỤNG */}
              <label className="block mb-2">Tháng sử dụng</label>
              <input
                type="month"
                value={newDocument.thangSuDung}
                onChange={(e) =>
                  setNewDocument({
                    ...newDocument,
                    thangSuDung: e.target.value,
                  })
                }
                className="border p-2 rounded-md w-full mb-4"
              />

              {/* PHÒNG BAN */}
              <label className="block mb-2">Phòng ban</label>
              <input
                type="text"
                placeholder="Phòng ban"
                value={newDocument.phongBan}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, phongBan: e.target.value })
                }
                className="border p-2 rounded-md w-full mb-4"
              />

              {/* CHI PHÍ */}
              <label className="block mb-2">Chi phí</label>
              <input
                type="number"
                placeholder="Chi phí"
                value={newDocument.chiPhi}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, chiPhi: e.target.value })
                }
                className="border p-2 rounded-md w-full mb-4"
              />

              {/* INPUT chọn file */}
              <label className="block mb-2">File đính kèm</label>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFileCreate(e.target.files[0]);
                  }
                }}
                className="mb-4"
              />

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateDocument}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Thêm mới
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal EDIT (Chỉnh sửa tài liệu) */}
        {isModalOpen && selectedDocument && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-md shadow-lg w-[500px]">
              <h3 className="text-xl font-bold mb-4">Chỉnh sửa tài liệu</h3>

              {/* TÊN */}
              <label className="block mb-2">Tên tài liệu</label>
              <input
                type="text"
                value={selectedDocument.ten}
                onChange={(e) =>
                  setSelectedDocument({
                    ...selectedDocument,
                    ten: e.target.value,
                  })
                }
                className="border p-2 rounded-md w-full mb-4"
              />

              {/* LOẠI (Select Dropdown) */}
              <label className="block mb-2">Loại tài liệu</label>
              <select
                value={selectedDocument.loai}
                onChange={(e) =>
                  setSelectedDocument({
                    ...selectedDocument,
                    loai: e.target.value,
                  })
                }
                className="border p-2 rounded-md w-full mb-4"
              >
                <option value="">Chọn loại tài liệu</option>
                <option value="Tờ Trình/PR">Tờ Trình/PR</option>
                <option value="Biên bản">Biên bản</option>
                <option value="Hợp đồng">Hợp đồng</option>
                <option value="Hoàn công">Hoàn công</option>
              </select>

              {/* THÁNG SỬ DỤNG */}
              <label className="block mb-2">Tháng sử dụng</label>
              <input
                type="month"
                value={selectedDocument.thangSuDung}
                onChange={(e) =>
                  setSelectedDocument({
                    ...selectedDocument,
                    thangSuDung: e.target.value,
                  })
                }
                className="border p-2 rounded-md w-full mb-4"
              />

              {/* PHÒNG BAN */}
              <label className="block mb-2">Phòng ban</label>
              <input
                type="text"
                value={selectedDocument.phongBan || ""}
                onChange={(e) =>
                  setSelectedDocument({
                    ...selectedDocument,
                    phongBan: e.target.value,
                  })
                }
                className="border p-2 rounded-md w-full mb-4"
              />

              {/* CHI PHÍ */}
              <label className="block mb-2">Chi phí</label>
              <input
                type="number"
                value={selectedDocument.chiPhi} // là string tạm thời
                onChange={(e) =>
                  setSelectedDocument({
                    ...selectedDocument,
                    chiPhi: e.target.value,
                  })
                }
                className="border p-2 rounded-md w-full mb-4"
              />

              {/* INPUT chọn file (edit) */}
              <label className="block mb-2">File (nếu muốn cập nhật)</label>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFileEdit(e.target.files[0]);
                  }
                }}
                className="mb-4"
              />

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveDocument}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal DELETE (Xác nhận xoá) */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-md shadow-lg w-[400px]">
              <h3 className="text-xl font-bold mb-4">Xác nhận xóa</h3>
              <p className="mb-4">Bạn có chắc chắn muốn xóa tài liệu này?</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteDocument}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentTable;
