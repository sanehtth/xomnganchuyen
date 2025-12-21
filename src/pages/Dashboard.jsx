import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Dashboard() {
  const { firebaseUser, profile, loading } = useAuth();

  if (loading) {
    return <p>Đang kiểm tra đăng nhập...</p>;
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  const displayName =
    profile?.displayName || firebaseUser.displayName || "Bạn";
  const email = profile?.email || firebaseUser.email || "";
  const role = profile?.role || "guest";
  const status = profile?.status || "none";
  const xp = profile?.xp ?? 0;
  const coin = profile?.coin ?? 0;
  const level = profile?.level ?? 1;

  return (
    <div>
      <h1>Fanpage Lab (beta)</h1>
      <p>Xin chào, {displayName}.</p>
      {email && <p>Email: {email}</p>}

      <p>Role: {role}</p>
      <p>Status: {status}</p>

      <h2>Chỉ số công khai</h2>
      <ul>
        <li>XP: {xp}</li>
        <li>Coin: {coin}</li>
        <li>Level: {level}</li>
      </ul>
    </div>
  );
}
