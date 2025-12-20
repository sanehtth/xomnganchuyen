// src/AuthContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, ensureUserProfile } from "./firebase";

// Giá trị mặc định
export const AuthContext = createContext({
  user: null,
  loading: true,
  isAdmin: false,
  profile: null,
  role: "guest",
  status: "none",
});

// List email admin
const ADMIN_EMAILS = ["sane.htth@gmail.com"]; // sửa thành email admin của bạn

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      // Chưa đăng nhập
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Có user
      setUser(firebaseUser);
      setIsAdmin(ADMIN_EMAILS.includes(firebaseUser.email || ""));

      try {
        const prof = await ensureUserProfile(firebaseUser);
        setProfile(prof);
      } catch (err) {
        console.error("ensureUserProfile error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    isAdmin,
    profile,
    role: profile?.role ?? "guest",
    status: profile?.status ?? "none",
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
