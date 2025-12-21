// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import JoinGate from "./pages/JoinGate.jsx";
import AdminPanel from "./pages/admin/AdminPanel.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import { useAuth } from "./AuthContext.jsx";

function AdminRoute({ children }) {
  const { loading, isAdmin } = useAuth();

  if (loading) return <p>Đang kiểm tra đăng nhập...</p>;
  if (!isAdmin) return <p>Bạn không có quyền truy cập trang admin.</p>;

  return children;
}

function AppShell() {
  return (
    <div className="app-shell">
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/join" element={<JoinGate />} />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />

          <Route path="*" element={<p>Không tìm thấy trang.</p>} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
