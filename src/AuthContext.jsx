import { createContext, useEffect, useState, useContext } from "react";
import { auth } from "./firebase";
import { ensureUserRecord } from "./services/userService";

export const AuthContext = createContext({
  user: null,
  loading: true,
  isAdmin: false,
  memberStatus: "none", // none | pending | approved
  role: "guest",        // guest | member | associate
});

const ADMIN_EMAILS = [
  "sane.htth@gmail.com",
  // thêm email admin khác ở đây nếu cần
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberStatus, setMemberStatus] = useState("none");
  const [role, setRole] = useState("guest");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);

      const admin = !!u && ADMIN_EMAILS.includes(u.email || "");
      setIsAdmin(admin);

      if (u) {
        // ĐỌC / KHỞI TẠO USER TRONG DB
        const dbUser = await ensureUserRecord(u, admin);

        // Đọc role + status từ DB (không ghi đè nữa, logic nằm trong ensureUserRecord)
        const dbRole = dbUser?.role || "guest";
        const dbStatus = dbUser?.status || "none";

        setRole(dbRole);
        setMemberStatus(dbStatus);
      } else {
        // Không có user -> reset state
        setRole("guest");
        setMemberStatus("none");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        memberStatus,
        role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook tiện dùng trong component khác
export function useAuth() {
  return useContext(AuthContext);
}
