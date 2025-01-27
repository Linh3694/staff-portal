import {React, useEffect, useState} from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Ticket from './pages/Ticket';
import AuthForm from "./pages/Events/nha_la_tet_lon_trong_tim/AuthForm";
import Event from "./pages/Events/nha_la_tet_lon_trong_tim/Event";
import DetailEvent from "./pages/Events/nha_la_tet_lon_trong_tim/detailEvent";
import EventManagement from "./pages/Events/nha_la_tet_lon_trong_tim/EventManagement";
import "./i18n";


function RequireEventAuth() {
  const location = useLocation();   // Lấy URL đang truy cập
  return (
    <Navigate
      to="/auth"
      replace
      state={{ from: location }}   // Gửi location này sang AuthForm
    />
  );
}

function App() {
  const isAuthenticated = !!localStorage.getItem("authToken"); // Kiểm tra trạng thái đăng nhập
  const [isEventAuthenticated, setIsEventAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

useEffect(() => {
  const role = localStorage.getItem("role"); // Lấy role từ localStorage
  setUserRole(role);
}, []);

  useEffect(() => {
    const eventAuth = localStorage.getItem("eventAuth") === "true";
    setIsEventAuthenticated(eventAuth); // Đồng bộ trạng thái với localStorage
    console.log("isEventAuthenticated on mount:", eventAuth);
  }, []);

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
        style={{ zIndex: 1200 }} // Đảm bảo toast không bị che bởi header
      />
      <Router>
        <Routes>
          {/* Trang Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Trang Dashboard (yêu cầu đăng nhập) */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated && ["admin", "superadmin", "technical"].includes(userRole) ? (
                <Dashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Trang Ticket (yêu cầu đăng nhập) */}
          <Route
            path="/ticket"
            element={isAuthenticated ? <Ticket /> : <Navigate to="/login" />}
          />

          {/* Trang Auth dành riêng cho Event */}
          <Route
            path="/auth"
             element={<AuthForm setIsEventAuthenticated={setIsEventAuthenticated} />}
          />

          {/* Trang Event (yêu cầu xác thực riêng) */}
          <Route
            path="/event_tet2025"
            element={
              isEventAuthenticated ? (
                <Event isEventAuthenticated={isEventAuthenticated} />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />

          {/* Trang chi tiết Event */}
          <Route
            path="/event_tet2025/:slug"
            element={
              isEventAuthenticated
                ? <DetailEvent />
                : // chuyển hướng kèm state là { from: currentLocation }
                  <RequireEventAuth />
            }
          />

          <Route path="/event-management" element={isEventAuthenticated ? <EventManagement /> : <Navigate to="/auth" />} /> {/* ✅ Route mới */}


          {/* Điều hướng mặc định */}
          <Route path="*" element={<Navigate to="/event_tet2025" />} />
        </Routes>
      </Router>
    </div>
  );

}

export default App;