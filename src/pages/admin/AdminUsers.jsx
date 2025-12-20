// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { fetchAllUsers, approveUser, setUserRole } from "../../firebase";

function AdminUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // chỉ admin mới được vào
  if (profile?.role !== "admin") {
    return <div>Không có quyền truy cập.</div>;
  }

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await fetchAllUsers();
      setUsers(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (filterStatus !== "all" && u.status !== filterStatus) return false;
    return true;
  });

  const handleApprove = async (u) => {
    const joinCode =
      u.joinCode ||
      Math.random().toString(36).substring(2, 10).toUpperCase();
    await approveUser(u.uid, joinCode);
    await loadUsers();
  };

  const handleSetRole = async (u, role) => {
    await setUserRole(u.uid, role);
    await loadUsers();
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Quản lý User</h1>

      <div style={{ marginBottom: 20, display: "flex", gap: 16 }}>
        <div>
          Role:{" "}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="guest">Guest</option>
            <option value="member">Member</option>
            <option value="contributor">Contributor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          Status:{" "}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="none">None</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button onClick={loadUsers}>Reload</button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table border="1" cellPadding="6" cellSpacing="0">
          <thead>
            <tr>
              <th>Email</th>
              <th>Tên</th>
              <th>Role</th>
              <th>Status</th>
              <th>XP</th>
              <th>Coin</th>
              <th>Level</th>
              <th>JoinCode</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.uid}>
                <td>{u.email}</td>
                <td>{u.displayName}</td>
                <td>{u.role}</td>
                <td>{u.status}</td>
                <td>{u.xp ?? 0}</td>
                <td>{u.coin ?? 0}</td>
                <td>{u.level ?? 1}</td>
                <td>{u.joinCode || "-"}</td>
                <td>
                  <button onClick={() => handleApprove(u)}>
                    Duyệt thành Member
                  </button>
                  <button onClick={() => handleSetRole(u, "contributor")}>
                    Set Contributor
                  </button>
                  <button onClick={() => handleSetRole(u, "guest")}>
                    Về Guest
                  </button>
                  <button onClick={() => handleSetRole(u, "admin")}>
                    Set Admin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminUsers;
