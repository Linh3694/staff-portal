import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AdminPage from "./pages/AdminPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ITProductCard from "./components/productcard/laptopProductCard";
import LaptopTable from "./components/LaptopTable";
import Profile from "./components/Profile";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css';


function App() {

  const showSuccessToast = () => {
    toast.success("Thành công! Dữ liệu đã được lưu.", {
      className: "toast-success",
    });
  };

  const showErrorToast = () => {
    toast.error("Lỗi! Không thể lưu dữ liệu.", {
      className: "toast-error",
    });
  };
  return (
    <div>
   <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 50 }} // Đảm bảo toast không bị che bởi header
      />
    <Router>
      <Routes>
        {/* Trang Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Trang Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Trang IT Product Card */}
        <Route
          path="/itproductcard/:id"
          element={<ITProductCard />}
        />
        
        {/* Trang Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Trang profile */}
        <Route path="/profile" element={<Profile />} />


        {/* Điều hướng mặc định */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
    </div>
  );
  
}

export default App;