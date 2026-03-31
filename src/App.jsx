import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
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
  
    let result;
  
    if (editingId) {
      result = await supabase
        .from("type")
        .update({ type_name: name })
        .eq("type_id", editingId);
    } else {
      result = await supabase.from("type").insert({ type_name: name });
    }
  
    console.log("DB result:", result); // ดู data / error ที่นี่
  
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
    setEditingId(item.type_id);
    setName(item.type_name || "");
  };

  const handleDelete = async (id) => {
    await supabase.from("type").delete().eq("type_id", id);
    fetchTypes();
  };

  return (
    <div style={{ padding: "16px" }}>
      <h1>Type List</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="ชื่อ type"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" style={{ marginLeft: "8px" }}>
          {editingId ? "บันทึก" : "เพิ่ม"}
        </button>
      </form>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <ul>
          {types.map((item) => (
            <li key={item.type_id}>
              {item.type_name}{" "}
              <button type="button" onClick={() => handleEdit(item)}>
                แก้ไข
              </button>
              <button type="button" onClick={() => handleDelete(item.type_id)}>
                ลบ
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;