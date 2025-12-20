// src/AuthContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, ensureUserDoc } from "./firebase";
import { firestore } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

export const AuthContext = createContext({
  user: null,
  loading: true,
  isAdmin: false,
  profile: null,
  role: "guest",
  status: "none",
});

const ADMIN_EMAILS = ["sane.htth@gmail.com"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Lắng nghe trạng thái login
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setIsAdmin(ADMIN_EMAILS.includes(firebaseUser.email || ""));

      // Đảm bảo doc tồn tại
      const ensured = await ensureUserDoc(firebaseUser);

      // Lắng nghe realtime user doc từ Firestore
      const userRef = doc(firestore, "users", firebaseUser.uid);
      const unsubDoc = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          setProfile(ensured || null);
        }
      });

      setLoading(false);

      // cleanup khi logout
      return () => {
        unsubDoc();
      };
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    role: profile?.role || "guest",
    status: profile?.status || "none",
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
