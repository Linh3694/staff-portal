import React, { useState, useEffect } from "react";
import {
  FiEdit,
  FiMonitor,
  FiTrash2,
  FiPackage,
  FiRefreshCw,
} from "react-icons/fi";
import {
  IoLocationOutline,
  IoBuildOutline,
  IoBookOutline,
  IoCloudUploadOutline,
} from "react-icons/io5";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdCancel, MdCheckCircle, MdOutlineError } from "react-icons/md";
import { debounce } from "lodash";
import Fuse from "fuse.js";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import axios from "axios";
import Dropdown from "../../../shared/components/function/dropdown";
import { API_URL, BASE_URL } from "../../../core/config"; // import từ file config
import Inspect from "../inspect/inspect";

const MonitorProductCard = ({
  monitorData,
  onCloseModal,
  onUpdateSpecs,
  onRevoke,
  onAssign,
  setSelectedMonitor,
  fetchMonitorDetails,
  onUpdateMonitor,
  refetchMonitors,
  onUpdateRoom,
}) => {
  const [activeTab, setActiveTab] = useState("repairs");
  const [repairs, setRepairs] = useState([]); // Quản lý danh sách sửa chữa cục bộ
  // Dữ liệu tạm để thêm/sửa repair/update
  const [repairData] = useState({
    type: "repair",
    description: "",
    date: "",
    details: "",
  });
  const [updates, setUpdates] = useState([]); // Danh sách cập nhật phần mềm
  const [setShowAddRepairModal] = useState(false); // Modal thêm sửa chữa
  const [editField, setEditField] = useState(null); // Tên trường specs đang chỉnh sửa (processor, ram,...)
  const [editValue, setEditValue] = useState(""); // Giá trị tạm thời khi chỉnh sửa
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
    type: "repair", // Mặc định là sửa chữa
    description: "",
    details: "",
    date: new Date().toISOString(),
  });
  // Thêm state cho modal xác nhận thu hồi
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReasons, setRevokeReasons] = useState([]);
  // Thêm state “localMonitorStatus” để tạm giữ status hiển thị
  const [localStatus, setLocalStatus] = useState(monitorData.status);
  const [localMonitor, setLocalMonitor] = useState(monitorData);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [notes, setNotes] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [currentHolder, setCurrentHolder] = useState({
    user: {
      fullname: "Chưa bàn giao",
      jobTitle: "",
    },
  });
  const [otherReason, setOtherReason] = useState(""); // Lưu nội dung lý do khác
  // State quản lý modal
  const [showBrokenModal, setShowBrokenModal] = useState(false);
  const [brokenReason, setBrokenReason] = useState(""); // Lưu lý do hỏng
  const [localRoom, setLocalRoom] = useState(null); // State cho phòng hiện tại
  const [rooms, setRooms] = useState([]); // Khai báo state cho danh sách phòng
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Quản lý trạng thái mở/đóng danh sách
  const [showRoomEditModal, setShowRoomEditModal] = useState(false); // State để hiển thị modal chỉnh sửa phòng
  const room = localMonitor.room || null; // Lấy thông tin phòng từ localMonitor
  const [showRecycleModal, setShowRecycleModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [lastInspection, setLastInspection] = useState(null); // Dữ liệu kiểm tra mới nhất
  const [inspectHistory, setInspectHistory] = useState([]); // Lịch sử kiểm tra
  const [loading, setLoading] = useState(false); // Trạng thái tải dữ liệu

  const fetchActivities = async (monitorId) => {
    try {
      const response = await axios.get(
        `${API_URL}/activities/monitor/${monitorId}`
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách hoạt động:", error);
      toast.error("Không thể tải lịch sử hoạt động!");
    }
  };

  const addActivity = async (activity) => {
    try {
      const response = await axios.post(`${API_URL}/activities`, activity);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi thêm hoạt động:", error);
      toast.error("Không thể thêm hoạt động!");
    }
  };

  const updateActivity = async (id, updates) => {
    const response = await axios.put(`${API_URL}/activities/${id}`, updates);
    return response.data;
  };

  const deleteActivity = async (id) => {
    const response = await axios.delete(`${API_URL}/activities/${id}`);
    return response.data;
  };

  useEffect(() => {
    setRefreshKey((prev) => prev + 1); // Tăng giá trị mỗi lần localMonitor thay đổi
  }, [localMonitor]);

  useEffect(() => {
    if (localMonitor?.room) {
      const detailedRoom = rooms.find(
        (room) => room.value === localMonitor.room._id
      );
      setLocalRoom(detailedRoom || localMonitor.room);
    } else {
      setLocalRoom(null); // Nếu không có room
    }
  }, [localMonitor, rooms, showRoomEditModal, refreshKey]); // Thêm `showRoomEditModal` vào dependency

  useEffect(() => {
    if (monitorData?.repairs) {
      setRepairs(monitorData.repairs); // Chỉ đồng bộ khi thực sự cần thiết
      setLocalStatus(monitorData.status);
    }
  }, [monitorData]); // Chỉ chạy khi `monitorData` thay đổi

  useEffect(() => {
    if (monitorData) {
      setLocalMonitor(monitorData); // Tránh gọi `setState` khi không cần thiết
      setLocalStatus(monitorData.status);
    }
  }, [monitorData]); // Chỉ phụ thuộc vào `monitorData`

  useEffect(() => {
    if (localStatus) {
      fetchMonitorDetails(localMonitor?._id);
    }
  }, [localStatus]);

  useEffect(() => {
    if (monitorData?._id) {
      fetchMonitorDetails(monitorData._id);
    }
  }, [monitorData?._id]); // Chỉ phụ thuộc vào `_id`

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/users`);
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setAllUsers(data); // Lưu danh sách người dùng
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (monitorData?.assignmentHistory?.length > 0) {
      const holder = monitorData.assignmentHistory.find(
        (history) => !history.endDate
      );
      setCurrentHolder(
        holder || {
          user: {
            fullname: "Chưa bàn giao",
            jobTitle: "",
          },
        }
      );
    } else {
      setCurrentHolder({
        user: {
          fullname: "Chưa bàn giao",
          jobTitle: "",
        },
      });
    }
  }, [monitorData]);

  useEffect(() => {
    setLocalMonitor(monitorData); // Đồng bộ dữ liệu khi monitorData thay đổi
    setLocalStatus(monitorData.status); // Đồng bộ trạng thái
  }, [monitorData]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchText("");
    setSearchResults([]);
  };
  useEffect(() => {
    const loadActivities = async () => {
      try {
        const activities = await fetchActivities(localMonitor._id);
        const repairList = activities.filter(
          (activity) => activity.type === "repair"
        );
        const updateList = activities.filter(
          (activity) => activity.type === "update"
        );

        setRepairs(repairList);
        setUpdates(updateList);
      } catch (error) {
        console.error("Lỗi khi tải danh sách hoạt động:", error);
        toast.error("Không thể tải danh sách hoạt động!");
      }
    };

    if (localMonitor._id) {
      loadActivities();
    }
  }, [localMonitor]);

  useEffect(() => {
    if (revokeReasons.includes("Máy hỏng")) {
      setLocalStatus("Broken");
    } else {
      setLocalStatus("Standby");
    }
  }, [revokeReasons]);

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

  // Xác nhận “bàn giao”
  const handleConfirmAssign = async () => {
    if (!selectedUser || !notes.trim()) {
      toast.error("Vui lòng nhập thông tin hợp lệ trước khi bàn giao!");
      return;
    }
    try {
      const response = await onAssign(monitorData._id, selectedUser, notes);
      if (!response || !response._id) {
        throw new Error("API không trả về dữ liệu hợp lệ.");
      }
      const updatedMonitor = response; // API trả về dữ liệu đã cập nhật

      // Cập nhật state
      setLocalMonitor(updatedMonitor); // Đồng bộ dữ liệu cục bộ
      setCurrentHolder({
        user: selectedUser,
        assignedBy: JSON.parse(localStorage.getItem("currentUser")),
        startDate: new Date().toISOString(),
      });
      onUpdateMonitor(updatedMonitor); // Đồng bộ với danh sách cha

      // Gọi lại API để cập nhật dữ liệu chi tiết trong modal
      await fetchMonitorDetails(monitorData._id);

      toast.success("Bàn giao thành công!");
      handleCloseModal();
    } catch (error) {
      console.error("Lỗi khi bàn giao:", error);
      toast.error("Không thể bàn giao thiết bị!");
    }
  };

  const previousUsers = monitorData.assignmentHistory?.filter(
    (history) => history.endDate
  );

  const handleOpenModal = () => {
    setShowAssignModal(true);
  };

  const handleCloseModal = () => {
    setShowAssignModal(false);
    setSelectedUser("");
    setNotes("");
  };

  const handleConfirmRecycle = async () => {
    try {
      const response = await axios.put(
        `${API_URL}/monitors/${localMonitor._id}/status`,
        { status: "Standby" }, // Cập nhật trạng thái về Chờ cấp phát
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      const updatedMonitor = response.data;

      // Cập nhật state
      setLocalMonitor(updatedMonitor);
      setLocalStatus("Standby");
      onUpdateMonitor(updatedMonitor);

      toast.success("Trạng thái đã được chuyển về Chờ cấp phát!");
      setShowRecycleModal(false); // Đóng modal
    } catch (error) {
      console.error("Lỗi khi chuyển trạng thái Recycle:", error);
      toast.error("Không thể chuyển trạng thái thiết bị!");
    }
  };

  const debouncedSearch = debounce(() => {
    handleSearch();
  }, 300); // Chỉ gọi API sau 300ms kể từ lần gõ cuối cùng.

  const options = {
    keys: ["fullname", "email", "jobTitle"], // Các trường để tìm kiếm
    threshold: 0.4, // Độ chính xác khớp
  };
  const fuse = new Fuse(allUsers, options);

  const handleSearch = () => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    const results = fuse.search(searchText);
    const formattedResults = results.map((result) => result.item);
    setSearchResults(formattedResults);
  };

  // Ví dụ: status === "Active" => hiển thị nút Thu hồi
  //        status === "Standby" => hiển thị nút Bàn giao
  const handleRevokeClick = () => {
    setShowRevokeModal(true);
  };

  const handleReasonChange = (reason) => {
    setRevokeReasons((prevReasons) => {
      let updatedReasons;
      if (prevReasons.includes(reason)) {
        // Nếu lý do đã tồn tại, loại bỏ nó
        updatedReasons = prevReasons.filter((r) => r !== reason);
      } else {
        // Nếu lý do chưa tồn tại, thêm nó vào
        updatedReasons = [...prevReasons, reason];
      }

      // Cập nhật trạng thái thiết bị dựa trên lý do
      if (updatedReasons.includes("Máy hỏng")) {
        setLocalStatus("Broken"); // Chuyển trạng thái sang Hỏng
      } else {
        setLocalStatus("Standby"); // Quay về trạng thái Chờ cấp phát
      }

      return updatedReasons; // Trả về mảng lý do đã cập nhật
    });
  };

  const newMonitorData = { ...monitorData, assigned: [] };
  // Xác nhận trong modal Thu hồi

  const confirmRevoke = async () => {
    if (!revokeReasons.length) {
      toast.error("Vui lòng chọn ít nhất một lý do!");
      return;
    }

    try {
      // Tạo danh sách lý do đầy đủ
      const reasonsToSave = [...revokeReasons];
      if (otherReason.trim()) {
        reasonsToSave.push(`Lý do khác: ${otherReason}`);
      }
      const response = await onRevoke(localMonitor._id, reasonsToSave);
      const updatedMonitor = response.monitor; // Lấy phần dữ liệu monitor
      setLocalMonitor(updatedMonitor); // Đồng bộ dữ liệu chi tiết
      setLocalStatus(updatedMonitor.status); // Cập nhật lại trạng thái hiển thị
      setCurrentHolder(null); // Xóa người sử dụng hiện tại
      setRevokeReasons([]);
      setOtherReason(""); // Reset lý do khác
      setShowRevokeModal(false);

      onUpdateMonitor(updatedMonitor); // Đồng bộ với danh sách cha
      await fetchMonitorDetails(localMonitor._id);
      toast.success("Thu hồi thành công!");
    } catch (error) {
      console.error("Lỗi khi thu hồi:", error);
      toast.error("Không thể thu hồi thiết bị!");
    }
  };

  // Huỷ modal Thu hồi
  const cancelRevoke = () => {
    setRevokeReasons([]); // Xóa danh sách lý do
    setShowRevokeModal(false); // Đóng modal
  };
  // Hàm mở modal
  const handleOpenBrokenModal = () => {
    setShowBrokenModal(true);
  };

  // Hàm đóng modal
  const handleCloseBrokenModal = () => {
    setShowBrokenModal(false);
    setBrokenReason(""); // Reset lý do
  };

  // Hàm xử lý xác nhận báo hỏng
  const handleConfirmBroken = async () => {
    if (!brokenReason.trim()) {
      toast.error("Vui lòng nhập lý do báo hỏng!");
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/monitors/${localMonitor._id}/status`,
        { status: "Broken", brokenReason: brokenReason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      const updatedMonitor = response.data;

      // Cập nhật state
      setLocalMonitor(updatedMonitor);
      setLocalStatus("Broken");
      onUpdateMonitor(updatedMonitor);

      toast.success("Thiết bị đã được báo hỏng!");
      handleCloseBrokenModal();
    } catch (error) {
      console.error("Lỗi khi báo hỏng thiết bị:", error);
      toast.error("Không thể báo hỏng thiết bị!");
    }
  };

  // -----------------------------------------------------
  // 1) TÁCH LOGIC CHỈNH SỬA SPECS
  // -----------------------------------------------------
  // Bấm “chỉnh sửa” (processor / ram / storage / display / releaseYear)
  const handleEditSpec = (field, currentValue) => {
    setEditField(field);
    setEditValue(currentValue || "");
  };

  const handleSaveSpec = (field, value) => {
    if (!field || value === undefined) {
      toast.error("Giá trị không hợp lệ. Vui lòng kiểm tra lại!");
      return;
    }

    let payload = {};
    if (["releaseYear", "type", "manufacturer"].includes(field)) {
      payload[field] = value || null;
    } else {
      payload.specs = {
        [field]: value || null, // Chỉ gửi trường cần cập nhật
      };
    }
    onUpdateSpecs(monitorData._id, payload)
      .then((updatedMonitor) => {
        toast.success("Cập nhật thông số thành công!");
        setEditField(null);
        setEditValue("");
        setLocalMonitor(updatedMonitor); // Đồng bộ lại dữ liệu
      })
      .catch((error) => {
        console.error("Cập nhật thông số thất bại:", error);
        toast.error("Không thể cập nhật thông số!");
      });
  };

  // Hủy chế độ sửa “activity”
  const handleCancelEdit = () => {
    setEditField(null);
    setEditValue("");
  };

  const handleViewDocument = async (filename) => {
    if (!filename) {
      toast.error("Không có file biên bản!");
      return;
    }

    const fileUrl = `${API_URL}/monitors/BBBG/${filename}`;
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(fileUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tải file. Lỗi: " + response.statusText);
      }

      // Chuyển đổi phản hồi thành Blob
      const blob = await response.blob();

      // Tạo URL tạm thời từ Blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Mở file trong tab mới
      window.open(blobUrl, "_blank");

      // Tùy chọn: Thu hồi URL tạm sau khi hoàn tất
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 10000); // Thu hồi sau 10 giây
    } catch (error) {
      console.error("Lỗi khi xem file:", error);
      toast.error("Không thể xem file biên bản!");
    }
  };

  const handleGenerateDocument = async () => {
    try {
      // 1. Tải file mẫu từ /public
      const response = await fetch("/handover_template.docx");
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // 2. Tạo PizZip instance từ file mẫu
      const zip = new PizZip(arrayBuffer);

      // 3. Khởi tạo Docxtemplater
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};

      if (!currentUser?.fullname || !currentHolder.user?.fullname) {
        toast.error(
          "Vui lòng kiểm tra thông tin người bàn giao hoặc nhận bàn giao."
        );
        return;
      }
      // 4. Lấy ngày hiện tại
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, "0")}/${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${today.getFullYear()}`;

      // 4. Gán dữ liệu động vào file mẫu
      doc.setData({
        today: formattedDate, // Ngày hiện tại
        //// Thông tin người dùng
        currentUser: currentUser?.fullname || "Không xác định",
        currentUserTitle: currentUser?.jobTitle || "Không xác định",
        nextUser: currentHolder.user?.fullname || "Không xác định",
        nextUserTitle: currentHolder.user?.jobTitle || "Không xác định",
        //// Thông tin monitor
        monitorName: monitorData.name || "Không xác định",
        monitorSerial: monitorData.serial,
        monitorreleaseYear: monitorData.releaseYear,
        notes: notes || "Không có ghi chú.",
      });

      // 5. Render tài liệu
      doc.render();

      // 6. Tạo file output
      const output = doc.getZip().generate({ type: "blob" });
      saveAs(output, "handover_form.docx");
    } catch (error) {
      console.error("Error generating document:", error);
    }
  };
  const handleFileUpload = (e) => {
    const file = e.target?.files?.[0]; // Lấy file từ event
    if (!file) {
      toast.error("Không có tệp nào được chọn!");
      return;
    }

    // Kiểm tra định dạng file
    if (!file.name.endsWith(".pdf")) {
      toast.error("Chỉ chấp nhận tệp PDF!");
      return;
    }
    const formData = new FormData();
    formData.append("file", file); // File tải lên
    formData.append("monitorId", localMonitor._id); // ID monitor
    formData.append("userId", currentHolder?.user?._id); // ID người dùng hiện tại

    axios
      .post(`${API_URL}/monitors/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })
      .then((response) => {
        toast.success("Tải lên thành công!");

        // Cập nhật dữ liệu trong frontend
        const updatedMonitor = response.data.monitor;
        setLocalMonitor(updatedMonitor); // Đồng bộ lại state
        setLocalStatus(updatedMonitor.status); // Cập nhật trạng thái hiển thị

        // Cập nhật dữ liệu trong frontend
        const updatedHolder = {
          ...currentHolder,
          document: response.data.document, // Cập nhật đường dẫn document
        };
        setCurrentHolder(updatedHolder); // Đồng bộ lại state
      })
      .catch((error) => {
        console.error("Lỗi khi tải lên file:", error);
        toast.error("Tải lên thất bại!");
      });
  };
  //--------------------------------------------------------------

  const handleSaveRoom = async () => {
    if (!localRoom || !localRoom._id) {
      toast.error("Vui lòng chọn phòng hợp lệ!");
      return;
    }

    try {
      // Cập nhật phòng cho monitor qua API
      const response = await axios.put(
        `${API_URL}/monitors/${localMonitor._id}`,
        { room: localRoom._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      const updatedMonitor = response.data;

      // Lấy thông tin chi tiết phòng
      const roomResponse = await axios.get(
        `${API_URL}/rooms/${updatedMonitor.room}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      const detailedRoom = roomResponse.data;

      // Đồng bộ lại state `localRoom` và `localMonitor`
      setLocalRoom(detailedRoom);
      setLocalMonitor((prev) => ({
        ...prev,
        room: detailedRoom, // Gán phòng chi tiết vào monitor
      }));
      setRefreshKey((prev) => prev + 1);

      toast.success("Cập nhật phòng thành công!");
      setShowRoomEditModal(false); // Đóng modal
    } catch (error) {
      console.error("Lỗi khi lưu phòng:", error);
      toast.error("Không thể lưu phòng!");
    }
  };

  // Hàm mở modal chỉnh sửa phòng
  const handleEditRoom = () => {
    setShowRoomEditModal(true);
    setSearchText(""); // Reset từ khóa tìm kiếm
    setSearchResults([]); // Xóa kết quả tìm kiếm
  };

  // Hàm đóng modal chỉnh sửa phòng
  const handleCloseRoomEditModal = () => {
    setShowRoomEditModal(false);
    setLocalRoom(null); // Reset lại localRoom
    setSearchText(""); // Reset từ khóa tìm kiếm
    setSearchResults([]); // Xóa kết quả tìm kiếm
  };

  // Hàm tìm kiếm phòng
  const handleSearchRoom = (keyword) => {
    if (!keyword.trim()) {
      setSearchResults([]); // Xóa kết quả nếu không có từ khóa
      return;
    }
    const filteredRooms = rooms.filter(
      (room) =>
        room.name.toLowerCase().includes(keyword.toLowerCase()) ||
        room.location.some((loc) =>
          loc.building.toLowerCase().includes(keyword.toLowerCase())
        )
    );
    setSearchResults(filteredRooms);
  };

  //--------------------------------------------------------------
  const handleAddNewActivity = async () => {
    const newActivity = {
      monitorId: localMonitor._id,
      type: repairData.type, // repair hoặc update
      description: repairData.description,
      details: repairData.details,
      date: repairData.date || new Date().toISOString(),
      updatedBy: JSON.parse(localStorage.getItem("currentUser"))?.fullname,
    };

    try {
      const addedActivity = await addActivity(newActivity);
      setRepairs([...repairs, addedActivity]);
      setShowAddRepairModal(false);
      toast.success("Thêm hoạt động thành công!");
    } catch (error) {
      console.error("Lỗi khi thêm hoạt động:", error);
      toast.error("Không thể thêm hoạt động!");
    }
  };

  const handleDeleteRepair = async (id) => {
    try {
      await deleteActivity(id);
      setRepairs(repairs.filter((repair) => repair._id !== id));
      toast.success("Xóa hoạt động thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa hoạt động:", error);
      toast.error("Không thể xóa hoạt động!");
    }
  };

  const handleEditRepair = async (id, updatedData) => {
    try {
      const updatedActivity = await updateActivity(id, updatedData);
      setRepairs(
        repairs.map((repair) => (repair._id === id ? updatedActivity : repair))
      );
      toast.success("Cập nhật hoạt động thành công!");
      setIsEditRepairOpen(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật hoạt động:", error);
      toast.error("Không thể cập nhật hoạt động!");
    }
  };

  const handleEditUpdate = async (id, updatedData) => {
    try {
      const updatedActivity = await updateActivity(id, updatedData);
      setUpdates(
        updates.map((update) => (update._id === id ? updatedActivity : update))
      );
      setIsEditUpdateOpen(false);
      toast.success("Cập nhật hoạt động thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật hoạt động:", error);
      toast.error("Không thể cập nhật hoạt động!");
    }
  };

  const handleDeleteUpdate = async (id) => {
    try {
      await deleteActivity(id);
      setUpdates(updates.filter((update) => update._id !== id));
      toast.success("Xóa hoạt động thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa hoạt động:", error);
      toast.error("Không thể xóa hoạt động!");
    }
  };

  const handleOpenEditUpdate = (update) => {
    setEditingUpdate(update);
    setIsEditUpdateOpen(true);
  };

  const handleCloseEditUpdate = () => {
    setIsEditUpdateOpen(false);
    setEditingUpdate({
      type: "update",
      description: "",
      date: "",
      details: "",
    });
  };

  const handleOpenEditRepair = (repair) => {
    setEditingRepair(repair);
    setIsEditRepairOpen(true);
  };

  const handleCloseEditRepair = () => {
    setIsEditRepairOpen(false);
    setEditingRepair({
      type: "repair",
      description: "",
      date: "",
      details: "",
    });
  };

  const handleOpenAddActivityModal = () => {
    setNewActivity({
      type: "repair",
      description: "",
      details: "",
      date: new Date().toISOString(),
    });
    setIsAddActivityModalOpen(true);
  };

  const handleCloseAddActivityModal = () => {
    setIsAddActivityModalOpen(false);
  };

  const handleSaveNewActivity = async () => {
    if (!newActivity.description.trim()) {
      toast.error("Vui lòng nhập mô tả hoạt động!");
      return;
    }

    try {
      const addedActivity = await addActivity({
        ...newActivity,
        entityType: "monitor",
        entityId: localMonitor._id,
        updatedBy: JSON.parse(localStorage.getItem("currentUser"))?.fullname,
      });

      if (newActivity.type === "repair") {
        setRepairs([...repairs, addedActivity]);
      } else {
        setUpdates([...updates, addedActivity]);
      }

      setIsAddActivityModalOpen(false);
      toast.success("Thêm hoạt động mới thành công!");
    } catch (error) {
      console.error("Lỗi khi thêm hoạt động:", error);
      toast.error("Không thể thêm hoạt động!");
    }
  };
  const allActivities = [...repairs, ...updates].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  // -----------------------------------------------------
  // Cập nhật hàm tính trạng thái bảo trì
  const calculateMaintenanceStatus = (lastInspectionDate, documentUrl) => {
    if (!lastInspectionDate)
      return { status: "Chưa kiểm tra", color: "bg-gray-400" };
    const monthsSinceLastInspection = dayjs().diff(
      dayjs(lastInspectionDate),
      "month"
    );
    if (monthsSinceLastInspection <= 6) {
      if (documentUrl && documentUrl.toLowerCase().endsWith(".pdf")) {
        return { status: "Đã kiểm tra", color: "bg-green-500 text-white" };
      } else {
        return {
          status: "Đã kiểm tra, thiếu biên bản",
          color: "bg-yellow-500 text-white",
        };
      }
    } else if (monthsSinceLastInspection <= 12) {
      return { status: "Cần kiểm tra", color: "bg-yellow-500 text-white" };
    } else {
      return { status: "Cần kiểm tra gấp", color: "bg-red-500 text-white" };
    }
  };

  const handleViewReport = () => {
    if (!lastInspection?.documentUrl) {
      toast.error("Không có file biên bản được tải lên!");
      return;
    }
    // Giả sử BASE_URL chứa domain của API hoặc server file
    const fileUrl = `${BASE_URL}${lastInspection.documentUrl}`;
    window.open(fileUrl, "_blank"); // Mở file trong tab mới
  };
  const handleDownloadReport = () => {
    if (!lastInspection?.documentUrl) {
      toast.error("Không có biên bản kiểm tra để tải về!");
      return;
    }
    const fileUrl = `${BASE_URL}${lastInspection.documentUrl}`;
    window.open(fileUrl, "_blank"); // Mở tab mới để tải xuống file
  };

  // Hàm xử lý upload file PDF biên bản đã được scan (sau khi in và ký)
  const handleFileUploadInspect = (e) => {
    const file = e.target?.files?.[0];
    if (!file) {
      toast.error("Không có tệp nào được chọn!");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Chỉ chấp nhận tệp PDF!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("inspectId", lastInspection?._id); // Kiểm tra inspectId có giá trị hay không

    axios
      .post(`${API_URL}/inspects/uploadReport`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })
      .then((response) => {
        toast.success("Tải lên biên bản thành công!");
        // Cập nhật ngay lập tức dữ liệu kiểm tra
        setLastInspection(response.data.data);

        // Cập nhật UI ngay lập tức
        setRefreshKey((prev) => prev + 1);
      })
      .catch((error) => {
        console.error("❌ Lỗi khi tải lên file:", error);
        toast.error("Tải lên thất bại!");
      });
  };

  // Trong block hiển thị thông tin bảo trì bảo dưỡng, chúng ta sử dụng calculateMaintenanceStatus
  const statusData = calculateMaintenanceStatus(
    lastInspection?.inspectionDate,
    lastInspection?.documentUrl
  );

  // -----------------------------------------------------
  return (
    <div className="max-w-full mx-auto bg-white p-6 rounded-xl shadow-lg">
      {/* Hàng trên cùng */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#002147]">
            {monitorData.name}
          </h2>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-base font-bold mt-2`}
          >
            {localStatus === "Active" && (
              <>
                <MdCheckCircle className="text-[#009483] text-lg mr-2 gap-2 font-bold" />{" "}
                Đang sử dụng
              </>
            )}
            {localStatus === "Standby" && (
              <>
                <MdOutlineError className="text-[#EAA300] text-lg mr-2 gap-2 font-bold" />{" "}
                Chờ cấp phát
              </>
            )}
            {localStatus === "Broken" && (
              <>
                <MdOutlineError className="text-[#FF5733] text-lg mr-2 gap-2 font-bold" />{" "}
                Hỏng
              </>
            )}
            {localStatus === "PendingDocumentation" && (
              <>
                <MdOutlineError className="text-[#EAA300] text-lg mr-2 gap-2 font-bold" />{" "}
                Đã bàn giao - Chưa có biên bản
              </>
            )}
          </span>
        </div>

        <div className="flex space-x-2 mt-2 mr-2">
          {localStatus === "Active" && (
            <button
              onClick={handleRevokeClick}
              className="px-5 py-2 bg-[#DC0909] text-white font-bold text-sm rounded-lg hover:bg-[#cc4529] transform transition-transform duration-300 hover:scale-105"
            >
              Thu hồi
            </button>
          )}
          {monitorData.status === "Standby" && (
            <>
              <button
                onClick={handleOpenModal}
                className="px-4 py-2 bg-[#009483] text-white font-bold text-sm rounded-lg hover:bg-[#006653] transform transition-transform duration-300 hover:scale-105"
              >
                Bàn giao
              </button>
              <button
                onClick={handleOpenBrokenModal}
                className="px-4 py-2 bg-[#FF5733] text-white font-bold text-sm rounded-lg hover:bg-[#CC4529] transform transition-transform duration-300 hover:scale-105"
              >
                Báo Hỏng
              </button>
            </>
          )}
          {monitorData.status === "Broken" && (
            <>
              <button className="px-4 py-2 bg-[#EA5050] text-white font-bold text-sm rounded-lg hover:bg-[#cc4529] transform transition-transform duration-300 hover:scale-105">
                Thanh lý
              </button>
              <button
                className="px-4 py-2 bg-[#009483] text-white font-bold text-sm rounded-lg hover:bg-[#006653] transform transition-transform duration-300 hover:scale-105"
                onClick={() => setShowRecycleModal(true)} // Mở modal xác nhận Recycle
              >
                <FiRefreshCw size={14} />
              </button>
            </>
          )}

          {localStatus === "PendingDocumentation" && (
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleGenerateDocument}
                className="px-4 py-2 bg-[#FF5733] text-white font-bold text-sm rounded-xl hover:bg-[#CC4529] transform transition-transform duration-300 hover:scale-105"
              >
                In biên bản
              </button>
              <label className="px-4 py-2 bg-[#002147] text-white font-bold text-sm rounded-xl hover:bg-[#001635] cursor-pointer transform transition-transform duration-300 hover:scale-105">
                Tải lên
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileUpload(e)} // Hàm xử lý khi chọn file
                  className="hidden"
                />
              </label>
              <button
                onClick={handleRevokeClick}
                className="px-5 py-2 bg-[#DC0909] text-white font-bold text-sm rounded-xl hover:bg-[#cc4529]"
              >
                Thu hồi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bố cục chính với 3 block */}
      <div className="grid grid-cols-[180px,2fr,2fr] gap-4">
        {/* Block 1: Thông tin spec */}
        <div className="w-44 justify-evenly items-center">
          {/* Màn hình Block */}
          <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl mb-4 mt-0 transform transition-transform duration-300 hover:scale-105">
            <div className="flex items-center space-x-3">
              <FiMonitor className="text-2xl text-[#FF5733]" />
              <div>
                <p className="text-sm text-theme-color-neutral-content">
                  Màn hình
                </p>
                {editField === "display" ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24 h-6 font-semibold focus:outline-none rounded bg-transparent"
                  />
                ) : (
                  <p className="font-semibold">
                    {monitorData.specs?.display || "N/A"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {editField === "display" ? (
                <>
                  <button onClick={() => handleSaveSpec("display", editValue)}>
                    <MdCheckCircle
                      className="text-[#009483] hover:scale-110 mt-5 ml-2"
                      size={15}
                    />
                  </button>
                  <button onClick={handleCancelEdit}>
                    <MdCancel
                      className="text-[#DC0909] hover:scale-110 mt-5"
                      size={15}
                    />
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    handleEditSpec("display", monitorData.specs?.display)
                  }
                >
                  <FiEdit
                    className="text-[#FF5733] hover:scale-110"
                    size={15}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Năm sản xuất */}
          <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl mb-4 mt-0 transform transition-transform duration-300 hover:scale-105">
            <div className="flex items-center space-x-3">
              <FiPackage className="text-2xl text-[#FF5733]" />
              <div>
                <p className="text-sm text-theme-color-neutral-content">
                  Năm Sản Xuất
                </p>
                {editField === "releaseYear" ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24 h-6 font-semibold focus:outline-none rounded bg-transparent"
                  />
                ) : (
                  <p className="font-semibold">
                    {monitorData.releaseYear || "N/A"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {editField === "releaseYear" ? (
                <>
                  <button
                    onClick={() => handleSaveSpec("releaseYear", editValue)}
                  >
                    <MdCheckCircle
                      className="text-[#009483] hover:scale-110 mt-5 ml-2"
                      size={15}
                    />
                  </button>
                  <button onClick={handleCancelEdit}>
                    <MdCancel
                      className="text-[#DC0909] hover:scale-110 mt-5"
                      size={15}
                    />
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    handleEditSpec("releaseYear", monitorData.releaseYear)
                  }
                >
                  <FiEdit
                    className="text-[#FF5733] hover:scale-110"
                    size={15}
                  />
                </button>
              )}
            </div>
          </div>
          {/* Manufacturer Block */}
          <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl mt-0 transform transition-transform duration-300 hover:scale-105">
            <div className="flex items-center space-x-3">
              <FiPackage className="text-2xl text-[#FF5733]" />
              <div>
                <p className="text-xs text-theme-color-neutral-content">
                  Nhà sản xuất
                </p>
                {editField === "manufacturer" ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24 h-6 font-semibold text-sm focus:outline-none rounded bg-transparent"
                  />
                ) : (
                  <p className="font-semibold">
                    {monitorData.manufacturer || "N/A"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {editField === "manufacturer" ? (
                <>
                  <button
                    onClick={() => handleSaveSpec("manufacturer", editValue)}
                  >
                    <MdCheckCircle
                      className="text-[#009483] hover:scale-110 mt-5 ml-2"
                      size={15}
                    />
                  </button>
                  <button onClick={handleCancelEdit}>
                    <MdCancel
                      className="text-[#DC0909] hover:scale-110 mt-5"
                      size={15}
                    />
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    handleEditSpec("manufacturer", monitorData.manufacturer)
                  }
                >
                  <FiEdit
                    className="text-[#FF5733] hover:scale-110"
                    size={15}
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Block 2: Thông tin bàn giao */}
        <div className="bg-[#f8f8f8] flex flex-col p-4 rounded-xl shadow">
          {/* Hiển thị nguyên nhân báo hỏng nếu trạng thái là Broken */}
          {localStatus === "Broken" && (
            <>
              <div className="bg-[#EA5050] text-red-50 p-4 rounded-xl mb-4">
                <p>Nguyên nhân hỏng:</p>
                <p>- {localMonitor.brokenReason || "Không rõ lý do"}</p>
              </div>
              <h3 className="text-base font-semibold mb-2">
                Thông tin sử dụng
              </h3>
              <div className="justify-between items-center flex">
                <h3 className="text-sm italic mt-2 mb-2">
                  Thiết bị hỏng chờ thành lý
                </h3>
                <div className="relative mb-2 mt-2 text-sm">
                  <Dropdown
                    button={
                      <button className="text-xs text-[#EA5050] underline">
                        Lịch sử bàn giao
                      </button>
                    }
                    children={
                      <div className="flex flex-col gap-3 p-4 rounded-[20px] bg-white shadow-xl shadow-shadow-500 w-[360px] max-h-[400px] overflow-y-auto">
                        {monitorData.assignmentHistory?.length > 0 ? (
                          monitorData.assignmentHistory
                            .filter((hist) => !!hist.endDate)
                            .sort(
                              (a, b) =>
                                new Date(b.endDate) - new Date(a.endDate)
                            )
                            .map((hist) => (
                              <div
                                key={hist._id}
                                className="p-2 bg-gray-200 rounded shadow"
                              >
                                <div className="flex items-center mb-2">
                                  <img
                                    src={
                                      hist.avatarUrl ||
                                      "https://via.placeholder.com/150"
                                    }
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full mr-3 object-cover"
                                  />
                                  <div>
                                    <p className="font-semibold text-sm">
                                      {hist.userName}
                                    </p>
                                    <p className="text-sm text-gray-700 italic">
                                      {dayjs(hist.startDate).format(
                                        "DD/MM/YYYY"
                                      )}{" "}
                                      —{" "}
                                      {dayjs(hist.endDate).format("DD/MM/YYYY")}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Người thu hồi:{" "}
                                      <strong>
                                        {hist.revokedBy?.fullname ||
                                          "Không xác định"}
                                      </strong>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Lý do thu hồi:{" "}
                                      <strong>
                                        {hist.revokedReason?.join(", ") ||
                                          "Không xác định"}
                                      </strong>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-gray-600">
                            Chưa có lịch sử bàn giao
                          </p>
                        )}
                      </div>
                    }
                    classNames={"py-2 top-4 left-0 w-max"}
                  />
                </div>
              </div>
              <div>
                {/* Phòng */}
                <h3 className="text-sm font-semibold mt-4 mb-4">
                  Nơi lưu trữ hiện tại
                </h3>
                <div className="bg-[#E4E9EF] text-[#002147] rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4">
                      <IoLocationOutline size={24} className="text-[#002147]" />
                      <div>
                        <p className="font-bold text-base">
                          {localRoom?.name || "Không xác định"}
                        </p>
                        {Array.isArray(localRoom?.location) &&
                        localRoom.location.length > 0 ? (
                          localRoom.location.map((loc, index) => (
                            <div key={index}>
                              Toà nhà: {loc.building || "Không xác định"} ||
                              Tầng: {loc.floor || "Không xác định"}
                            </div>
                          ))
                        ) : (
                          <div>Không có thông tin vị trí</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleEditRoom}
                      aria-label="Edit room information"
                      className="text-[#FF5733] rounded-full p-2 hover:bg-gray-200 transition-transform transform hover:scale-110"
                    >
                      <FiEdit size={20} />
                    </button>
                  </div>
                  <hr className="my-2 border-t border-gray-300" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <p>Công năng hiện tại:</p>
                      <span className="px-3 py-1 bg-[#002147] text-white text-sm rounded-full">
                        {localRoom?.status || "Không xác định trạng thái"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          {localStatus !== "Broken" && (
            <>
              <h3 className="text-base font-semibold mb-2">
                Thông tin sử dụng
              </h3>
              <div className="justify-between items-center flex">
                <h3 className="text-sm font-semibold mt-2 mb-2">
                  Người sử dụng hiện tại
                </h3>
                <div className="relative mb-2 mt-2 text-sm">
                  <Dropdown
                    button={
                      <button className="text-xs text-[#EA5050] underline">
                        Lịch sử bàn giao
                      </button>
                    }
                    children={
                      <div className="flex flex-col gap-3 p-4 rounded-[20px] bg-white shadow-xl shadow-shadow-500 w-[360px] max-h-[400px] overflow-y-auto">
                        {monitorData.assignmentHistory?.length > 0 ? (
                          monitorData.assignmentHistory
                            .filter((hist) => !!hist.endDate)
                            .sort(
                              (a, b) =>
                                new Date(b.endDate) - new Date(a.endDate)
                            )
                            .map((hist) => (
                              <div
                                key={hist._id}
                                className="p-2 bg-gray-200 rounded shadow"
                              >
                                <div className="flex items-center mb-2">
                                  <img
                                    src={
                                      hist.avatarUrl ||
                                      "https://via.placeholder.com/150"
                                    }
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full mr-3 object-cover"
                                  />
                                  <div>
                                    <p className="font-semibold text-sm">
                                      {hist.userName}
                                    </p>
                                    <p className="text-sm text-gray-700 italic">
                                      {dayjs(hist.startDate).format(
                                        "DD/MM/YYYY"
                                      )}{" "}
                                      —{" "}
                                      {dayjs(hist.endDate).format("DD/MM/YYYY")}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Người thu hồi:{" "}
                                      <strong>
                                        {hist.revokedBy?.fullname ||
                                          "Không xác định"}
                                      </strong>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Lý do thu hồi:{" "}
                                      <strong>
                                        {hist.revokedReason?.join(", ") ||
                                          "Không xác định"}
                                      </strong>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-gray-600">
                            Chưa có lịch sử bàn giao
                          </p>
                        )}
                      </div>
                    }
                    classNames={"py-2 top-4 left-0 w-max"}
                  />
                </div>
              </div>
              <div>
                {currentHolder ? (
                  <div className="bg-[#002147] rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 p-4 ">
                    <div className=" text-white shadow mb-2 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            currentHolder?.user?.avatarUrl
                              ? `${BASE_URL}${currentHolder?.user?.avatarUrl}`
                              : "/default-avatar.png"
                          }
                          alt="Avatar"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-base">
                            {currentHolder?.user?.fullname || "Không xác định"}
                          </p>
                          <p className="text-xs italic text-gray-300">
                            {currentHolder?.user?.jobTitle || "Không xác định"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <p className="text-xs  text-gray-300">
                          {new Date(
                            currentHolder?.startDate
                          ).toLocaleDateString("vi-VN")}{" "}
                          - nay
                        </p>
                        <button
                          className="mt-1 text-xs font-semibold underline text-gray-300 hover:text-gray-100"
                          onClick={() =>
                            handleViewDocument(
                              currentHolder.document?.split("/").pop()
                            )
                          } // Hàm xử lý khi click
                        >
                          Biên bản
                        </button>
                      </div>
                    </div>
                    <div>
                      <hr className="my-2 border-t border-gray-400" />{" "}
                      {/* Dòng phân cách */}
                      <p className="text-xs italic text-gray-300">
                        Người bàn giao:{" "}
                        {currentHolder?.assignedBy?.fullname ||
                          "Không xác định"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="italic text-xs">Chưa bàn giao </p>
                )}

                {/* Phòng */}
                <h3 className="text-sm font-semibold mt-4 mb-2">
                  Nơi sử dụng hiện tại
                </h3>
                <div className="bg-[#E4E9EF] text-[#002147] rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 p-4">
                  <div className="flex justify-between items-center mb-4 key={refreshKey}">
                    <div className="flex items-center space-x-4">
                      <IoLocationOutline size={24} className="text-[#002147]" />
                      <div>
                        <p className="font-bold text-base">
                          {localRoom?.name || "Không xác định"}
                        </p>
                        {Array.isArray(localRoom?.location) &&
                        localRoom.location.length > 0 ? (
                          localRoom.location.map((loc, index) => (
                            <div key={index}>
                              Toà nhà: {loc.building || "Không xác định"} ||
                              Tầng: {loc.floor || "Không xác định"}
                            </div>
                          ))
                        ) : (
                          <div>Không có thông tin vị trí</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleEditRoom}
                      aria-label="Edit room information"
                      className="text-[#FF5733] rounded-full p-2 hover:bg-gray-200 transition-transform transform hover:scale-110"
                    >
                      <FiEdit size={20} />
                    </button>
                  </div>
                  <hr className="my-2 border-t border-gray-300" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <p>Công năng hiện tại:</p>
                      <span className="px-3 py-1 bg-[#002147] text-white text-sm rounded-full">
                        {localRoom?.status || "Không xác định trạng thái"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Block hiển thị thông tin bảo trì bảo dưỡng */}
                <h3 className="text-sm font-semibold mt-4 mb-2">
                  Thông tin bảo trì bảo dưỡng
                </h3>
                <div className="bg-[#E4E9EF] p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
                  {loading ? (
                    <p>Đang tải dữ liệu kiểm tra...</p>
                  ) : lastInspection ? (
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <IoBuildOutline size={28} className="text-[#002147]" />
                        <div>
                          <p className="text-sm font-bold ml-2">
                            Lần kiểm tra gần nhất:{" "}
                            {dayjs(lastInspection.inspectionDate).format(
                              "DD/MM/YYYY"
                            )}
                          </p>
                          <p className="text-sm ml-2">
                            Người kiểm tra:{" "}
                            {lastInspection.inspectorName || "Không xác định"}
                          </p>
                        </div>
                      </div>
                      {lastInspection.documentUrl &&
                        lastInspection.documentUrl
                          .toLowerCase()
                          .endsWith(".pdf") && (
                          <button
                            onClick={handleViewReport}
                            className="px-2 py-1 text-[#002147] text-sm"
                          >
                            <IoBookOutline size={20} />
                          </button>
                        )}
                      {statusData.status === "Đã kiểm tra, thiếu biên bản" && (
                        <label className="px-2 py-1 text-[#002147] font-bold rounded text-xs cursor-pointer transform transition-transform duration-300 hover:scale-105">
                          <IoCloudUploadOutline size={22} />
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileUploadInspect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Chưa có lịch sử kiểm tra.
                    </p>
                  )}

                  <hr className="my-4 border-gray-300" />

                  <div className="flex gap-2 items-center">
                    <h4 className="text-sm font-semibold">
                      Trạng thái bảo trì:
                    </h4>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${statusData.color}`}
                    >
                      {statusData.status}
                    </span>

                    {statusData.status === "Đã kiểm tra, thiếu biên bản" && (
                      <>
                        <button
                          onClick={handleDownloadReport}
                          className="px-2 py-1 text-white font-semibold text-sm rounded-lg shadow-2xl bg-[#002147] transform transition-transform duration-300 hover:scale-105"
                        >
                          In Biên bản
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Block 3: Lịch sử hoạt động */}
        <div className="bg-[#f8f8f8] p-4 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold">Lịch sử hoạt động</h3>
            <button
              className="px-3 py-1 bg-[#002147] text-white text-sm rounded-xl shadow hover:bg-[#001635]"
              onClick={handleOpenAddActivityModal}
            >
              +
            </button>
          </div>
          <div className="flex space-x-2 mb-4 text-sm">
            <button
              className={`px-4 py-2 rounded-xl shadow-lg ${
                activeTab === "all"
                  ? "bg-oxford-blue text-white"
                  : "bg-[#E4E9EF] transform transition-transform duration-300 hover:scale-105"
              }`}
              onClick={() => setActiveTab("all")}
            >
              Tổng hợp
            </button>
            <button
              className={`px-4 py-2 rounded-xl shadow-lg ${
                activeTab === "repairs"
                  ? " bg-oxford-blue text-white"
                  : "bg-[#E4E9EF] transform transition-transform duration-300 hover:scale-105"
              }`}
              onClick={() => setActiveTab("repairs")}
            >
              Sửa chữa
            </button>
            <button
              className={`px-4 py-2 rounded-xl shadow-lg ${
                activeTab === "updates"
                  ? "bg-oxford-blue text-white"
                  : "bg-[#E4E9EF] transform transition-transform duration-300 hover:scale-105"
              }`}
              onClick={() => setActiveTab("updates")}
            >
              Cập nhật phần mềm
            </button>
          </div>

          {/* Hiển thị danh sách activity */}
          <div className="space-y-2 max-h-[270px] overflow-y-auto text-sm">
            {activeTab === "repairs" &&
              repairs.map((repair) => (
                <div
                  key={repair._id}
                  className="relative bg-gray-200 p-4 rounded-xl shadow"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-gray-800 truncate">
                      {repair.description || "Không có mô tả"}
                    </p>
                    <span className="text-sm text-gray-500">
                      {dayjs(repair.date).format("HH:mm:ss | DD-MM-YYYY")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1 truncate">
                    Chi tiết: {repair.details || "Không có chi tiết"}
                  </p>
                  <div className="flex justify-between space-x-2 mt-2">
                    <div>
                      <p className="text-sm text-gray-600 italic">
                        Cập nhật bởi: {repair.updatedBy || "Không xác định"}
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEditRepair(repair)}
                        className="flex items-center justify-center w-6 h-6 text-white bg-oxford-blue rounded-xl transform transition-transform duration-300 hover:scale-105"
                      >
                        <FiEdit size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteRepair(repair._id)}
                        className="flex items-center justify-center w-6 h-6 text-white bg-orange-red rounded-xl transform transition-transform duration-300 hover:scale-105"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {activeTab === "updates" &&
              updates.map((update) => (
                <div
                  key={update._id}
                  className="relative bg-gray-200 p-4 rounded-xl shadow"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-gray-800 truncate">
                      {update.description || "Không có mô tả"}
                    </p>
                    <span className="text-sm text-gray-500">
                      {dayjs(update.date).format("HH:mm:ss | DD-MM-YYYY")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1 truncate">
                    Chi tiết: {update.details || "Không có chi tiết"}
                  </p>
                  <div className="flex justify-between space-x-2 mt-2">
                    <div>
                      <p className="text-sm text-gray-600 italic">
                        Cập nhật bởi: {update.updatedBy || "Không xác định"}
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEditUpdate(update)}
                        className="flex items-center justify-center w-6 h-6 text-white bg-oxford-blue rounded-xl transform transition-transform duration-300 hover:scale-105"
                      >
                        <FiEdit size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteUpdate(update._id)}
                        className="flex items-center justify-center w-6 h-6 text-white bg-orange-red rounded-xl transform transition-transform duration-300 hover:scale-105"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {activeTab === "all" &&
              allActivities.map((activity) => (
                <div
                  key={activity._id}
                  className="bg-gray-200 p-4 rounded-xl shadow"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-gray-800 truncate">
                      {activity.description || "Không có mô tả"}
                    </p>
                    <span className="text-sm text-gray-500">
                      {dayjs(activity.date).format("HH:mm:ss | DD-MM-YYYY")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1 truncate">
                    Chi tiết: {activity.details || "Không có chi tiết"}
                  </p>
                  <div className="flex justify-between space-x-2 mt-2">
                    <p className="text-sm text-gray-600 italic">
                      {activity.type === "repair"
                        ? "Kỹ thuật:"
                        : "Cập nhật bởi:"}{" "}
                      {activity.updatedBy || "Không xác định"}
                    </p>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        activity.type === "repair"
                          ? "bg-[#FF5733] text-white"
                          : "bg-[#002147] text-white"
                      }`}
                    >
                      {activity.type === "repair"
                        ? "Sửa chữa"
                        : "Cập nhật phần mềm"}
                    </span>
                  </div>
                </div>
              ))}
          </div>
          {/* Modal Thêm Hoạt Động */}
          {isAddActivityModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white w-1/3 p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-bold mb-4">Thêm hoạt động mới</h2>

                {/* Loại hoạt động */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Loại hoạt động
                  </label>
                  <select
                    className="w-full border p-2 rounded-xl"
                    value={newActivity.type}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, type: e.target.value })
                    }
                  >
                    <option value="repair">Sửa chữa</option>
                    <option value="update">Cập nhật phần mềm</option>
                  </select>
                </div>

                {/* Mô tả */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Mô tả
                  </label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded-xl"
                    placeholder="Nhập mô tả..."
                    value={newActivity.description}
                    onChange={(e) =>
                      setNewActivity({
                        ...newActivity,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Chi tiết */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Chi tiết
                  </label>
                  <textarea
                    className="w-full border p-2 rounded-xl"
                    placeholder="Nhập chi tiết..."
                    value={newActivity.details}
                    onChange={(e) =>
                      setNewActivity({
                        ...newActivity,
                        details: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Nút hành động */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseAddActivityModal}
                    className="px-4 py-2 bg-gray-300 text-black rounded-xl hover:bg-gray-400 transform transition-transform duration-300 hover:scale-105"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveNewActivity}
                    className="px-4 py-2 bg-[#DC0909] text-white rounded-xl hover:bg-[#CC4529] transform transition-transform duration-300 hover:scale-105"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          )}
          {isEditUpdateOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white w-1/3 p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-bold mb-4">Chỉnh sửa cập nhật</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Mô tả
                  </label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded-xl"
                    value={editingUpdate.description}
                    onChange={(e) =>
                      setEditingUpdate({
                        ...editingUpdate,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Chi tiết
                  </label>
                  <textarea
                    className="w-full border p-2 rounded-xl"
                    value={editingUpdate.details}
                    onChange={(e) =>
                      setEditingUpdate({
                        ...editingUpdate,
                        details: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseEditUpdate}
                    className="px-4 py-2 bg-gray-300 text-black rounded-xl hover:bg-gray-400 transform transition-transform duration-300 hover:scale-105"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() =>
                      handleEditUpdate(editingUpdate._id, editingUpdate)
                    }
                    className="px-4 py-2 bg-[#DC0909] text-white rounded-xl hover:bg-[#CC4529] transform transition-transform duration-300 hover:scale-105"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          )}
          {isEditRepairOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white w-1/3 p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-bold mb-4">Chỉnh sửa sửa chữa</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Mô tả
                  </label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded-xl"
                    value={editingRepair.description}
                    onChange={(e) =>
                      setEditingRepair({
                        ...editingRepair,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Chi tiết
                  </label>
                  <textarea
                    className="w-full border p-2 rounded-xl"
                    value={editingRepair.details}
                    onChange={(e) =>
                      setEditingRepair({
                        ...editingRepair,
                        details: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseEditRepair}
                    className="px-4 py-2 bg-gray-300 text-black rounded-xl hover:bg-gray-400 transform transition-transform duration-300 hover:scale-105"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() =>
                      handleEditRepair(editingRepair._id, editingRepair)
                    }
                    className="px-4 py-2 bg-[#DC0909] text-white rounded-xl hover:bg-[#CC4529] transform transition-transform duration-300 hover:scale-105"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Modal Thu hồi với lý do */}
          {showRevokeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Xác nhận thu hồi
                </h3>

                {/* Các lựa chọn lý do thu hồi */}
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold mb-2">Chọn lý do thu hồi:</p>
                    <div className="space-y-2">
                      {[
                        "Máy không đạt yêu cầu công việc",
                        "Nghỉ việc",
                        "Máy hỏng",
                      ].map((reason) => (
                        <label
                          key={reason}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={revokeReasons.includes(reason)}
                            onChange={() => handleReasonChange(reason)}
                          />
                          <span>{reason}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Lý do khác:
                      </label>
                      <textarea
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        rows="3"
                        className="mt-1 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                        placeholder="Nhập lý do khác..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={cancelRevoke}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-200 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring focus:ring-gray-400 transform transition-transform duration-300"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmRevoke}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 focus:outline-none focus:ring focus:ring-red-500 transform transition-transform duration-300"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Mở modal Assign */}
          {showAssignModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white w-[90%] max-w-md p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Bàn giao thiết bị
                </h2>

                {/* Trường Người sử dụng */}
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium mb-2">
                    Người sử dụng
                  </label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded"
                    placeholder="Tìm theo tên hoặc email..."
                    value={searchText}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      debouncedSearch(); // Gọi hàm tìm kiếm với debounce
                    }}
                  />
                  {searchText.trim() && (
                    <div className="absolute z-10 bg-white border rounded mt-1 max-h-48 w-full overflow-y-auto shadow-lg">
                      {searchResults.length > 0 ? (
                        <ul>
                          {searchResults.map((user) => (
                            <li
                              key={user._id}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleSelectUser(user)}
                            >
                              <p className="font-bold">{user.fullname}</p>
                              <p className="text-sm italic text-gray-600">
                                {user.email}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 p-2">
                          Không tìm thấy kết quả nào!
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {selectedUser && (
                  <div className="mt-4 mb-4 bg-[#002147] text-white p-4 rounded-xl flex items-center space-x-4">
                    <img
                      src={
                        selectedUser.avatarUrl ||
                        "https://via.placeholder.com/150"
                      }
                      alt={selectedUser.fullname}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-lg">
                        {selectedUser.fullname}
                      </p>
                      <p className="text-sm italic text-gray-500">
                        {selectedUser.email}
                      </p>
                      <p className="text-sm italic text-gray-500">
                        {selectedUser.jobTitle || "Không xác định"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Trường Ghi chú */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    className="w-full border rounded-xl p-2"
                    placeholder="Nhập ghi chú (nếu có)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Nút hành động */}
                <div className="flex justify-end space-x-4">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded-xl hover:bg-gray-400"
                    onClick={handleCloseModal}
                  >
                    Hủy
                  </button>
                  <button
                    className="px-4 py-2 bg-[#FF5733] text-white rounded-xl hover:bg-[#CC4529]"
                    onClick={handleConfirmAssign}
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          )}
          {showBrokenModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-xl shadow-lg w-1/3">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Lý do báo hỏng
                </h2>
                <textarea
                  className="w-full border border-gray-300 rounded-xl p-2 mb-4"
                  placeholder="Nhập lý do báo hỏng..."
                  value={brokenReason}
                  onChange={(e) => setBrokenReason(e.target.value)}
                ></textarea>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCloseBrokenModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirmBroken}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* // Modal chỉnh sửa phòng */}
          <div key={refreshKey}>
            {showRoomEditModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md">
                  <h2 className="text-lg font-bold mb-4">Chỉnh sửa phòng</h2>
                  {/* Ô input tìm kiếm */}
                  <input
                    type="text"
                    className="w-full border p-2 rounded-xl mb-4"
                    placeholder="Tìm theo tên phòng hoặc vị trí..."
                    value={searchText}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      handleSearchRoom(e.target.value); // Tìm kiếm phòng
                    }}
                  />
                  {/* Danh sách kết quả tìm kiếm */}
                  <div className="max-h-48 overflow-y-auto border rounded-xl p-2">
                    {searchResults.length > 0 ? (
                      searchResults.map((room) => (
                        <div
                          key={room._id}
                          className={`p-2 rounded-xl cursor-pointer ${
                            localRoom?._id === room._id
                              ? "bg-blue-100 font-bold"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => setLocalRoom(room)} // Chọn phòng
                        >
                          <p>{room.name}</p>
                          <p className="text-xs text-gray-500 italic">
                            {room.location
                              .map(
                                (loc) => `${loc.building} || Tầng: ${loc.floor}`
                              )
                              .join(", ")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        Không tìm thấy phòng phù hợp.
                      </p>
                    )}
                  </div>
                  {/* Nút hành động */}
                  <div className="flex justify-end mt-4 space-x-2">
                    <button
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400"
                      onClick={handleCloseRoomEditModal}
                    >
                      Hủy
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                      onClick={handleSaveRoom} // Lưu thông tin phòng
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {showRecycleModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-lg w-1/3">
                <h2 className="text-lg font-bold mb-4 text-gray-800">
                  Xác nhận chuyển trạng thái
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Bạn có chắc chắn muốn chuyển trạng thái thiết bị này về{" "}
                  <strong>Chờ cấp phát</strong> không?
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowRecycleModal(false)} // Đóng modal
                    className="px-3 py-1 text-sm bg-gray-300 text-black rounded-xl hover:bg-gray-400"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirmRecycle} // Hàm xử lý xác nhận
                    className="px-3 py-1 text-sm bg-[#009483] text-white rounded-xl hover:bg-[#006653]"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          )}
          {showInspectModal && (
            <Inspect
              monitorData={localMonitor}
              user={currentHolder.user}
              onClose={() => setShowInspectModal(false)}
              inspectId={monitorData._id} // id là giá trị bạn có
              onInspectionComplete={(inspectionData) => {
                // Xử lý dữ liệu kiểm tra tại LaptopProductCard
                setLocalMonitor((prev) => ({
                  ...prev,
                  lastInspection: inspectionData,
                }));
              }}
            />
          )}
        </div>
      </div>

      {/* Nút Hủy và Lưu (tùy trường hợp bạn có dùng không) */}
      <div className="flex justify-end space-x-2 mt-4">
        <button
          className="px-4 py-2 bg-gray-300 text-black text-sm font-semibold rounded-xl hover:bg-gray-400"
          onClick={onCloseModal}
        >
          Hủy
        </button>
        <button
          className="px-4 py-2 bg-[#DC0909] text-white text-sm font-semibold rounded-xl hover:bg-[#001635]"
          onClick={onCloseModal}
        >
          Lưu
        </button>
      </div>
    </div>
  );
};

export default MonitorProductCard;
