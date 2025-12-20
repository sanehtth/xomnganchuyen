// src/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  onAuthChange,
  loginWithGoogle,
  logoutFirebase,
  ensureUserProfile,
  updateUserTheme,
} from "./firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Ghi chú:
 * - state chính: { firebaseUser, profile, loading, theme }
 * - theme: vừa lưu ở localStorage, vừa lưu Firestore (nếu đã đăng nhập)
 */
export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null); // dữ liệu trong collection users
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem("theme") || "light"
  );

  // Áp theme vào body
  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  // Lắng nghe thay đổi đăng nhập
  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setFirebaseUser(user);
      const p = await ensureUserProfile(user);
      setProfile(p);
      if (p.theme) setTheme(p.theme);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleLoginWithGoogle = async () => {
    setLoading(true);
    try {
      const { firebaseUser: fu, profile: p } = await loginWithGoogle();
      setFirebaseUser(fu);
      setProfile(p);
      if (p.theme) setTheme(p.theme);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutFirebase();
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTheme = async (nextTheme) => {
    setTheme(nextTheme);
    if (firebaseUser) {
      // nếu đã login thì lưu lên Firestore
      try {
        await updateUserTheme(firebaseUser.uid, nextTheme);
      } catch (e) {
        console.error("Update theme failed", e);
      }
    }
  };

  const value = {
    firebaseUser,
    profile,
    loading,
    theme,
    loginWithGoogle: handleLoginWithGoogle,
    logout: handleLogout,
    setTheme: handleChangeTheme,
    // tiện: flag check quyền
    isAdmin: profile?.role === "admin",
    isMember: profile?.role === "member",
    isContributor: profile?.role === "contributor",
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
