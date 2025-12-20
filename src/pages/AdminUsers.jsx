// src/pages/admin/AdminUsers.jsx
import { useContext, useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase.js";          // đường dẫn từ /pages/admin
import { AuthContext } from "../../AuthContext.jsx";
import { Link } from "react-router-dom";

function groupUsers(usersObj) {
  const guests = [];
  const members = [];
  const associates = [];

  Object.entries(usersObj || {}).forEach(([uid, data]) => {
    const profile = data.profile || {};
    const stats = data.stats || {};
    const system = data.system || {};

    const row = {
      uid,
      name: profile.displayName || "No name",
      email: profile.email || "",
      role: profile.role || "guest",
      level: stats.level || 1,
      xp: stats.xp || 0,
      coin: stats.coin || 0,
      joined: system.joinedAt || "",
      lastActive: system.lastActiveAt || "",
    };

    if (row.role === "associate") associates.push(row);
    else if (row.role === "member") members.push(row);
    else guests.push(row);
  });

  // sort cho dễ nhìn: mới vào trước
  const byJoined = (a, b) => (a.joined || "").localeCompare(b.joined || "");
  guests.sort(byJoined);
  members.sort(byJoined);
  associates.sort(byJoined);

  return { guests, members, associates };
}

function UserTable({ title, users }) {
  return (
    <section className="mt-3">
      <h2>
        {title}{" "}
        <span style={{ fontSize: 14, opacity: 0.6 }}>({users.length})</span>
      </h2>

      {users.length === 0 ? (
        <p style={{ fontSize: 14, opacity: 0.7 }}>Chưa có ai trong nhóm này.</p>
      ) : (
        <div className="table-wrapper">
          <table className="user-table">
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
              {users.map((u) => (
                <tr key={u.uid}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{u.email}</div>
                  </td>
                  <td>{u.level}</td>
                  <td>{u.xp}</td>
                  <td>{u.coin}</td>
                  <td>{u.joined || "-"}</td>
                  <td>{u.lastActive || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AdminUsers() {
  const { user, loading, isAdmin } = useContext(AuthContext);
  const [usersData, setUsersData] = useState(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsub = onValue(
      usersRef,
      (snap) => {
        setUsersData(snap.val() || {});
        setBusy(false);
      },
      (err) => {
        console.error("Error loading users:", err);
        setBusy(false);
      }
    );
    return () => unsub();
  }, []);

  if (loading || busy) {
    return (
      <main className="app-shell">
        <div className="max-w">Đang tải dữ liệu...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Bạn chưa đăng nhập.</p>
          <p>
            <Link to="/login" className="btn">
              Về trang đăng nhập
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <h1>Quản lý User</h1>
          <p>Bạn không có quyền xem danh sách user.</p>
        </div>
      </main>
    );
  }

  const { guests, members, associates } = groupUsers(usersData || {});

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Quản lý User</h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          Thống kê guest (chỉ xem), member (fan đã vào hệ thống) và associate
          (cộng sự được đào tạo).
        </p>

        <UserTable title="Guest" users={guests} />
        <UserTable title="Member" users={members} />
        <UserTable title="Associate" users={associates} />
      </div>
    </main>
  );
}
