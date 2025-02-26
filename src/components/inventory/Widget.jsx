import React from "react";

const Widget = ({ icon, title, subtitle, bgColor }) => {
  return (
    <div
      className={`p-4 rounded-2xl flex items-center ${bgColor}`}
    >
      <div className="w-12 h-12 p-2 bg-gray-200 rounded-full flex justify-center items-center">
        {React.cloneElement(icon, { className: "w-7 h-7 text-[#FF5733]" })}
      </div>
      <div className="ml-4">
        <p className="text-gray-500 font-semibold text-xs">{title}</p>
        <p className="text-[#002147] font-bold text-lg">{subtitle}</p>
      </div>
    </div>
  );
};

export default Widget;
