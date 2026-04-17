import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import "./Students.css";

export default function Students({ activeBranch }) {
  const navigate = useNavigate();

  const branchId = activeBranch?.id;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // ================= FETCH =================
  const fetchStudents = async () => {
    if (!branchId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("branch_id", branchId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
    } else {
      setStudents(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, [branchId]);

  // ================= DELETE =================
  const deleteStudent = async (id) => {
    if (!window.confirm("Delete student?")) return;

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);

    if (!error) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // ================= FILTER =================
  const filtered = students
    .filter((s) => {
      if (filter === "paid") return s.paid;
      if (filter === "unpaid") return !s.paid;
      return true;
    })
    .filter((s) =>
      `${s.first_name} ${s.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <div className="students-page">

      {/* HEADER */}
      <div className="students-header">
        <h2>{activeBranch?.name} • Students</h2>

        {/* ✅ PRO NAVIGATION */}
        <button
          onClick={() =>
            navigate(`/dashboard/${branchId}/addstudents`)
          }
        >
          + Add Student
        </button>
      </div>

      {/* CONTROLS */}
      <div className="students-controls">
        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="students-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Fee</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>
                <td>
                  {s.first_name} {s.last_name}
                </td>
                <td>{s.phone}</td>
                <td>{s.monthly_fee}</td>
                <td>{s.paid ? "Paid" : "Unpaid"}</td>
                <td>
                  <button onClick={() => deleteStudent(s.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}