// src/pages/admin/AdminUsers.jsx

import { useEffect, useState } from "react";
import { fetchAllUsers, approveUser, setUserRole } from "../../firebase";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | pending | member | guest

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchAllUsers();
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setUsers(list);
      } catch (err) {
        console.error("Lỗi tải users:", err);
        alert("Không tải được danh sách user.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (filter === "pending") return u.status === "pending";
    if (filter === "member") return u.role === "member" || u.role === "admin";
    if (filter === "guest") return u.role === "guest";
    return true;
  });

  const handleApprove = async (uid, approved) => {
    const joinCode = approved ? prompt("Join code (có thể bỏ trống):", "") : "";
    await approveUser(uid, approved, joinCode || "");
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === uid
          ? {
              ...u,
              status: approved ? "approved" : "rejected",
              role: approved ? "member" : u.role,
              joinCode: approved ? joinCode : u.joinCode,
            }
          : u
      )
    );
  };

  const handleRoleChange = async (uid, role) => {
    await setUserRole(uid, role);
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, role } : u))
    );
  };

  return (
    <section>
      <h2>Quản lý user</h2>

      {loading && <p>Đang tải danh sách...</p>}

      {!loading && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label>
              Lọc:
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ marginLeft: 8 }}
              >
                <option value="all">Tất cả</option>
                <option value="pending">Đợi duyệt</option>
                <option value="member">Member / Admin</option>
                <option value="guest">Guest</option>
              </select>
            </label>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              maxWidth: 900,
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
                  Tên
                </th>
                <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
                  Email
                </th>
                <th style={{ borderBottom: "1px solid #ddd" }}>Role</th>
                <th style={{ borderBottom: "1px solid #ddd" }}>Trạng thái</th>
                <th style={{ borderBottom: "1px solid #ddd" }}>XP</th>
                <th style={{ borderBottom: "1px solid #ddd" }}>Coin</th>
                <th style={{ borderBottom: "1px solid #ddd" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.uid}>
                  <td style={{ padding: "6px 4px" }}>
                    {u.displayName || "(Không tên)"}
                  </td>
                  <td style={{ padding: "6px 4px" }}>{u.email}</td>
                  <td style={{ textAlign: "center" }}>
                    <select
                      value={u.role || "guest"}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                    >
                      <option value="guest">guest</option>
                      <option value="member">member</option>
                      <option value="associate">associate</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td style={{ textAlign: "center" }}>{u.status || "none"}</td>
                  <td style={{ textAlign: "right" }}>{u.xp ?? 0}</td>
                  <td style={{ textAlign: "right" }}>{u.coin ?? 0}</td>
                  <td style={{ textAlign: "center" }}>
                    {u.status === "pending" ? (
                      <>
                        <button onClick={() => handleApprove(u.uid, true)}>
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleApprove(u.uid, false)}
                          style={{ marginLeft: 8 }}
                        >
                          Từ chối
                        </button>
                      </>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
