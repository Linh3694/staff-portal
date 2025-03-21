import React, { useState, useEffect } from "react";
import {
  FiEdit,
  FiCpu,
  FiHardDrive,
  FiMonitor,
  FiTrash2,
  FiPackage,
  FiRefreshCw,
  FiGrid,
  FiArchive,
} from "react-icons/fi";
import { FaMemory } from "react-icons/fa";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.module.css";
import { MdCancel, MdCheckCircle, MdOutlineError } from "react-icons/md";
import { debounce } from "lodash";
import Fuse from "fuse.js";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import axios from "axios";
import Dropdown from "../../function/dropdown";
import {
  IoLocationOutline,
  IoBuildOutline,
  IoBookOutline,
  IoCloudUploadOutline,
} from "react-icons/io5";
import Inspect from "../inspect/inspect";
import { API_URL, UPLOAD_URL, BASE_URL } from "../../../config";

/**
 * Hàm tiện ích trả về endpoint ứng với từng loại thiết bị.
 * Ví dụ: deviceType = "laptop" -> "laptops"
 */
const getEndpoint = (deviceType) => {
  switch (deviceType) {
    case "laptop":
      return "laptops";
    case "monitor":
      return "monitors";
    case "printer":
      return "printers";
    case "projector":
      return "projectors";
    case "tool":
      return "tools";
    default:
      return "devices"; // fallback nếu cần
  }
};

/**
 * ProductCard: gộp chung logic của LaptopProductCard, MonitorProductCard, v.v.
 * Props bắt buộc:
 * - deviceType: "laptop" | "monitor" | "printer" | "projector" | "tool"
 * - deviceData: Object chứa dữ liệu thiết bị
 * - onCloseModal: Hàm đóng modal
 * - onRevoke: Hàm xử lý thu hồi
 * - onAssign: Hàm xử lý bàn giao
 * - fetchDeviceDetails: Hàm fetch chi tiết thiết bị
 * - onUpdateDevice: Hàm cập nhật state ở cấp cha
 */
const ProductCard = ({
  deviceType = "laptop",
  deviceData,
  onCloseModal,
  onRevoke,
  onAssign,
  fetchDeviceDetails,
  onUpdateDevice,
}) => {
  const [activeTab, setActiveTab] = useState("repairs");
  const [repairs, setRepairs] = useState([]);
  const [updates, setUpdates] = useState([]);

  // Biến tạm cho sửa chữa / cập nhật (nếu cần)
  const [repairData] = useState({
    type: "repair",
    description: "",
    date: "",
    details: "",
  });

  // Quản lý state chung
  const [setShowAddRepairModal] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [isEditUpdateOpen, setIsEditUpdateOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState({
    type: "update",
    description: "",
    date: "",
    details: "",
  });
  const [isEditRepairOpen, setIsEditRepairOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState({
    type: "repair",
    description: "",
    date: "",
    details: "",
  });
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: "repair",
    description: "",
    details: "",
    date: new Date().toISOString(),
  });

  // Thu hồi
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReasons, setRevokeReasons] = useState([]);
  const [otherReason, setOtherReason] = useState("");

  // Local status & data
  const [localStatus, setLocalStatus] = useState(deviceData.status);
  const [localDevice, setLocalDevice] = useState(deviceData);

  // Bàn giao
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [notes, setNotes] = useState("");

  // Tìm kiếm user
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [currentHolder, setCurrentHolder] = useState({
    user: {
      fullname: "Chưa bàn giao",
      jobTitle: "",
      email: "",
      avatarUrl: "",
      department: "",
    },
  });

  // Báo hỏng
  const [showBrokenModal, setShowBrokenModal] = useState(false);
  const [brokenReason, setBrokenReason] = useState("");

  // Phòng ban
  const [localRoom, setLocalRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showRoomEditModal, setShowRoomEditModal] = useState(false);
  const room = localDevice.room || null;

  // Recycle
  const [showRecycleModal, setShowRecycleModal] = useState(false);

  // Inspect
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [lastInspection, setLastInspection] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

  // 1) Fetch Inspect
  useEffect(() => {
    const fetchInspectionData = async () => {
      if (!deviceData?._id) return;
      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/inspects/${deviceType}/${deviceData._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok) {
          setLastInspection(data.data);
        } else {
          console.error("Lỗi khi lấy dữ liệu kiểm tra:", data.message);
          setLastInspection(null);
        }
      } catch (error) {
        console.error("Lỗi kết nối:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInspectionData();
  }, [deviceData._id, deviceType, refreshKey]);

  // 2) Fetch hoạt động (repairs, updates)
  const fetchActivities = async (type, id) => {
    const response = await axios.get(`${API_URL}/activities/${type}/${id}`);
    return response.data;
  };

  useEffect(() => {
    const loadActivities = async () => {
      if (!localDevice?._id) return;
      try {
        const activities = await fetchActivities(deviceType, localDevice._id);
        const repairList = activities.filter((a) => a.type === "repair");
        const updateList = activities.filter((a) => a.type === "update");

        setRepairs(repairList);
        setUpdates(updateList);
      } catch (error) {
        console.error("Lỗi khi tải activity:", error);
        toast.error("Không thể tải lịch sử hoạt động!");
      }
    };
    loadActivities();
  }, [localDevice, deviceType]);

  // 3) useEffect đồng bộ cục bộ
  useEffect(() => {
    setLocalDevice(deviceData);
    setLocalStatus(deviceData.status);
  }, [deviceData]);

  // Refresh
  useEffect(() => {
    setRefreshKey((prev) => prev + 1);
  }, [localDevice]);

  // Ai đang giữ
  useEffect(() => {
    if (deviceData?.assignmentHistory?.length > 0) {
      const holder = deviceData.assignmentHistory.find((h) => !h.endDate);
      setCurrentHolder(
        holder || {
          user: {
            fullname: "Chưa bàn giao",
            jobTitle: "",
            avatarUrl: "",
            email: "",
            department: "",
          },
        }
      );
    } else {
      setCurrentHolder({
        user: {
          fullname: "Chưa bàn giao",
          jobTitle: "",
          avatarUrl: "",
          email: "",
          department: "",
        },
      });
    }
  }, [deviceData]);

  // Revoke reason => Broken / Standby
  useEffect(() => {
    if (revokeReasons.includes("Máy hỏng")) {
      setLocalStatus("Broken");
    } else {
      setLocalStatus("Standby");
    }
  }, [revokeReasons]);

  // 4) Lấy danh sách phòng
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(`${API_URL}/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRooms(response.data.rooms || []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách phòng:", error);
        toast.error("Không thể tải danh sách phòng!");
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (localDevice?.room) {
      const detailedRoom = rooms.find((r) => r.value === localDevice.room._id);
      setLocalRoom(detailedRoom || localDevice.room);
    } else {
      setLocalRoom(null);
    }
  }, [localDevice, rooms, showRoomEditModal, refreshKey]);

  // 5) Lấy danh sách user
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/users`);
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setAllUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchAllUsers();
  }, []);

  // 6) Bàn giao
  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
  };
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedUser("");
    setNotes("");
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchText("");
    setSearchResults([]);
  };

  const handleConfirmAssign = async () => {
    if (!selectedUser || !notes.trim()) {
      toast.error("Vui lòng nhập thông tin hợp lệ trước khi bàn giao!");
      return;
    }
    try {
      const response = await onAssign(deviceData._id, selectedUser, notes);
      if (!response || !response._id) {
        throw new Error("API không trả về dữ liệu hợp lệ.");
      }
      const updated = response;

      setLocalDevice(updated);
      setCurrentHolder({
        user: selectedUser,
        assignedBy: JSON.parse(localStorage.getItem("currentUser")),
        startDate: new Date().toISOString(),
      });
      onUpdateDevice(updated);

      await fetchDeviceDetails(deviceData._id);
      toast.success("Bàn giao thành công!");
      handleCloseModal();
    } catch (error) {
      console.error("Lỗi khi bàn giao:", error);
      toast.error("Không thể bàn giao thiết bị!");
    }
  };

  // Tìm kiếm user
  const fuse = new Fuse(allUsers, {
    keys: ["fullname", "email", "jobTitle"],
    threshold: 0.4,
  });
  const debouncedSearch = debounce(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }
    const results = fuse.search(searchText);
    setSearchResults(results.map((r) => r.item));
  }, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchText]);

  // 7) Thu hồi
  const handleRevokeClick = () => {
    setShowRevokeModal(true);
  };
  const handleReasonChange = (reason) => {
    setRevokeReasons((prev) => {
      let updated = [...prev];
      if (updated.includes(reason)) {
        updated = updated.filter((r) => r !== reason);
      } else {
        updated.push(reason);
      }
      return updated;
    });
  };

  const confirmRevoke = async () => {
    if (!revokeReasons.length) {
      toast.error("Vui lòng chọn ít nhất một lý do!");
      return;
    }
    try {
      const reasonsToSave = [...revokeReasons];
      if (otherReason.trim()) {
        reasonsToSave.push(`Lý do khác: ${otherReason}`);
      }
      const response = await onRevoke(localDevice._id, reasonsToSave);
      // Tùy backend, ví dụ:
      const updated =
        response.device ||
        response.laptop ||
        response.monitor ||
        response.printer ||
        response.projector ||
        response.tool ||
        response;

      setLocalDevice(updated);
      setLocalStatus(updated.status);
      setCurrentHolder(null);
      setRevokeReasons([]);
      setOtherReason("");
      setShowRevokeModal(false);

      onUpdateDevice(updated);
      await fetchDeviceDetails(localDevice._id);

      toast.success("Thu hồi thành công!");
    } catch (error) {
      console.error("Lỗi khi thu hồi:", error);
      toast.error("Không thể thu hồi thiết bị!");
    }
  };
  const cancelRevoke = () => {
    setRevokeReasons([]);
    setOtherReason("");
    setShowRevokeModal(false);
  };

  // 8) Báo hỏng
  const handleOpenBrokenModal = () => {
    setShowBrokenModal(true);
  };
  const handleCloseBrokenModal = () => {
    setShowBrokenModal(false);
    setBrokenReason("");
  };
  const handleConfirmBroken = async () => {
    if (!brokenReason.trim()) {
      toast.error("Vui lòng nhập lý do báo hỏng!");
      return;
    }
    try {
      const endpoint = getEndpoint(deviceType);
      const response = await axios.put(
        `${API_URL}/${endpoint}/${localDevice._id}/status`,
        { status: "Broken", brokenReason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      const updated = response.data;
      setLocalDevice(updated);
      setLocalStatus("Broken");
      onUpdateDevice(updated);

      toast.success("Thiết bị đã được báo hỏng!");
      handleCloseBrokenModal();
    } catch (error) {
      console.error("Lỗi khi báo hỏng:", error);
      toast.error("Không thể báo hỏng thiết bị!");
    }
  };

  // 9) Recycle
  const handleConfirmRecycle = async () => {
    try {
      const endpoint = getEndpoint(deviceType);
      const response = await axios.put(
        `${API_URL}/${endpoint}/${localDevice._id}/status`,
        { status: "Standby" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      const updated = response.data;
      setLocalDevice(updated);
      setLocalStatus("Standby");
      onUpdateDevice(updated);

      toast.success("Trạng thái đã được chuyển về Chờ cấp phát!");
      setShowRecycleModal(false);
    } catch (error) {
      console.error("Lỗi khi chuyển trạng thái Recycle:", error);
      toast.error("Không thể chuyển trạng thái thiết bị!");
    }
  };

  // 10) Chỉnh sửa specs
  const handleEditSpec = (field, currentValue) => {
    setEditField(field);
    setEditValue(currentValue || "");
  };
  const handleSaveSpec = (field, value) => {
    if (!field) return;
    const endpoint = getEndpoint(deviceType);

    // Tuỳ backend: 1 số field có thể để trong specs, 1 số ở root
    // Thí dụ: laptop => specs.processor, monitor => specs.panelType, v.v.

    // Demo: nếu field là "processor"/"ram"/"storage" => put vào specs
    // Còn lại => put ở root
    let payload = {};
    if (
      ["processor", "ram", "storage", "panelType", "resolution"].includes(field)
    ) {
      payload.specs = { [field]: value };
    } else {
      payload[field] = value;
    }

    axios
      .put(`${API_URL}/${endpoint}/${localDevice._id}`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })
      .then((res) => {
        const updated = res.data;
        toast.success("Cập nhật thông số thành công!");
        setLocalDevice(updated);
        setEditField(null);
        setEditValue("");
        onUpdateDevice(updated);
      })
      .catch((err) => {
        console.error("Cập nhật thông số thất bại:", err);
        toast.error("Không thể cập nhật thông số!");
      });
  };
  const handleCancelEdit = () => {
    setEditField(null);
    setEditValue("");
  };

  // 11) Biên bản (nếu cần) - copy logic cũ
  const handleViewDocument = async (filename) => {
    if (!filename) {
      toast.error("Không có file biên bản!");
      return;
    }
    try {
      const endpoint = getEndpoint(deviceType);
      const fileUrl = `${API_URL}/${endpoint}/BBBG/${filename}`;
      window.open(fileUrl, "_blank");
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Không thể tải file biên bản!");
    }
  };
  const handleFileChange = (e) => {
    // ...
  };
  const handleUploadBBBG = async () => {
    // ...
  };
  const handleGenerateBBBGDoc = async () => {
    // ...
  };

  // 12) Hiển thị
  const previousUsers = deviceData.assignmentHistory?.filter((h) => h.endDate);

  return (
    <div className="product-card-container">
      <div className="card-header">
        <h2>Thông tin thiết bị ({deviceType.toUpperCase()})</h2>
        <button onClick={onCloseModal}>Đóng</button>
      </div>

      <div className="card-body">
        {/* Ví dụ hiển thị field specs riêng cho từng loại */}
        {deviceType === "laptop" && (
          <>
            <div>
              <strong>CPU:</strong>{" "}
              {editField === "processor" ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveSpec("processor", editValue)}
                  autoFocus
                />
              ) : (
                <span
                  onClick={() =>
                    handleEditSpec("processor", localDevice.specs?.processor)
                  }
                >
                  {localDevice.specs?.processor || "N/A"}
                </span>
              )}
            </div>
            <div>
              <strong>RAM:</strong>{" "}
              {editField === "ram" ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveSpec("ram", editValue)}
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => handleEditSpec("ram", localDevice.specs?.ram)}
                >
                  {localDevice.specs?.ram || "N/A"}
                </span>
              )}
            </div>
          </>
        )}

        {deviceType === "monitor" && (
          <>
            <div>
              <strong>Panel Type:</strong>{" "}
              {editField === "panelType" ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveSpec("panelType", editValue)}
                  autoFocus
                />
              ) : (
                <span
                  onClick={() =>
                    handleEditSpec("panelType", localDevice.specs?.panelType)
                  }
                >
                  {localDevice.specs?.panelType || "N/A"}
                </span>
              )}
            </div>
            <div>
              <strong>Resolution:</strong>{" "}
              {editField === "resolution" ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveSpec("resolution", editValue)}
                  autoFocus
                />
              ) : (
                <span
                  onClick={() =>
                    handleEditSpec("resolution", localDevice.specs?.resolution)
                  }
                >
                  {localDevice.specs?.resolution || "N/A"}
                </span>
              )}
            </div>
          </>
        )}

        {/* ... Tương tự cho printer, projector, tool nếu muốn ... */}

        <p>Trạng thái: {localStatus}</p>
        <p>
          Người đang giữ: {currentHolder?.user?.fullname || "Chưa bàn giao"}
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "repairs" ? "active" : ""}
          onClick={() => setActiveTab("repairs")}
        >
          Sửa chữa
        </button>
        <button
          className={activeTab === "updates" ? "active" : ""}
          onClick={() => setActiveTab("updates")}
        >
          Cập nhật
        </button>
      </div>
      <div className="tab-content">
        {activeTab === "repairs" && (
          <div>
            {repairs.length > 0 ? (
              repairs.map((r) => (
                <div key={r._id}>
                  - {r.description} ({dayjs(r.date).format("DD/MM/YYYY")})
                </div>
              ))
            ) : (
              <p>Chưa có sửa chữa nào.</p>
            )}
          </div>
        )}
        {activeTab === "updates" && (
          <div>
            {updates.length > 0 ? (
              updates.map((u) => (
                <div key={u._id}>
                  - {u.description} ({dayjs(u.date).format("DD/MM/YYYY")})
                </div>
              ))
            ) : (
              <p>Chưa có cập nhật nào.</p>
            )}
          </div>
        )}
      </div>

      {/* Inspect */}
      <div className="inspect-section">
        <button onClick={() => setShowInspectModal(true)}>
          Kiểm tra (Inspect)
        </button>
        {lastInspection ? (
          <p>
            Lần kiểm tra gần nhất:{" "}
            {dayjs(lastInspection.inspectionDate).format("DD/MM/YYYY")}
          </p>
        ) : (
          <p>Chưa có dữ liệu kiểm tra.</p>
        )}
      </div>

      {/* Modal Bàn giao */}
      {showAssignModal && (
        <div className="assign-modal">
          <h3>Bàn giao thiết bị</h3>
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchResults.length > 0 && (
            <ul>
              {searchResults.map((user) => (
                <li key={user._id} onClick={() => handleSelectUser(user)}>
                  {user.fullname} - {user.email}
                </li>
              ))}
            </ul>
          )}
          <textarea
            placeholder="Ghi chú bàn giao..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button onClick={handleConfirmAssign}>Xác nhận</button>
          <button onClick={handleCloseAssignModal}>Hủy</button>
        </div>
      )}

      {/* Modal Thu hồi */}
      {showRevokeModal && (
        <div className="revoke-modal">
          <h3>Thu hồi thiết bị</h3>
          <label>
            <input
              type="checkbox"
              checked={revokeReasons.includes("Không còn nhu cầu")}
              onChange={() => handleReasonChange("Không còn nhu cầu")}
            />
            Không còn nhu cầu
          </label>
          <label>
            <input
              type="checkbox"
              checked={revokeReasons.includes("Máy hỏng")}
              onChange={() => handleReasonChange("Máy hỏng")}
            />
            Máy hỏng
          </label>
          {/* ...có thể thêm nhiều lý do khác... */}
          <textarea
            placeholder="Lý do khác..."
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
          />
          <button onClick={confirmRevoke}>Xác nhận</button>
          <button onClick={cancelRevoke}>Hủy</button>
        </div>
      )}

      {/* Modal Broken */}
      {showBrokenModal && (
        <div className="broken-modal">
          <h3>Báo hỏng thiết bị</h3>
          <textarea
            placeholder="Nhập lý do..."
            value={brokenReason}
            onChange={(e) => setBrokenReason(e.target.value)}
          />
          <button onClick={handleConfirmBroken}>Xác nhận</button>
          <button onClick={handleCloseBrokenModal}>Hủy</button>
        </div>
      )}

      {/* Modal Recycle */}
      {showRecycleModal && (
        <div className="recycle-modal">
          <h3>Chuyển về trạng thái Chờ cấp phát?</h3>
          <button onClick={handleConfirmRecycle}>Đồng ý</button>
          <button onClick={() => setShowRecycleModal(false)}>Hủy</button>
        </div>
      )}

      {/* Inspect dùng chung */}
      {showInspectModal && (
        <Inspect
          deviceType={deviceType}
          deviceData={localDevice}
          showModal={showInspectModal}
          setShowModal={setShowInspectModal}
          refreshKey={refreshKey}
          setRefreshKey={setRefreshKey}
        />
      )}

      {/* Footer: ví dụ hiển thị các nút tùy theo trạng thái */}
      <div className="card-footer">
        {localStatus === "Standby" && (
          <button onClick={handleOpenAssignModal}>Bàn giao</button>
        )}
        {localStatus === "Active" && (
          <button onClick={handleRevokeClick}>Thu hồi</button>
        )}
        <button onClick={handleOpenBrokenModal}>Báo hỏng</button>
        <button onClick={() => setShowRecycleModal(true)}>Recycle</button>
      </div>
    </div>
  );
};

export default ProductCard;
