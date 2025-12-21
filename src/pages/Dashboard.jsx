// src/pages/Dashboard.jsx
import { useAuth } from "../AuthContext";

export default function Dashboard() {
  const { user, logout, loading } = useAuth();

  return (
    <main style={{ padding: 40 }}>
      <h1>Fanpage Lab (beta)</h1>
      <p>Xin chào, {user?.displayName || "bạn"}.</p>
      <p>Email: {user?.email}</p>

      {/* Chỗ này sau này bạn hiển thị coin/xp/level, joinCode, v.v. */}
      <section style={{ marginTop: 24 }}>
        <h2>Chỉ số công khai</h2>
        <ul>
          <li>XP: 0</li>
          <li>Coin: 0</li>
          <li>Level: 1</li>
        </ul>
      </section>

      <button onClick={logout} disabled={loading} style={{ marginTop: 24 }}>
        {loading ? "Đang đăng xuất..." : "Logout"}
      </button>
    </main>
  );
}
