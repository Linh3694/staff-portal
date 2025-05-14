import React, { useEffect, useState } from "react";
import { API_URL } from "../../../core/config";
import { toast } from "react-toastify";

const StudentPhoto = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState("");

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/photos`);
      const data = await res.json();
      setPhotos(data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu ảnh!");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn file!");
      return;
    }
    const formData = new FormData();
    formData.append("photo", selectedFile);
    formData.append("description", description);
    try {
      const res = await fetch(`${API_URL}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Upload ảnh thành công!");
      setShowUploadModal(false);
      setSelectedFile(null);
      setDescription("");
      fetchPhotos();
    } catch (error) {
      toast.error("Lỗi khi upload ảnh");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Chắc chắn xoá?")) return;
    try {
      const res = await fetch(`${API_URL}/photos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete photo");
      toast.success("Đã xoá ảnh!");
      fetchPhotos();
    } catch (error) {
      toast.error("Lỗi xoá ảnh!");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Quản lý Ảnh</h1>
      <button
        onClick={() => setShowUploadModal(true)}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded"
      >
        Upload Ảnh mới
      </button>
      {loading ? (
        <div>Đang tải dữ liệu...</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Ảnh</th>
              <th className="p-2 text-left">Mô tả</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {photos.map((photo, idx) => (
              <tr key={photo._id} className="border-b">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2">
                  <img
                    src={photo.url}
                    alt={photo.description}
                    className="w-20 h-20 object-cover"
                  />
                </td>
                <td className="p-2">{photo.description}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(photo._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-xl font-bold mb-4">Upload Ảnh mới</h2>
            <input
              type="file"
              className="border p-2 rounded mb-2 w-full"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <textarea
              className="border p-2 rounded mb-2 w-full"
              placeholder="Mô tả ảnh"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                className="mr-2 px-4 py-2 bg-gray-300 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPhoto;
