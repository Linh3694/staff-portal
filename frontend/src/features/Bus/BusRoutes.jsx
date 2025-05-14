// BusRoutes.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../core/config"; // import từ file config
import Switch from "react-switch";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const BusRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null); // Để xác định đang tạo mới hay sửa
  const [routeForm, setRouteForm] = useState({
    name: "",
    addresses: [""],
    routeType: "Đón học sinh",
    description: "",
    active: true,
  });
  useEffect(() => {
    fetchRoutes();
  }, []);
  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`${API_URL}/routes`);
      setRoutes(response.data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const toggleActiveStatus = async (routeId, newStatus) => {
    try {
      await axios.put(`${API_URL}/routes/${routeId}`, {
        active: newStatus,
      });
      setRoutes((prev) =>
        prev.map((route) =>
          route._id === routeId ? { ...route, active: newStatus } : route
        )
      );
    } catch (error) {
      console.error("Error toggling route status:", error);
    }
  };

  // Mở modal để tạo mới tuyến
  const handleOpenCreateModal = () => {
    setEditingRoute(null); // Đặt lại trạng thái để tạo mới
    setRouteForm({
      name: "",
      addresses: [""],
      routeType: "Đón học sinh",
      description: "",
      active: true,
    });
    setShowModal(true);
  };

  // Mở modal để sửa tuyến
  const handleOpenEditModal = (route) => {
    setEditingRoute(route._id); // Gán ID của tuyến đang sửa
    setRouteForm({
      name: route.name,
      addresses: route.addresses,
      routeType: route.routeType,
      description: route.description || "",
      active: route.active,
    });
    setShowModal(true);
  };

  // Lưu dữ liệu khi bấm "Tạo mới" hoặc "Lưu chỉnh sửa"
  const handleSaveRoute = async () => {
    try {
      if (editingRoute) {
        await axios.put(`${API_URL}/routes/${editingRoute}`, {
          ...routeForm,
          addresses: routeForm.addresses.filter((addr) => addr.trim() !== ""),
        });
      } else {
        await axios.post(`${API_URL}/routes`, {
          ...routeForm,
          addresses: routeForm.addresses.filter((addr) => addr.trim() !== ""),
        });
      }

      fetchRoutes();
      setShowModal(false);
      setRouteForm({
        name: "",
        addresses: [""],
        routeType: "Đón học sinh",
        description: "",
        active: true,
      });
      setEditingRoute(null);
    } catch (error) {
      console.error("Error saving route:", error);
    }
  };

  const handleDelete = async (routeId) => {
    try {
      await axios.delete(`${API_URL}/routes/${routeId}`);
      fetchRoutes();
    } catch (error) {
      console.error("Error deleting route:", error);
    }
  };

  // Thêm một dòng địa chỉ
  const addAddressField = () => {
    setRouteForm({ ...routeForm, addresses: [...routeForm.addresses, ""] });
  };

  // Cập nhật giá trị của dòng địa chỉ
  const handleAddressChange = (index, value) => {
    const updatedAddresses = [...routeForm.addresses];
    updatedAddresses[index] = value;
    setRouteForm({ ...routeForm, addresses: updatedAddresses });
  };

  // Xóa một dòng địa chỉ
  const removeAddressField = (index) => {
    if (routeForm.addresses.length > 1) {
      const updatedAddresses = routeForm.addresses.filter(
        (_, i) => i !== index
      );
      setRouteForm({ ...routeForm, addresses: updatedAddresses });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản lý Tuyến Xe</h2>
        <button
          onClick={() => handleOpenCreateModal(true)}
          className="bg-[#002855] text-white px-4 py-2 rounded-lg font-semibold"
        >
          Tạo tuyến mới
        </button>
      </div>

      {/* Bảng danh sách tuyến xe */}
      <table className="w-full">
        <thead>
          <tr className="!border-px !border-gray-400">
            <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-500">TUYẾN</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-500">ĐIỂM DỪNG</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-500">LOẠI TUYẾN</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-500">MÔ TẢ</p>
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
          {routes.map((route, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-bold text-navy-700">{route.name}</p>
              </td>
              <td className="min-w-[200px] border-white/0 py-3 pr-4">
                <p className="text-sm text-navy-700">
                  {route.addresses.join(", ")}
                </p>
              </td>
              <td className="min-w-[120px] border-white/0 py-3 pr-4">
                <p className="text-sm text-navy-700">{route.routeType}</p>
              </td>
              <td className="min-w-[200px] border-white/0 py-3 pr-4">
                <p className="text-sm text-navy-700">
                  {route.description || "Không có"}
                </p>
              </td>
              <td className="min-w-[100px] border-white/0 py-3 pr-4">
                <Switch
                  onChange={() => toggleActiveStatus(route._id, !route.active)}
                  checked={route.active}
                  onColor="#4caf50"
                  offColor="#ccc"
                  uncheckedIcon={false}
                  checkedIcon={false}
                  height={20}
                  width={40}
                />
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(route)}
                    className="text-[#002855]"
                  >
                    <FiEdit />
                  </button>

                  <button
                    onClick={() => handleDelete(route._id)}
                    className="flex items-center justify-center w-7 h-7 text-white bg-red-500 rounded-lg hover:scale-105"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal thêm tuyến mới */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">
              {editingRoute ? "Chỉnh sửa Tuyến" : "Tạo Tuyến Mới"}
            </h3>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600">
                Tuyến
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                value={routeForm.name}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, name: e.target.value })
                }
                required
              />
            </div>

            {/* Danh sách địa chỉ */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600">
                Địa chỉ
              </label>
              {routeForm.addresses.map((address, index) => (
                <div key={index} className="flex items-center mb-1">
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={address}
                    onChange={(e) => handleAddressChange(index, e.target.value)}
                    required
                  />
                  <button
                    onClick={() => removeAddressField(index)}
                    className="ml-2 text-red-500"
                    disabled={routeForm.addresses.length === 1}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={addAddressField} className="text-[#002855] mt-2">
                + Thêm địa chỉ
              </button>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600">
                Loại Tuyến
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={routeForm.routeType}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, routeType: e.target.value })
                }
              >
                <option value="Đón học sinh">Đón học sinh</option>
                <option value="Trả học sinh">Trả học sinh</option>
              </select>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600">
                Mô Tả
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                value={routeForm.description}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, description: e.target.value })
                }
              />
            </div>

            <div className="mb-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={routeForm.active}
                  onChange={(e) =>
                    setRouteForm({ ...routeForm, active: e.target.checked })
                  }
                />
                <span className="text-sm font-medium text-gray-600">
                  Hoạt động
                </span>
              </label>
            </div>

            {/* Nút hành động */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveRoute}
                className="w-full mt-4 bg-blue-500 text-white p-2 rounded-lg"
              >
                {editingRoute ? "Lưu chỉnh sửa" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusRoutes;
