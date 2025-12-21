import React, { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  ref as dbRef,
  get,
  set,
  update,
} from "firebase/database";
import { auth, database } from "./firebase";

const AuthContext = createContext(null);

// Giá trị mặc định nếu user chưa có trong DB
const DEFAULT_PROFILE = {
  role: "guest",     // guest | member | associate | admin
  status: "none",    // none | pending | approved | rejected | admin (cũ của bạn)
  xp: 0,
  coin: 0,
  level: 1,
};

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null); // user từ Firebase Auth
  const [profile, setProfile] = useState(null);           // hồ sơ trong Realtime DB
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setFirebaseUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setFirebaseUser(user);

        const userRef = dbRef(database, `users/${user.uid}`);
        const snap = await get(userRef);

        if (snap.exists()) {
          const data = snap.val() || {};

          const merged = {
            uid: user.uid,
            displayName: user.displayName || data.displayName || "No name",
            email: user.email || data.email || "",
            photoURL: user.photoURL || data.photoURL || "",
            ...DEFAULT_PROFILE,
            ...data, // dữ liệu trong DB sẽ ghi đè DEFAULT_PROFILE
          };

          setProfile(merged);

          // Cập nhật lại một vài field cơ bản
          await update(userRef, {
            displayName: merged.displayName,
            email: merged.email,
            photoURL: merged.photoURL,
            role: merged.role,
            status: merged.status,
            xp: merged.xp,
            coin: merged.coin,
            level: merged.level,
            lastActiveAt: Date.now(),
          });
        } else {
          const newProfile = {
            uid: user.uid,
            displayName: user.displayName || "No name",
            email: user.email || "",
            photoURL: user.photoURL || "",
            ...DEFAULT_PROFILE,
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
          };

          await set(userRef, newProfile);
          setProfile(newProfile);
        }
      } catch (err) {
        console.error("Lỗi load profile:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    await signOut(auth);
  }

  // Điều kiện admin:
  // - Ưu tiên role === "admin"
  // - Giữ tương thích với dữ liệu cũ: status === "admin"
  const isAdmin =
    profile?.role === "admin" || profile?.status === "admin";

  const value = {
    firebaseUser,
    profile,
    loading,
    loginWithGoogle,
    logout,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
