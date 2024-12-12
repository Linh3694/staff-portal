import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import DesktopProductCard from "./productcard/desktopProductCard";
import * as XLSX from "xlsx";
import ReactDOM from "react-dom";
import "../css/table.css"
import { MdCancel, MdCheckCircle, MdOutlineError } from "react-icons/md";


const DesktopTable = () => {
          
        const [data, setData] = useState([]); // State cho danh sách desktops
        const [users, setUsers] = useState([]); // Lưu danh sách users từ API
        const [showAddModal, setShowAddModal] = useState(false); // State để điều khiển modal 
        const [newDesktop, setNewDesktop] = useState({
            name: "",
            manufacturer: "",
            serial: "",
            assigned: [],
            status: "Active",
            releaseYear: "",
            specs: {
              processor: "",
              ram: "",
              storage: "",
              display: "",
          },
          }); 
        const [editingDesktop, setEditingDesktop] = useState({
            name: "",
            manufacturer: "",
            serial: "",
            assigned: [],
            status: "Active",
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
        const [desktopToDelete, setDesktopToDelete] = useState(null);
        const [selectedDesktop, setSelectedDesktop] = useState(null);
        const [showDetailModal, setShowDetailModal] = useState(false); // Kiểm soát hiển thị modal
        const [showUploadModal, setShowUploadModal] = useState(false);
        const [parsedData, setParsedData] = useState([]);
        const [isUploading, setIsUploading] = useState(false);

        const statusClasses = {
          Active: "bg-green-100 text-green-800",
          "In Repair": "bg-yellow-100 text-yellow-800",
          "Lưu kho": "bg-red-600 text-white",
          default: "bg-gray-100 text-gray-700",
        };
        
        const statusLabels = {
          Active: "Đang sử dụng",
          "In Repair": "Chờ sửa chữa",
          "Lưu kho": "Lưu kho",
          default: "Không xác định",
        };

      
        const handleDeleteRepair = async (desktopId, repairId) => {
          console.log("Desktop ID:", desktopId);
          console.log("Repair ID:", repairId);
        
          if (!repairId) {
            console.error("repairId không hợp lệ.");
            return Promise.reject("repairId không hợp lệ");
          }
        
          try {
            const token = localStorage.getItem("authToken");
            const response = await axios.delete(
              `http://localhost:5001/api/desktops/${desktopId}/repairs/${repairId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
        
            if (response.status === 200) {
              setSelectedDesktop((prevDesktop) => ({
                ...prevDesktop,
                repairs: prevDesktop.repairs.filter((repair) => repair._id !== repairId),
              }));
              toast.success("Xóa nhật ký sửa chữa thành công!",{
                className: "toast-success",
              });
              return Promise.resolve(); // Trả về Promise thành công
            }
            } catch (error) {
                console.error("Error deleting repair log:", error);
                toast.error("Không thể xóa nhật ký sửa chữa!",{
                  className: "toast-error",
                });
              return Promise.reject(error); // Trả về Promise lỗi
          }
        };
        
          const handleAddRepair = async (repairData) => {
              try {

                const currentUser = JSON.parse(localStorage.getItem("currentUser")) || { fullname: "Không xác định" }; // Lấy thông tin người dùng hiện tại
                const payload = {
                  description: repairData.description || "Không có mô tả",
                  date: repairData.date || new Date().toISOString(),
                  updatedBy: currentUser.fullname,
                };

                console.log("Payload:", payload);
                console.log("Gửi yêu cầu tới:", `http://localhost:5001/api/desktops/${selectedDesktop._id}/repairs`);
                console.log("Payload:", repairData);
                console.log("Selected desktop:", selectedDesktop);
                console.log("Payload:", {
                  description: repairData.description,
                  date: repairData.date || new Date().toISOString(),
                  updatedBy: currentUser.fullname,
                });
                console.log("Token:", localStorage.getItem("authToken"));
                const response = await fetch(`http://localhost:5001/api/desktops/${selectedDesktop._id}/repairs`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                  },
                  body: JSON.stringify(payload),
                });
            
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error("API Error:", errorText);
                  throw new Error(errorText || "Failed to add repair log");
                }
                const updatedRepair = await response.json();
            
                setSelectedDesktop((prevDesktop) => ({
                  ...prevDesktop,
                  repairs: [updatedRepair, ...(prevDesktop.repairs || [])], // Thêm nhật ký sửa chữa mới vào đầu danh sách
                }));
            
                console.log("Repair log updated successfully:", updatedRepair);
              } catch (error) {
                console.error("Error adding repair log:", error);
              }
          };
          
          console.log("Props truyền vào desktopProductCard:", {
            desktopData: selectedDesktop,
            onDeleteRepair: handleDeleteRepair,
          });

          <desktopProductCard
            desktopData={{
              ...selectedDesktop,
              repairs: selectedDesktop?.repairs || [], // Đảm bảo repairs là mảng
            }}
            onAddRepair={(repair) => {
                    // Gọi API thêm nhật ký sửa chữa
                    fetch(`http://localhost:5001/api/desktops/${selectedDesktop._id}/repairs`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(repair),
                    })
                      .then((response) => {
                        if (response.ok) {
                          console.log("Repair saved successfully");
                        
                        } else {
                          console.error("Failed to save repair");                         
                        }
                      })
                      .catch((error) => console.error("Error saving repair:", error));
               }}
            currentUser={JSON.parse(localStorage.getItem("currentUser"))}
            onDeleteRepair={handleDeleteRepair}
            />
          
          const handleViewDetails = (desktop) => {
            setSelectedDesktop(desktop); // Lưu thiết bị được chọn
            setShowDetailModal(true); // Hiển thị modal
          };

          // Hàm gọi API để lấy danh sách desktops
          const fetchDesktops = async () => {
            try {
              const token = localStorage.getItem("authToken");
              const response = await axios.get("http://localhost:5001/api/desktops", {
                headers: { Authorization: `Bearer ${token}` },
              });

              // Map dữ liệu `assigned` để phù hợp với định dạng giao diện
              const desktops = response.data.map((desktop) => ({
                ...desktop,
                assigned: desktop.assigned.map((user) => ({
                  value: user._id,
                  label: user.name,
                  title: user.jobTitle || "Không xác định",
                })),
              }));
              setData(desktops);
              console.log("Desktops fetched:", response.data); // Log dữ liệu
            } catch (error) {
              console.error("Error fetching desktops:", error);
            }
          };

          // Lấy danh sách users
       
          const fetchUsers = async () => {
            try {
              const token = localStorage.getItem("authToken");
              const response = await axios.get("http://localhost:5001/api/users", {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (response.data && Array.isArray(response.data)) {
                setUsers(
                  response.data.map((user) => ({
                    value: user._id,
                    label: user.fullname || user.email,
                    title: user.jobTitle || "Không xác định",
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

          const handleDelete = async (id) => {
            if (!desktopToDelete) return;

              try {
                await axios.delete(`http://localhost:5001/api/desktops/${desktopToDelete._id}`, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Thêm token ở đây
                  },
                }
                );
                fetchDesktops(); // Cập nhật lại danh sách sau khi xóa
                toast.success("Desktop đã được xóa!",
                  {
                    className: "toast-success",
                  }
                );
              } catch (error) {
                console.error("Error deleting desktop:", error);
                toast.error("Có lỗi xảy ra khi xóa desktop!",
                  {
                    className: "toast-error",
                  }
                );
              } finally {
                setShowConfirmModal(false); // Đóng modal
                setDesktopToDelete(null); // Reset desktop cần xóa
              }
          };

          const handleEdit = (item) => {
              setEditingDesktop({
                ...item,
                releaseYear: item.releaseYear || "", // Đảm bảo có giá trị mặc định cho Năm sản xuất
                specs: {
                  processor: item.specs?.processor || "",
                  ram: item.specs?.ram || "",
                  storage: item.specs?.storage || "",
                  display: item.specs?.display || "",
                },
                assigned: Array.isArray(item.assigned)
                  ? item.assigned.map((user) => ({
                      value: user.value || user._id, // Đảm bảo định dạng user
                      label: user.label || user.fullname,
                    }))
                  : [],
              });
              setShowEditModal(true); // Hiển thị modal chỉnh sửa
          };

          const confirmDelete = (desktop) => {
            setDesktopToDelete(desktop); // Đặt desktop cần xóa
            setShowConfirmModal(true); // Hiển thị modal xác nhận
          };
          
          const handleAddDesktop = async (e) => {
            e.preventDefault();
          
            try {
              // Kiểm tra dữ liệu nhập
              if (!newDesktop.name || !newDesktop.manufacturer || !newDesktop.serial || !newDesktop.status) {
                toast.error("Vui lòng điền đầy đủ thông tin!",
                  {
                    className: "toast-error",
                  }
                );
                return;
              }
          
              // Chuẩn bị payload
              const payload = {
                ...newDesktop,
                releaseYear: newDesktop.releaseYear || "",
                specs: {
                  processor: newDesktop.specs?.processor || "",
                  ram: newDesktop.specs?.ram || "",
                  storage: newDesktop.specs?.storage || "",
                  display: newDesktop.specs?.display || "",
                },
                assigned: newDesktop.assigned?.map((user) => user.value) || [], // Xử lý danh sách người dùng
              };
          
              console.log("Payload gửi lên:", payload);
              console.log("Dữ liệu gửi đi:", newDesktop);
          
              // Gửi dữ liệu lên API
              const response = await axios.post("http://localhost:5001/api/desktops", payload, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Đảm bảo token được gửi kèm
                },
              });
          
              if (response.status === 201) {
                toast.success("Thêm desktop thành công!",
                  {
                    className: "toast-success",
                    progressClassName: "Toastify__progress-bar",
                  }
                );
          
                // Cập nhật danh sách desktops và đóng modal
                fetchDesktops();
                setShowAddModal(false);
                setNewDesktop({
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
                  status: "Active",
                });
              }
            } catch (error) {
              console.error("Lỗi khi thêm desktop:", error);
              toast.error("Có lỗi xảy ra khi thêm desktop. Vui lòng thử lại!",
                {
                  className: "toast-error",
                  progressClassName: "Toastify__progress-bar",
                }
              );
            }
          };

          const handleFileChange = (e) => {
            const file = e.target.files[0];
        
            if (!file) {
                toast.error("Vui lòng chọn một tệp!",
                  {
                    className: "toast-error",
                    progressClassName: "Toastify__progress-bar",
                  }
                );
                return;
            }
        
            if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
                toast.error("Định dạng tệp không hợp lệ. Vui lòng chọn tệp Excel!",
                  {
                    className: "toast-error",
                    progressClassName: "Toastify__progress-bar",
                  }
                );
                return;
            }
        
            const reader = new FileReader();
        
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
                    // Chuẩn hóa dữ liệu
                    const normalizedData = sheetData.map((row, index) => {
                        if (!row["Tên Thiết Bị (name)"] || !row["Nhà Sản Xuất (manufacturer)"] || !row["Serial (serial)"]) {
                            console.error(`Hàng ${index + 1} bị thiếu dữ liệu bắt buộc.`);
                            return null;
                        }
                        const assignedFullnames = row["Người Dùng (assigned)"]
                            ? row["Người Dùng (assigned)"].split(",").map((name) => name.trim())
                            : [];

                        const assignedIds = assignedFullnames.map((name) => {
                           const normalizedFullname = name.trim().toLowerCase();
                           const matchedUser = users.find(
                            (user) => user.label.trim().toLowerCase() === normalizedFullname // So sánh tên đã chuẩn hóa
                          );
                            if (!matchedUser) {
                              const suggestions = users.map((user) => user.label).join(", ");
                              console.error(`Tên không hợp lệ: ${name}. Các tên hợp lệ: ${suggestions}`);
                              toast.error(`Tên không hợp lệ: ${name}. Gợi ý: ${suggestions}`);
                              throw new Error(`Tên không hợp lệ: ${name}`);
                          }
                            return matchedUser.value; // Lấy ID nếu khớp
                        }); 
        
                        return {
                            name: row["Tên Thiết Bị (name)"] || "",
                            manufacturer: row["Nhà Sản Xuất (manufacturer)"] || "",
                            serial: row["Serial (serial)"] || "",
                            status: row["Trạng Thái (status)"] === "Đang sử dụng"
                                  ? "Active"
                                  : row["Trạng Thái (status)"] === "Chờ sửa chữa"
                                  ? "In Repair"
                                  : row["Trạng Thái (status)"] === "Lưu kho"
                                  ? "Lưu kho"
                                  : "Không xác định",
                            specs: {
                                processor: row["Bộ Xử Lý (processor)"] || "",
                                ram: row["RAM (ram)"] || "",
                                storage: row["Bộ Nhớ (storage)"] || "",
                                display: row["Màn Hình (display)"] || "",
                            },
                            assigned: assignedIds,
                            releaseYear: row["Năm đưa vào sử dụng (releaseYear)"] || "",
                        };
                    }).filter((item) => item !== null); // Loại bỏ các dòng không hợp lệ
        
                    console.log("Dữ liệu chuẩn hóa:", normalizedData);
        
                    if (normalizedData.length === 0) {
                        toast.error("File Excel không chứa dữ liệu hợp lệ!",{
                            className: "toast-error",
                            progressClassName: "Toastify__progress-bar",
                          }
                        );
                        return;
                    }
        
                    setParsedData(normalizedData);
                    toast.success("File Excel hợp lệ và đã được tải lên!",
                      {
                        className: "toast-success",
                        progressClassName: "Toastify__progress-bar",
                      }
                    );
                } catch (error) {
                    console.error("Lỗi khi xử lý tệp Excel:", error);
                    toast.error("Đã xảy ra lỗi khi xử lý tệp. Vui lòng kiểm tra lại!",
                      {
                        className: "toast-error",
                        progressClassName: "Toastify__progress-bar",
                      }
                    );
                }
            };
        
            reader.readAsArrayBuffer(file);
        };
          

        const handleConfirmUpload = async () => {
          if (!parsedData || parsedData.length === 0) {
              toast.error("Không có dữ liệu để upload. Vui lòng kiểm tra file Excel!",
                {
                  className: "toast-error",
                  progressClassName: "Toastify__progress-bar",
                }
              );
              return;
          }
      
          try {
              console.log("Dữ liệu gửi lên:", parsedData);
      
              const response = await axios.post(
                  "http://localhost:5001/api/desktops/bulk-upload",
                  { desktops: parsedData },
                  {
                      headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                      },
                  }
              );
      
              if (response.status === 201) {
                  toast.success(`${response.data.addedDesktops} desktop(s) đã được thêm thành công!`,
                    {
                      className: "toast-success",
                      progressClassName: "Toastify__progress-bar",
                    }
                  );
                  fetchDesktops();
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
                          toast.error(`Các serial bị trùng: ${duplicateSerials.join(", ")}`,
                          {
                            className: "toast-error",
                            progressClassName: "Toastify__progress-bar",
                          });
                      } else {
                          toast.error("File chứa lỗi không xác định.",
                            {
                              className: "toast-error",
                              progressClassName: "Toastify__progress-bar",
                            }
                          );
                      }
                  } else {
                      toast.error("Dữ liệu có lỗi, vui lòng kiểm tra lại.",
                        {
                          className: "toast-error",
                          progressClassName: "Toastify__progress-bar",
                        }
                      );
                  }
              } else {
                  toast.error("Đã xảy ra lỗi không xác định từ server!",
                    {
                      className: "toast-error",
                      progressClassName: "Toastify__progress-bar",
                    }
                  );
              }
          }
      };

          useEffect(() => {
            const fetchData = async () => {
              try {
                await fetchDesktops();
                await fetchUsers();
              } catch (error) {
                }
            };
            fetchData();
            }, []);

  return (  
    <div className="w-full h-full px-6 pb-6 sm:overflow-x-auto rounded-2xl">
      {/* Header */}
       <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
         {/* Search Input */}
         <div className="relative w-full sm:w-1/2 mb-4 sm:mb-0">
         <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
         <input
        type="text"
        placeholder="Tìm kiếm desktop..."
        className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={(e) => {
          const query = e.target.value.toLowerCase();
          if (query === "") {
            // Nếu ô tìm kiếm rỗng, khôi phục dữ liệu gốc
            fetchDesktops();
          } else {
            const filteredData = data.filter((item) =>
              item.name.toLowerCase().includes(query) ||
              item.manufacturer.toLowerCase().includes(query) ||
              item.serial.toLowerCase().includes(query)
            );
            setData(filteredData); // Cập nhật danh sách được hiển thị
          }
        }}
      />
    </div> 
    {/* Buttons */}
    <div className="flex space-x-2">
      <button
        onClick={() => {
          setNewDesktop({
            name: "",
            manufacturer: "",
            serial: "",
            assigned: [],
            status: "Active",
          }); // Reset lại form
          setShowAddModal(true);
        }}
        className="px-3 py-2 bg-oxford-blue text-sm font-bold text-white rounded-lg shadow-md hover:bg-oxford-blue-dark"
      >
        Thêm mới
      </button>
      <button
        className="bg-orange-red text-white text-sm font-bold px-3 py-2 rounded-lg shadow-md hover:bg-orange-red-dark"
        onClick={() => setShowUploadModal(true)}
      >
        Upload
      </button>
    </div>
  </div>

      {/* {-----------------------------------------/* Bảng /-----------------------------------------} */}
  <div className="w-full h-full px-6 pb-6 sm:overflow-x-auto bg-white rounded-2xl shadow-xl">
    <div className="mt-1 overflow-x-scroll xl:overflow-x-hidden">
      <table className="w-full">
        <thead>
          <tr className="!border-px !border-gray-400" >
            <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">TÊN THIẾT BỊ
                </p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">SERIAL
                </p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">NGƯỜI SỬ DỤNG
                </p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">TRẠNG THÁI
                </p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-500">HÀNH ĐỘNG
                </p>
            </th>
          </tr>
        </thead>
        <tbody>
  {data.map((item, index) => (
    <tr key={index} className="border-b border-gray-200">
      <td
        onClick={() => handleViewDetails(item)} 
        className="cursor-pointer text-[#002147] min-w-[150px] border-white/0 py-3 pr-4"
      >
        <p className="text-sm font-bold text-navy-700">
        {item.name}
        </p>
        <span className="text-sm italic bold text-gray-500">
          {item.manufacturer || "Không xác định"} - {item.releaseYear || "N/A"}
        </span>
      </td>
      <td className="min-w-[150px] border-white/0 py-3 pr-4">
         <p className="text-sm font-bold text-navy-700">{item.serial}
         </p>
         </td>
      <td className="min-w-[150px] border-white/0 py-3 pr-4 text-sm font-bold text-navy-700">
        {Array.isArray(item.assigned) && item.assigned.length > 0
          ? item.assigned.map((user) => (
              <span
                key={user.value || user._id}
                className="text-sm font-bold text-navy-700"
              >
                {user.label || user.name}
              </span>
            ))
          : "Chưa bàn giao"}
      </td>
      <td className="min-w-[150px] border-white/0 py-3 pr-4">
        <div className="flex items-center">
          {item.status === "Active" ? (
            <MdCheckCircle className="text-green-500 me-1" />
          ) : item.status === "Lưu kho" ? (
            <MdCancel className="text-red-500 me-1" />
          ) : item.status === "In Repair" ? (
            <MdOutlineError className="text-amber-500 me-1" />
          ) : null}
          <p className="text-sm font-bold text-navy-700">
            {statusLabels[item.status] || statusLabels.default}
          </p>
        </div>
      </td>
      <td className="min-w-[150px] border-white/0 py-3 pr-4">
          <div className="flex space-x-2">
            <button
              onClick={() => handleEdit(item)}
              className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg hover:bg-oxford-blue-dark"
            >
              <FiEdit size={14} />
            </button>
            <button
              onClick={() => confirmDelete(item)}
              className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg hover:bg-orange-red-dark"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        </td>
    </tr>
  ))}
     </tbody>
    </table>
  </div>
</div>  


      {/* {-----------------------------------------/* Modal thêm mới /-----------------------------------------} */}
      {showAddModal && 
        ReactDOM.createPortal
          (
              <div
                className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 space-y-6 z-1000"
                onClick={() => setShowAddModal(false)}
              >
                <div
                  className="bg-white rounded-lg shadow-lg p-6 w-[50%]"
                  onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
                >
                  <h3 className="text-2xl font-bold mb-6 text-[#002147]">Thêm mới desktop</h3>
                  <form onSubmit={handleAddDesktop}>
                    {/* Thông tin chung */}
                    <div
                      className="border rounded-lg p-4 mb-4 relative"
                      style={{ position: "relative", padding: "16px", marginBottom: "30px" }}
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
                          <label className="block text-gray-600 font-medium mb-2">Tên thiết bị</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập tên thiết bị"
                            value={newDesktop.name}
                            onChange={(e) => setNewDesktop({ ...newDesktop, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Nhà sản xuất</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập nhà sản xuất"
                            value={newDesktop.manufacturer}
                            onChange={(e) => setNewDesktop({ ...newDesktop, manufacturer: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Serial</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập số serial"
                            value={newDesktop.serial}
                            onChange={(e) => setNewDesktop({ ...newDesktop, serial: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Năm sản xuất</label>
                          <input
                            type="number"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập năm sản xuất"
                            value={newDesktop.releaseYear}
                            onChange={(e) => setNewDesktop({ ...newDesktop, releaseYear: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cấu hình */}
                    <div
                      className="border rounded-lg p-4 mb-4 relative"
                      style={{ position: "relative", padding: "16px", marginBottom: "30px" }}
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
                          marginBottom: "16px"
                        }}
                      >
                        Cấu hình
                      </span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Processor</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập bộ xử lý"
                            value={newDesktop.specs?.processor || ""}
                            onChange={(e) =>
                              setNewDesktop({ ...newDesktop, specs: { ...newDesktop.specs, processor: e.target.value } })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">RAM</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập dung lượng RAM"
                            value={newDesktop.specs?.ram || ""}
                            onChange={(e) =>
                              setNewDesktop({ ...newDesktop, specs: { ...newDesktop.specs, ram: e.target.value } })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Bộ Nhớ</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập dung lượng Bộ nhớ"
                            value={newDesktop.specs?.storage || ""}
                            onChange={(e) =>
                              setNewDesktop({ ...newDesktop, specs: { ...newDesktop.specs, storage: e.target.value } })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Màn hình</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập kích thước màn hình"
                            value={newDesktop.specs?.display || ""}
                            onChange={(e) =>
                              setNewDesktop({ ...newDesktop, specs: { ...newDesktop.specs, display: e.target.value } })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Trạng thái */}
                    <div
                      className="border rounded-lg p-4 mb-4 relative"
                      style={{ position: "relative", padding: "16px", marginBottom: "16px" }}
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
                          marginBottom: "16px"
                        }}
                      >
                        Trạng thái
                      </span>
                      <select
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                        value={newDesktop.status}
                        onChange={(e) => setNewDesktop({ ...newDesktop, status: e.target.value })}
                      >
                        <option value="Active">Đang sử dụng</option>
                        <option value="In Repair">Chờ sửa chữa</option>
                        <option value="Lưu kho">Lưu kho</option>
                      </select>
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
      {showUploadModal && ReactDOM.createPortal(
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-9999"
            style={{ zIndex: 1050 }}>
              <div className="bg-white p-6 rounded-md shadow-md w-1/3 relative z-9999"
              style={{ zIndex: 1050 }}>
                <h2 className="text-2xl font-bold mb-4 text-center text-[#002147]">Cập nhật dữ liệu</h2>
                <form>
                  {/* Input chọn file */}
                  <div className="mb-4">
                    <label className="block text-base font-medium mb-2">Chọn file Excel</label>
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
                      href="/sample-template.xlsx"
                      download
                      className="bg-[#002147] text-white px-4 py-2 rounded-md hover:bg-[#001635]"
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
                          isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-[#002147] hover:bg-[#001635]"
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
      {showEditModal && ReactDOM.createPortal(
            <div
              className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 space-y-6 z-1000"
              style={{ zIndex: 1050 }}
              onClick={() => setShowEditModal(false)}>
              <div
                className="bg-white rounded-lg shadow-lg p-6 w-[50%]"
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
                style={{ zIndex: 1050 }}>
                <h3 className="text-2xl font-semibold mb-8 text-[#002147]">Cập nhật thông tin Desktop</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const payload = {
                        ...editingDesktop,
                        releaseYear: editingDesktop.releaseYear || "",
                        specs: {
                          processor: editingDesktop.specs?.processor || "",
                          ram: editingDesktop.specs?.ram || "",
                          storage: editingDesktop.specs?.storage || "",
                          display: editingDesktop.specs?.display || "",
                        },
                        assigned:
                            editingDesktop.assigned
                              ? editingDesktop.assigned.map((user) => user.value)
                              : selectedDesktop.assigned.map((user) => user.value),
                        };
                      
                        console.log("Payload gửi lên server:", payload);

                      await axios.put(
                        `http://localhost:5001/api/desktops/${editingDesktop._id}`,
                        payload,
                        {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                          },
                        }
                      );
                      setShowEditModal(false);
                      fetchDesktops(); // Cập nhật danh sách sau khi sửa
                      toast.success("Cập nhật desktop thành công!",
                        {
                          className: "toast-succes",
                          progressClassName: "Toastify__progress-bar",
                        }
                      );
                    } catch (error) {
                      console.error("Error updating desktop:", error);
                      toast.error("Không thể cập nhật desktop!",
                        {
                          className: "toast-error",
                          progressClassName: "Toastify__progress-bar",
                        }
                      );
                    }
                  }}
                >
                  {/* Thông tin chung */}
                  <div className="border rounded-lg p-4 mb-4 relative"
                  style={{ position: "relative", padding: "16px", marginBottom: "30px" }}
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
                        <label className="block text-gray-600 font-medium mb-2">Tên thiết bị</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập tên thiết bị"
                          value={editingDesktop.name}
                          onChange={(e) => setEditingDesktop({ ...editingDesktop, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Nhà sản xuất</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập nhà sản xuất"
                          value={editingDesktop.manufacturer}
                          onChange={(e) => setEditingDesktop({ ...editingDesktop, manufacturer: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Serial</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập số serial"
                          value={editingDesktop.serial}
                          onChange={(e) => setEditingDesktop({ ...editingDesktop, serial: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Năm sản xuất</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập năm sản xuất"
                          value={editingDesktop.releaseYear}
                          onChange={(e) => setEditingDesktop({ ...editingDesktop, releaseYear: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cấu hình */}
                  <div className="border rounded-lg p-4 mb-4 relative"
                  style={{ position: "relative", padding: "16px", marginBottom: "30px" }}
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
                        <label className="block text-gray-600 font-medium mb-2">Processor</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập bộ xử lý"
                          value={editingDesktop.specs?.processor || ""}
                          onChange={(e) =>
                            setEditingDesktop({ ...editingDesktop, specs: { ...editingDesktop.specs, processor: e.target.value } })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">RAM</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập dung lượng RAM"
                          value={editingDesktop.specs?.ram || ""}
                          onChange={(e) =>
                            setEditingDesktop({ ...editingDesktop, specs: { ...editingDesktop.specs, ram: e.target.value } })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Bộ Nhớ</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập dung lượng bộ nhớ"
                          value={editingDesktop.specs?.storage || ""}
                          onChange={(e) =>
                            setEditingDesktop({ ...editingDesktop, specs: { ...editingDesktop.specs, storage: e.target.value } })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Màn hình</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập kích thước màn hình"
                          value={editingDesktop.specs?.display || ""}
                          onChange={(e) =>
                            setEditingDesktop({ ...editingDesktop, specs: { ...editingDesktop.specs, display: e.target.value } })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trạng thái */}
                    <div
                      className="border rounded-lg p-4 mb-8 relative"
                      style={{ position: "relative", padding: "16px", marginBottom: "30px" }}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Tình trạng</label>
                          <select
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            value={editingDesktop.status}
                            onChange={(e) => setEditingDesktop({ ...editingDesktop, status: e.target.value })}
                          >
                            <option value="Active">Đang sử dụng</option>
                            <option value="In Repair">Chờ sửa chữa</option>
                            <option value="Lưu kho">Lưu kho</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Người sử dụng</label>
                          <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                                placeholder="Nhập tên người sử dụng"
                                value={editingDesktop.assigned[0]?.label || ""}
                                onChange={(e) => {
                                  const query = e.target.value.toLowerCase();

                                  // Lọc danh sách người dùng phù hợp
                                  const filtered = users.filter((user) =>
                                    user.label.toLowerCase().includes(query)
                                  );

                                  setFilteredUsers(filtered);
                                  setShowSuggestions(true);

                                  // Tạm thời gắn giá trị nhập vào assigned
                                  setEditingDesktop({
                                    ...editingDesktop,
                                    assigned: [{ label: e.target.value, value: null }],
                                  });
                                }}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Đợi người dùng chọn gợi ý
                              />
                          {showSuggestions && filteredUsers.length > 0 && (
                            <ul className="border rounded-lg mt-2 bg-white shadow-lg max-h-40 overflow-y-auto">
                              {filteredUsers.map((user) => (
                                <li
                                  key={user.value}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => {
                                    setEditingDesktop({ ...editingDesktop, assigned: [user] });
                                    setShowSuggestions(false);
                                  }}
                                >
                                  {user.label}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
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
      {showConfirmModal && ReactDOM.createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center"
          style={{ zIndex: 1050 }}>
            <div className="bg-white rounded-lg shadow-lg p-6 w-96" 
                        style={{ zIndex: 1050 }}>
              <h3 className="text-lg text-center font-semibold mb-4 text-[#002147]">Xác nhận xóa</h3>
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa desktop <strong>{desktopToDelete?.name}</strong> không?
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
      {showDetailModal && selectedDesktop && ReactDOM.createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-1000"
          style={{ zIndex: 1050 }}
          onClick={(e) => {
            // Đóng modal nếu người dùng nhấp ra ngoài modal
            if (e.target === e.currentTarget) {
              setSelectedDesktop(null);
            }
          }}
          >
            <div className=" w-3/4 max-w-4xl"
            style={{ zIndex: 1050 }}
            onClick={(e) => e.stopPropagation()}>
              <DesktopProductCard
                desktopData={{
                  ...selectedDesktop,
                  assigned: selectedDesktop?.assigned.map((user) => ({
                    ...user,
                    jobTitle: user.jobTitle || "Không xác định", // Thêm jobTitle
                  })) || [],
                  releaseYear: selectedDesktop.releaseYear || "Không có",
                }}
                onAddRepair={handleAddRepair} // Truyền hàm vào đây
                onDeleteRepair={handleDeleteRepair}
                onCloseModal={() => {
                  setSelectedDesktop(null); // Reset desktop đã chọn
                  setShowDetailModal(false); // Đóng modal
                }} // Truyền hàm đóng modal
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default DesktopTable;