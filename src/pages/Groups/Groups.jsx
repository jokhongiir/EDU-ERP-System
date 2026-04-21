import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiPlus,
  FiX,
  FiUsers,
  FiBookOpen,
  FiUser,
  FiCalendar,
  FiClock,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import "./Groups.css";

export default function Groups({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    teacher_id: "",
    course_id: "",
    start_date: "",
    start_time: "",
    end_time: "",
  });

  // ================= FETCH =================
  useEffect(() => {
    if (!branchId) return;
    fetchData();
  }, [branchId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [g, t, c, s] = await Promise.all([
        supabase.from("groups").select("*").eq("branch_id", branchId),
        supabase.from("teachers").select("*").eq("branch_id", branchId),
        supabase.from("courses").select("*").eq("branch_id", branchId),
        supabase.from("students").select("*").eq("branch_id", branchId),
      ]);

      if (g.error || t.error || c.error || s.error) {
        throw g.error || t.error || c.error || s.error;
      }

      setGroups(g.data || []);
      setTeachers(t.data || []);
      setCourses(c.data || []);
      setStudents(s.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ================= RESET =================
  const resetForm = () => {
    setForm({
      name: "",
      teacher_id: "",
      course_id: "",
      start_date: "",
      start_time: "",
      end_time: "",
    });
    setEditId(null);
    setModalOpen(false);
  };

  // ================= OPEN EDIT =================
  const handleEdit = (g) => {
    setForm({
      name: g.name || "",
      teacher_id: g.teacher_id || "",
      course_id: g.course_id || "",
      start_date: g.start_date || "",
      start_time: g.start_time || "",
      end_time: g.end_time || "",
    });

    setEditId(g.id);
    setModalOpen(true);
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      return alert("Group name required");
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        branch_id: branchId,

        teacher_id: form.teacher_id || null,
        course_id: form.course_id || null,

        start_date: form.start_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
      };

      let res;

      if (editId) {
        res = await supabase
          .from("groups")
          .update(payload)
          .eq("id", editId);
      } else {
        res = await supabase.from("groups").insert([payload]);
      }

      if (res.error) throw res.error;

      resetForm();
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!confirm("Delete this group?")) return;

    await supabase.from("groups").delete().eq("id", id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  // ================= HELPERS =================
  const getTeacher = (id) =>
    teachers.find((t) => t.id === id)?.name || "—";

  const getCourse = (id) =>
    courses.find((c) => c.id === id)?.name || "—";

  const getStudentsCount = (groupId) =>
    students.filter((s) => s.group_id === groupId).length;

  // ================= UI =================
  return (
    <div className="groups">

      {/* HEADER */}
      <div className="groups__header">
        <h1>Groups</h1>

        <button onClick={() => setModalOpen(true)}>
          <FiPlus /> Create Group
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>Loading...</p>}

      {/* GRID */}
      <div className="groups__grid">
        {groups.map((g) => (
          <div key={g.id} className="groups__card">

            <div onClick={() => setSelectedGroup(g)}>
              <h3>{g.name}</h3>

              <p><FiUser /> {getTeacher(g.teacher_id)}</p>
              <p><FiBookOpen /> {getCourse(g.course_id)}</p>
              <p><FiUsers /> {getStudentsCount(g.id)}</p>
              <p><FiCalendar /> {g.start_date || "—"}</p>
            </div>

            <div className="actions">
              <button onClick={() => handleEdit(g)}>
                <FiEdit2 />
              </button>

              <button onClick={() => handleDelete(g.id)}>
                <FiTrash2 />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* ================= MODAL ================= */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">

            <div className="modal-header">
              <h2>{editId ? "Edit Group" : "Create Group"}</h2>
              <FiX onClick={resetForm} />
            </div>

            <form onSubmit={handleSubmit}>

              <input
                name="name"
                placeholder="Group name"
                value={form.name}
                onChange={handleChange}
              />

              <select
                name="course_id"
                value={form.course_id}
                onChange={handleChange}
              >
                <option value="">Course (optional)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                name="teacher_id"
                value={form.teacher_id}
                onChange={handleChange}
              >
                <option value="">Teacher (optional)</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <input type="date" name="start_date" value={form.start_date} onChange={handleChange} />
              <input type="time" name="start_time" value={form.start_time} onChange={handleChange} />
              <input type="time" name="end_time" value={form.end_time} onChange={handleChange} />

              <button type="submit">
                {editId ? "Update" : "Create"}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ================= DETAILS ================= */}
      {selectedGroup && (
        <div className="modal-overlay">
          <div className="modal-box">

            <div className="modal-header">
              <h2>{selectedGroup.name}</h2>
              <FiX onClick={() => setSelectedGroup(null)} />
            </div>

            <div className="details">
              <p><FiUser /> {getTeacher(selectedGroup.teacher_id)}</p>
              <p><FiBookOpen /> {getCourse(selectedGroup.course_id)}</p>
              <p><FiCalendar /> {selectedGroup.start_date || "—"}</p>
              <p><FiClock /> {selectedGroup.start_time} - {selectedGroup.end_time}</p>
              <p><FiUsers /> {getStudentsCount(selectedGroup.id)}</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}