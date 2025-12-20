import { useContext } from "react";
import { AuthContext } from "../AuthContext.jsx";
import { loginWithGoogle } from "../firebase";

export function LoginPage() {
  const { loading, user } = useContext(AuthContext);

  async function handleLogin() {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
      alert("Login thất bại. Kiểm tra console.");
    }
  }

  if (loading) return <div className="max-w">Đang tải...</div>;
  if (user) return (
    <div className="max-w">
      <p>Bạn đã đăng nhập.</p>
      <a href="/">Về trang chính</a>
    </div>
  );

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Đăng nhập Fanpage</h1>
        <p className="mt-2">Dùng Google để vào hệ thống fan & admin.</p>
        <button className="btn mt-3" onClick={handleLogin}>
          Đăng nhập với Google
        </button>
      </div>
    </main>
  );
}