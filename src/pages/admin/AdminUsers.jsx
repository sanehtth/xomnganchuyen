import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";

export default function AdminUsers() {
  const [users, setUsers] = useState({});

  useEffect(() => {
    return onValue(ref(db, "users"), snap => {
      setUsers(snap.val() || {});
    });
  }, []);

  const updateRole = (uid, role) => {
    update(ref(db, `users/${uid}`), { role });
  };

  const updateStatus = (uid, status) => {
    update(ref(db, `users/${uid}`), { status });
  };

  const arr = Object.values(users);

  return (
    <main>
      <h1>Quản lý User</h1>

      <h2>Guest</h2>
      {arr.filter(u => u.role === "guest").map(u => (
        <div key={u.uid}>
          {u.email}
          <button onClick={() => updateStatus(u.uid, "pending")}>Set Pending</button>
        </div>
      ))}

      <h2>Member</h2>
      {arr.filter(u => u.role === "member").map(u => (
        <div key={u.uid}>
          {u.email}
          <button onClick={() => updateRole(u.uid, "associate")}>Thăng cộng sự</button>
        </div>
      ))}

      <h2>Associate</h2>
      {arr.filter(u => u.role === "associate").map(u => (
        <div key={u.uid}>
          {u.email}
        </div>
      ))}
    </main>
  );
}
