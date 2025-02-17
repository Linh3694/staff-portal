import React from "react";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../config"; // import từ file config


  const LoginPage = () => {
   // **Đăng nhập với Microsoft** - Chuyển hướng sang server
   const handleMicrosoftLogin = () => {
    window.location.href = `${API_URL}/auth/microsoft`;
  };

  return (
    <div className="min-h-screen bg-[#EDEDED]" >
      
      <div className="absolute top-4 left-20 flex flex-col items-start">
        {/* Logo */}
        <div className="flex items-center gap-5 animate-slide-down">
          <img src="/login/wellsping-logo.png" alt="Logo 2" className="w-36 h-20" />
          <img src="/login/happyjourney.png" alt="Logo 1" className="w-32 h-28" />
        </div>

        {/* Tiêu đề 360° WISers */}
        <h1 className="text-6xl font-bold mt-16 ">
          <span className="font-normal" style={{ color: "#2B6478" }}>360°</span>{" "}
          <span style={{ color: "#F05023" }}>W</span>
          <span style={{ color: "#F5AA1E" }}>I</span>
          <span style={{ color: "#009483" }}>S</span>
          <span style={{ color: "#2B6478" }}>ers</span>
        </h1>

        {/* Slogan Warm heart... */}
        <div className="text-2xl text-[#002855] font-medium mt-6">
          <span className="mr-2">Warm heart</span> | 
          <span className="mx-2">Innovation minds</span> | 
          <span className="ml-2">Sharing</span>
        </div>

        {/* Câu slogan bên dưới */}
        <p className="text-[#002855] text-2xl font-light mt-10">
          Đồng hành cùng nhà giáo, thắp sáng niềm say mê công việc! ✨
        </p>
      </div>
     
      
      <div className="absolute top-24 right-32 items-center ">
      <img src="/login/building.svg" alt="Building" />
      </div>
      <div className="w-[400px] fixed bottom-16 left-1/2 transform -translate-x-1/2 animate-slide-up">
        {/* Nút đăng nhập với Microsoft */}
        <button
          onClick={handleMicrosoftLogin}
          className="w-full bg-[#002147] text-white py-3 font-bold rounded-full mb-4 hover:bg-[#1a3a5e] transition-all flex items-center justify-center gap-2"
        >
          <img src="/login/microsoft.svg" alt="Microsoft" className="w-5 h-5 " />
          Đăng nhập với Microsoft
        </button>
      </div>
      <footer className="absolute bottom-4 left-20 text-sm text-gray-600">
            © Copyright 2025 Wellspring International Bilingual Schools. All Rights Reserved.
      </footer>
    </div>
   
  );
};

export default LoginPage;
