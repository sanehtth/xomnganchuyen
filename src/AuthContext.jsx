import { createContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import { ensureUserRecord } from "./services/userService";

export const AuthContext = createContext({
  user: null,
  loading: true,
  isAdmin: false,
});

const ADMIN_EMAILS = [
  "sane.htth@gmail.com",
  // thêm email admin khác ở đây
];


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
const [memberStatus, setMemberStatus] = useState("guest");
const [role, setRole] = useState("guest");

  useEffect(() => {
  const unsub = auth.onAuthStateChanged(async (u) => {
    setUser(u);
    const admin = u ? ADMIN_EMAILS.includes(u.email) : false;
    setIsAdmin(admin);

    if (u) {
      const dbUser = await ensureUserRecord(u, admin);

      setMemberStatus(dbUser?.status ?? "guest");
      setRole(dbUser?.role ?? "guest");
    }

    setLoading(false);
  });

  return unsub;
}, []);


  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
