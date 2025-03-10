import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { API_URL } from "../../config"; // Import API_URL từ file config

const BusVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    id: "",
    licensePlate: "",
    driverName: "",
    phone: "",
    seatingCapacity: "",
    status: "active", // Giá trị mặc định cho trạng thái
  });

  // Lấy danh sách phương tiện từ API
  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API_URL}/vehicles`);
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Mở modal tạo mới phương tiện
  const handleOpenCreateModal = () => {
    setEditingVehicle(null);
    setVehicleForm({
      id: "",
      licensePlate: "",
      driverName: "",
      phone: "",
      seatingCapacity: "",
      status: "active",
    });
    setShowModal(true);
  };

  // Mở modal chỉnh sửa phương tiện
  const handleOpenEditModal = (vehicle) => {
    setEditingVehicle(vehicle._id);
    setVehicleForm({
      id: vehicle.id,
      licensePlate: vehicle.licensePlate,
      driverName: vehicle.driverName,
      phone: vehicle.phone,
      seatingCapacity: vehicle.seatingCapacity,
      status: vehicle.status,
    });
    setShowModal(true);
  };

  // Lưu dữ liệu phương tiện (tạo mới hoặc chỉnh sửa)
  const handleSaveVehicle = async () => {
    try {
      if (editingVehicle) {
        // Cập nhật phương tiện
        await axios.put(`${API_URL}/vehicles/${editingVehicle}`, vehicleForm);
      } else {
        // Tạo mới phương tiện
        await axios.post(`${API_URL}/vehicles`, vehicleForm);
      }
      fetchVehicles();
      setShowModal(false);
      setEditingVehicle(null);
      setVehicleForm({
        id: "",
        licensePlate: "",
        driverName: "",
        phone: "",
        seatingCapacity: "",
        status: "active",
      });
    } catch (error) {
      console.error("Error saving vehicle:", error);
    }
  };

  // Xóa phương tiện
  const handleDelete = async (vehicleId) => {
    try {
      await axios.delete(`${API_URL}/vehicles/${vehicleId}`);
      fetchVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản lý Phương Tiện</h2>
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#002855] text-white px-4 py-2 rounded-lg font-semibold"
        >
          Tạo phương tiện mới
        </button>
      </div>

      {/* Bảng hiển thị danh sách phương tiện */}
      <table className="w-full">
        <thead>
          <tr className="!border-px !border-gray-400">
            <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-500">MÃ XE</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-500">BIỂN KIỂM SOÁT</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-500">TÀI XẾ</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-500">SĐT</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-500">SỨC CHỨA</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-500">TRẠNG THÁI</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-500">HÀNH ĐỘNG</p>
            </th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">{vehicle.id}</p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">
                  {vehicle.licensePlate}
                </p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">
                  {vehicle.driverName}
                </p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">
                  {vehicle.phone}
                </p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">
                  {vehicle.seatingCapacity}
                </p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">
                  {vehicle.status}
                </p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(vehicle)}
                    className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg hover:scale-105"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle._id)}
                    className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg hover:scale-105"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal tạo mới / chỉnh sửa phương tiện */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">
              {editingVehicle ? "Chỉnh sửa Phương Tiện" : "Tạo Phương Tiện Mới"}
            </h3>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600">
                Mã Xe
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={vehicleForm.id}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, id: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600">
                Biển Kiểm Soát
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                value={vehicleForm.licensePlate}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    licensePlate: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600">
                Tài Xế
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                value={vehicleForm.driverName}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, driverName: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600">
                SĐT
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                value={vehicleForm.phone}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, phone: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600">
                Sức Chứa
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={vehicleForm.seatingCapacity}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    seatingCapacity: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600">
                Trạng Thái
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={vehicleForm.status}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveVehicle}
                className="w-full mt-4 bg-[#002855] text-white p-2 rounded-lg"
              >
                {editingVehicle ? "Lưu chỉnh sửa" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusVehicles;
