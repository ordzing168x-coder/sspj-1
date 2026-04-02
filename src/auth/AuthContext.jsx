import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

const SESSION_KEY = "sspj_session";

const AuthContext = createContext(null);

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** master: ทุกอย่าง | admin: เพิ่ม/แก้ (ไม่ลบ) | user: ดูอย่างเดียว */
export function getPermissions(roleName) {
  const r = (roleName || "").toLowerCase();
  if (r === "master") {
    return { canRead: true, canCreate: true, canUpdate: true, canDelete: true };
  }
  if (r === "admin") {
    return { canRead: true, canCreate: true, canUpdate: true, canDelete: false };
  }
  return { canRead: true, canCreate: false, canUpdate: false, canDelete: false };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());

  const login = useCallback(async (username, password) => {
    const { data, error } = await supabase.rpc("login_user", {
      p_username: username.trim(),
      p_password: password,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.auth_name) {
      return { ok: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
    }

    const next = {
      user: {
        user_id: row.user_id,
        user_fname: row.user_fname,
        user_lname: row.user_lname,
        user_uname: row.user_uname,
      },
      role: String(row.auth_name).toLowerCase(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      role: session?.role ?? null,
      permissions: getPermissions(session?.role),
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
