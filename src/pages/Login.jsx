// src/pages/Login.jsx
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../firebase";
import { AuthContext } from "../AuthContext";

export default function LoginPage() {
  const { user, loading } = useContext(AuthContext);
  const [loggingIn, setLoggingIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    try {
      setLoggingIn(true);
      await loginWithGoogle();
      // AuthContext sẽ tự cập nhật user + profile
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi đăng nhập. Vui lòng thử lại.");
      setLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Đang kiểm tra trạng thái đăng nhập...</p>
        </div>
      </main>
    );
  }

  if (user) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <h1>Đăng nhập Fanpage</h1>
          <p>Bạn đã đăng nhập.</p>
          <button className="btn" onClick={() => navigate("/dashboard")}>
            Về Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Đăng nhập Fanpage</h1>
        <p>Bấm nút dưới để đăng nhập bằng Google.</p>
        <button
          className="btn primary"
          onClick={handleLogin}
          disabled={loggingIn}
        >
          {loggingIn ? "Đang đăng nhập..." : "Đăng nhập với Google"}
        </button>
      </div>
    </main>
  );
}
