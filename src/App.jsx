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
import MicrosoftAuthSuccess from "./components/MicrosoftAuthSuccess";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./i18n";
import FlipViewPage from "./pages/FlipViewPage";
import HallofFame from "./pages/HallOfFame-homepage";
import HallOfFamePublicPage from "./pages/HallOfFame-detail";
import Library from "./pages/Library";

// PublicRoute: Nếu người dùng đã đăng nhập, chuyển hướng về Dashboard
function PublicRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem("authToken");
  const userRole = localStorage.getItem("role");

  // Chỉ chuyển hướng nếu user đã đăng nhập và có role hợp lệ
  if (
    isAuthenticated &&
    [
      "admin",
      "superadmin",
      "technical",
      "marcom",
      "hr",
      "bos",
      "admission",
    ].includes(userRole)
  ) {
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
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
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
  }, []); // <-- Dependency array ngăn vòng lặp vô hạn

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
          <Route path="/hall-of-honor" element={<HallofFame />} />
          <Route
            path="/hall-of-honor/detail"
            element={<HallOfFamePublicPage />}
          />
          <Route path="/library" element={<Library />} />
          <Route path="/:customName" element={<FlipViewPage />} />
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
          <Route
            path="/auth/microsoft/success"
            element={<MicrosoftAuthSuccess />}
          />
          {/* Trang Dashboard - Chỉ cho phép người dùng đã đăng nhập với role phù hợp */}
          <Route
            path="/dashboard/*"
            element={
              <RequireAuth
                allowedRoles={[
                  "admin",
                  "superadmin",
                  "technical",
                  "marcom",
                  "hr",
                  "bos",
                  "admission",
                ]}
              >
                <Dashboard />
              </RequireAuth>
            }
          />
          {/* Default route: Nếu truy cập URL không xác định, chuyển về trang Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
