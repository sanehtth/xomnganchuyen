// src/pages/Login.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function LoginPage() {
  const { user, loading, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <p>Đang kiểm tra trạng thái đăng nhập...</p>;
  }

  // ĐÃ ĐĂNG NHẬP
  if (user) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Fanpage Lab</h1>
        <p>Đang đăng nhập: {user.email}</p>

        <button onClick={() => navigate("/dashboard")}>
          Vào dashboard
        </button>

        <button onClick={logout} style={{ marginLeft: 8 }}>
          Đăng xuất
        </button>
      </div>
    );
  }

  // CHƯA ĐĂNG NHẬP
  return (
    <div style={{ padding: 20 }}>
      <h1>Fanpage Lab</h1>
      <p>Đăng nhập để vào hệ thống tuyển người & đào tạo.</p>
      <button onClick={loginWithGoogle}>Đăng nhập với Google</button>
    </div>
  );
}
