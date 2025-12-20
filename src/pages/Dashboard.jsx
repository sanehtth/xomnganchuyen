import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../AuthContext.jsx";
import { db, listenUser } from "../firebase";
import { ref, update } from "firebase/database";

export function Dashboard() {
  const { user, loading } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = listenUser(user.uid, (val) => setProfile(val));
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const userRef = ref(db, `users/${user.uid}`);
    update(userRef, { lastActiveAt: Date.now() }).catch(() => {});
  }, [user]);

  if (loading) return <div className="max-w">Đang tải...</div>;
  if (!user) return (
    <div className="max-w">
      <p>Bạn chưa đăng nhập.</p>
      <a href="/login">Đăng nhập</a>
    </div>
  );

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Xin chào, {profile?.displayName || user.displayName || "fan"}</h1>
        <div className="card mt-3">
          <h3>Thông tin cơ bản</h3>
          <p>Email: {user.email}</p>
          <p>Level: {profile?.level ?? 1}</p>
          <p>XP: {profile?.xp ?? 0}</p>
          <p>Coin: {profile?.coin ?? 0}</p>
          <span className="pill">Member view</span>
        </div>
      </div>
    </main>
  );
}