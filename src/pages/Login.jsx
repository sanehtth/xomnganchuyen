// src/pages/Login.jsx
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext.jsx";
import { LoginWithGoogle } from "../firebase";

function LoginPage() {
  const { user, loading } = useContext(AuthContext);
  const [loggingIn, setLoggingIn] = useState(false);
  const navigate = useNavigate();

  // Nếu đã đăng nhập thì tự chuyển sang dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [loading, user, navigate]);

  const handleLogin = async () => {
    try {
      setLoggingIn(true);
      await LoginWithGoogle();          // dùng đúng hàm trong firebase.js
      // sau khi login xong, AuthContext sẽ tự cập nhật user
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi đăng nhập. Bạn hãy thử lại sau.");
      setLoggingIn(false);
    }
  };

  // Đang kiểm tra trạng thái đăng nhập (lần đầu vào trang)
  if (loading) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Đang kiểm tra trạng thái đăng nhập...</p>
        </div>
      </main>
    );
  }

  // Đã có user (đăng nhập rồi)
  if (user) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Bạn đã đăng nhập.</p>
          <a href="/dashboard" className="btn">
            Về Dashboard
          </a>
        </div>
      </main>
    );
  }

  // Chưa đăng nhập
  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Đăng nhập Fanpage</h1>
        <p>Đăng nhập Google để vào hệ thống.</p>

        <button
          className="btn primary mt-3"
          onClick={handleLogin}
          disabled={loggingIn}
        >
          {loggingIn ? "Đang đăng nhập..." : "Đăng nhập với Google"}
        </button>
      </div>
    </main>
  );
}

export default LoginPage;
