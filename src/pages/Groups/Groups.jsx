import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
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
  FiAlertTriangle,
} from "react-icons/fi";

export default function Groups({ activeBranch }) {
  const branchId = activeBranch?.id;
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
  const [deleteId, setDeleteId] = useState(null);
  
  const [formValues, setFormValues] = useState({
    name: "",
    teacher_id: "",
    course_id: "",
    start_date: "",
    start_time: "",
    end_time: "",
    schedule_type: "all",
  });

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [g, t, c, s] = await Promise.all([
        supabase
          .from("groups")
          .select("*")
          .eq("branch_id", branchId)
          .order("created_at", { ascending: false }),
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

  useEffect(() => {
    if (modalOpen || selectedGroup || deleteId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalOpen, selectedGroup, deleteId]);

  const getTeacher = (id) =>
    teachers.find((t) => t.id === id)?.name || "Unassigned";
  const getCourse = (id) =>
    courses.find((c) => c.id === id)?.name || "No course";
  const getStudentsCount = (groupId) =>
    students.filter((s) => s.group_id === groupId).length;
  const getScheduleLabel = (type) => {
    const labels = { odd: "Odd days", even: "Even days", all: "Every day" };
    return labels[type] || "Every day";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => {
    setFormValues({
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
    if (!formValues.name.trim()) return;
    setSaving(true);
    const payload = {
      name: formValues.name,
      teacher_id: formValues.teacher_id || null,
      course_id: formValues.course_id || null,
      start_date: formValues.start_date || null,
      start_time: formValues.start_time || null,
      end_time: formValues.end_time || null,
      schedule_type: formValues.schedule_type,
      branch_id: branchId,
    };
    try {
      let result;
      if (editId) {
        result = await supabase.from("groups").update(payload).eq("id", editId);
      } else {
        result = await supabase.from("groups").insert([payload]);
      }
      if (result.error) {
        throw result.error;
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Supabase operation failed:", err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("groups").delete().eq("id", deleteId);
      if (error) throw error;
      setGroups((prev) => prev.filter((g) => g.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete group:", err.message);
    }
  };

  const handleEdit = (g) => {
    setFormValues({
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

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
      const matchCourse =
        !filterCourse || String(g.course_id) === String(filterCourse);
      const matchTeacher =
        !filterTeacher || String(g.teacher_id) === String(filterTeacher);
      return matchSearch && matchCourse && matchTeacher;
    });
  }, [groups, search, filterCourse, filterTeacher]);

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
                    value={formValues.name}
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
                      value={formValues.course_id}
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
                      value={formValues.teacher_id}
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
                      value={formValues.start_date}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group-item">
                    <label className="form-label">Schedule Type</label>
                    <select
                      className="form-control-select"
                      name="schedule_type"
                      value={formValues.schedule_type}
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
                      value={formValues.start_time}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group-item">
                    <label className="form-label">End Time</label>
                    <input
                      className="form-control-input"
                      type="time"
                      name="end_time"
                      value={formValues.end_time}
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

        {/* DETAILS MODAL WITH STUDENTS LIST */}
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
                    <FiUsers /> <strong>Total Students:</strong>{" "}
                    {getStudentsCount(selectedGroup.id)} active
                  </p>
                </div>

                {/* DYNAMIC STUDENTS LIST SECTION */}
                <div className="students-list-section" style={{ marginTop: "24px" }}>
                  <h4 style={{ 
                    marginBottom: "12px", 
                    borderBottom: "2px solid #f0f0f0", 
                    paddingBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#333"
                  }}>
                    <FiUsers /> Students Roster
                  </h4>
                  {students.filter((s) => s.group_id === selectedGroup.id).length === 0 ? (
                    <p style={{ color: "#8c8c8c", fontStyle: "italic", padding: "10px 0" }}>
                      No students registered in this group yet.
                    </p>
                  ) : (
                    <ul style={{ 
                      listStyle: "none", 
                      padding: 0, 
                      margin: 0, 
                      maxHeight: "220px", 
                      overflowY: "auto",
                      border: "1px solid #f0f0f0",
                      borderRadius: "6px"
                    }}>
                      {students
                        .filter((s) => s.group_id === selectedGroup.id)
                        .map((student, index) => (
                          <li 
                            key={student.id} 
                            style={{ 
                              padding: "10px 14px", 
                              borderBottom: index === students.filter((s) => s.group_id === selectedGroup.id).length - 1 ? "none" : "1px solid #f5f5f5", 
                              display: "flex", 
                              alignItems: "center",
                              gap: "12px",
                              backgroundColor: index % 2 === 0 ? "#ffffff" : "#fafafa"
                            }}
                          >
                            <span style={{ color: "#bfbfbf", fontSize: "13px", width: "20px" }}>
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span style={{ fontWeight: "500", color: "#262626" }}>
                              {student.name || `${student.first_name || ""} ${student.last_name || ""}`}
                            </span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ⚠️ CONFIRM DELETE MODAL */}
        {deleteId && (
          <div className="app-modal-overlay" onClick={() => setDeleteId(null)}>
            <div
              className="app-modal-box confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-icon-wrapper">
                <FiAlertTriangle />
              </div>
              <h3>Delete Group</h3>
              <p>Are you sure you want to delete this group? This action cannot be undone.</p>
              <div className="confirm-footer-btns">
                <button className="btn-no" onClick={() => setDeleteId(null)}>
                  Cancel
                </button>
                <button className="btn-yes" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </>,
      document.body,
    );
  };

  return (
    <div className="groups-container">
      <div className="groups-top-bar">
        <div className="title-area">
          <h1 className="page-main-title">
            {activeBranch?.name || "Branch"} • Groups
          </h1>
          <p className="page-description">
            Manage class schedules, teachers, and groups
          </p>
        </div>
        <button className="add-group-btn" onClick={() => setModalOpen(true)}>
          <FiPlus /> New Group
        </button>
      </div>
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
      {loading ? (
        <div className="groups-main-grid">
          {[...Array(6)].map((_, index) => (
            <div className="group-item-card skeleton-card" key={index}>
              <div className="group-card-info">
                <div className="skeleton skeleton-title"></div>
                <div className="card-details-stack">
                  <div className="skeleton skeleton-text"></div>
                  <div className="skeleton skeleton-text"></div>
                  <div className="skeleton skeleton-text short"></div>
                </div>
              </div>
              <div className="group-card-actions">
                <div className="skeleton skeleton-btn"></div>
                <div className="skeleton skeleton-btn"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="empty-state">No groups found.</div>
      ) : (
        <div className="groups-main-grid">
          {filteredGroups.map((g) => (
            <div
              key={g.id}
              className="group-item-card"
              onClick={() => setSelectedGroup(g)}
              style={{ cursor: "pointer" }}
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
                  onClick={() => setDeleteId(g.id)}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {renderModals()}
    </div>
  );
}