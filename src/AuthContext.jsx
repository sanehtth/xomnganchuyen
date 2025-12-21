// src/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  loginWithGoogle,
  logout as firebaseLogout,
  ensureUserProfile,
} from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase user
  const [profile, setProfile] = useState(null); // data trong Realtime DB
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(fbUser);
      try {
        const profileData = await ensureUserProfile(fbUser);
        setProfile(profileData);
      } catch (err) {
        console.error("ensureUserProfile error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const value = useMemo(() => {
    const role = profile?.role || "guest";
    const status = profile?.status || "none";

    return {
      user,
      profile,
      loading,
      role,
      status,
      isLoggedIn: !!user,
      isAdmin: role === "admin",
      isStaff: role === "admin" || role === "associate",

      loginWithGoogle: async () => {
        await loginWithGoogle();
      },

      logout: async () => {
        await firebaseLogout();
      },
    };
  }, [user, profile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
