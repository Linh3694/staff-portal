import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./features/Auth/LoginPage";
import Dashboard from "./features/Dashboard/Dashboard";
import MicrosoftAuthSuccess from "./features/Auth/MicrosoftAuthSuccess";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import FlipViewPage from "./features/FlipPage/FlipViewPage";
import { AuthProvider, useAuth } from "./shared/contexts/AuthContext";

// Enhanced auth check using AuthContext
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Component wrapper để sử dụng AuthContext trong routing
function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Login - public route */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Microsoft Auth Success */}
        <Route
          path="/auth/microsoft/success"
          element={<MicrosoftAuthSuccess />}
        />

        {/* Dashboard - requires authentication */}
        <Route
          path="/dashboard/*"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        {/* Custom name pages - must be last to not conflict with other routes */}
        <Route path="/:customName" element={<FlipViewPage />} />

        {/* Catch all other routes and redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
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
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
