// src/pages/Dashboard.jsx

import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useTheme } from "../theme";

export default function Dashboard() {
  const { firebaseUser, profile, isAdmin, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return <main className="app-shell">Đang tải dữ liệu...</main>;
  }

  if (!firebaseUser) {
    return (
      <main className="app-shell">
        <p>Bạn chưa đăng nhập.</p>
        <Link to="/login" className="btn btn-primary">
          Về trang đăng nhập
        </Link>
      </main>
    );
  }

  const xp = profile?.xp ?? 0;
  const coin = profile?.coin ?? 0;
  const level = profile?.level ?? 1;

  return (
    <main className="app-shell">
      <h1>Fanpage Lab (beta)</h1>
      <p>
        Xin chào,{" "}
        {profile?.displayName || firebaseUser.displayName || firebaseUser.email}
      </p>
      <p>Email: {profile?.email || firebaseUser.email}</p>

      <section className="mt-4">
        <h2>Chỉ số công khai</h2>
        <ul>
          <li>XP: {xp}</li>
          <li>Coin: {coin}</li>
          <li>Level: {level}</li>
        </ul>
      </section>

      <section className="mt-4">
        <h2>Theme</h2>
        <p>Theme hiện tại: {theme === "light" ? "Light" : "Dark"}</p>
        <button className="btn" onClick={toggleTheme}>
          Đổi theme
        </button>
      </section>

      {isAdmin && (
        <section className="mt-4">
          <h2>Khu admin</h2>
          <p>Bạn là admin, có thể quản lý user và sau này thêm tool.</p>
          <Link to="/admin" className="btn btn-primary">
            Vào admin panel
          </Link>
        </section>
      )}
    </main>
  );
}
