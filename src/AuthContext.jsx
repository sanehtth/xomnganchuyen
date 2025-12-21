// AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { ref, get, set } from "firebase/database";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // user từ Firebase Auth
  const [profile, setProfile] = useState(null); // hồ sơ trong DB (role, xp, coin,...)
  const [loading, setLoading] = useState(true);

  // đăng nhập với Google
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // phần còn lại do onAuthStateChanged xử lý
  }

  // đăng xuất
  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      // Đọc hồ sơ user trong Realtime DB: /users/{uid}
      const userRef = ref(db, `users/${firebaseUser.uid}`);
      const snap = await get(userRef);

      if (!snap.exists()) {
        // nếu chưa có thì tạo mới với role guest
        const payload = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || "",
          email: firebaseUser.email || "",
          role: "guest",
          status: "pending",
          xp: 0,
          coin: 0,
          level: 1,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
        };
        await set(userRef, payload);
        setProfile(payload);
      } else {
        setProfile(snap.val());
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const isLoggedIn = !!user;
  const role = profile?.role || "guest";
  const status = profile?.status || "none";
  const isAdmin = role === "admin";

  const value = {
    user,
    profile,
    loading,
    isLoggedIn,
    role,
    status,
    isAdmin,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
