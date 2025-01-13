import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Ticket from './pages/Ticket';
import Event from './pages/Event'



function App() {

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

          {/* Trang Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route path="/ticket" element={<Ticket />} />

          <Route path="/event" element={<Event />} />

          {/* Điều hướng mặc định */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </div>
  );

}

export default App;