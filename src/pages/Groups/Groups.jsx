import { useEffect, useMemo, useState } from "react";
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
  FiSearch,
} from "react-icons/fi";

import "./Groups.css";

export default function Groups({ activeBranch }) {
  const branchId = activeBranch?.id;

  // ================= STATE =================
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ================= FILTER STATES =================
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // ================= MODAL =================
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editId, setEditId] = useState(null);

  // ================= FORM =================
  const [form, setForm] = useState({
    name: "",
    teacher_id: "",
    course_id: "",
    start_date: "",
    start_time: "",
    end_time: "",
  });

  // ================= FETCH =================
  const fetchData = async () => {
    if (!branchId) return;

    setLoading(true);

    try {
      const [g, t, c, s] = await Promise.all([
        supabase.from("groups").select("*").eq("branch_id", branchId),
        supabase.from("teachers").select("*").eq("branch_id", branchId),
        supabase.from("courses").select("*").eq("branch_id", branchId),
        supabase.from("students").select("*").eq("branch_id", branchId),
      ]);

      setGroups(g.data || []);
      setTeachers(t.data || []);
      setCourses(c.data || []);
      setStudents(s.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  // ================= HELPERS =================
  const getTeacher = (id) =>
    teachers.find((t) => t.id === id)?.name || "—";

  const getCourse = (id) =>
    courses.find((c) => c.id === id)?.name || "—";

  const getStudentsCount = (groupId) =>
    students.filter((s) => s.group_id === groupId).length;

  // ================= FORM =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

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

  // ================= CREATE / UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return alert("Group name required");

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      branch_id: branchId,
      teacher_id: form.teacher_id || null,
      course_id: form.course_id || null,
      start_date: form.start_date || null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
    };

    try {
      if (editId) {
        await supabase.from("groups").update(payload).eq("id", editId);
      } else {
        await supabase.from("groups").insert(payload);
      }

      resetForm();
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    const ok = window.confirm("⚠️ Delete this group?");
    if (!ok) return;

    await supabase.from("groups").delete().eq("id", id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  // ================= EDIT =================
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

  // ================= FILTER =================
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      return (
        g.name.toLowerCase().includes(search.toLowerCase()) &&
        (filterCourse ? g.course_id === filterCourse : true) &&
        (filterTeacher ? g.teacher_id === filterTeacher : true) &&
        (filterDate ? g.start_date === filterDate : true)
      );
    });
  }, [groups, search, filterCourse, filterTeacher, filterDate]);

  // ================= UI =================
  return (
    <div className="groups">

      {/* HEADER */}
      <div className="groups__header">
        <div>
          <h2>{activeBranch?.name || "Branch"} • Groups</h2>
          <p className="groups__sub">Manage students, teachers and schedules</p>
        </div>

        <button onClick={() => setModalOpen(true)}>
          <FiPlus /> New Group
        </button>
      </div>

      {/* FILTERS */}
      <div className="groups__filters">

        <div className="filter">
          <FiSearch />
          <input
            placeholder="Search group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
          <option value="">All Teachers</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <button
          className="reset-btn"
          onClick={() => {
            setSearch("");
            setFilterCourse("");
            setFilterTeacher("");
            setFilterDate("");
          }}
        >
          Reset
        </button>

      </div>

      {/* LOADING */}
      {loading && <div className="groups__loading">Loading...</div>}

      {/* EMPTY */}
      {!loading && filteredGroups.length === 0 && (
        <div className="groups__empty">
          <FiUsers size={42} />
          <p>No groups found</p>
        </div>
      )}

      {/* GRID */}
      <div className="groups__grid">
        {filteredGroups.map((g) => (
          <div key={g.id} className="groups__card">

            <div onClick={() => setSelectedGroup(g)}>
              <h3>{g.name}</h3>

              <p><FiUser /> {getTeacher(g.teacher_id)}</p>
              <p><FiBookOpen /> {getCourse(g.course_id)}</p>
              <p><FiUsers /> {getStudentsCount(g.id)} students</p>
              <p><FiCalendar /> {g.start_date || "—"}</p>
            </div>

            <div className="groups__actions">
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

      {/* MODAL */}
      {modalOpen && (
        <div className="modal">
          <div className="modal__content">

            <div className="modal__header">
              <h3>{editId ? "Edit Group" : "Create Group"}</h3>
              <FiX onClick={resetForm} />
            </div>

            <form onSubmit={handleSubmit}>

              <input
                name="name"
                placeholder="Group name"
                value={form.name}
                onChange={handleChange}
              />

              <select name="course_id" value={form.course_id} onChange={handleChange}>
                <option value="">Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select name="teacher_id" value={form.teacher_id} onChange={handleChange}>
                <option value="">Teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <input type="date" name="start_date" value={form.start_date} onChange={handleChange} />
              <input type="time" name="start_time" value={form.start_time} onChange={handleChange} />
              <input type="time" name="end_time" value={form.end_time} onChange={handleChange} />

              <button disabled={saving}>
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* DETAILS */}
      {selectedGroup && (
        <div className="modal">
          <div className="modal__content">

            <div className="modal__header">
              <h3>{selectedGroup.name}</h3>
              <FiX onClick={() => setSelectedGroup(null)} />
            </div>

            <div className="details">
              <p><FiUser /> {getTeacher(selectedGroup.teacher_id)}</p>
              <p><FiBookOpen /> {getCourse(selectedGroup.course_id)}</p>
              <p><FiCalendar /> {selectedGroup.start_date || "—"}</p>
              <p><FiClock /> {selectedGroup.start_time} - {selectedGroup.end_time}</p>
              <p><FiUsers /> {getStudentsCount(selectedGroup.id)} students</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}