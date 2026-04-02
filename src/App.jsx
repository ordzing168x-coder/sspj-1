import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./auth/AuthContext";
import Login from "./Login";

function TypeList() {
  const { user, role, permissions, logout } = useAuth();
  const [types, setTypes] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("type")
      .select("*")
      .order("type_id", { ascending: true });

    if (!error) setTypes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!permissions.canCreate && !permissions.canUpdate) return;

    let result;

    if (editingId) {
      if (!permissions.canUpdate) return;
      result = await supabase
        .from("type")
        .update({ type_name: name })
        .eq("type_id", editingId);
    } else {
      if (!permissions.canCreate) return;
      result = await supabase.from("type").insert({ type_name: name });
    }

    const { error } = result;
    if (error) {
      alert("Supabase error: " + error.message);
      return;
    }

    setName("");
    setEditingId(null);
    fetchTypes();
  };

  const handleEdit = (item) => {
    if (!permissions.canUpdate) return;
    setEditingId(item.type_id);
    setName(item.type_name || "");
  };

  const handleDelete = async (id) => {
    if (!permissions.canDelete) return;
    await supabase.from("type").delete().eq("type_id", id);
    fetchTypes();
  };

  const label =
    role === "master"
      ? "Master — ทำได้ทุกอย่าง"
      : role === "admin"
        ? "Admin — เพิ่ม/แก้ไขได้ (ลบไม่ได้)"
        : "User — ดูอย่างเดียว";

  return (
    <div style={{ padding: "16px", maxWidth: 560, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{label}</p>
          <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
            {user?.user_fname || ""} {user?.user_lname || ""}{" "}
            <span style={{ fontWeight: 400, color: "#64748b" }}>
              (@{user?.user_uname})
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          ออกจากระบบ
        </button>
      </header>

      <h1 style={{ marginTop: 0 }}>Type List</h1>

      {(permissions.canCreate || permissions.canUpdate) && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="ชื่อ type"
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={editingId ? !permissions.canUpdate : !permissions.canCreate}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
          <button
            type="submit"
            style={{ marginLeft: "8px", padding: "8px 14px", borderRadius: 8 }}
            disabled={
              editingId ? !permissions.canUpdate : !permissions.canCreate
            }
          >
            {editingId ? "บันทึก" : "เพิ่ม"}
          </button>
        </form>
      )}

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {types.map((item) => (
            <li
              key={item.type_id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <span>{item.type_name}</span>
              <span style={{ display: "flex", gap: 8 }}>
                {permissions.canUpdate && (
                  <button type="button" onClick={() => handleEdit(item)}>
                    แก้ไข
                  </button>
                )}
                {permissions.canDelete && (
                  <button type="button" onClick={() => handleDelete(item.type_id)}>
                    ลบ
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function App() {
  const { session } = useAuth();
  if (!session) return <Login />;
  return <TypeList />;
}

export default App;
