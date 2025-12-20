import { createContext, useEffect, useState, useContext } from "react";
import { auth, db } from "./firebase";
import { ref, get } from "firebase/database";

export const AuthContext = createContext({
  user: null,
  loading: true,
  isAdmin: false,
  memberStatus: "none", // none | pending | approved
  role: "guest",        // guest | member | associate
});

const ADMIN_EMAILS = [
  "sane.htth@gmail.com",
  // nếu sau này có thêm admin thì thêm email vào đây
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

      if (u) {
        // Xác định admin theo email
        const admin = ADMIN_EMAILS.includes(u.email || "");
        setIsAdmin(admin);

        // CHỈ ĐỌC dữ liệu user từ Realtime Database
        try {
          const userRef = ref(db, `users/${u.uid}`);
          const snap = await get(userRef);
          const data = snap.exists() ? snap.val() : {};

          const dbRole = data.role || "guest";
          const dbStatus = data.status || "none";

          setRole(dbRole);
          setMemberStatus(dbStatus);
        } catch (err) {
          console.error("Lỗi khi đọc user record:", err);
          // Nếu đọc DB lỗi thì vẫn cho login, nhưng coi như guest chưa gửi yêu cầu
          setRole("guest");
          setMemberStatus("none");
        }
      } else {
        // Không có user (đã logout)
        setIsAdmin(false);
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

// Hook tiện dùng
export function useAuth() {
  return useContext(AuthContext);
}
