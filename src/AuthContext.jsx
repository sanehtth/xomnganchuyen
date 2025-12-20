// src/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, listenUser, loginWithGoogle, logout } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null); // user của Firebase Auth
  const [userRecord, setUserRecord] = useState(null);      // user trong Realtime DB
  const [loading, setLoading] = useState(true);

  // Theo dõi trạng thái đăng nhập Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user || null);

      if (!user) {
        setUserRecord(null);
        setLoading(false);
        return;
      }

      // Lắng nghe dữ liệu user trong Realtime DB
      const stopListen = listenUser(user.uid, (data) => {
        setUserRecord(data);
        setLoading(false);
      });

      return () => stopListen();
    });

    return () => unsub();
  }, []);

  const handleLoginGoogle = async () => {
    setLoading(true);
    try {
      const { user, userRecord } = await loginWithGoogle();
      setFirebaseUser(user);
      setUserRecord(userRecord);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setFirebaseUser(null);
      setUserRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const role = userRecord?.role ?? "guest";
  const status = userRecord?.status ?? "none";

  const isAdmin = role === "admin";
  const isMember = role === "member";
  const isAssociate = role === "associate";

  const value = {
    // thô
    firebaseUser,
    userRecord,
    loading,

    // thông tin hay dùng
    role,
    status,
    isAdmin,
    isMember,
    isAssociate,

    // action
    loginWithGoogle: handleLoginGoogle,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// hook tiện dùng trong mọi component
export function useAuth() {
  return useContext(AuthContext);
}
