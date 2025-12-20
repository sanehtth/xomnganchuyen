// src/pages/admin/AdminUsers.jsx
import { useContext, useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../../firebase.js";
import { AuthContext } from "../../AuthContext.jsx";
import { Link } from "react-router-dom";

function normalizeUser(uid, data) {
  const profile = data.profile || {};
  const stats = data.stats || {};
  const system = data.system || {};

  return {
    uid,
    name: profile.displayName || "No name",
    email: profile.email || "",
    role: profile.role || "guest",        // guest | member | associate
    status: profile.status || "active",   // active | pending | blocked
    level: stats.level || 1,
    xp: stats.xp || 0,
    coin: stats.coin || 0,
    joined: system.joinedAt || "",
    lastActive: system.lastActiveAt || "",
  };
}

function groupUsers(usersObj) {
  const guests = [];
  const members = [];
  const associates = [];

  Object.entries(usersObj || {}).forEach(([uid, data]) => {
    const u = normalizeUser(uid, data);

    if (u.role === "associate") associates.push(u);
    else if (u.role === "member") members.push(u);
    else guests.push(u);
  });

  const byJoined = (a, b) => (a.joined || "").localeCompare(b.joined || "");

  guests.sort(byJoined);
  members.sort(byJoined);
  associates.sort(byJoined);

  return { guests, members, associates };
}

function UserRow({ user, onSetRole, onSetStatus, busy }) {
  return (
    <tr key={user.uid}>
      <td>
        <div style={{ fontWeight: 500 }}>{user.name}</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{user.email}</div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>
          Role: <strong>{user.role}</strong> | Status:{" "}
          <strong>{user.status}</strong>
        </div>
      </td>
      <td>{user.level}</td>
      <td>{user.xp}</td>
      <td>{user.coin}</td>
      <td>{user.joined || "-"}</td>
      <td>{user.lastActive || "-"}</td>
      <td>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {user.role === "guest" && (
            <>
              <button
                disabled={busy}
                onClick={() => onSetRole(user, "member")}
                className="btn-small"
              >
                Cho làm Member
              </button>
              <button
                disabled={busy}
                onClick={() => onSetStatus(user, "pending")}
                className="btn-small secondary"
              >
                Set Pending
              </button>
            </>
          )}

          {user.role === "member" && (
            <>
              <button
                disabled={busy}
                onClick={() => onSetRole(user, "associate")}
                className="btn-small"
              >
                Cho làm Associate
              </button>
              <button
                disabled={busy}
                onClick={() => onSetStatus(user, "blocked")}
                className="btn-small danger"
              >
                Block
              </button>
            </>
          )}

          {user.role === "associate" && (
            <button
              disabled={busy}
              onClick={() => onSetStatus(user, "blocked")}
              className="btn-small danger"
            >
              Block
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function UserTable({ title, users, onSetRole, onSetStatus, busy }) {
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
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow
                  key={u.uid}
                  user={u}
                  onSetRole={onSetRole}
                  onSetStatus={onSetStatus}
                  busy={busy}
                />
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
  const [busyUid, setBusyUid] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsub = onValue(
      usersRef,
      (snap) => {
        setUsersData(snap.val() || {});
        setInitialLoading(false);
      },
      (err) => {
        console.error("Error loading users:", err);
        setInitialLoading(false);
      }
    );
    return () => unsub();
  }, []);

  async function handleSetRole(user, newRole) {
    try {
      setBusyUid(user.uid);
      await update(ref(db, `users/${user.uid}/profile`), {
        role: newRole,
        status: "active",
      });
    } catch (e) {
      console.error("Error set role:", e);
      alert("Không cập nhật được role, xem console.");
    } finally {
      setBusyUid(null);
    }
  }

  async function handleSetStatus(user, newStatus) {
    try {
      setBusyUid(user.uid);
      await update(ref(db, `users/${user.uid}/profile`), {
        status: newStatus,
      });
    } catch (e) {
      console.error("Error set status:", e);
      alert("Không cập nhật được status, xem console.");
    } finally {
      setBusyUid(null);
    }
  }

  if (loading || initialLoading) {
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
          Guest = người chỉ đăng nhập; Member = fan đã được duyệt vào hệ thống;
          Associate = cộng sự được đào tạo. Bạn có thể nâng / hạ cấp từng người.
        </p>

        <UserTable
          title="Guest"
          users={guests}
          onSetRole={handleSetRole}
          onSetStatus={handleSetStatus}
          busy={!!busyUid}
        />
        <UserTable
          title="Member"
          users={members}
          onSetRole={handleSetRole}
          onSetStatus={handleSetStatus}
          busy={!!busyUid}
        />
        <UserTable
          title="Associate"
          users={associates}
          onSetRole={handleSetRole}
          onSetStatus={handleSetStatus}
          busy={!!busyUid}
        />
      </div>
    </main>
  );
}
