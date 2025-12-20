// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "../firebase"; // nếu đường dẫn khác thì chỉnh lại cho đúng
// ví dụ: import { database } from "../../firebase";

function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Đọc toàn bộ danh sách user từ /users
    const usersRef = ref(database, "users");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, u]) => ({
        id,
        email: u.email || "",
        displayName: u.displayName || "",
        role: u.role || "guest",
        status: u.status || "",
        memberId: u.memberId || "",
        level: u.level ?? 1,
        xp: u.xp ?? 0,
        coin: u.coin ?? 0,
        joinedAt: u.joinedAt || null,
        lastActive: u.lastActive || null,
      }));
      setUsers(list);
    });

    return () => unsubscribe();
  }, []);

  // Nhóm user
  const pendingUsers = users.filter(
    (u) => u.role === "pending" || u.status === "pending"
  );
  const memberUsers = users.filter((u) => u.role === "member");
  const associateUsers = users.filter((u) => u.role === "associate");
  const guestUsers = users.filter(
    (u) =>
      !pendingUsers.includes(u) &&
      !memberUsers.includes(u) &&
      !associateUsers.includes(u)
  );

  // Admin duyệt: cho user thành member
  const handleApprove = async (user) => {
    try {
      await update(ref(database, `users/${user.id}`), {
        role: "member",
        status: "approved",
        // tạm thời dùng id rút gọn làm memberId 10 ký tự
        memberId: (user.id || "").slice(-10),
      });
      alert(`Đã duyệt VIP cho: ${user.email}`);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi duyệt user, xem console.");
    }
  };

  // Từ chối: trả về guest bình thường
  const handleReject = async (user) => {
    try {
      await update(ref(database, `users/${user.id}`), {
        role: "guest",
        status: "rejected",
      });
      alert(`Đã từ chối: ${user.email}`);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi từ chối user, xem console.");
    }
  };

  const renderUserRow = (u, extraActions = null) => (
    <tr key={u.id}>
      <td>{u.email}</td>
      <td>{u.displayName}</td>
      <td>{u.role}</td>
      <td>{u.memberId || "-"}</td>
      <td>{u.level}</td>
      <td>{u.xp}</td>
      <td>{u.coin}</td>
      <td>{extraActions}</td>
    </tr>
  );

  return (
    <div style={{ padding: "32px" }}>
      <h1>Quản lý User</h1>

      {/* Pending VIP */}
      <section style={{ marginTop: 24 }}>
        <h2>Yêu cầu VIP đang chờ duyệt</h2>
        {pendingUsers.length === 0 ? (
          <p>Không có yêu cầu nào.</p>
        ) : (
          <table border="1" cellPadding="6" cellSpacing="0">
            <thead>
              <tr>
                <th>Email</th>
                <th>Tên hiển thị</th>
                <th>Role</th>
                <th>Member ID</th>
                <th>Level</th>
                <th>XP</th>
                <th>Coin</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((u) =>
                renderUserRow(
                  u,
                  <>
                    <button onClick={() => handleApprove(u)}>Duyệt VIP</button>
                    <button
                      onClick={() => handleReject(u)}
                      style={{ marginLeft: 8 }}
                    >
                      Từ chối
                    </button>
                  </>
                )
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* Guest */}
      <section style={{ marginTop: 32 }}>
        <h2>Guest</h2>
        {guestUsers.length === 0 ? (
          <p>Không có guest nào.</p>
        ) : (
          <table border="1" cellPadding="6" cellSpacing="0">
            <thead>
              <tr>
                <th>Email</th>
                <th>Tên hiển thị</th>
                <th>Role</th>
                <th>Member ID</th>
                <th>Level</th>
                <th>XP</th>
                <th>Coin</th>
                <th></th>
              </tr>
            </thead>
            <tbody>{guestUsers.map((u) => renderUserRow(u))}</tbody>
          </table>
        )}
      </section>

      {/* Member */}
      <section style={{ marginTop: 32 }}>
        <h2>Member</h2>
        {memberUsers.length === 0 ? (
          <p>Chưa có member nào.</p>
        ) : (
          <table border="1" cellPadding="6" cellSpacing="0">
            <thead>
              <tr>
                <th>Email</th>
                <th>Tên hiển thị</th>
                <th>Role</th>
                <th>Member ID</th>
                <th>Level</th>
                <th>XP</th>
                <th>Coin</th>
                <th></th>
              </tr>
            </thead>
            <tbody>{memberUsers.map((u) => renderUserRow(u))}</tbody>
          </table>
        )}
      </section>

      {/* Associate / cộng sự nếu bạn cần dùng sau này */}
      <section style={{ marginTop: 32 }}>
        <h2>Associate</h2>
        {associateUsers.length === 0 ? (
          <p>Chưa có associate nào.</p>
        ) : (
          <table border="1" cellPadding="6" cellSpacing="0">
            <thead>
              <tr>
                <th>Email</th>
                <th>Tên hiển thị</th>
                <th>Role</th>
                <th>Member ID</th>
                <th>Level</th>
                <th>XP</th>
                <th>Coin</th>
                <th></th>
              </tr>
            </thead>
            <tbody>{associateUsers.map((u) => renderUserRow(u))}</tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default AdminUsers;
