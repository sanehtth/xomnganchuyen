// src/pages/Login.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
  const { isLoggedIn, user, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <p>Đang kiểm tra đăng nhập...</p>;
  }

  // Đã đăng nhập
  if (isLoggedIn) {
    return (
      <div className="card">
        <h1>Fanpage Lab</h1>
        <p>Đăng nhập để vào hệ thống tuyển người & đào tạo.</p>

        <p className="mt-3">
          Đang đăng nhập: <strong>{user?.email}</strong>
        </p>

        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/dashboard")}
        >
          Vào dashboard
        </button>
      </div>
    );
  }

  // Chưa đăng nhập
  return (
    <div className="card">
      <h1>Fanpage Lab</h1>
      <p>Đăng nhập để vào hệ thống tuyển người & đào tạo.</p>

      <button className="btn btn-primary mt-3" onClick={loginWithGoogle}>
        Đăng nhập với Google
      </button>
    </div>
  );
}
