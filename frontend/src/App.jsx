import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import LoginPage from "./features/Auth/LoginPage";
import Dashboard from "./features/Dashboard/Dashboard";
import MicrosoftAuthSuccess from "./features/Auth/MicrosoftAuthSuccess";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./core/i18n";
import FlipViewPage from "./features/FlipPage/FlipViewPage";
import HallofFame from "./features/HallOfHonor/HallOfFame-homepage";
import HallOfFamePublicPage from "./features/HallOfHonor/HallOfFame-detail";
import Library from "./features/Library/Library";
import Admission from "./features/Admission/Admission";
import LoginAdmission from "./features/Auth/LoginAdmission";
import { AuthProvider } from "./shared/contexts/AuthContext";



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



// RequireAdmissionAuth: Kiểm tra đăng nhập đặc biệt cho trang Admission
function RequireAdmissionAuth({ children }) {
  const location = useLocation();
  const isAdmissionAuthenticated = !!localStorage.getItem("admissionAuth");

  if (!isAdmissionAuthenticated) {
    return <Navigate to="/login-admission" state={{ from: location }} replace />;
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
    <AuthProvider>
      <div>
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
        />
        <Router>
          <Routes>
            <Route path="/hall-of-honor" element={<HallofFame />} />
            <Route path="/hall-of-honor/detail/:category" element={<HallOfFamePublicPage />} />
            <Route path="/hall-of-honor/detail/:category/student/:recordId/:studentId" element={<HallOfFamePublicPage />} />
            <Route path="/hall-of-honor/detail/:category/class/:recordId/:classId" element={<HallOfFamePublicPage />} />
            <Route
              path="/hall-of-honor/detail"
              element={<Navigate to="/hall-of-honor/detail/scholarship-talent" replace />}
            />
            <Route 
              path="/admission" 
              element={
                <RequireAdmissionAuth>
                  <Admission />
                </RequireAdmissionAuth>
              } 
            />
            <Route path="/login-admission" element={<LoginAdmission />} />
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
    </AuthProvider>
  );
}

export default App;
