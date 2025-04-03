import React, { useEffect, useState } from "react";
import { API_URL } from "../../../config";
import { toast } from "react-toastify";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const StudentSchoolYear = () => {
  const [schoolYears, setSchoolYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const fetchSchoolYears = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/schoolyears`);
      const data = await res.json();
      setSchoolYears(data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu!");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch(`${API_URL}/schoolyears`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      toast.success("Tạo Năm học thành công!");
      setShowCreateModal(false);
      setFormData({ code: "", startDate: "", endDate: "", description: "" });
      fetchSchoolYears();
    } catch (error) {
      toast.error("Lỗi khi tạo Năm học");
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(
        `${API_URL}/schoolyears/${selectedSchoolYear._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Cập nhật Năm học thành công!");
      setShowEditModal(false);
      setSelectedSchoolYear(null);
      fetchSchoolYears();
    } catch (error) {
      toast.error("Lỗi khi cập nhật Năm học");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Chắc chắn xoá?")) return;
    try {
      const res = await fetch(`${API_URL}/schoolyears/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Đã xoá Năm học!");
      fetchSchoolYears();
    } catch (error) {
      toast.error("Không xoá được Năm học");
    }
  };

  const openEditModal = (year) => {
    setSelectedSchoolYear(year);
    setFormData({
      code: year.code,
      startDate: year.startDate ? year.startDate.substring(0, 10) : "",
      endDate: year.endDate ? year.endDate.substring(0, 10) : "",
      description: year.description,
    });
    setShowEditModal(true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-6">Quản lý Năm học</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
        >
          Thêm Năm học
        </button>
      </div>
      {loading ? (
        <div>Đang tải dữ liệu...</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="!border-px !border-gray-400">
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">STT</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">NĂM HỌC</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">BẮT ĐẦU</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">KẾT THÚC</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">HÀNH ĐỘNG</p>
              </th>
            </tr>
          </thead>
          <tbody>
            {schoolYears.map((sy, idx) => (
              <tr key={sy._id} className="border-b border-gray-200">
                <td className="max-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">{idx + 1}</p>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">{sy.code}</p>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">
                    {sy.startDate ? sy.startDate.substring(0, 10) : ""}
                  </p>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">
                    {sy.endDate ? sy.endDate.substring(0, 10) : ""}
                  </p>
                </td>

                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(sy)}
                      className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                    >
                      <FiEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(sy._id)}
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
      )}

      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50  z-50">
          <div className="bg-white p-6 rounded-[20px] w-96">
            <h2 className="text-xl font-bold mb-4">Tạo Năm học mới</h2>
            <label className="font-semibold ml-2 text-base">Năm học</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="2024-2025"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
            />
            <label className="font-semibold ml-2 text-base">Ngày bắt đầu</label>
            <input
              type="date"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="01/07/2024"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
            />
            <label className="font-semibold ml-2 text-base">
              Ngày kết thúc
            </label>
            <input
              type="date"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="30/06/2025"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
            />

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-2 bg-orange-red text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#ff6b3a] transform transition-transform duration-300 hover:scale-105 "
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-xl font-bold mb-4">Chỉnh sửa Năm học</h2>
            <label className="font-semibold ml-2 text-base">Năm học</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              placeholder="2024-2025"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
            />
            <label className="font-semibold ml-2 text-base">Ngày bắt đầu</label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
            />
            <label className="font-semibold ml-2 text-base">
              Ngày kết thúc
            </label>
            <input
              type="text"
              className="border border-gray-100 bg-[#f8f8f8] p-2 rounded-xl mb-2 w-full text-sm"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
            />

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-3 py-2 bg-orange-red text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#ff6b3a] transform transition-transform duration-300 hover:scale-105 "
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                className="mr-2 px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSchoolYear;
