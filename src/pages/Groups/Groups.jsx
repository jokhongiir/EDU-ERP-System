import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import "./Groups.css";

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

export default function Groups({ activeBranch }) {
  const branchId = activeBranch?.id;

  // ================= STATE =================
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");

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
    schedule_type: "all", // 👈 odd/even/all
  });

  // ================= FETCH =================
  const fetchData = async () => {
    if (!branchId) return;

    setLoading(true);

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

    setLoading(false);
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

  const getScheduleLabel = (type) => {
    if (type === "odd") return "Odd Days";
    if (type === "even") return "Even Days";
    return "Every Day";
  };

  // ================= FORM CHANGE =================
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
      schedule_type: "all",
    });
    setEditId(null);
    setModalOpen(false);
  };

  // ================= SAVE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return alert("Group name required");

    setSaving(true);

    const payload = {
      name: form.name,
      branch_id: branchId,
      teacher_id: form.teacher_id || null,
      course_id: form.course_id || null,
      start_date: form.start_date || null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      schedule_type: form.schedule_type,
    };

    if (editId) {
      await supabase.from("groups").update(payload).eq("id", editId);
    } else {
      await supabase.from("groups").insert(payload);
    }

    setSaving(false);
    resetForm();
    fetchData();
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    const ok = confirm("Delete this group?");
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
      schedule_type: g.schedule_type || "all",
    });

    setEditId(g.id);
    setModalOpen(true);
  };

  // ================= FILTER =================
  const filteredGroups = useMemo(() => {
    return groups.filter((g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterCourse ? g.course_id === filterCourse : true) &&
      (filterTeacher ? g.teacher_id === filterTeacher : true)
    );
  }, [groups, search, filterCourse, filterTeacher]);

  // ================= UI =================
  return (
    <div className="groups-container">

      {/* HEADER */}
      <div className="groups-top-bar">
        <div className="groups-titles">
          <h2 className="groups-main-title">{activeBranch?.name || "Branch"} • Groups</h2>
          <p className="groups-sub-title">Professional schedule & group management</p>
        </div>

        <button className="add-group-btn" onClick={() => setModalOpen(true)}>
          <FiPlus /> New Group
        </button>
      </div>

      {/* FILTERS */}
      <div className="groups-filter-wrapper">

        <div className="search-input-box">
          <FiSearch className="search-icon" />
          <input
            className="filter-field-input"
            placeholder="Search group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="filter-select-dropdown" value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select className="filter-select-dropdown" value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
          <option value="">All Teachers</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

      </div>

      {/* GRID */}
      <div className="groups-main-grid">
        {filteredGroups.map((g) => (
          <div key={g.id} className="group-item-card">

            <div className="group-card-info" onClick={() => setSelectedGroup(g)}>
              <h3 className="group-card-name">{g.name}</h3>

              <p className="group-detail-item"><FiUser /> {getTeacher(g.teacher_id)}</p>
              <p className="group-detail-item"><FiBookOpen /> {getCourse(g.course_id)}</p>
              <p className="group-detail-item"><FiUsers /> {getStudentsCount(g.id)} students</p>
              <p className="group-detail-item"><FiCalendar /> {g.start_date || "—"}</p>
              <p className="group-detail-item"><FiCalendar />{getScheduleLabel(g.schedule_type)}</p>
            </div>

            <div className="group-card-actions">
              <button className="action-btn edit-action" onClick={() => handleEdit(g)}>
                <FiEdit2 />
              </button>
              <button className="action-btn delete-action" onClick={() => handleDelete(g.id)}>
                <FiTrash2 />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="app-modal-overlay">
          <div className="app-modal-box">

            <div className="app-modal-header">
              <h3 className="modal-title">{editId ? "Edit Group" : "Create Group"}</h3>
              <FiX className="modal-close-icon" onClick={resetForm} />
            </div>

            <form className="group-entry-form" onSubmit={handleSubmit}>

              <input
                className="form-control-input"
                name="name"
                placeholder="Group name"
                value={form.name}
                onChange={handleChange}
              />

              <select className="form-control-select" name="course_id" onChange={handleChange} value={form.course_id}>
                <option value="">Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select className="form-control-select" name="teacher_id" onChange={handleChange} value={form.teacher_id}>
                <option value="">Teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <input className="form-control-input" type="date" name="start_date" value={form.start_date} onChange={handleChange} />
              <input className="form-control-input" type="time" name="start_time" value={form.start_time} onChange={handleChange} />
              <input className="form-control-input" type="time" name="end_time" value={form.end_time} onChange={handleChange} />

              {/* SCHEDULE */}
              <select className="form-control-select" name="schedule_type" value={form.schedule_type} onChange={handleChange}>
                <option value="all">Every Day</option>
                <option value="odd">Odd Days</option>
                <option value="even">Even Days</option>
              </select>

              <button className="form-submit-button" disabled={saving}>
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* DETAILS */}
      {selectedGroup && (
        <div className="app-modal-overlay">
          <div className="app-modal-box">

            <div className="app-modal-header">
              <h3 className="modal-title">{selectedGroup.name}</h3>
              <FiX className="modal-close-icon" onClick={() => setSelectedGroup(null)} />
            </div>

            <div className="group-full-details">
              <p className="detail-row"><FiUser /> {getTeacher(selectedGroup.teacher_id)}</p>
              <p className="detail-row"><FiBookOpen /> {getCourse(selectedGroup.course_id)}</p>
              <p className="detail-row"><FiCalendar /> {selectedGroup.start_date}</p>
              <p className="detail-row"><FiClock /> {selectedGroup.start_time} - {selectedGroup.end_time}</p>
              <p className="detail-row"><FiCalendar />{getScheduleLabel(selectedGroup.schedule_type)}</p>
              <p className="detail-row"><FiUsers /> {getStudentsCount(selectedGroup.id)} students</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}