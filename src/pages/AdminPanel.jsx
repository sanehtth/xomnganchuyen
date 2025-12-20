// src/pages/AdminPanel.jsx

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function AdminPanel() {
  const { profile, isAdmin } = useAuth();

  // Chặn user thường vào trang admin
  if (!isAdmin) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>Không có quyền truy cập</h1>
        <p>Trang này chỉ dành cho admin.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Admin tools</h1>
      <p>
        Xin chào, <strong>{profile?.displayName || profile?.email}</strong>
      </p>

      <h2 style={{ marginTop: "24px" }}>Khu vực quản trị</h2>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          <Link to="/admin/users">Quản lý user</Link>
        </li>
        <li>
          <Link to="/admin/reports">Xem báo cáo</Link>
        </li>
        <li>
          <Link to="/admin/tools">Kho công cụ (AI, tạo ảnh, video…)</Link>
        </li>
      </ul>

      <p style={{ marginTop: "24px", fontSize: "14px", color: "#666" }}>
        Sau này bạn có thể thêm nhiều tab / link khác cho cộng sự, cấp quyền
        theo nhu cầu.
      </p>
    </div>
  );
}
