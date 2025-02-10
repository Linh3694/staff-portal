import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Ticket from "./pages/Ticket";
import AuthForm from "./pages/Events/nha_la_tet_lon_trong_tim/AuthForm";
import Event from "./pages/Events/nha_la_tet_lon_trong_tim/Event";
import DetailEvent from "./pages/Events/nha_la_tet_lon_trong_tim/detailEvent";
import EventManagement from "./pages/Events/nha_la_tet_lon_trong_tim/EventManagement";
import MicrosoftAuthSuccess from "./pages/MicrosoftAuthSuccess";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./i18n";

// PublicRoute: Nếu người dùng đã đăng nhập, chuyển hướng về Dashboard
function PublicRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem("authToken");
  const userRole = localStorage.getItem("role");

  // Chỉ chuyển hướng nếu user đã đăng nhập và có role hợp lệ
  if (isAuthenticated && ["admin", "superadmin", "technical"].includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// RequireAuth: Chỉ cho phép truy cập các trang bảo vệ nếu đã đăng nhập (và nếu cần, có role hợp lệ)
function RequireAuth({ children, allowedRoles }) {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem("authToken");
  const userRole = localStorage.getItem("role");

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Thay vì chuyển hướng về /login, bạn có thể:
    // - Hiển thị một trang thông báo lỗi,
    // - Hoặc xóa thông tin đăng nhập (logout) rồi chuyển hướng.
    // Ví dụ, chuyển hướng về một trang NotAuthorized:
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}

// RequireEventAuth: Dành cho các trang Event (nếu cần)
function RequireEventAuth() {
  const location = useLocation();
  return <Navigate to="/auth" replace state={{ from: location }} />;
}

function App() {
  const [isEventAuthenticated, setIsEventAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

  useEffect(() => {
    const eventAuth = localStorage.getItem("eventAuth") === "true";
    setIsEventAuthenticated(eventAuth);
  }, []);  // <-- Dependency array ngăn vòng lặp vô hạn

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
        style={{ zIndex: 1200 }}
      />
      <Router>
        <Routes>
          {/* Trang Login */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Trang Microsoft Auth Success (sau khi đăng nhập Microsoft) */}
          <Route path="/auth/microsoft/success" element={<MicrosoftAuthSuccess />} />

          {/* Trang Dashboard - Chỉ cho phép người dùng đã đăng nhập với role phù hợp */}
          <Route path="/dashboard/*" element={
            <RequireAuth allowedRoles={["admin", "superadmin", "technical"]}>
              <Dashboard />
            </RequireAuth>
          } />

          {/* Trang Ticket - Yêu cầu đăng nhập */}
          <Route
            path="/ticket"
            element={
              <RequireAuth>
                <Ticket />
              </RequireAuth>
            }
          />

          {/* Trang Auth dành cho Event */}
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
            element={isEventAuthenticated ? <DetailEvent /> : <RequireEventAuth />}
          />

          {/* Trang quản lý Event */}
          <Route
            path="/event-management"
            element={isEventAuthenticated ? <EventManagement /> : <Navigate to="/auth" />}
          />

          {/* Default route: Nếu truy cập URL không xác định, chuyển về trang Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;