import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import ReactDOM from "react-dom";
import "../css/table.css"
import { MdCancel, MdCheckCircle, MdOutlineError } from "react-icons/md";
import Dropdown from "./function/dropdown";


const ToolTable = () => {
        
        const [data, setData] = useState([]); // State cho danh sách Tool
        const [users, setUsers] = useState([]); // Lưu danh sách users từ API
        const [showAddModal, setShowAddModal] = useState(false); // State để điều khiển modal 
        const [newTool, setNewTool] = useState({
            name: "",
            manufacturer: "",
            serial: "",
            assigned: [],
            status: "Active",
            releaseYear: "",
          }); 
        const [editingTool, setEditingTool] = useState({
            name: "",
            manufacturer: "",
            serial: "",
            assigned: [],
            status: "Active",
            releaseYear: "",
          });
        const [showEditModal, setShowEditModal] = useState(false);
        const [filteredUsers, setFilteredUsers] = useState([]); // Lưu danh sách gợi ý tạm thời
        const [showSuggestions, setShowSuggestions] = useState(false); // Kiểm soát hiển thị gợi ý
        const [showConfirmModal, setShowConfirmModal] = useState(false);
        const [toolToDelete, setToolToDelete] = useState(null);
        const [selectedTool, setSelectedTool] = useState(null);
        const [showDetailModal, setShowDetailModal] = useState(false); // Kiểm soát hiển thị modal
        const [showUploadModal, setShowUploadModal] = useState(false);
        const [parsedData, setParsedData] = useState([]);
        const [isUploading, setIsUploading] = useState(false);
        const [showDropdown, setShowDropdown] = useState(false);
        const [selectedOption, setSelectedOption] = useState("Tất cả trạng thái");
        const [selectedDepartment, setSelectedDepartment] = useState("Tất cả phòng ban");
        const [selectedManufacturer, setSelectedManufacturer] = useState("Tất cả nhà sản xuất");
        const [selectedYear, setSelectedYear] = useState("Tất cả năm sản xuất");

        

        const statusLabels = {
          Active: "Đang sử dụng",
                  "Standby": "Chờ Cấp Phát",
                  "Broken": "Hỏng",

          default: "Không xác định",
        };

      
        const handleDeleteRepair = async (toolId, repairId) => {
          if (!repairId) {
            return Promise.reject("repairId không hợp lệ");
          }
        
          try {
            const token = localStorage.getItem("authToken");
            const response = await axios.delete(
              `/api/tool/${toolId}/repairs/${repairId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
        
            if (response.status === 200) {
              setSelectedTool((prevTool) => ({
                ...prevTool,
                repairs: prevTool.repairs.filter((repair) => repair._id !== repairId),
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
                console.log("Gửi yêu cầu tới:", `/api/tool/${selectedTool._id}/repairs`);
                console.log("Payload:", repairData);
                console.log("Selected tool:", selectedTool);
                console.log("Payload:", {
                  description: repairData.description,
                  date: repairData.date || new Date().toISOString(),
                  updatedBy: currentUser.fullname,
                });
                console.log("Token:", localStorage.getItem("authToken"));
                const response = await fetch(`/api/tool/${selectedTool._id}/repairs`, {
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
            
                setSelectedTool((prevTool) => ({
                  ...prevTool,
                  repairs: [updatedRepair, ...(prevTool.repairs || [])], // Thêm nhật ký sửa chữa mới vào đầu danh sách
                }));
            
                console.log("Repair log updated successfully:", updatedRepair);
              } catch (error) {
                console.error("Error adding repair log:", error);
              }
          };
          
          console.log("Props truyền vào ToolProductCard:", {
            toolData: selectedTool,
            onDeleteRepair: handleDeleteRepair,
          });

          // <laptopProductCard
          //   laptopData={{
          //     ...selectedLaptop,
          //     repairs: selectedLaptop?.repairs || [], // Đảm bảo repairs là mảng
          //   }}
          //   onAddRepair={(repair) => {
          //           // Gọi API thêm nhật ký sửa chữa
          //           fetch(`http://localhost:5001/api/laptops/${selectedLaptop._id}/repairs`, {
          //             method: "POST",
          //             headers: { "Content-Type": "application/json" },
          //             body: JSON.stringify(repair),
          //           })
          //             .then((response) => {
          //               if (response.ok) {
          //                 console.log("Repair saved successfully");
                        
          //               } else {
          //                 console.error("Failed to save repair");                         
          //               }
          //             })
          //             .catch((error) => console.error("Error saving repair:", error));
          //      }}
          //   currentUser={JSON.parse(localStorage.getItem("currentUser"))}
          //   onDeleteRepair={handleDeleteRepair}
          //   />
          
          const handleViewDetails = (tool) => {
            setSelectedTool(tool); // Lưu thiết bị được chọn
            setShowDetailModal(true); // Hiển thị modal
          };

          // Hàm gọi API để lấy danh sách tool
          const fetchtool = async () => {
            try {
              const token = localStorage.getItem("authToken");
              const response = await axios.get("/api/tool", {
                headers: { Authorization: `Bearer ${token}` },
              });

              // Map dữ liệu `assigned` để phù hợp với định dạng giao diện
              const tool = response.data.map((tool) => ({
                ...tool,
                assigned: tool.assigned.map((user) => ({
                  value: user._id,
                  label: user.name,
                  title: user.jobTitle || "Không xác định",
                  departmentName: user.department || "Không xác định",
                })),
              }));
              setData(tool);
              console.log("tool fetched:", response.data); // Log dữ liệu
            } catch (error) {
              console.error("Error fetching tool:", error);
            }
          };

          // Lấy danh sách users
       
          const fetchUsers = async () => {
            try {
              const token = localStorage.getItem("authToken");
              const response = await axios.get("/api/users", {
                headers: { Authorization: `Bearer ${token}` },
              });
              console.log("Dữ liệu từ API users:", response.data);

              if (response.data && Array.isArray(response.data)) {
                setUsers(
                  response.data.map((user) => ({
                    value: user._id,
                    label: user.fullname,
                    title: user.jobTitle || "Không xác định",
                    departmentName: user.department || "Unknown",
                    emailAddress : user.email,
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
            if (!toolToDelete) return;

              try {
                await axios.delete(`/api/tool/${toolToDelete._id}`, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Thêm token ở đây
                  },
                }
                );
                fetchtool(); // Cập nhật lại danh sách sau khi xóa
                toast.success("tool đã được xóa!",
                  {
                    className: "toast-success",
                  }
                );
              } catch (error) {
                console.error("Error deleting tool:", error);
                toast.error("Có lỗi xảy ra khi xóa tool!",
                  {
                    className: "toast-error",
                  }
                );
              } finally {
                setShowConfirmModal(false); // Đóng modal
                setToolToDelete(null); // Reset Tool cần xóa
              }
          };

          const handleEdit = (item) => {
              setEditingTool({
                ...item,
                releaseYear: item.releaseYear || "", // Đảm bảo có giá trị mặc định cho Năm sản xuất
                
                assigned: Array.isArray(item.assigned)
                  ? item.assigned.map((user) => ({
                      value: user.value || user._id, // Đảm bảo định dạng user
                      label: user.label || user.fullname,
                    }))
                  : [],
              });
              setShowEditModal(true); // Hiển thị modal chỉnh sửa
          };

          const confirmDelete = (tool) => {
            setToolToDelete(tool); // Đặt tool cần xóa
            setShowConfirmModal(true); // Hiển thị modal xác nhận
          };
          
          const handleAddTool = async (e) => {
            e.preventDefault();
          
            try {
              // Kiểm tra dữ liệu nhập
              if (!newTool.name || !newTool.serial || !newTool.status) {
                toast.error("Vui lòng điền đầy đủ thông tin!",
                  {
                    className: "toast-error",
                  }
                );
                return;
              }
          
              // Chuẩn bị payload
              const payload = {
                ...newTool,
                releaseYear: newTool.releaseYear || "",
                
                assigned: newTool.assigned?.map((user) => user.value) || [], // Xử lý danh sách người dùng
              };
        
          
              // Gửi dữ liệu lên API
              const response = await axios.post("/api/tool", payload, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Đảm bảo token được gửi kèm
                },
              });
          
              if (response.status === 201) {
                toast.success("Thêm tool thành công!",
                  {
                    className: "toast-success",
                    progressClassName: "Toastify__progress-bar",
                  }
                );
          
                // Cập nhật danh sách tool và đóng modal
                fetchtool();
                setShowAddModal(false);
                setNewTool({
                  name: "",
                  manufacturer: "",
                  serial: "",
                  releaseYear: "",
                  assigned: [],
                  status: "Active",
                });
              }
            } catch (error) {
              console.error("Lỗi khi thêm Tool:", error);
              toast.error("Có lỗi xảy ra khi thêm Tool. Vui lòng thử lại!",
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
                        if (!row["Tên Thiết Bị (name)"] || !row["Serial (serial)"]) {
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
                          serial: row["Serial (serial)"] || "",
                          status: row["Trạng Thái (status)"] === "Đang sử dụng"
                                ? "Active"
                                : row["Trạng Thái (status)"] === "Chờ Cấp Phát"
                                ? "Standby"
                                : row["Trạng Thái (status)"] === "Hỏng"
                                ? "Broken"
                                : "Không xác định",
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
            toast.error("Không có dữ liệu để upload. Vui lòng kiểm tra file Excel!");
            return;
          }
        
          // Kiểm tra serial trùng lặp trong file Excel
          const serials = parsedData.map((item) => item.serial);
          const duplicateSerials = serials.filter(
            (serial, index) => serials.indexOf(serial) !== index
          );
        
          if (duplicateSerials.length > 0) {
            toast.error(`Serial trùng lặp trong file: ${duplicateSerials.join(", ")}`);
            return;
          }
        
          try {
            console.log("Dữ liệu gửi lên (Tool):", parsedData);
        
            const response = await axios.post(
              "/api/tool/bulk-upload",
              { tools: parsedData },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
              }
            );
        
            if (response.status === 201) {
              toast.success("Dữ liệu phụ kiện đã được tải lên thành công!");
              fetchtool(); // Làm mới danh sách
              setShowUploadModal(false);
            }
          } catch (error) {
            console.error("Error uploading Tool data:", error.response?.data || error);
            toast.error("Đã xảy ra lỗi khi tải dữ liệu lên. Vui lòng thử lại!");
          }
        };

          useEffect(() => {
            const fetchData = async () => {
              try {
                await fetchtool();
                await fetchUsers();
              } catch (error) {
                }
            };
            fetchData();
            }, []);

  return (  
    <div className="w-full h-full px-6 pb-6 sm:overflow-x-auto rounded-2xl">
        {/* Header */}
        <div className="flex flex-col justify-between items-start mb-4">
              {/* Search Input */}
                    <div className="relative w-full mb-4">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                          type="text"
                          placeholder="Tìm kiếm tool..."
                          className="pl-10 pr-4 py-2 border rounded-md w-100 focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          onChange={(e) => {
                            const query = e.target.value ? e.target.value.toLowerCase() : "";
                            if (query === "") {
                              fetchtool();
                            } else {
                              const filteredData = data.filter((item) =>
                                item.name?.toLowerCase().includes(query) || // Dùng optional chaining để tránh undefined
                                item.manufacturer?.toLowerCase().includes(query) ||
                                item.serial?.toLowerCase().includes(query)
                              );
                              setData(filteredData);
                            }
                          }}
                        />
                      </div>
           
                <div className="flex items-center justify-between w-full space-x-4">
                     <div className="flex space-x-4">
                     <Dropdown
                          button={
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-50 focus:ring-2 focus:ring-[#002147]">
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
                                  fetchtool(); // Lấy lại toàn bộ dữ liệu
                                  setShowDropdown(false); // Đóng dropdown
                                }}
                              >
                                Tất cả trạng thái
                              </button>

                              {/* Các trạng thái */}
                              {[
                                { value: "Active", label: "Đang sử dụng" },
                                { value: "Standby", label: "Chờ Cấp Phát" },
                                { value: "Broken", label: "Hỏng" },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                                  onClick={() => {
                                    setSelectedOption(option.label);
                                    setData(data.filter((item) => item.status === option.value)); // Lọc theo trạng thái
                                    setShowDropdown(false); // Đóng dropdown
                                  }}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          }
                        />
                        </div>
                             {/* Các nút hành động */}
                                <div className="flex space-x-2">
                                        <button
                                          onClick={() => {
                                            setNewTool({
                                              name: "",
                                              manufacturer: "",
                                              serial: "",
                                              assigned: [],
                                              status: "Active",
                                            });
                                            setShowAddModal(true);
                                          }}
                                          className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-md hover:bg-[#001635]"
                                        >
                                          Thêm mới
                                        </button>
                                        <button
                                          className="bg-[#FF5733] text-white text-sm font-bold px-3 py-2 rounded-lg shadow-md hover:bg-[#cc4529]"
                                          onClick={() => setShowUploadModal(true)}
                                        >
                                          Upload
                                        </button>
                               
                                        </div>
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
                    {console.log("Item Object:", item)}
                    {console.log("Assigned Users:", item.assigned)}
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
                      {Array.isArray(item.assigned) && item.assigned.length > 0 ? (
                      item.assigned.map((user) => (
                        <div key={user.value || user._id}>
                          <p className="font-bold">{user.label}</p>
                          <span className="italic text-gray-400">
                            {user.departmentName ? user.departmentName : "SS"}
                          </span>
                          {console.log("User Object:", user)}
                        {console.log("User Department Name:", user.departmentName)}
                        </div>
                      ))
                    ) : (
                      "Chưa bàn giao"
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
                  <h3 className="text-2xl font-bold mb-6 text-[#002147]">Thêm mới Tool</h3>
                  <form onSubmit={handleAddTool}>
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
                            value={newTool.name}
                            onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Nhà sản xuất</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập nhà sản xuất"
                            value={newTool.manufacturer}
                            onChange={(e) => setNewTool({ ...newTool, manufacturer: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Serial</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập số serial"
                            value={newTool.serial}
                            onChange={(e) => setNewTool({ ...newTool, serial: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Năm sản xuất</label>
                          <input
                            type="number"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                            placeholder="Nhập năm sản xuất"
                            value={newTool.releaseYear}
                            onChange={(e) => setNewTool({ ...newTool, releaseYear: e.target.value })}
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
                        value={newTool.status}
                        onChange={(e) => setNewTool({ ...newTool, status: e.target.value })}
                      >
                        <option value="Active">Đang sử dụng</option>
                        <option value="Standby">Chờ Cấp Phát</option>
                        <option value="Broken">Hỏng</option>
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
                <h3 className="text-2xl font-semibold mb-8 text-[#002147]">Cập nhật thông tin Tool</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const payload = {
                        ...editingTool,
                        releaseYear: editingTool.releaseYear || "",
                        assigned:
                            editingTool.assigned
                              ? editingTool.assigned.map((user) => user.value)
                              : selectedTool.assigned.map((user) => user.value),
                        };
                      
                        console.log("Payload gửi lên server:", payload);

                      await axios.put(
                        `/api/tool/${editingTool._id}`,
                        payload,
                        {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                          },
                        }
                      );
                      setShowEditModal(false);
                      fetchtool(); // Cập nhật danh sách sau khi sửa
                      toast.success("Cập nhật tool thành công!",
                        {
                          className: "toast-succes",
                          progressClassName: "Toastify__progress-bar",
                        }
                      );
                    } catch (error) {
                      console.error("Error updating tool:", error);
                      toast.error("Không thể cập nhật tool!",
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
                          value={editingTool.name}
                          onChange={(e) => setEditingTool({ ...editingTool, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Nhà sản xuất</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập nhà sản xuất"
                          value={editingTool.manufacturer}
                          onChange={(e) => setEditingTool({ ...editingTool, manufacturer: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Serial</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập số serial"
                          value={editingTool.serial}
                          onChange={(e) => setEditingTool({ ...editingTool, serial: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-medium mb-2">Năm sản xuất</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                          placeholder="Nhập năm sản xuất"
                          value={editingTool.releaseYear}
                          onChange={(e) => setEditingTool({ ...editingTool, releaseYear: e.target.value })}
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
                            value={editingTool.status}
                            onChange={(e) => setEditingTool({ ...editingTool, status: e.target.value })}
                          >
                            <option value="Active">Đang sử dụng</option>
                            <option value="Standby">Chờ Cấp Phát</option>
                            <option value="Broken">Hỏng</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-600 font-medium mb-2">Người sử dụng</label>
                          <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002147]"
                                placeholder="Nhập tên người sử dụng"
                                value={editingTool.assigned[0]?.label || ""}
                                onChange={(e) => {
                                  const query = e.target.value.toLowerCase();

                                  // Lọc danh sách người dùng phù hợp
                                  const filtered = users.filter((user) =>
                                    user.label.toLowerCase().includes(query) ||
                                    user.emailAddress.toLowerCase().includes(query)
                                  );

                                  setFilteredUsers(filtered);
                                  setShowSuggestions(true);

                                  // Tạm thời gắn giá trị nhập vào assigned
                                  setEditingTool({
                                    ...editingTool,
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
                                    setEditingTool({ ...editingTool, assigned: [user] });
                                    setShowSuggestions(false);
                                  }}
                                >
                                 <span className="font-bold">{user.label}</span>
                                  <br />
                                  <span className="italic text-gray-500">{user.emailAddress}</span>
                                </li>
                              ))}
                              {filteredUsers.length === 0 && (
                                <li className="px-4 py-2 text-gray-500 italic">Không tìm thấy kết quả</li>
                              )}
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
                Bạn có chắc chắn muốn xóa Tool <strong>{toolToDelete?.name}</strong> không?
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
      {/* {showDetailModal && selectedtool && ReactDOM.createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-1000"
          style={{ zIndex: 1050 }}
          onClick={(e) => {
            // Đóng modal nếu người dùng nhấp ra ngoài modal
            if (e.target === e.currentTarget) {
              setSelectedtool(null);
            }
          }}
          >
            <div className=" w-3/4 max-w-4xl"
            style={{ zIndex: 1050 }}
            onClick={(e) => e.stopPropagation()}>
              <LaptopProductCard
                laptopData={{
                  ...selectedLaptop,
                  assigned: selectedLaptop?.assigned.map((user) => ({
                    ...user,
                    jobTitle: user.jobTitle || "Không xác định", // Thêm jobTitle
                  })) || [],
                  releaseYear: selectedLaptop.releaseYear || "Không có",
                }}
                onAddRepair={handleAddRepair} // Truyền hàm vào đây
                onDeleteRepair={handleDeleteRepair}
                onCloseModal={() => {
                  setSelectedLaptop(null); // Reset tool đã chọn
                  setShowDetailModal(false); // Đóng modal
                }} // Truyền hàm đóng modal
              />
            </div>
          </div>,
          document.body
        )} */}
    </div>
  );
};

export default ToolTable;