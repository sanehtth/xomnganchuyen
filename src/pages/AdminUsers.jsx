// src/pages/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, update } from "firebase/database";

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function roleLabel(role) {
  if (role === "member") return "Member";
  if (role === "associate") return "Associate";
  return "Guest";
}

function statusLabel(status) {
  if (!status || status === "none") return "—";
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status;
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsub = onValue(
      usersRef,
      (snap) => {
        const val = snap.val() || {};
        const list = Object.entries(val).map(([uid, u]) => ({
          uid,
          email: u.profile?.email || "No email",
          name: u.profile?.displayName || "No name",
          level: u.stats?.level || 1,
          xp: u.stats?.xp || 0,
          coin: u.stats?.coin || 0,
          joinedAt: u.createdAt || u.profile?.createdAt || null,
          lastActiveAt: u.lastActiveAt || null,
          role: u.role || "guest",
          joinStatus: u.joinStatus || "none",
          joinCode: u.joinCode || "",
        }));
        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading users:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  async function setStatus(uid, status) {
    try {
      await update(ref(db, `users/${uid}`), {
        joinStatus: status,
      });
    } catch (e) {
      console.error("Update status error:", e);
      alert("Không cập nhật được status, xem console.");
    }
  }

  async function approveMember(uid) {
    try {
      await update(ref(db, `users/${uid}`), {
        role: "member",
        joinStatus: "approved",
      });
    } catch (e) {
      console.error("Approve error:", e);
      alert("Không duyệt được user, xem console.");
    }
  }

  async function removeVip(uid) {
    try {
      await update(ref(db, `users/${uid}`), {
        role: "guest",
        joinStatus: "none",
      });
    } catch (e) {
      console.error("Remove VIP error:", e);
      alert("Không cập nhật được user, xem console.");
    }
  }

  const guests = users.filter((u) => u.role === "guest");
  const members = users.filter((u) => u.role === "member");
  const associates = users.filter((u) => u.role === "associate");

  const renderTable = (title, list, showVipActions) => (
    <>
      <h2 style={{ marginTop: "24px", marginBottom: "12px" }}>{title}</h2>
      {list.length === 0 ? (
        <p style={{ color: "#666" }}>Chưa có user nào.</p>
      ) : (
        <table
          style={{
            width: "100%",
            maxWidth: "900px",
            borderCollapse: "collapse",
            marginBottom: "24px",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Level</th>
              <th style={thStyle}>XP</th>
              <th style={thStyle}>Coin</th>
              <th style={thStyle}>Joined</th>
              <th style={thStyle}>Last active</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
              {showVipActions && <th style={thStyle}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.uid}>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}>{u.level}</td>
                <td style={tdStyle}>{u.xp}</td>
                <td style={tdStyle}>{u.coin}</td>
                <td style={tdStyle}>{formatDate(u.joinedAt)}</td>
                <td style={tdStyle}>{formatDate(u.lastActiveAt)}</td>
                <td style={tdStyle}>{roleLabel(u.role)}</td>
                <td style={tdStyle}>{statusLabel(u.joinStatus)}</td>
                {showVipActions && (
                  <td style={tdStyle}>
                    {u.role === "guest" && (
                      <>
                        <button
                          style={smallBtn}
                          onClick={() => setStatus(u.uid, "pending")}
                        >
                          Set Pending
                        </button>
                        <button
                          style={smallBtn}
                          onClick={() => approveMember(u.uid)}
                        >
                          Approve
                        </button>
                      </>
                    )}
                    {u.role !== "guest" && (
                      <button
                        style={smallBtnDanger}
                        onClick={() => removeVip(u.uid)}
                      >
                        Remove VIP
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );

  return (
    <div style={{ padding: "32px 16px" }}>
      <h1>Quản lý User</h1>
      {loading && <p>Đang tải user...</p>}

      {renderTable("Guest", guests, true)}
      {renderTable("Member", members, true)}
      {renderTable("Associate", associates, true)}
    </div>
  );
}

const thStyle = {
  borderBottom: "1px solid #ddd",
  textAlign: "left",
  padding: "8px",
  fontWeight: 600,
};

const tdStyle = {
  borderBottom: "1px solid #f0f0f0",
  padding: "6px 8px",
  fontSize: "14px",
};

const smallBtn = {
  marginRight: "6px",
  padding: "4px 8px",
  fontSize: "12px",
  cursor: "pointer",
};

const smallBtnDanger = {
  ...smallBtn,
  color: "#a00",
};
