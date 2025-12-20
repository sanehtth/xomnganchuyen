import { createContext, useEffect, useState } from "react";
import { auth } from "./firebase";

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

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
        setUser(u);
        setIsAdmin(u ? ADMIN_EMAILS.includes(u.email) : false);
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
