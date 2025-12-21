import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import {
  fetchAllUsers,
  approveUser,
  rejectUser,
  setUserRole,
} from "../../services/userService";

export default function AdminUsers() {
  const { firebaseUser, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;

    (async () => {
      try {
        const list = await fetchAllUsers();
        // sort: admin -> member -> guest
        list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        setUsers(list);
      } catch (err) {
        console.error(err);
        setError("Không load được danh sách user");
      }
    })();
  }, [isAdmin]);

  if (loading) return <p>Đang kiểm tra quyền...</p>;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!isAdmin) return <p>Bạn không có quyền truy cập trang này.</p>;

  async function handleApprove(uid, role = "member") {
    try {
      setBusyId(uid);
      setError("");
      await approveUser(uid, role);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid ? { ...u, role, status: "approved" } : u
        )
      );
    } catch (err) {
      console.error(err);
      setError("Lỗi khi duyệt user");
    } finally {
      setBusyId("");
    }
  }

  async function handleReject(uid) {
    try {
      setBusyId(uid);
      setError("");
      await rejectUser(uid);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid ? { ...u, status: "rejected" } : u
        )
      );
    } catch (err) {
      console.error(err);
      setError("Lỗi khi từ chối user");
    } finally {
      setBusyId("");
    }
  }

  async function handleSetRole(uid, role) {
    try {
      setBusyId(uid);
      setError("");
      await setUserRole(uid, role);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role } : u))
      );
    } catch (err) {
      console.error(err);
      setError("Lỗi khi đổi role");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <h1>Quản lý user</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table border="1" cellPadding="4" cellSpacing="0">
        <thead>
          <tr>
            <th>Email</th>
            <th>Tên</th>
            <th>Role</th>
            <th>Status</th>
            <th>XP</th>
            <th>Coin</th>
            <th>Level</th>
            <th>Join code</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.uid}>
              <td>{u.email}</td>
              <td>{u.displayName}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>{u.xp ?? 0}</td>
              <td>{u.coin ?? 0}</td>
              <td>{u.level ?? 1}</td>
              <td>{u.joinCode || ""}</td>
              <td>
                <button
                  disabled={busyId === u.uid}
                  onClick={() => handleApprove(u.uid, "member")}
                >
                  Duyệt member
                </button>
                <button
                  disabled={busyId === u.uid}
                  onClick={() => handleApprove(u.uid, "associate")}
                >
                  Duyệt cộng sự
                </button>
                <button
                  disabled={busyId === u.uid}
                  onClick={() => handleSetRole(u.uid, "admin")}
                >
                  Set admin
                </button>
                <button
                  disabled={busyId === u.uid}
                  onClick={() => handleReject(u.uid)}
                >
                  Từ chối
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={9}>Chưa có user nào.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
