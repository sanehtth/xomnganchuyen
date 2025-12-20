import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, update } from "firebase/database";

function formatDate(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleDateString("vi-VN");
  } catch {
    return "";
  }
}

function formatDateTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("vi-VN");
  } catch {
    return "";
  }
}

function generateJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsub = onValue(usersRef, (snap) => {
      const val = snap.val() || {};
      const list = Object.entries(val).map(([uid, u]) => ({
        uid,
        email: u.email || "",
        displayName: u.displayName || "No name",
        level: u.level || 1,
        xp: u.xp || 0,
        coin: u.coin || 0,
        status: u.status || "guest", // guest | pending | active | banned
        role: u.role || "guest",     // guest | member | associate
        joinCode: u.joinCode || "",
        isSubVerified: !!u.isSubVerified,
        joinedAt: u.joinedAt || 0,
        lastActiveAt: u.lastActiveAt || 0,
      }));
      setUsers(list);
    });

    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q) ||
        (u.joinCode && u.joinCode.toLowerCase().includes(q))
      );
    });
  }, [users, search]);

  const guestList = filtered.filter((u) => u.role === "guest");
  const memberList = filtered.filter((u) => u.role === "member");
  const associateList = filtered.filter((u) => u.role === "associate");

  const handleApproveMember = async (user) => {
    const updates = {
      role: "member",
      status: "active",
      isSubVerified: true,
    };
    if (!user.joinCode) {
      updates.joinCode = generateJoinCode();
    }
    await update(ref(db, `users/${user.uid}`), updates);
  };

  const handlePromoteAssociate = async (user) => {
    await update(ref(db, `users/${user.uid}`), {
      role: "associate",
      status: "active",
    });
  };

  const handleDemoteToMember = async (user) => {
    await update(ref(db, `users/${user.uid}`), {
      role: "member",
    });
  };

  const handleBanUser = async (user) => {
    const confirmed = window.confirm(
      `Khóa tài khoản ${user.email || user.uid}?`
    );
    if (!confirmed) return;
    await update(ref(db, `users/${user.uid}`), {
      status: "banned",
      role: "guest",
    });
  };

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Quản lý user</h1>
        <p>Xem danh sách guest, member và cộng sự.</p>

        <div className="card mb-4">
          <div className="card-body">
            <input
              type="text"
              placeholder="Tìm theo tên / email / uid / mã 6 số..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "6px 8px" }}
            />
          </div>
        </div>

        {/* Guest */}
        <section className="card mb-4">
          <div className="card-header">
            <strong>Guest</strong> (quan tâm, chưa là thành viên) – Tổng:{" "}
            {guestList.length}
          </div>
          <div className="card-body">
            {guestList.length === 0 ? (
              <p>Không có guest phù hợp.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Joined</th>
                    <th>Last active</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {guestList.map((u) => (
                    <tr key={u.uid}>
                      <td>
                        <div>{u.displayName}</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          {u.email || u.uid}
                        </div>
                      </td>
                      <td>{formatDate(u.joinedAt)}</td>
                      <td>{formatDateTime(u.lastActiveAt)}</td>
                      <td>{u.status}</td>
                      <td>
                        <button
                          className="btn small"
                          onClick={() => handleApproveMember(u)}
                        >
                          Xác nhận đã sub &amp; cấp mã
                        </button>
                        {"  "}
                        <button
                          className="btn small danger"
                          onClick={() => handleBanUser(u)}
                        >
                          Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Member */}
        <section className="card mb-4">
          <div className="card-header">
            <strong>Member</strong> (fan đã sub, có mã 6 số) – Tổng:{" "}
            {memberList.length}
          </div>
          <div className="card-body">
            {memberList.length === 0 ? (
              <p>Chưa có member nào.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Level</th>
                    <th>XP</th>
                    <th>Coin</th>
                    <th>Mã 6 số</th>
                    <th>Joined</th>
                    <th>Last active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {memberList.map((u) => (
                    <tr key={u.uid}>
                      <td>
                        <div>{u.displayName}</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          {u.email}
                        </div>
                      </td>
                      <td>{u.level}</td>
                      <td>{u.xp}</td>
                      <td>{u.coin}</td>
                      <td>{u.joinCode || "-"}</td>
                      <td>{formatDate(u.joinedAt)}</td>
                      <td>{formatDateTime(u.lastActiveAt)}</td>
                      <td>
                        <button
                          className="btn small"
                          onClick={() => handlePromoteAssociate(u)}
                        >
                          Thăng cộng sự
                        </button>
                        {"  "}
                        <button
                          className="btn small danger"
                          onClick={() => handleBanUser(u)}
                        >
                          Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Associate */}
        <section className="card mb-4">
          <div className="card-header">
            <strong>Cộng sự</strong> (nhóm được đào tạo) – Tổng:{" "}
            {associateList.length}
          </div>
          <div className="card-body">
            {associateList.length === 0 ? (
              <p>Chưa có cộng sự nào.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Level</th>
                    <th>XP</th>
                    <th>Coin</th>
                    <th>Mã 6 số</th>
                    <th>Joined</th>
                    <th>Last active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {associateList.map((u) => (
                    <tr key={u.uid}>
                      <td>
                        <div>{u.displayName}</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          {u.email}
                        </div>
                      </td>
                      <td>{u.level}</td>
                      <td>{u.xp}</td>
                      <td>{u.coin}</td>
                      <td>{u.joinCode || "-"}</td>
                      <td>{formatDate(u.joinedAt)}</td>
                      <td>{formatDateTime(u.lastActiveAt)}</td>
                      <td>
                        <button
                          className="btn small"
                          onClick={() => handleDemoteToMember(u)}
                        >
                          Giáng về member
                        </button>
                        {"  "}
                        <button
                          className="btn small danger"
                          onClick={() => handleBanUser(u)}
                        >
                          Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
