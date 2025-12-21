// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import { fetchAllUsers, approveUser, setUserRole } from "../../firebase.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchAllUsers();
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setUsers(list);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (uid) => {
    setBusyId(uid);
    try {
      const updated = await approveUser(uid);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? updated : u))
      );
    } catch (err) {
      console.error(err);
      alert("Lỗi duyệt user");
    } finally {
      setBusyId(null);
    }
  };

  const handleSetRole = async (uid, role) => {
    setBusyId(uid);
    try {
      const updated = await setUserRole(uid, role);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? updated : u))
      );
    } catch (err) {
      console.error(err);
      alert("Lỗi đổi role");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p>Đang tải user...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="card">
      <h1>Quản lý User</h1>

      <table
        style={{
          width: "100%",
          fontSize: 13,
          borderCollapse: "collapse",
          marginTop: 16,
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Tên</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>XP</th>
            <th>Coin</th>
            <th>Level</th>
            <th>Join code</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.uid}>
              <td>{u.displayName || "(No name)"}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>{u.xp ?? 0}</td>
              <td>{u.coin ?? 0}</td>
              <td>{u.level ?? 1}</td>
              <td>{u.joinCode || "-"}</td>
              <td>
                <button
                  className="btn btn-primary"
                  disabled={busyId === u.uid}
                  onClick={() => handleApprove(u.uid)}
                >
                  Duyệt thành Member
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ marginLeft: 4 }}
                  disabled={busyId === u.uid}
                  onClick={() => handleSetRole(u.uid, "associate")}
                >
                  Set Associate
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ marginLeft: 4 }}
                  disabled={busyId === u.uid}
                  onClick={() => handleSetRole(u.uid, "admin")}
                >
                  Set Admin
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
