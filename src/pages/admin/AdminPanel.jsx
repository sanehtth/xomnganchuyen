// src/pages/admin/AdminPanel.jsx

import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function AdminPanel() {
  const { isAdmin, firebaseUser } = useAuth();

  if (!isAdmin) {
    return (
      <main className="app-shell">
        <h1>Admin</h1>
        <p>Bạn không có quyền truy cập khu admin.</p>
        <Link to="/dashboard" className="btn btn-primary">
          Về dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <h1>Admin Panel</h1>
      <p>
        Xin chào admin{" "}
        {firebaseUser?.displayName || firebaseUser?.email || "User"}
      </p>

      <nav className="mt-3" style={{ display: "flex", gap: 12 }}>
        <Link to="/admin/users" className="btn btn-primary">
          Quản lý user
        </Link>
        {/* sau này thêm: báo cáo, tools, ... */}
      </nav>

      <div className="mt-4">
        <Outlet />
      </div>
    </main>
  );
}
