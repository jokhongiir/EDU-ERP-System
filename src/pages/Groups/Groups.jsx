import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom"; // importing Portal
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

  // ================= FORM STATE =================
  const [form, setForm] = useState({
    name: "",
    teacher_id: "",
    course_id: "",
    start_date: "",
    start_time: "",
    end_time: "",
    schedule_type: "all",
  });

  // ================= FETCH DATA =================
  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [g, t, c, s] = await Promise.all([
        supabase.from("groups").select("*").eq("branch_id", branchId).order("created_at", { ascending: false }),
        supabase.from("teachers").select("*").eq("branch_id", branchId),
        supabase.from("courses").select("*").eq("branch_id", branchId),
        supabase.from("students").select("*").eq("branch_id", branchId),
      ]);

      setGroups(g.data || []);
      setTeachers(t.data || []);
      setCourses(c.data || []);
      setStudents(s.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= MODAL SCROLL LOCK =================
  useEffect(() => {
    if (modalOpen || selectedGroup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalOpen, selectedGroup]);

  // ================= HELPERS =================
  const getTeacher = (id) => teachers.find((t) => t.id === id)?.name || "Unassigned";
  const getCourse = (id) => courses.find((c) => c.id === id)?.name || "No course";
  const getStudentsCount = (groupId) => students.filter((s) => s.group_id === groupId).length;

  const getScheduleLabel = (type) => {
    const labels = { odd: "Odd days", even: "Even days", all: "Every day" };
    return labels[type] || "Every day";
  };

  // ================= EVENT HANDLERS =================
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Group name is required");

    setSaving(true);
    const payload = {
      ...form,
      branch_id: branchId,
      teacher_id: form.teacher_id || null,
      course_id: form.course_id || null,
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

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    await supabase.from("groups").delete().eq("id", id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

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

  // ================= FILTER LOGIC =================
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
      const matchCourse = !filterCourse || String(g.course_id) === String(filterCourse);
      const matchTeacher = !filterTeacher || String(g.teacher_id) === String(filterTeacher);
      return matchSearch && matchCourse && matchTeacher;
    });
  }, [groups, search, filterCourse, filterTeacher]);

  // ================= MODALS =================
  const renderModals = () => {
    return createPortal(
      <>
        {/* CREATE / EDIT MODAL */}
        {modalOpen && (
          <div className="app-modal-overlay" onClick={resetForm}>
            <div className="app-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="app-modal-header">
                <h3 className="modal-title">
                  {editId ? "Edit Group" : "Create New Group"}
                </h3>
                <button className="modal-close-btn" onClick={resetForm}>
                  <FiX />
                </button>
              </div>

              <form className="group-entry-form" onSubmit={handleSubmit}>
                <div className="form-group-item">
                  <label className="form-label">Group Name</label>
                  <input
                    className="form-control-input"
                    name="name"
                    autoFocus
                    placeholder="e.g. General English Morning"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row-grid">
                  <div className="form-group-item">
                    <label className="form-label">Course</label>
                    <select
                      className="form-control-select"
                      name="course_id"
                      onChange={handleChange}
                      value={form.course_id}
                    >
                      <option value="">Select course</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-item">
                    <label className="form-label">Teacher</label>
                    <select
                      className="form-control-select"
                      name="teacher_id"
                      onChange={handleChange}
                      value={form.teacher_id}
                    >
                      <option value="">Select teacher</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row-grid">
                  <div className="form-group-item">
                    <label className="form-label">Start Date</label>
                    <input
                      className="form-control-input"
                      type="date"
                      name="start_date"
                      value={form.start_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label">Schedule Type</label>
                    <select
                      className="form-control-select"
                      name="schedule_type"
                      value={form.schedule_type}
                      onChange={handleChange}
                    >
                      <option value="all">Every day</option>
                      <option value="odd">Odd days (Mon, Wed, Fri)</option>
                      <option value="even">Even days (Tue, Thu, Sat)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-grid">
                  <div className="form-group-item">
                    <label className="form-label">Start Time</label>
                    <input
                      className="form-control-input"
                      type="time"
                      name="start_time"
                      value={form.start_time}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label">End Time</label>
                    <input
                      className="form-control-input"
                      type="time"
                      name="end_time"
                      value={form.end_time}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <button className="form-submit-button" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editId
                    ? "Save Changes"
                    : "Create Group"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DETAIL MODAL */}
        {selectedGroup && (
          <div
            className="app-modal-overlay"
            onClick={() => setSelectedGroup(null)}
          >
            <div
              className="app-modal-box detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="app-modal-header">
                <h3 className="modal-title">Group Details</h3>
                <button
                  className="modal-close-btn"
                  onClick={() => setSelectedGroup(null)}
                >
                  <FiX />
                </button>
              </div>

              <div className="group-full-details">
                <div className="info-badge">
                  <h2 className="info-title">{selectedGroup.name}</h2>
                  <span className="course-tag">
                    {getCourse(selectedGroup.course_id)}
                  </span>
                </div>

                <div className="info-list">
                  <p className="detail-row">
                    <FiUser /> <strong>Teacher:</strong>{" "}
                    {getTeacher(selectedGroup.teacher_id)}
                  </p>
                  <p className="detail-row">
                    <FiCalendar /> <strong>Start Date:</strong>{" "}
                    {selectedGroup.start_date || "Unknown"}
                  </p>
                  <p className="detail-row">
                    <FiClock /> <strong>Time:</strong>{" "}
                    {selectedGroup.start_time || "??:??"} -{" "}
                    {selectedGroup.end_time || "??:??"}
                  </p>
                  <p className="detail-row">
                    <FiCalendar /> <strong>Schedule:</strong>{" "}
                    {getScheduleLabel(selectedGroup.schedule_type)}
                  </p>
                  <p className="detail-row">
                    <FiUsers /> <strong>Students:</strong>{" "}
                    {getStudentsCount(selectedGroup.id)} active
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </>,
      document.body
    );
  };

  return (
    <div className="groups-container">
      {/* HEADER */}
      <div className="groups-top-bar">
        <div className="groups-titles">
          <h2 className="groups-main-title">
            {activeBranch?.name || "Branch"} • Groups
          </h2>
          <p className="groups-sub-title">
            Manage class schedules, teachers, and groups
          </p>
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
            placeholder="Search group name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select-dropdown"
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="filter-select-dropdown"
          value={filterTeacher}
          onChange={(e) => setFilterTeacher(e.target.value)}
        >
          <option value="">All teachers</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="loading-state">Loading groups...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="empty-state">No groups found.</div>
      ) : (
        <div className="groups-main-grid">
          {filteredGroups.map((g) => (
            <div
              key={g.id}
              className="group-item-card"
              onClick={() => setSelectedGroup(g)}
            >
              <div className="group-card-info">
                <h3 className="group-card-name">{g.name}</h3>

                <div className="card-details-stack">
                  <p>
                    <FiUser /> {getTeacher(g.teacher_id)}
                  </p>
                  <p>
                    <FiBookOpen /> {getCourse(g.course_id)}
                  </p>
                  <p>
                    <FiUsers /> {getStudentsCount(g.id)} Students
                  </p>
                </div>
              </div>

              <div
                className="group-card-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="action-btn edit-action"
                  onClick={() => handleEdit(g)}
                >
                  <FiEdit2 />
                </button>

                <button
                  className="action-btn delete-action"
                  onClick={() => handleDelete(g.id)}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      {renderModals()}
    </div>
  );
}