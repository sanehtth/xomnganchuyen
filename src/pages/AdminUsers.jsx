// src/pages/AdminUsers.jsx
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../AuthContext.jsx";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

export function AdminUsers() {
  const { user, loading, isAdmin } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    const usersRef = ref(db, "users");
    const unsub = onValue(usersRef, (snap) => {
      const val = snap.val() || {};
      const arr = Object.entries(val).map(([uid, u]) => ({
        uid,
        ...u,
      }));
      // sắp xếp: user mới lên trên
      arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setUsers(arr);
    });

    return () => unsub();
  }, [isAdmin]);

  if (loading) return <div className="max-w">Đang tải...</div>;

  if (!user)
    return (
      <div className="max-w">
        <p>Bạn chưa đăng nhập.</p>
        <a href="/login">Đăng nhập</a>
      </div>
    );

  if (!isAdmin)
    return (
      <div className="max-w">
        <p>Bạn không có quyền admin.</p>
        <a href="/">Về trang chính</a>
      </div>
    );

  const filtered = users.filter((u) => {
    if (!filter.trim()) return true;
    const key = filter.toLowerCase();
    return (
      (u.displayName || "").toLowerCase().includes(key) ||
      (u.email || "").toLowerCase().includes(key) ||
      (u.uid || "").toLowerCase().includes(key)
    );
  });

  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString();
  };

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Quản lý user</h1>
        <p className="mt-2">
          Xem danh sách thành viên, thông tin cơ bản và trạng thái tài khoản.
        </p>

        <div className="card mt-3">
          <div className="flex space-between items-center gap-2">
            <input
              type="text"
              placeholder="Tìm theo tên / email / uid..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <span className="pill">
              Tổng: {users.length} user
            </span>
          </div>

          <div className="mt-3" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Level</th>
                  <th>XP</th>
                  <th>Coin</th>
                  <th>Joined</th>
                  <th>Last active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.uid}>
                    <td>
                      <div>
                        <b>{u.displayName || "No name"}</b>
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {u.email || u.uid}
                      </div>
                    </td>
                    <td>{u.level ?? 1}</td>
                    <td>{u.xp ?? 0}</td>
                    <td>{u.coin ?? 0}</td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td>{fmtDate(u.lastActiveAt)}</td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ fontSize: 13, opacity: 0.7 }}>
                      Không có user nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
