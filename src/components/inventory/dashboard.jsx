import { useState, useEffect } from "react";
import { API_URL } from "../../config"; // import từ file config
import Widget from "./Widget"; // Import component Widget
import { MdComputer, MdTv, MdPrint, MdVideocam, MdBuild } from "react-icons/md";
import LaptopDashboardDetail from "./LaptopDashboardDetail"; // (Mới thêm)
import MonitorDashboardDetail from "./MonitorDashboardDetail"; // (Mới thêm)
import PrinterDashboardDetail from "./PrinterDashboardDetail"; // (Mới thêm)
import ProjectorDashboardDetail from "./ProjectorDashboardDetail"; // (Mới thêm)
import ToolsDashboardDetail from "./ToolsDashboardDetail"; // (Mới thêm)

const DashboardInventory = () => {
  const [deviceCounts, setDeviceCounts] = useState({
    laptops: 0,
    monitors: 0,
    printers: 0,
    projectors: 0,
    tools: 0,
  });
  // Thêm state điều khiển hiển thị chi tiết thiết bị
  const [selectedDevice, setSelectedDevice] = useState("Laptop");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers = { Authorization: `Bearer ${token}` };

        const endpoints = [
          {
            key: "laptops",
            url: `${API_URL}/laptops`,
            dataKey: "populatedLaptops",
          },
          {
            key: "monitors",
            url: `${API_URL}/monitors`,
            dataKey: "populatedMonitors",
          },
          {
            key: "printers",
            url: `${API_URL}/printers`,
            dataKey: "populatedPrinters",
          },
          {
            key: "projectors",
            url: `${API_URL}/projectors`,
            dataKey: "populatedProjectors",
          },
          {
            key: "tools",
            url: `${API_URL}/tools`,
            dataKey: "populatedTools",
          },
        ];

        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            fetch(endpoint.url, { headers }).then((res) => res.json())
          )
        );
        const updatedCounts = {};
        responses.forEach((data, index) => {
          const key = endpoints[index].dataKey;
          updatedCounts[endpoints[index].key] = Array.isArray(data[key])
            ? data[key].length
            : 0;
        });

        setDeviceCounts(updatedCounts);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      }
    };

    fetchData();
  }, []);

  const devices = [
    {
      name: "Laptop",
      count: deviceCounts.laptops,
      icon: <MdComputer />,
      bgColor: selectedDevice === "Laptop" ? "bg-gray-200" : "bg-white",
      onClick: () => setSelectedDevice("Laptop"),
    },
    {
      name: "Monitor",
      count: deviceCounts.monitors,
      icon: <MdTv />,
      bgColor: selectedDevice === "Monitor" ? "bg-gray-200" : "bg-white",
      onClick: () => setSelectedDevice("Monitor"),
    },
    {
      name: "Printer",
      count: deviceCounts.printers,
      icon: <MdPrint />,
      bgColor: selectedDevice === "Printer" ? "bg-gray-200" : "bg-white",
      onClick: () => setSelectedDevice("Printer"),
    },
    {
      name: "Projector",
      count: deviceCounts.projectors,
      icon: <MdVideocam />,
      bgColor: selectedDevice === "Projector" ? "bg-gray-200" : "bg-white",
      onClick: () => setSelectedDevice("Projector"),
    },
    {
      name: "Tools",
      count: deviceCounts.tools,
      icon: <MdBuild />,
      bgColor: selectedDevice === "Tools" ? "bg-gray-200" : "bg-white",
      onClick: () => setSelectedDevice("Tools"),
    },
  ];

  return (
    <div className="p-6 min-h-screen">
      {/* Grid hiển thị 5 thẻ thiết bị */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {devices.map((device, index) => (
          <div key={index} onClick={device.onClick}>
            <Widget
              icon={device.icon}
              title={device.name}
              subtitle={device.count}
              bgColor={device.bgColor}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 p-8 rounded-2xl bg-white">
        {selectedDevice === "Laptop" && <LaptopDashboardDetail />}
        {selectedDevice === "Monitor" && <MonitorDashboardDetail />}
        {selectedDevice === "Printer" && <PrinterDashboardDetail />}
        {selectedDevice === "Projector" && <ProjectorDashboardDetail />}
        {selectedDevice === "Tools" && <ToolsDashboardDetail />}
      </div>
    </div>
  );
};

export default DashboardInventory;
