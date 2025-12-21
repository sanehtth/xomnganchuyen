// src/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, loginWithGoogle as fbLoginWithGoogle, logout as fbLogout } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true); // Đang kiểm tra lần đầu
  const [loading, setLoading] = useState(false);          // Loading khi bấm nút login/logout

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setCheckingAuth(false); // => kết thúc “Đang kiểm tra đăng nhập…”
    });

    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await fbLoginWithGoogle();
      // onAuthStateChanged sẽ tự cập nhật user
    } catch (err) {
      console.error("Login error:", err);
      alert("Đăng nhập thất bại, bạn thử lại nhé.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await fbLogout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    checkingAuth,
    loading,
    loginWithGoogle,
    logout,
    // tạm thời chưa dùng role/status, sau này bạn nối vào Firestore
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
