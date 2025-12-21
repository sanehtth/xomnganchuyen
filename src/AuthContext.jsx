// src/AuthContext.jsx
// Quản lý trạng thái đăng nhập + hồ sơ user (Realtime DB)

import { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  onAuthStateChanged,
  loginWithGoogle as loginApi,
  logout as logoutApi,
  subscribeToUserProfile,
} from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lắng nghe trạng thái đăng nhập Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setFirebaseUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setFirebaseUser(user);

      // Lắng nghe realtime dữ liệu user trong DB
      const stopProfile = subscribeToUserProfile(user.uid, (data) => {
        setProfile(data);
      });

      setLoading(false);

      // cleanup khi đổi user
      return () => stopProfile();
    });

    return () => unsubscribe();
  }, []);

  const handleLoginWithGoogle = async () => {
    setLoading(true);
    try {
      await loginApi();
      // onAuthStateChanged sẽ tự cập nhật firebaseUser + profile
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutApi();
  };

  const role = profile?.role || "guest";
  const status = profile?.status || "none";
  const isAdmin = role === "admin";
  const isLoggedIn = !!firebaseUser;

  const value = {
    firebaseUser,
    profile,
    role,
    status,
    isAdmin,
    isLoggedIn,
    loading,
    loginWithGoogle: handleLoginWithGoogle,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  }
  return ctx;
}
