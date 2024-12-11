import React from "react";

const PrinterTable = ({ data = [] }) => {
  
  return (
    <table className="min-w-full bg-white rounded-lg shadow-md">
      <thead>
        <tr>
          <th className="px-4 py-2 text-left text-gray-600">Tên Thiết Bị</th>
          <th className="px-4 py-2 text-left text-gray-600">Nhà sản xuất</th>
          <th className="px-4 py-2 text-left text-gray-600">Serial</th>
          <th className="px-4 py-2 text-left text-gray-600">Vị trí</th>
          <th className="px-4 py-2 text-left text-gray-600">IP</th>
          <th className="px-4 py-2 text-left text-gray-600">Đổ mực</th>
          <th className="px-4 py-2 text-left text-gray-600">Trạng thái</th>
        </tr>
      </thead>
      <tbody>
       {data.length > 0 ? (
            data.map((item) => (
          <tr key={item.id} className="border-t">
            <td className="px-4 py-2">{item.name}</td>
            <td className="px-4 py-2">{item.manufacturer}</td>
            <td className="px-4 py-2">{item.serial}</td>
            <td className="px-4 py-2">{item.location}</td>
            <td className="px-4 py-2">{item.ip}</td>
            <td className="px-4 py-2">{item.refillDate}</td>
            <td className="px-4 py-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  item.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : item.status === "In Repair"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {item.status === "Active"
                  ? "Đang sử dụng"
                  : item.status === "In Repair"
                  ? "Chờ sửa chữa"
                  : "Không xác định"}
              </span>
            </td>
          </tr>
            ))
      ) : (
        <tr>
          <td colSpan="6" className="px-4 py-2 text-center">
            Không có dữ liệu
          </td>
        </tr>
      )}

      </tbody>
    </table>
  );
};

export default PrinterTable;