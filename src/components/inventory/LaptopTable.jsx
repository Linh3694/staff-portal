import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiCopy } from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import LaptopProductCard from "./productcard/laptopProductCard";
import * as XLSX from "xlsx";
import ReactDOM from "react-dom";
import { MdCancel, MdCheckCircle, MdOutlineError } from "react-icons/md";
import Dropdown from "../function/dropdown";
import { API_URL } from "../../config"; // import từ file config
import _ from "lodash"; // hoặc import debounce trực tiếp: import { debounce } from 'lodash';

const LaptopTable = () => {
  const [data, setData] = useState([]); // State cho danh sách laptops
  const [users, setUsers] = useState([]); // Lưu danh sách users từ API
  const [showAddModal, setShowAddModal] = useState(false); // State để điều khiển modal
  const [newLaptop, setNewLaptop] = useState({
    name: "",
    type: "Laptop",
    manufacturer: "",
    serial: "",
    assigned: [],
    room: "",
    status: "Standby",
    reason: "",
    releaseYear: "",
    specs: {
      processor: "",
      ram: "",
      storage: "",
      display: "",
    },
  });
  const [editingLaptop, setEditingLaptop] = useState({
    name: "",
    type: "Laptop",
    manufacturer: "",
    serial: "",
    assigned: [],
    room: "",
    status: "Active",
    reason: "",
    releaseYear: "",
    specs: {
      processor: "",
      ram: "",
      storage: "",
      display: "",
    },
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]); // Lưu danh sách gợi ý tạm thời
  const [showSuggestions, setShowSuggestions] = useState(false); // Kiểm soát hiển thị gợi ý
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [laptopToDelete, setLaptopToDelete] = useState(null);
  const [selectedLaptop, setSelectedLaptop] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false); // Kiểm soát hiển thị modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Tất cả trạng thái");
  const [selectedDepartment, setSelectedDepartment] =
    useState("Tất cả phòng ban");
  const [selectedManufacturer, setSelectedManufacturer] = useState(
    "Tất cả nhà sản xuất"
  );
  const [selectedYear, setSelectedYear] = useState("Tất cả năm sản xuất");
  const [selectedType, setSelectedType] = useState("Tất cả"); // Mặc định là Tất cả
  const [rooms, setRooms] = useState([]); // Lưu danh sách rooms từ API
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]); // Lưu danh sách gợi ý

  const statusLabels = {
    Active: "Đang sử dụng",
    Standby: "Chờ Cấp Phát",
    Broken: "Hỏng",
    PendingDocumentation: "Đã bàn giao - Chưa có biên bản", // Thêm trạng thái mới
  };

  const handleUpdateSpecs = (laptopId, updatedSpecs) => {
    console.log("Cập nhật specs cho laptop:", laptopId, updatedSpecs);
    const token = localStorage.getItem("authToken");
    return axios
      .put(`${API_URL}/laptops/${laptopId}/specs`, updatedSpecs, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        const updatedLaptop = response.data;
        if (selectedLaptop && selectedLaptop._id === updatedLaptop._id) {
          setSelectedLaptop(updatedLaptop);
        }
        return updatedLaptop;
      })
      .catch((error) => {
        console.error("Lỗi cập nhật specs:", error);
        throw error;
      });
  };
  const handleViewDetails = (laptop) => {
    setSelectedLaptop(laptop); // Chỉ truyền dữ liệu xuống LaptopProductCard
    setRefreshKey((prevKey) => prevKey + 1); // Tăng giá trị để ép render
    setShowDetailModal(true);
  };
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response);
      if (response.data && Array.isArray(response.data)) {
        setUsers(
          response.data.map((user) => ({
            value: user._id,
            label: user.fullname,
            title: user.jobTitle || "Không",
            department: user.department || "Chưa xác định",
            email: user.email,
            avatarUrl: user.avatarUrl || "Không có",
          }))
        );
      } else {
        console.error("API không trả về danh sách người dùng hợp lệ");
        setUsers([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách users:", error);
      setUsers([]);
    }
  };

  // Hàm gọi API để lấy danh sách laptops
  const fetchLaptops = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_URL}/laptops`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // response.data.populatedLaptops là TẤT CẢ laptops
      const rawList = response.data.populatedLaptops;

      // Nếu cần map room, assigned:
      const laptops = rawList.map((laptop) => ({
        ...laptop,
        room: laptop.room
          ? {
              label: laptop.room.name,
              value: laptop.room._id,
              location: laptop.room.location || ["Không xác định"],
            }
          : { label: "Không xác định", location: ["Không xác định"] },
        assigned: laptop.assigned.map((user) => ({
          value: user._id,
          label: user.fullname,
          department: user.department || "Chưa xác định",
          jobTitle: user.jobTitle,
          email: user.email,
          avatarUrl: user.avatarUrl,
        })),
      }));

      // Bỏ setData(...) ban đầu. Thay vào:
      setOriginalData(laptops); // Lưu tất cả laptops
      setFilteredData(laptops); // Mặc định chưa filter thì = tất cả
      setTotalPages(Math.ceil(laptops.length / 30));
      setCurrentPage(1);
      // Hiển thị trước 30 items
      setData(laptops.slice(0, 30));

      console.log("Fetched total laptops:", laptops.length);
    } catch (error) {
      console.error("Error fetching laptops:", error);
    }
  };

  useEffect(() => {
    fetchLaptops();
  }, []);

  const applyFilters = (filters = {}) => {
    let filtered = [...originalData];

    // Lọc theo trạng thái
    if (filters.status && filters.status !== "Tất cả") {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    // Lọc theo loại
    if (filters.type && filters.type !== "Tất cả") {
      filtered = filtered.filter((item) => item.type === filters.type);
    }

    // Lọc theo nhà sản xuất
    if (filters.manufacturer && filters.manufacturer !== "Tất cả") {
      filtered = filtered.filter(
        (item) => item.manufacturer === filters.manufacturer
      );
    }

    // Lọc theo năm sản xuất
    if (filters.releaseYear && filters.releaseYear !== "Tất cả") {
      filtered = filtered.filter(
        (item) => item.releaseYear === filters.releaseYear
      );
    }

    // Lọc theo phòng ban
    if (filters.department && filters.department !== "Tất cả") {
      filtered = filtered.filter((item) =>
        item.assigned.some((user) => user.department === filters.department)
      );
    }
    setFilteredData(filtered);

    const newTotalPages = Math.ceil(filtered.length / 30);
    setTotalPages(newTotalPages);
    setCurrentPage(1);
    setData(filtered.slice(0, 30)); // Hiển thị trang đầu (chỉ 30 items)
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);

    const startIndex = (newPage - 1) * 30;
    setData(filteredData.slice(startIndex, startIndex + 30));
  };

  // Lấy danh sách users

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const roomsData = response.data.rooms || [];
      const normalizedRooms = roomsData.map((room) => ({
        value: room._id,
        label: room.name,
        location: Array.isArray(room.location)
          ? room.location.map((loc) => {
              if (typeof loc === "string") {
                const [building, floor] = loc.split(", ");
                return `Tòa nhà: ${building || "Không xác định"} | Tầng: ${
                  floor || "Không rõ"
                }`;
              }
              return "Không xác định"; // Trả về mặc định nếu loc không hợp lệ
            })
          : ["Không xác định"], // Trả về mặc định nếu location không phải mảng
      }));

      setRooms(normalizedRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Không thể tải danh sách phòng!");
    }
  };
  const handleRevokeLaptop = async (laptopId, reasons) => {
    try {
      const token = localStorage.getItem("authToken");
      const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Lấy thông tin người dùng hiện tại
      const response = await fetch(`${API_URL}/laptops/${laptopId}/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ revokedBy: currentUser?._id || null, reasons }),
      });

      if (!response.ok) throw new Error("Không thể thu hồi laptop!");

      const updatedLaptop = await response.json();
      await fetchLaptopDetails(laptopId); // Gọi API để đồng bộ lại chi tiết

      // Đồng bộ trạng thái với danh sách laptops
      setData((prevData) =>
        prevData.map((laptop) =>
          laptop._id === updatedLaptop._id ? updatedLaptop : laptop
        )
      );
      setSelectedLaptop(updatedLaptop); // Cập nhật laptop đang được chọn
      toast.success("Thu hồi laptop thành công!");
      return updatedLaptop;
    } catch (error) {
      console.error("Error during revoke:", error);
      toast.error("Đã xảy ra lỗi khi thu hồi laptop!");
    }
  };

  // ----------------------------------------------------
  // Gọi API “bàn giao” (POST /laptops/:id/assign)
  // ----------------------------------------------------
  const handleAssignLaptop = async (laptopId, newUserId, notes) => {
    try {
      const token = localStorage.getItem("authToken");
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));

      const response = await fetch(`${API_URL}/laptops/${laptopId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newUserId,
          notes,
          assignedBy: currentUser?._id || null,
        }),
      });

      console.log("Response from API:", response); // Debug toàn bộ response

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API lỗi không xác định.");
      }

      const data = await response.json();
      console.log("Parsed data:", data); // Debug dữ liệu đã parse

      if (!data || !data._id) {
        throw new Error("Dữ liệu trả về từ API không hợp lệ.");
      }

      // Cập nhật state
      if (Array.isArray(data)) {
        setData(
          data.map((laptop) => ({
            ...laptop,
            room: laptop.room
              ? {
                  ...laptop.room,
                  location: Array.isArray(laptop.room.location)
                    ? laptop.room.location.map((loc) =>
                        typeof loc === "string" ? loc : "Không xác định"
                      )
                    : ["Không xác định"], // Giá trị mặc định nếu `location` không phải mảng
                }
              : { name: "Không xác định", location: ["Không xác định"] }, // Nếu `room` null
          }))
        );
      }

      return data; // Trả về dữ liệu đã cập nhật
    } catch (error) {
      console.error("Error in handleAssignLaptop:", error);
      throw error; // Throw lại lỗi để xử lý ở `LaptopProductCard.jsx`
    }
  };

  const fetchLaptopDetails = async (laptopId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_URL}/laptops/${laptopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rawLaptop = response.data; // Dữ liệu gốc từ API
      const mappedLaptop = {
        ...rawLaptop,
        assigned: rawLaptop.assigned.map((user) => ({
          value: user._id,
          label: user.fullname,
          department: user.department || "Chưa xác định",
          jobTitle: user.jobTitle,
          email: user.email,
          avatarUrl: user.avatarUrl,
        })),
      };

      setSelectedLaptop(mappedLaptop);
    } catch (error) {
      console.error("Error fetching laptop details:", error);
    }
  };

  const updateLaptopState = (updatedLaptop) => {
    if (!updatedLaptop || !updatedLaptop._id) {
      console.error("updatedLaptop is invalid:", updatedLaptop);
      return;
    }

    setData((prevData) =>
      prevData.map((laptop) =>
        laptop && laptop._id === updatedLaptop._id ? updatedLaptop : laptop
      )
    );
  };

  const handleUpdateRoom = (updatedLaptop) => {
    // Tìm thông tin phòng chi tiết
    const updatedRoom = rooms.find(
      (room) => room.value === updatedLaptop.room?.value
    );

    const newLaptopData = {
      ...updatedLaptop,
      room: updatedRoom || {
        value: updatedLaptop.room,
        label: "Không xác định",
      },
    };

    // Cập nhật danh sách tại bảng
    setData((prevData) =>
      prevData.map((laptop) =>
        laptop._id === updatedLaptop._id ? newLaptopData : laptop
      )
    );

    // Cập nhật laptop đang chọn nếu cần
    if (selectedLaptop && selectedLaptop._id === updatedLaptop._id) {
      setSelectedLaptop(newLaptopData);
    }
  };

  const handleClone = async (laptop) => {
    try {
      // Payload giữ nguyên thông tin laptop, chỉ thay đổi serial
      const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Lấy thông tin người dùng hiện tại
      const userId = currentUser ? currentUser._id : null; // Lấy ID người dùng
      const clonedLaptop = {
        ...laptop,
        serial: `${laptop.serial}_copy`,
        assigned: laptop.assigned?.map((user) => user.value),
        room: laptop.room ? laptop.room.value : null,
        userId,
      };

      // Gửi yêu cầu POST để tạo laptop mới
      const response = await axios.post(`${API_URL}/laptops`, clonedLaptop, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.status === 201) {
        const newClonedLaptop = response.data;
        // Đưa laptop clone lên đầu danh sách
        setOriginalData((prevData) => [newClonedLaptop, ...prevData]);
        setFilteredData((prevData) => [newClonedLaptop, ...prevData]);
        setData((prevData) => [newClonedLaptop, ...prevData.slice(0, 29)]); // Hiển thị laptop clone ở đầu
        setTotalPages(Math.ceil((filteredData.length + 1) / 30));
        setCurrentPage(1);
        fetchLaptops(); // Cập nhật lại danh sách
        toast.success("Nhân bản laptop thành công!", {
          className: "toast-success",
        });
      }
    } catch (error) {
      console.error("Error cloning laptop:", error);
      toast.error("Không thể nhân bản laptop!", {
        className: "toast-error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!laptopToDelete) return;

    try {
      await axios.delete(`${API_URL}/laptops/${laptopToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Thêm token ở đây
        },
      });
      fetchLaptops(); // Cập nhật lại danh sách sau khi xóa
      toast.success("Laptop đã được xóa!", {
        className: "toast-success",
      });
    } catch (error) {
      console.error("Error deleting laptop:", error);
      toast.error("Có lỗi xảy ra khi xóa laptop!", {
        className: "toast-error",
      });
    } finally {
      setShowConfirmModal(false); // Đóng modal
      setLaptopToDelete(null); // Reset laptop cần xóa
    }
  };

  // Xử lý trong handleEdit
  const handleEdit = (item) => {
    setEditingLaptop({
      ...item,
      assigned: Array.isArray(item.assigned)
        ? item.assigned.map((user) => ({
            value: user.value || user._id,
            label: user.label || user.fullname,
          }))
        : [],
      room: item.room ? { value: item.room._id, label: item.room.label } : null,
    });
    setShowEditModal(true);
  };

  const confirmDelete = (laptop) => {
    setLaptopToDelete(laptop); // Đặt laptop cần xóa
    setShowConfirmModal(true); // Hiển thị modal xác nhận
  };

  const handleAddLaptop = async (e) => {
    e.preventDefault();

    try {
      // Kiểm tra dữ liệu nhập
      if (!newLaptop.name || !newLaptop.serial) {
        toast.error("Vui lòng điền đầy đủ thông tin!", {
          className: "toast-error",
        });
        return;
      }
      const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Assuming currentUser is stored in localStorage
      const userId = currentUser ? currentUser._id : null; // Retrieve the user's ID
      console.log(
        "Current User từ localStorage:",
        localStorage.getItem("currentUser")
      );

      if (!userId) {
        toast.error("User is not logged in. Please log in and try again.");
        return;
      }

      // Chuẩn bị payload
      const payload = {
        ...newLaptop,
        releaseYear: newLaptop.releaseYear || "",
        status: newLaptop.status || "Standby",
        type: newLaptop.type || "Laptop",
        specs: {
          processor: newLaptop.specs?.processor || "",
          ram: newLaptop.specs?.ram || "",
          storage: newLaptop.specs?.storage || "",
          display: newLaptop.specs?.display || "",
        },
        assigned:
          newLaptop.status === "Active"
            ? newLaptop.assigned.map((user) => user.value)
            : [],
        room: newLaptop.status !== "Active" ? newLaptop.room : null,
        reason: newLaptop.status === "Broken" ? newLaptop.reason : null, // Thêm lý do hỏng nếu có
        userId,
        // Xử lý danh sách người dùng
      };

      // Gửi dữ liệu lên API
      const response = await axios.post(`${API_URL}/laptops`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Đảm bảo token được gửi kèm
        },
      });

      if (response.status === 201) {
        setOriginalData((prevData) => [newLaptop, ...prevData]);
        setFilteredData((prevData) => [newLaptop, ...prevData]);
        setData((prevData) => [newLaptop, ...prevData.slice(0, 29)]); // Hiển thị laptop mới ở đầu
        setTotalPages(Math.ceil((filteredData.length + 1) / 30));
        setCurrentPage(1);
        fetchLaptops(); // Cập nhật lại danh sách

        toast.success("Thêm laptop thành công!", {
          className: "toast-success",
          progressClassName: "Toastify__progress-bar",
        });

        // Cập nhật danh sách laptops và đóng modal
        setShowAddModal(false);
        setNewLaptop({
          name: "",
          manufacturer: "",
          serial: "",
          releaseYear: "",
          specs: {
            processor: "",
            ram: "",
            storage: "",
            display: "",
          },
          assigned: [],
          status: "Standby",
          room: "",
          userId,
        });
      }
    } catch (error) {
      console.error("Lỗi khi thêm laptop:", error);
      toast.error("Có lỗi xảy ra khi thêm laptop. Vui lòng thử lại!", {
        className: "toast-error",
        progressClassName: "Toastify__progress-bar",
      });
    }
  };

  // Hàm lọc dữ liệu theo searchTerm
  const filterData = (query) => {
    if (!query.trim()) {
      setFilteredData(originalData);
      setTotalPages(Math.ceil(originalData.length / 30));
      setData(originalData.slice(0, 30));
      setCurrentPage(1);
      setSuggestions([]);
      return;
    }
    const filtered = originalData.filter((item) => {
      const assignedNames = Array.isArray(item.assigned)
        ? item.assigned.map((u) => `${u.label} ${u.department}`).join(" ")
        : "";
      const roomInfo = item.room
        ? `${item.room.label} ${(item.room.location || []).join(" ")}`
        : "";
      const combinedText = [
        item.name,
        item.manufacturer,
        item.serial,
        assignedNames,
        roomInfo,
      ]
        .join(" ")
        .toLowerCase();
      return combinedText.includes(query);
    });
    setFilteredData(filtered);
    setTotalPages(Math.ceil(filtered.length / 30));
    setData(filtered.slice(0, 30));
    setCurrentPage(1);
    setSuggestions(filtered.slice(0, 10));
  };

  // Sử dụng debounce để giảm số lần lọc
  const debouncedFilterData = useCallback(_.debounce(filterData, 300), [
    originalData,
  ]);

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchTerm(query);
    debouncedFilterData(query);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      toast.error("Vui lòng chọn một tệp!", {
        className: "toast-error",
      });
      return;
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Định dạng tệp không hợp lệ. Vui lòng chọn tệp Excel!", {
        className: "toast-error",
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log("Dữ liệu thô từ Excel:", sheetData);

        // Chuẩn hóa dữ liệu
        const normalizedData = sheetData
          .map((row, index) => {
            // Kiểm tra các trường bắt buộc
            if (!row["Tên Thiết Bị (name)"] || !row["Serial (serial)"]) {
              console.warn(
                `Hàng ${
                  index + 1
                } bị bỏ qua: thiếu "Tên thiết bị" hoặc "Serial".`
              );
              return null; // Bỏ qua nếu thiếu trường bắt buộc
            }

            // Chuẩn hóa các trường không bắt buộc
            const specs = {
              processor:
                typeof row["Bộ Xử Lý (processor)"] === "string"
                  ? row["Bộ Xử Lý (processor)"].trim()
                  : "",
              ram:
                typeof row["RAM (ram)"] === "string"
                  ? row["RAM (ram)"].trim()
                  : "",
              storage:
                typeof row["Bộ Nhớ (storage)"] === "string"
                  ? row["Bộ Nhớ (storage)"].trim()
                  : "",
              display:
                typeof row["Màn Hình (display)"] === "string"
                  ? row["Màn Hình (display)"].trim()
                  : "",
            };

            const roomName =
              typeof row["Tên Phòng (Room Name)"] === "string"
                ? row["Tên Phòng (Room Name)"].trim()
                : "";
            const matchedRoom = roomName
              ? rooms.find(
                  (room) => room.label.toLowerCase() === roomName.toLowerCase()
                )
              : null;

            if (roomName && !matchedRoom) {
              console.warn(
                `Tên phòng "${roomName}" không tồn tại. Trường này sẽ bị bỏ qua.`
              );
            }

            const assignedFullnames = row["Người Dùng (assigned)"]
              ? row["Người Dùng (assigned)"]
                  .split(",")
                  .map((name) => name.trim())
              : [];

            const assignedIds = assignedFullnames
              .map((name) => {
                const matchedUser = users.find(
                  (user) =>
                    user.label.trim().toLowerCase() === name.toLowerCase()
                );
                if (!matchedUser) {
                  console.warn(
                    `Tên người dùng "${name}" không hợp lệ. Bỏ qua.`
                  );
                  return null;
                }
                return matchedUser.value; // ID hợp lệ
              })
              .filter((id) => id !== null); // Loại bỏ các giá trị không hợp lệ

            return {
              name: row["Tên Thiết Bị (name)"].trim(),
              serial: row["Serial (serial)"]
                ? String(row["Serial (serial)"]).trim()
                : "",
              type:
                typeof row["Loại (type)"] === "string"
                  ? row["Loại (type)"].trim()
                  : "Laptop", // Mặc định là Laptop
              manufacturer:
                typeof row["Nhà Sản Xuất (manufacturer)"] === "string"
                  ? row["Nhà Sản Xuất (manufacturer)"].trim()
                  : "",
              releaseYear:
                typeof row["Năm đưa vào sử dụng (releaseYear)"] === "string"
                  ? row["Năm đưa vào sử dụng (releaseYear)"].trim()
                  : "",
              status:
                typeof row["Trạng Thái (status)"] === "string"
                  ? row["Trạng Thái (status)"].trim()
                  : "Không xác định",
              specs: specs,
              assigned: assignedIds,
              room: matchedRoom?.value || "", // Nếu không hợp lệ hoặc trống, để trống
            };
          })
          .filter((item) => item !== null); // Loại bỏ các dòng không hợp lệ

        console.log("Dữ liệu chuẩn hóa:", normalizedData);

        if (normalizedData.length === 0) {
          toast.error("File Excel không chứa dữ liệu hợp lệ!", {
            className: "toast-error",
          });
          return;
        }

        setParsedData(normalizedData);
        toast.success("File Excel hợp lệ và đã được tải lên!", {
          className: "toast-success",
        });
      } catch (error) {
        console.error("Lỗi khi xử lý tệp Excel:", error);
        toast.error("Đã xảy ra lỗi khi xử lý tệp. Vui lòng kiểm tra lại!", {
          className: "toast-error",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmUpload = async () => {
    if (!parsedData || parsedData.length === 0) {
      toast.error("Không có dữ liệu để upload. Vui lòng kiểm tra file Excel!", {
        className: "toast-error",
        progressClassName: "Toastify__progress-bar",
      });
      return;
    }

    try {
      console.log("Dữ liệu gửi lên:", parsedData);

      const response = await axios.post(
        `${API_URL}/laptops/bulk-upload`,
        { laptops: parsedData },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.status === 201) {
        toast.success(
          `${response.data.addedLaptops} laptop(s) đã được thêm thành công!`,
          {
            className: "toast-success",
            progressClassName: "Toastify__progress-bar",
          }
        );
        fetchLaptops();
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu lên:", error);

      if (error.response?.status === 400) {
        const { errors } = error.response.data || {};
        if (errors && Array.isArray(errors)) {
          const duplicateSerials = errors
            .filter((err) => err.message.includes("đã tồn tại"))
            .map((err) => err.serial);

          if (duplicateSerials.length > 0) {
            toast.error(`Các serial bị trùng: ${duplicateSerials.join(", ")}`, {
              className: "toast-error",
              progressClassName: "Toastify__progress-bar",
            });
          } else {
            toast.error("File chứa lỗi không xác định.", {
              className: "toast-error",
              progressClassName: "Toastify__progress-bar",
            });
          }
        } else {
          toast.error("Dữ liệu có lỗi, vui lòng kiểm tra lại.", {
            className: "toast-error",
            progressClassName: "Toastify__progress-bar",
          });
        }
      } else {
        toast.error("Đã xảy ra lỗi không xác định từ server!", {
          className: "toast-error",
          progressClassName: "Toastify__progress-bar",
        });
      }
    }
  };

  // useEffect #1: fetch toàn bộ dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      await fetchLaptops(); // Lấy toàn bộ laptops => setOriginalData(...)
      await fetchUsers(); // Lấy toàn bộ user => setUsers(...)
      await fetchRooms(); // Lấy toàn bộ room => setRooms(...)
    };

    fetchData();
  }, []);

  // useEffect #2: Mỗi khi originalData thay đổi, tự cập nhật filteredData, totalPages, data trang đầu
  useEffect(() => {
    if (originalData.length > 0) {
      setFilteredData(originalData);
      setTotalPages(Math.ceil(originalData.length / 30));
      setData(originalData.slice(0, 30)); // Chỉ hiển thị 30 items đầu tiên
      setCurrentPage(1); // Reset về trang 1
    }
  }, [originalData]);

  // useEffect #3: Mỗi khi filteredData hoặc currentPage thay đổi => cắt 30 records hiển thị
  useEffect(() => {
    const startIndex = (currentPage - 1) * 30;
    const paginatedData = filteredData.slice(startIndex, startIndex + 30);
    setData(paginatedData);
  }, [filteredData, currentPage]);

  // useEffect #4: Nếu đang mở detail (selectedLaptop), thì tìm laptop mới nhất trong data
  useEffect(() => {
    if (selectedLaptop) {
      const updatedLaptop = data.find(
        (laptop) => laptop._id === selectedLaptop._id
      );
      if (updatedLaptop) setSelectedLaptop(updatedLaptop);
    }
  }, [data]);
  // useEffect #5: Log ra Original / Filtered / Displayed data (nếu muốn debug)

  return (
    <div className="w-full h-full px-6 pb-6 sm:overflow-x-auto rounded-2xl">
      {/* Header */}
      <div className="flex flex-col justify-between items-start mb-2">
        {/* Search Input */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="relative w-1/3">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm laptop..."
              className="pl-10 pr-4 py-2 rounded-md w-2/3"
              value={searchTerm}
              onChange={handleSearchChange}
            />

            {/* Hiển thị suggestions (nếu có) */}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setNewLaptop({
                  name: "",
                  manufacturer: "",
                  serial: "",
                  assigned: [],
                });
                setShowAddModal(true);
              }}
              className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-2xl hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105 "
            >
              Thêm mới
            </button>
            <button
              className="px-3 py-2 bg-[#FF5733] text-white text-sm font-bold  rounded-lg shadow-2xl hover:bg-[#cc4529]transform transition-transform duration-300 hover:scale-105 "
              onClick={() => setShowUploadModal(true)}
            >
              Upload
            </button>
          </div>
        </div>

        <div className="flex items-center justify-start w-full space-x-4 mb-4">
          <Dropdown
            button={
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-50 focus:ring-2 focus:ring-[#002147] transform transition-transform duration-300 hover:scale-105 ">
                {selectedOption === "Tất cả"
                  ? "Trạng thái: Tất cả trạng thái"
                  : `Trạng thái: ${selectedOption}`}
              </button>
            }
            children={
              <div className="flex flex-col gap-2 mt-10 bg-white rounded-lg shadow-lg p-4">
                {/* Option "Tất cả trạng thái" */}
                <button
                  key="all"
                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => {
                    setSelectedOption("Tất cả");
                    applyFilters({ status: "Tất cả" });
                  }}
                >
                  Tất cả trạng thái
                </button>

                {/* Các trạng thái */}
                {[
                  { value: "Active", label: "Đang sử dụng" },
                  { value: "Standby", label: "Chờ Cấp Phát" },
                  { value: "Broken", label: "Hỏng" },
                  {
                    value: "PendingDocumentation",
                    label: "Đã bàn giao - Chưa có biên bản",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                    onClick={() => {
                      setSelectedOption(option.label);
                      applyFilters({ status: option.value });
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            }
          />
          <Dropdown
            button={
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-50 focus:ring-2 focus:ring-[#002147] transform transition-transform duration-300 hover:scale-105">
                {selectedType === "Tất cả"
                  ? "Loại: Tất cả"
                  : `Loại: ${selectedType}`}
              </button>
            }
            children={
              <div className="flex flex-col gap-2 mt-10 bg-white rounded-lg shadow-lg p-4">
                <button
                  key="all"
                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => {
                    setSelectedType("Tất cả");
                    applyFilters({ type: "Tất cả" });
                  }}
                >
                  Tất cả
                </button>
                {Array.from(new Set(originalData.map((item) => item.type))).map(
                  (type) => (
                    <button
                      key={type}
                      className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => {
                        setSelectedType(type);
                        applyFilters({ type });
                      }}
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            }
          />
          <Dropdown
            button={
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-50 focus:ring-2 focus:ring-[#002147] transform transition-transform duration-300 hover:scale-105">
                {selectedDepartment === "Tất cả"
                  ? "Phòng ban: Tất cả phòng ban"
                  : `Phòng ban: ${selectedDepartment}`}
              </button>
            }
            children={
              <div className="flex flex-col gap-2 mt-10 bg-white rounded-lg shadow-lg p-4">
                <button
                  key="all"
                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => {
                    setSelectedDepartment("Tất cả");
                    applyFilters({ department: "Tất cả" });
                  }}
                >
                  Tất cả phòng ban
                </button>
                {Array.from(
                  new Set(
                    originalData.flatMap((item) =>
                      item.assigned.map((user) => user.department)
                    )
                  )
                ).map((department) => (
                  <button
                    key={department}
                    className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                    onClick={() => {
                      setSelectedDepartment(department);
                      applyFilters({ department });
                    }}
                  >
                    {department}
                  </button>
                ))}
              </div>
            }
          />
          <Dropdown
            button={
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-50 focus:ring-2 focus:ring-[#002147] transform transition-transform duration-300 hover:scale-105">
                {selectedManufacturer === "Tất cả"
                  ? "Nhà sản xuất: Tất cả nhà sản xuất"
                  : `Nhà sản xuất: ${selectedManufacturer}`}
              </button>
            }
            children={
              <div className="flex flex-col gap-2 mt-10 bg-white rounded-lg shadow-lg p-4">
                <button
                  key="all"
                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => {
                    setSelectedManufacturer("Tất cả");
                    applyFilters({ manufacturer: "Tất cả" });
                  }}
                >
                  Tất cả nhà sản xuất
                </button>
                {Array.from(
                  new Set(originalData.map((item) => item.manufacturer))
                ).map((manufacturer) => (
                  <button
                    key={manufacturer}
                    className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                    onClick={() => {
                      setSelectedManufacturer(manufacturer);
                      applyFilters({ manufacturer });
                    }}
                  >
                    {manufacturer}
                  </button>
                ))}
              </div>
            }
          />
          <Dropdown
            button={
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-50 focus:ring-2 focus:ring-[#002147] transform transition-transform duration-300 hover:scale-105">
                {selectedYear === "Tất cả"
                  ? "Năm sản xuất: Tất cả năm sản xuất"
                  : `Năm sản xuất: ${selectedYear}`}
              </button>
            }
            children={
              <div className="flex flex-col gap-2 mt-10 bg-white rounded-lg shadow-lg p-4">
                <button
                  key="all"
                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => {
                    setSelectedYear("Tất cả");
                    applyFilters({ releaseYear: "Tất cả" });
                  }}
                >
                  Tất cả năm sản xuất
                </button>
                {Array.from(
                  new Set(originalData.map((item) => item.releaseYear))
                )
                  .sort()
                  .map((year) => (
                    <button
                      key={year}
                      className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => {
                        setSelectedYear(year);
                        applyFilters({ releaseYear: year });
                      }}
                    >
                      {year}
                    </button>
                  ))}
              </div>
            }
          />
        </div>
      </div>

      {/* {-----------------------------------------/* Bảng /-----------------------------------------} */}
      <div className="w-full h-full px-6 pb-6 sm:overflow-x-auto bg-white rounded-2xl shadow-xl border">
        <div className="mt-1 overflow-x-scroll xl:overflow-x-hidden">
          <table className="w-full ">
            <thead>
              <tr className="!border-px !border-gray-400">
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">
                    TÊN THIẾT BỊ
                  </p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">LOẠI</p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">SERIAL</p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">
                    NGƯỜI SỬ DỤNG
                  </p>
                </th>
                <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">NƠI SỬ DỤNG</p>
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
              {data.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td
                    onClick={() => handleViewDetails(item)}
                    className="cursor-pointer text-[#002147] min-w-[150px] border-white/0 py-3 pr-4 "
                  >
                    <p className="text-sm font-bold text-navy-700">
                      {item.name}
                    </p>
                    <span className="text-sm italic bold text-gray-500">
                      {item.manufacturer || "Không xác định"} -{" "}
                      {item.releaseYear || "N/A"}
                    </span>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">
                      {item.type}
                    </p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">
                      {item.serial}
                    </p>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4 text-sm font-bold text-navy-700">
                    {Array.isArray(item.assigned) &&
                    item.assigned.length > 0 ? (
                      item.assigned.map((user) => (
                        <div key={user.value || user._id}>
                          <p className="font-bold">{user.label}</p>
                          <span className="italic text-gray-400">
                            {user.department
                              ? user.department
                              : "Không xác định"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div>
                        <p className="font-bold">Chưa bàn giao</p>
                      </div>
                    )}
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4 text-sm font-bold text-navy-700">
                    {item.room ? (
                      <div>
                        <p className="font-bold">{item.room.label}</p>
                        {Array.isArray(item.room.location) &&
                        item.room.location.length > 0 ? (
                          item.room.location.map((loc, idx) => {
                            if (
                              typeof loc === "string" &&
                              loc.includes(", tầng ")
                            ) {
                              const [building, floor] = loc.split(", tầng ");
                              return (
                                <p key={idx} className="italic text-gray-400">
                                  Tòa nhà: {building.trim() || "Không xác định"}{" "}
                                  | Tầng: {floor.trim() || "Không rõ"}
                                </p>
                              );
                            }
                            return "";
                          })
                        ) : (
                          <p className="italic text-gray-400">Không xác định</p>
                        )}
                      </div>
                    ) : (
                      <p className="font-bold">Không xác định</p>
                    )}
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <div className="flex items-center">
                      {item.status === "Active" ? (
                        <MdCheckCircle className="text-[#009483] me-1" />
                      ) : item.status === "Broken" ? (
                        <MdCancel className="text-orange-red me-1" />
                      ) : item.status === "Standby" ? (
                        <MdOutlineError className="text-amber-500 me-1" />
                      ) : item.status === "PendingDocumentation" ? (
                        <MdOutlineError className="text-[#FFC107] me-1" />
                      ) : null}
                      <p className="text-sm font-bold text-navy-700">
                        {statusLabels[item.status] || "Không xác định"}
                      </p>
                    </div>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                      >
                        <FiEdit size={14} />
                      </button>
                      <button
                        onClick={() => confirmDelete(item)}
                        className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg  transform transition-transform duration-300 hover:scale-105"
                      >
                        <FiTrash2 size={14} />
                      </button>
                      <button
                        onClick={() => handleClone(item)}
                        className="flex items-center justify-center w-7 h-7 text-white bg-[#009483] rounded-lg  transform transition-transform duration-300 hover:scale-105"
                      >
                        <FiCopy size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Phân trang */}
          <div className="flex justify-end items-center mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-3 py-1 bg-[#FF5733] text-white text-sm  font-bold rounded-lg hover:bg-[#ff6b4a] disabled:bg-[#002147] disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <span className="mx-4 text-xs font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-3 py-1 bg-[#FF5733] text-white text-sm font-bold rounded-lg hover:bg-[#ff6b4a] disabled:bg-[#002147] disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* {-----------------------------------------/* Modal thêm mới /-----------------------------------------} */}
      {showAddModal &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 space-y-6 z-1000"
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-6 w-[50%]"
              onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
            >
              <h3 className="text-2xl font-bold mb-6 text-[#002147]">
                Thêm mới laptop
              </h3>
              <form onSubmit={handleAddLaptop}>
                {/* Thông tin chung */}
                <div
                  className="border rounded-lg p-4 mb-4 relative"
                  style={{
                    position: "relative",
                    padding: "16px",
                    marginBottom: "30px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "16px",
                      backgroundColor: "#fff",
                      padding: "0 8px",
                      fontWeight: "bold",
                      color: "#002147",
                    }}
                  >
                    Thông tin chung
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Tên thiết bị
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập tên thiết bị"
                        value={newLaptop.name}
                        onChange={(e) =>
                          setNewLaptop({ ...newLaptop, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Phân loại
                      </label>
                      <select
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        value={newLaptop.type}
                        onChange={(e) =>
                          setNewLaptop({ ...newLaptop, type: e.target.value })
                        }
                      >
                        <option value="Laptop">Laptop</option>
                        <option value="Desktop">Desktop</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Nhà sản xuất
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập nhà sản xuất"
                        value={newLaptop.manufacturer}
                        onChange={(e) =>
                          setNewLaptop({
                            ...newLaptop,
                            manufacturer: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Serial
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập số serial"
                        value={newLaptop.serial}
                        onChange={(e) =>
                          setNewLaptop({ ...newLaptop, serial: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Năm sản xuất
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập năm sản xuất"
                        value={newLaptop.releaseYear}
                        onChange={(e) =>
                          setNewLaptop({
                            ...newLaptop,
                            releaseYear: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Cấu hình */}
                <div
                  className="border rounded-lg p-4 mb-4 relative"
                  style={{
                    position: "relative",
                    padding: "16px",
                    marginBottom: "30px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "16px",
                      backgroundColor: "#fff",
                      padding: "0 8px",
                      fontWeight: "bold",
                      color: "#002147",
                      marginBottom: "16px",
                    }}
                  >
                    Cấu hình
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Processor
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập bộ xử lý"
                        value={newLaptop.specs?.processor || ""}
                        onChange={(e) =>
                          setNewLaptop({
                            ...newLaptop,
                            specs: {
                              ...newLaptop.specs,
                              processor: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        RAM
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập dung lượng RAM"
                        value={newLaptop.specs?.ram || ""}
                        onChange={(e) =>
                          setNewLaptop({
                            ...newLaptop,
                            specs: { ...newLaptop.specs, ram: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Bộ Nhớ
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập dung lượng Bộ nhớ"
                        value={newLaptop.specs?.storage || ""}
                        onChange={(e) =>
                          setNewLaptop({
                            ...newLaptop,
                            specs: {
                              ...newLaptop.specs,
                              storage: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Màn hình
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập kích thước màn hình"
                        value={newLaptop.specs?.display || ""}
                        onChange={(e) =>
                          setNewLaptop({
                            ...newLaptop,
                            specs: {
                              ...newLaptop.specs,
                              display: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#002147] text-white rounded"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* {-----------------------------------------/* Modal upload /-----------------------------------------} */}
      {showUploadModal &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-9999"
            style={{ zIndex: 1050 }}
          >
            <div
              className="bg-white p-6 rounded-md shadow-md w-1/3 relative z-9999"
              style={{ zIndex: 1050 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-center text-[#002147]">
                Cập nhật dữ liệu
              </h2>
              <form>
                {/* Input chọn file */}
                <div className="mb-4">
                  <label className="block text-base font-medium mb-2">
                    Chọn file Excel
                  </label>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="block w-full text-sm text-gray-900 border border-gray-300 cursor-pointer bg-gray-50 focus:outline-none"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Trạng thái tải */}
                {isUploading && (
                  <div className="text-blue-500 text-center mb-4">
                    Đang xử lý tệp, vui lòng chờ...
                  </div>
                )}

                <div className="flex justify-between items-center">
                  {/* Nút tải file mẫu */}
                  <a
                    href="/laptop-sample-upload.xlsx"
                    download
                    className="bg-[#009483] text-white px-4 py-2 rounded-md hover:bg-[#001635]"
                  >
                    Tải file mẫu
                  </a>
                  <div className="flex space-x-2">
                    {/* Nút hủy */}
                    <button
                      type="button"
                      className="bg-[#FF5733] text-white px-4 py-2 rounded-md"
                      onClick={() => setShowUploadModal(false)}
                    >
                      Hủy
                    </button>
                    {/* Nút xác nhận */}
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-md text-white ${
                        isUploading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-[#002147] hover:bg-[#001635]"
                      }`}
                      onClick={handleConfirmUpload}
                      disabled={isUploading}
                    >
                      Xác nhận
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      {/* {-----------------------------------------/* Modal cập nhật thông tin /-----------------------------------------} */}
      {showEditModal &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 space-y-6 z-1000"
            style={{ zIndex: 1050 }}
            onClick={() => setShowEditModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-6 w-[50%]"
              onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
              style={{ zIndex: 1050 }}
            >
              <h3 className="text-2xl font-semibold mb-8 text-[#002147]">
                Cập nhật thông tin Laptop
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const payload = {
                      ...editingLaptop,
                      releaseYear: editingLaptop.releaseYear || "",
                      type: editingLaptop.type || "Laptop",
                      reason: editingLaptop.reason || "",
                      specs: {
                        processor: editingLaptop.specs?.processor || "",
                        ram: editingLaptop.specs?.ram || "",
                        storage: editingLaptop.specs?.storage || "",
                        display: editingLaptop.specs?.display || "",
                      },
                      assigned: Array.isArray(editingLaptop.assigned)
                        ? editingLaptop.assigned
                            .filter((user) => user.value) // Lọc bỏ user không có ID
                            .map((user) => user.value) // Chỉ lấy ID
                        : [],
                      room: editingLaptop.room?.value || null, // Chỉ lấy ID phòng
                    };

                    console.log("Payload gửi lên server:", payload);

                    await axios.put(
                      `${API_URL}/laptops/${editingLaptop._id}`,
                      payload,
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "authToken"
                          )}`,
                        },
                      }
                    );
                    setShowEditModal(false);
                    fetchLaptops(); // Làm mới danh sách sau khi lưu
                    toast.success("Cập nhật laptop thành công!");
                  } catch (error) {
                    console.error("Error updating laptop:", error);
                    toast.error("Không thể cập nhật laptop!");
                  }
                }}
              >
                {/* Thông tin chung */}
                <div
                  className="border rounded-lg p-4 mb-4 relative"
                  style={{
                    position: "relative",
                    padding: "16px",
                    marginBottom: "30px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "16px",
                      backgroundColor: "#fff",
                      padding: "0 8px",
                      fontWeight: "bold",
                      color: "#002147",
                    }}
                  >
                    Thông tin chung
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Tên thiết bị
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập tên thiết bị"
                        value={editingLaptop.name}
                        onChange={(e) =>
                          setEditingLaptop({
                            ...editingLaptop,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Nhà sản xuất
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập nhà sản xuất"
                        value={editingLaptop.manufacturer}
                        onChange={(e) =>
                          setEditingLaptop({
                            ...editingLaptop,
                            manufacturer: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Phân loại
                      </label>
                      <select
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        value={editingLaptop.type}
                        onChange={(e) =>
                          setEditingLaptop({
                            ...editingLaptop,
                            type: e.target.value,
                          })
                        }
                      >
                        <option value="Laptop">Laptop</option>
                        <option value="Desktop">Desktop</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Serial
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập số serial"
                        value={editingLaptop.serial}
                        onChange={(e) =>
                          setEditingLaptop({
                            ...editingLaptop,
                            serial: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Năm sản xuất
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập năm sản xuất"
                        value={editingLaptop.releaseYear}
                        onChange={(e) =>
                          setEditingLaptop({
                            ...editingLaptop,
                            releaseYear: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Cấu hình */}
                <div
                  className="border rounded-lg p-4 mb-4 relative"
                  style={{
                    position: "relative",
                    padding: "16px",
                    marginBottom: "30px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "16px",
                      backgroundColor: "#fff",
                      padding: "0 8px",
                      fontWeight: "bold",
                      color: "#002147",
                    }}
                  >
                    Cấu hình
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Processor
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập bộ xử lý"
                        value={editingLaptop.specs?.processor || ""}
                        onChange={(e) =>
                          setEditingLaptop({
                            ...editingLaptop,
                            specs: {
                              ...editingLaptop.specs,
                              processor: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        RAM
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập dung lượng RAM"
                        value={editingLaptop.specs?.ram || ""}
                        onChange={(e) =>
                          setEditingLaptop({
                            ...editingLaptop,
                            specs: {
                              ...editingLaptop.specs,
                              ram: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Bộ Nhớ
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập dung lượng bộ nhớ"
                        value={editingLaptop.specs?.storage || ""}
                        onChange={(e) =>
                          setEditingLaptop({
                            ...editingLaptop,
                            specs: {
                              ...editingLaptop.specs,
                              storage: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-2">
                        Màn hình
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        placeholder="Nhập kích thước màn hình"
                        value={editingLaptop.specs?.display || ""}
                        onChange={(e) =>
                          setEditingLaptop({
                            ...editingLaptop,
                            specs: {
                              ...editingLaptop.specs,
                              display: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Trạng thái */}
                <div
                  className="border rounded-lg p-4 mb-4 relative justify-between"
                  style={{
                    position: "relative",
                    padding: "16px",
                    marginBottom: "30px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "16px",
                      backgroundColor: "#fff",
                      padding: "0 8px",
                      fontWeight: "bold",
                      color: "#002147",
                    }}
                  >
                    Trạng thái
                  </span>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div>
                      <select
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        value={editingLaptop.status}
                        onChange={(e) =>
                          setEditingLaptop({
                            ...editingLaptop,
                            status: e.target.value,
                          })
                        }
                      >
                        <option value="Active">Đang sử dụng</option>
                        <option value="Standby">Chờ Cấp Phát</option>
                        <option value="Broken">Hỏng</option>
                      </select>
                    </div>

                    {/* Ô người sử dụng khi trạng thái là "Đang sử dụng" */}
                    {editingLaptop.status === "Active" && (
                      <div>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập tên người sử dụng"
                          value={editingLaptop.assigned[0]?.label || ""}
                          onChange={(e) => {
                            const query = e.target.value.toLowerCase();

                            // Lọc danh sách người dùng phù hợp
                            const filtered = users.filter(
                              (user) =>
                                user.label.toLowerCase().includes(query) ||
                                user.emailAddress.toLowerCase().includes(query)
                            );

                            setFilteredUsers(filtered);
                            setShowSuggestions(true);

                            // Tạm thời gắn giá trị nhập vào assigned
                            setEditingLaptop({
                              ...editingLaptop,
                              assigned: [
                                { label: e.target.value, value: null },
                              ],
                            });
                          }}
                          onBlur={() =>
                            setTimeout(() => setShowSuggestions(false), 200)
                          } // Đợi người dùng chọn gợi ý
                        />
                        {showSuggestions && filteredUsers.length > 0 && (
                          <ul className="border rounded-lg mt-2 bg-white shadow-lg max-h-40 overflow-y-auto">
                            {filteredUsers.map((user) => (
                              <li
                                key={user.value}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  setEditingLaptop({
                                    ...editingLaptop,
                                    assigned: [user],
                                  });
                                  setShowSuggestions(false);
                                }}
                              >
                                <span className="font-bold">{user.label}</span>
                                <br />
                                <span className="italic text-gray-500">
                                  {user.emailAddress}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Ô lý do hỏng khi trạng thái là "Hỏng" */}
                    {editingLaptop.status === "Broken" && (
                      <div>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập lý do hỏng"
                          value={editingLaptop.reason || ""}
                          onChange={(e) =>
                            setEditingLaptop({
                              ...editingLaptop,
                              reason: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    {/* <div>
                          <label className="block mt-3 text-gray-600 font-medium mb-2">Nơi sử dụng</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập tên phòng"
                            value={editingLaptop.room?.label || ""}
                            onChange={(e) => {
                              const query = e.target.value.toLowerCase();

                              // Lọc danh sách rooms phù hợp
                              const filtered = rooms.filter((room) =>
                                room.label.toLowerCase().includes(query)
                              );

                              setFilteredRooms(filtered);
                              setShowRoomSuggestions(true);

                              // Tạm thời gắn giá trị nhập vào room
                              setEditingLaptop({
                                ...editingLaptop,
                                room: { label: e.target.value, value: null },
                              });
                            }}
                            onBlur={() => setTimeout(() => setShowRoomSuggestions(false), 200)}
                          />
                            {showRoomSuggestions && filteredRooms.length > 0 && (
                              <ul className="border rounded-lg mt-2 bg-white shadow-lg max-h-40 overflow-y-auto">
                              {filteredRooms.map((room) => (
                                <li
                                  key={room.value}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => {
                                    setEditingLaptop({
                                      ...editingLaptop,
                                      room,
                                    });
                                    setShowRoomSuggestions(false);
                                  }}
                                >
                                  <span className="font-bold">{room.label}</span>
                                  <br />
                                  <span className="italic text-gray-500">{room.location}</span>
                                </li>
                              ))}
                            </ul>
                            )}
                        </div> */}
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#002147] text-white rounded"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      {/* {-----------------------------------------/* Modal confirm /-----------------------------------------} */}
      {showConfirmModal &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center"
            style={{ zIndex: 1050 }}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-6 w-96"
              style={{ zIndex: 1050 }}
            >
              <h3 className="text-lg text-center font-semibold mb-4 text-[#002147]">
                Xác nhận xóa
              </h3>
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa laptop{" "}
                <strong>{laptopToDelete?.name}</strong> không?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-[#002147] text-white rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-[#FF5733] text-white rounded hover:bg-[#cc4529] transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      {/* {-----------------------------------------/* Modal click thiết bị /-----------------------------------------} */}
      {showDetailModal &&
        selectedLaptop &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            style={{ zIndex: 1050 }}
            onClick={(e) => {
              // Đóng modal nếu người dùng nhấp ra ngoài modal
              if (e.target === e.currentTarget) {
                setSelectedLaptop(null);
              }
            }}
          >
            <div
              className="  w-4/5 max-w-7xl rounded-lg shadow-lg relative overflow-y-auto max-h-[90vh]"
              style={{ zIndex: 1990 }}
              onClick={(e) => e.stopPropagation()}
            >
              <LaptopProductCard
                key={refreshKey} // Force re-render khi refreshKey thay đổi
                laptopData={{
                  ...selectedLaptop,
                  releaseYear: selectedLaptop.releaseYear,
                }}
                setSelectedLaptop={setSelectedLaptop}
                onUpdateSpecs={handleUpdateSpecs} // Bổ sung prop này
                onCloseModal={() => {
                  setSelectedLaptop(null); // Reset laptop đã chọn
                  setShowDetailModal(false); // Đóng modal
                  fetchLaptops(); // refresh sau khi thao tác
                }} // Truyền hàm đóng modal
                // Truyền vào 2 hàm thu hồi / bàn giao
                onRevoke={handleRevokeLaptop}
                onAssign={handleAssignLaptop}
                fetchLaptopDetails={fetchLaptopDetails}
                onUpdateLaptop={updateLaptopState}
                onUpdateRoom={handleUpdateRoom}
                refetchLaptops={fetchLaptops}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default LaptopTable;
