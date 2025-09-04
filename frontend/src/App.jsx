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
import { AuthProvider } from "./shared/contexts/AuthContext";

// Simple auth check
function RequireAuth({ children }) {
  const isAuthenticated = !!localStorage.getItem("authToken");
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem("authToken");
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
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
        <Router>
          <Routes>
            {/* Flip page viewer - public access */}
            <Route path="/:customName" element={<FlipViewPage />} />

            {/* Login */}
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

            {/* Default route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
