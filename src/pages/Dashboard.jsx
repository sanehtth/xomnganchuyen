// src/pages/Dashboard.jsx
import React from "react";
import { useAuth } from "../AuthContext";

function Dashboard() {
  const { firebaseUser, profile, theme, setTheme } = useAuth();

  if (!firebaseUser) {
    return <div>Bạn cần đăng nhập trước.</div>;
  }

  const isGuest = profile?.role === "guest";
  const isPending = profile?.status === "pending";

  return (
    <div style={{ padding: 40 }}>
      <h1>Fanpage Lab (beta)</h1>

      <h2>Xin chào, {profile?.displayName || firebaseUser.email}</h2>
      <p>Email: {firebaseUser.email}</p>
      <p>Role: {profile?.role}</p>
      <p>Status: {profile?.status}</p>

      <h3>Chỉ số công khai</h3>
      <ul>
        <li>XP: {profile?.xp ?? 0}</li>
        <li>Coin: {profile?.coin ?? 0}</li>
        <li>Level: {profile?.level ?? 1}</li>
      </ul>

      {isGuest && !isPending && (
        <p>
          Bạn đang là guest. Vào trang{" "}
          <a href="/join">Cổng đăng ký VIP</a> để gửi yêu cầu.
        </p>
      )}

      {isPending && (
        <p>Yêu cầu VIP của bạn đang chờ admin duyệt.</p>
      )}

      <div style={{ marginTop: 20 }}>
        <span>Theme hiện tại: {theme}</span>{" "}
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          Đổi theme
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
