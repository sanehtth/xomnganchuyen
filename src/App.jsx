// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./AuthContext";
//import AdminUsers from "./pages/admin/AdminUsers";
//import AdminPanel from "./pages/admin/AdminPanel";
import JoinGate from "./pages/JoinGate";

function PrivateRoute({ children }) {
  const { user, checkingAuth } = useAuth();

  if (checkingAuth) {
    return <p style={{ textAlign: "center", marginTop: 40 }}>Đang kiểm tra đăng nhập...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Sau này bạn mở lại admin tools ở đây */}
        {/*
        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <AdminUsers />
            </PrivateRoute>
          }
        />
        */}
      </Routes>
    </BrowserRouter>
  );
}
