import { useState, useEffect } from "react";
import { API_URL } from "../../config"; // import từ file config
import Widget from "./Widget"; // Import component Widget
import { MdComputer, MdTv, MdPrint, MdVideocam, MdBuild } from "react-icons/md";

const DashboardInventory = () => {
  const [deviceCounts, setDeviceCounts] = useState({
    laptops: 0,
    monitors: 0,
    printers: 0,
    projectors: 0,
    tools: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
        try {
          const token = localStorage.getItem("authToken");
          const headers = { Authorization: `Bearer ${token}` };
      
          const endpoints = [
            { key: "laptops", url: `${API_URL}/laptops`, dataKey: "populatedLaptops" },
            { key: "monitors", url: `${API_URL}/monitors`, dataKey: "populatedMonitors" },
            { key: "printers", url: `${API_URL}/printers`, dataKey: "populatedPrinters" },
            { key: "projectors", url: `${API_URL}/projectors`, dataKey: "populatedProjectors" },
            { key: "tools", url: `${API_URL}/tools`, dataKey: "populatedTools" },
          ];
      
          const responses = await Promise.all(
            endpoints.map((endpoint) =>
              fetch(endpoint.url, { headers }).then((res) => res.json())
            )
          );
      
          console.log("Fetched Data (parsed JSON):", responses); // Debug dữ liệu
      
          const updatedCounts = {};
          responses.forEach((data, index) => {
            const key = endpoints[index].dataKey;
            updatedCounts[endpoints[index].key] = Array.isArray(data[key]) ? data[key].length : 0;
          });
      
          setDeviceCounts(updatedCounts);
        } catch (error) {
          console.error("Lỗi khi tải dữ liệu:", error);
        }
      };
      
      

    fetchData();
  }, []);

  const devices = [
    { name: "Laptop", count: deviceCounts.laptops, icon: <MdComputer />, bgColor: "bg-white" },
    { name: "Monitor", count: deviceCounts.monitors, icon: <MdTv />, bgColor: "bg-white" },
    { name: "Printer", count: deviceCounts.printers, icon: <MdPrint />, bgColor: "bg-white" },
    { name: "Projector", count: deviceCounts.projectors, icon: <MdVideocam />, bgColor: "bg-white" },
    { name: "Tools", count: deviceCounts.tools, icon: <MdBuild />, bgColor: "bg-white" },
  ];

  return (
    <div className="p-6 min-h-screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {devices.map((device, index) => (
          <Widget
            key={index}
            icon={device.icon}
            title={device.name}
            subtitle={device.count}
            bgColor={device.bgColor}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardInventory;
