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

/** master: ทุกอย่าง | admin: เพิ่ม/แก้ (ลบไม่ได้) | user: ดูอย่างเดียว */
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
  const [pin, setPin] = useState(null); // keep in memory only (not stored in sessionStorage)

  // PIN confirm modal state
  const [pinConfirm, setPinConfirm] = useState({
    open: false,
    message: "",
    resolve: null,
  });
  const [pinInput, setPinInput] = useState("");

  const login = useCallback(async (username, password) => {
    const { data, error } = await supabase.rpc("login_user", {
      p_username: username.trim(),
      p_password: password,
    });

    if (error) return { ok: false, message: error.message };

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.auth_name) {
      return { ok: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
    }

    const nextSession = {
      user: {
        user_id: row.user_id,
        user_fname: row.user_fname,
        user_lname: row.user_lname,
        user_uname: row.user_uname,
      },
      role: String(row.auth_name).toLowerCase(),
      rankName: row.rank_name || null,
    };

    // Keep PIN only in memory; still fetches from DB after login
    setPin(row.user_pin == null ? null : String(row.user_pin));

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPin(null);
  }, []);

  const confirmWithPin = useCallback(
    (message) => {
      return new Promise((resolve) => {
        setPinInput("");
        setPinConfirm({ open: true, message, resolve });
      });
    },
    [setPinConfirm]
  );

  const handlePinSubmit = () => {
    const resolve = pinConfirm.resolve;
    if (typeof resolve !== "function") {
      setPinConfirm({ open: false, message: "", resolve: null });
      return;
    }

    if (pin == null) {
      resolve(false);
      setPinConfirm({ open: false, message: "", resolve: null });
      return;
    }

    const ok = String(pinInput) === String(pin);
    resolve(ok);
    setPinConfirm({ open: false, message: "", resolve: null });
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      role: session?.role ?? null,
      rankName: session?.rankName ?? null,
      permissions: getPermissions(session?.role),
      login,
      logout,
      confirmWithPin,
    }),
    [session, login, logout, confirmWithPin]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}

      {pinConfirm.open ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onMouseDown={(e) => {
            // click outside closes => cancel
            if (e.target === e.currentTarget) {
              const resolve = pinConfirm.resolve;
              if (typeof resolve === "function") resolve(false);
              setPinConfirm({ open: false, message: "", resolve: null });
            }
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>{pinConfirm.message}</h3>

            <input
              type="password"
              inputMode="numeric"
              placeholder="กรอกรหัส PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxSizing: "border-box",
                marginBottom: 12,
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePinSubmit();
                if (e.key === "Escape") {
                  const resolve = pinConfirm.resolve;
                  if (typeof resolve === "function") resolve(false);
                  setPinConfirm({ open: false, message: "", resolve: null });
                }
              }}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  const resolve = pinConfirm.resolve;
                  if (typeof resolve === "function") resolve(false);
                  setPinConfirm({ open: false, message: "", resolve: null });
                }}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handlePinSubmit}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

