import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";

function generateMemberId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 10; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const r = ref(db, "users");
    onValue(r, (snap) => {
      const val = snap.val() || {};
      const arr = Object.entries(val).map(([uid, u]) => ({
        uid,
        email: u.email || "",
        name: u.displayName || "",
        role: u.role || "guest",
        memberId: u.memberId || "",
        joinedAt: u.joinedAt || "",
      }));
      setUsers(arr);
    });
  }, []);

  async function approve(uid) {
    const id = generateMemberId();
    const r = ref(db, `users/${uid}`);
    await update(r, {
      role: "member",
      memberId: id,
      approvedAt: Date.now(),
    });
  }

  async function reject(uid) {
    const r = ref(db, `users/${uid}`);
    await update(r, { role: "guest" });
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Quản lý User</h1>

      <h3>Guest</h3>
      <table style={{ width: "100%", marginBottom: 30 }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>ID</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users
            .filter((u) => u.role === "guest" || u.role === "pending")
            .map((u) => (
              <tr key={u.uid}>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.memberId || "-"}</td>
                <td>
                  {u.role === "pending" ? (
                    <>
                      <button onClick={() => approve(u.uid)}>Approve</button>
                      <button onClick={() => reject(u.uid)}>Reject</button>
                    </>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <h3>Member</h3>
      <table style={{ width: "100%", marginBottom: 30 }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {users
            .filter((u) => u.role === "member")
            .map((u) => (
              <tr key={u.uid}>
                <td>{u.email}</td>
                <td>{u.memberId}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <h3>Associate</h3>
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {users
            .filter((u) => u.role === "associate")
            .map((u) => (
              <tr key={u.uid}>
                <td>{u.email}</td>
                <td>{u.memberId}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
