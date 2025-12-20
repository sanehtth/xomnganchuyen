// src/pages/Login.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { LoginWithGooglePopup } from "../firebase";

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Nếu đã đăng nhập thì tự chuyển sang /dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [loading, user, navigate]);

  const handleLogin = async () => {
    try {
      await LoginWithGooglePopup();
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      alert("Có lỗi khi đăng nhập. Bạn hãy thử lại sau.");
    }
  };

  if (loading) {
    return (
      <main className="app-shell">
        <div className="max-w">Đang kiểm tra trạng thái đăng nhập...</div>
      </main>
    );
  }

  if (user) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Bạn đã đăng nhập.</p>
          <p>
            <a href="/dashboard" className="btn outline">
              Về trang chính
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Hệ thống Fanpage</h1>
        <p>Đăng nhập Google để vào hệ thống.</p>

        <button className="btn primary mt-3" onClick={handleLogin}>
          Đăng nhập với Google
        </button>
      </div>
    </main>
  );
}

export default LoginPage;
