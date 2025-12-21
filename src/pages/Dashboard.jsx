// src/pages/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Dashboard() {
  const { loading, isLoggedIn, user, profile, role, status } = useAuth();

  if (loading) return <p>Đang tải...</p>;
  if (!isLoggedIn) return <p>Bạn chưa đăng nhập.</p>;

  return (
    <div className="card">
      <h1>Fanpage Lab (beta)</h1>
      <p className="mt-2">
        Xin chào, <strong>{user?.displayName || user?.email}</strong>
      </p>

      <p className="mt-2">Email: {user?.email}</p>
      <p>Role: {role}</p>
      <p>Status: {status}</p>

      <h3 className="mt-3">Chỉ số công khai</h3>
      <ul>
        <li>XP: {profile?.xp ?? 0}</li>
        <li>Coin: {profile?.coin ?? 0}</li>
        <li>Level: {profile?.level ?? 1}</li>
      </ul>

      {role === "guest" && (
        <p className="mt-3">
          Bạn hiện là guest. Vào trang{" "}
          <Link to="/join">Cổng đăng ký VIP</Link> để gửi yêu cầu.
        </p>
      )}

      {role !== "guest" && (
        <p className="mt-3">
          Bạn đã là <strong>{role}</strong>. Hệ thống sẽ dần bổ sung thêm tool
          và nhiệm vụ.
        </p>
      )}
    </div>
  );
}
