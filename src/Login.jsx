import { useState } from "react";
import { useAuth } from "./auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await login(username, password);
    setBusy(false);
    if (!res.ok) setError(res.message || "เข้าสู่ระบบไม่สำเร็จ");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f1f5f9",
        padding: 16,
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>เข้าสู่ระบบ</h1>
        <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 14 }}>
          master / admin / user ตามสิทธิ์ในตาราง auth
        </p>

        <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
          ชื่อผู้ใช้
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              marginTop: 6,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              boxSizing: "border-box",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 16, fontSize: 14 }}>
          รหัสผ่าน
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              marginTop: 6,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              boxSizing: "border-box",
            }}
          />
        </label>

        {error ? (
          <p style={{ color: "#dc2626", fontSize: 14, margin: "0 0 12px" }}>{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 600,
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "กำลังเข้า..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}
