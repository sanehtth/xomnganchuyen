// src/pages/admin/AdminPanel.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext.jsx";

export default function AdminPanel() {
  const { user } = useAuth();

  return (
    <div className="card">
      <h1>Admin tools</h1>
      <p className="mt-2">
        Xin chào admin, <strong>{user?.displayName || user?.email}</strong>
      </p>

      <div className="mt-3">
        <h3>Quản lý</h3>
        <ul>
          <li>
            <Link to="/admin/users">Quản lý user</Link>
          </li>
          {/* Sau này thêm: báo cáo, tool, v.v. */}
        </ul>
      </div>
    </div>
  );
}
