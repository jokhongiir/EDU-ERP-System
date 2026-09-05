import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
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
  FiAlertTriangle,
  FiUserPlus,
  FiCheck,
  FiUserMinus,
  FiLayers,
} from "react-icons/fi";
import "./Groups.css";

const INITIAL_FORM = {
  name: "",
  teacher_id: "",
  course_id: "",
  start_date: "",
  start_time: "",
  end_time: "",
  schedule_type: "all",
};

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
  const [editId, setEditId] = useState(null);
  const [formValues, setFormValues] = useState(INITIAL_FORM);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [removeStudentData, setRemoveStudentData] = useState(null);
  const [quickAddGroup, setQuickAddGroup] = useState(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [quickSelected, setQuickSelected] = useState([]);
  const [removingId, setRemovingId] = useState(null);
  const [errorModal, setErrorModal] = useState(null);

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
        supabase
          .from("students")
          .select("*")
          .eq("branch_id", branchId)
          .eq("is_archived", false),
      ]);
      setGroups(g.data || []);
      setTeachers(t.data || []);
      setCourses(c.data || []);
      setStudents(s.data || []);
    } catch (err) {
      setErrorModal(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const open =
      modalOpen ||
      selectedGroup ||
      deleteId ||
      quickAddGroup ||
      removeStudentData ||
      errorModal;
    document.body.style.overflow = open ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    modalOpen,
    selectedGroup,
    deleteId,
    quickAddGroup,
    removeStudentData,
    errorModal,
  ]);

  const teacherMap = useMemo(
    () => new Map(teachers.map((t) => [t.id, t.name])),
    [teachers],
  );
  const courseMap = useMemo(
    () => new Map(courses.map((c) => [c.id, c.name])),
    [courses],
  );

  const getTeacher = (id) => teacherMap.get(id) || "Unassigned";
  const getCourse = (id) => courseMap.get(id) || "No course";
  const getStudentsCount = (groupId) =>
    students.filter((s) => s.group_id === groupId).length;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => {
    setFormValues(INITIAL_FORM);
    setEditId(null);
    setModalOpen(false);
  };

  const openCreate = () => {
    setFormValues(INITIAL_FORM);
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (g) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValues.name.trim() || !branchId) return;
    setSaving(true);

    const payload = {
      ...formValues,
      teacher_id: formValues.teacher_id || null,
      course_id: formValues.course_id || null,
      start_date: formValues.start_date || null,
      start_time: formValues.start_time || null,
      end_time: formValues.end_time || null,
      branch_id: branchId,
    };

    try {
      const query = editId
        ? supabase.from("groups").update(payload).eq("id", editId)
        : supabase.from("groups").insert([payload]);

      const { error } = await query;
      if (error) throw error;

      resetForm();
      fetchData();
    } catch (err) {
      setErrorModal(err.message || "Failed to save group");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickSelected.length || !quickAddGroup) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({ group_id: quickAddGroup.id })
        .in("id", quickSelected);
      if (error) throw error;

      setQuickAddGroup(null);
      setQuickSelected([]);
      setQuickSearch("");
      fetchData();
    } catch (err) {
      setErrorModal(err.message || "Failed to add students");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await supabase
        .from("students")
        .update({ group_id: null })
        .eq("group_id", deleteId);
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
      setGroups((prev) => prev.filter((g) => g.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setErrorModal(err.message || "Failed to delete group");
    } finally {
      setSaving(false);
    }
  };

  const confirmRemoveStudent = async () => {
    if (!removeStudentData) return;
    setRemovingId(removeStudentData.id);
    try {
      const { error } = await supabase
        .from("students")
        .update({ group_id: null })
        .eq("id", removeStudentData.id);
      if (error) throw error;
      setStudents((prev) =>
        prev.map((s) =>
          s.id === removeStudentData.id ? { ...s, group_id: null } : s,
        ),
      );
      setRemoveStudentData(null);
    } catch (err) {
      setErrorModal(err.message || "Failed to remove student");
    } finally {
      setRemovingId(null);
    }
  };

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchSearch = g.name
        ?.toLowerCase()
        .includes(search.toLowerCase());
      const matchCourse =
        !filterCourse || String(g.course_id) === String(filterCourse);
      const matchTeacher =
        !filterTeacher || String(g.teacher_id) === String(filterTeacher);
      return matchSearch && matchCourse && matchTeacher;
    });
  }, [groups, search, filterCourse, filterTeacher]);

  const quickFilteredStudents = useMemo(() => {
    if (!quickAddGroup) return [];
    const available = students.filter(
      (s) => s.group_id !== quickAddGroup.id,
    );
    if (!quickSearch.trim()) return available;
    const q = quickSearch.toLowerCase();
    return available.filter((s) => {
      const name =
        `${s.first_name || ""} ${s.last_name || ""} ${s.name || ""}`.toLowerCase();
      return name.includes(q);
    });
  }, [students, quickSearch, quickAddGroup]);

  return (
    <div className="gr-root">
      <div className="gr-header">
        <div>
          <h1 className="gr-title">
            {activeBranch?.name || "Branch"} • Groups
          </h1>
          <p className="gr-desc">
            Manage class schedules, teachers, and groups
          </p>
        </div>
        <button
          className="gr-create-btn"
          onClick={openCreate}
          disabled={!branchId}
        >
          <FiPlus /> New Group
        </button>
      </div>

      <div className="gr-filters">
        <div className="gr-search">
          <FiSearch />
          <input
            placeholder="Search group name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterTeacher}
          onChange={(e) => setFilterTeacher(e.target.value)}
        >
          <option value="">All Teachers</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="gr-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="gr-card gr-skeleton">
              <div className="gr-skel-line" />
              <div className="gr-skel-title" />
              <div className="gr-skel-text" />
              <div className="gr-skel-text short" />
            </div>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="gr-empty">
          <FiLayers size={44} />
          <h3>No groups found</h3>
          <p>Create a new group to get started</p>
        </div>
      ) : (
        <div className="gr-grid">
          {filteredGroups.map((g) => (
            <div
              key={g.id}
              className="gr-card"
              onClick={() => setSelectedGroup(g)}
            >
              <div className="gr-card-top" />
              <div className="gr-card-body">
                <div className="gr-card-icon">
                  <FiLayers />
                </div>
                <h3>{g.name}</h3>
                <div className="gr-card-meta">
                  <span>
                    <FiUser /> {getTeacher(g.teacher_id)}
                  </span>
                  <span>
                    <FiBookOpen /> {getCourse(g.course_id)}
                  </span>
                  <span>
                    <FiUsers /> {getStudentsCount(g.id)} Students
                  </span>
                </div>
              </div>
              <div
                className="gr-card-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="gr-action-row">
                  <button
                    className="gr-btn-icon"
                    onClick={() => openEdit(g)}
                    title="Edit"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="gr-btn-icon danger"
                    onClick={() => setDeleteId(g.id)}
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <button
                  className="gr-add-student-btn"
                  onClick={() => {
                    setQuickAddGroup(g);
                    setQuickSelected([]);
                    setQuickSearch("");
                  }}
                >
                  <FiUserPlus size={14} /> Add Student
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {createPortal(
        <>
          {/* Create / Edit */}
          {modalOpen && (
            <div className="gr-overlay" onClick={resetForm}>
              <div className="gr-modal" onClick={(e) => e.stopPropagation()}>
                <div className="gr-modal-header">
                  <h3>{editId ? "Edit Group" : "Create New Group"}</h3>
                  <button className="gr-close" onClick={resetForm}>
                    <FiX />
                  </button>
                </div>
                <form className="gr-form" onSubmit={handleSubmit}>
                  <div className="gr-field">
                    <label>Group Name *</label>
                    <input
                      name="name"
                      required
                      autoFocus
                      placeholder="e.g. General English Morning"
                      value={formValues.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="gr-row">
                    <div className="gr-field">
                      <label>Course</label>
                      <select
                        name="course_id"
                        value={formValues.course_id}
                        onChange={handleChange}
                      >
                        <option value="">Select course</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="gr-field">
                      <label>Teacher</label>
                      <select
                        name="teacher_id"
                        value={formValues.teacher_id}
                        onChange={handleChange}
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
                  <div className="gr-row">
                    <div className="gr-field">
                      <label>Start Date</label>
                      <input
                        type="date"
                        name="start_date"
                        value={formValues.start_date}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="gr-field">
                      <label>Schedule</label>
                      <select
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
                  <div className="gr-row">
                    <div className="gr-field">
                      <label>Start Time</label>
                      <input
                        type="time"
                        name="start_time"
                        value={formValues.start_time}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="gr-field">
                      <label>End Time</label>
                      <input
                        type="time"
                        name="end_time"
                        value={formValues.end_time}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="gr-submit"
                    disabled={saving}
                  >
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

          {/* Details — header + info fixed, roster scrolls */}
          {selectedGroup && (
            <div
              className="gr-overlay"
              onClick={() => setSelectedGroup(null)}
            >
              <div
                className="gr-modal gr-modal-lg gr-modal-fixed"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="gr-modal-header">
                  <h3>Group Details</h3>
                  <button
                    className="gr-close"
                    onClick={() => setSelectedGroup(null)}
                  >
                    <FiX />
                  </button>
                </div>

                <div className="gr-details-top">
                  <h2>{selectedGroup.name}</h2>
                  <span className="gr-tag">
                    {getCourse(selectedGroup.course_id)}
                  </span>
                  <div className="gr-detail-list">
                    <p>
                      <FiUser /> <strong>Teacher:</strong>{" "}
                      {getTeacher(selectedGroup.teacher_id)}
                    </p>
                    <p>
                      <FiCalendar /> <strong>Start:</strong>{" "}
                      {selectedGroup.start_date || "—"}
                    </p>
                    <p>
                      <FiClock /> <strong>Time:</strong>{" "}
                      {selectedGroup.start_time || "??:??"} –{" "}
                      {selectedGroup.end_time || "??:??"}
                    </p>
                    <p>
                      <FiUsers /> <strong>Students:</strong>{" "}
                      {getStudentsCount(selectedGroup.id)}
                    </p>
                  </div>
                  <h4 className="gr-roster-title">
                    <FiUsers /> Students Roster
                  </h4>
                </div>

                <div className="gr-details-scroll">
                  {students.filter((s) => s.group_id === selectedGroup.id)
                    .length === 0 ? (
                    <p className="gr-muted">No students in this group yet.</p>
                  ) : (
                    <ul className="gr-roster">
                      {students
                        .filter((s) => s.group_id === selectedGroup.id)
                        .map((s, i) => {
                          const name =
                            s.name ||
                            `${s.first_name || ""} ${s.last_name || ""}`.trim();
                          return (
                            <li key={s.id}>
                              <span>
                                <em>{String(i + 1).padStart(2, "0")}</em> {name}
                              </span>
                              <button
                                className="gr-btn-icon danger"
                                disabled={removingId === s.id}
                                onClick={() =>
                                  setRemoveStudentData({ id: s.id, name })
                                }
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Add */}
          {quickAddGroup && (
            <div
              className="gr-overlay"
              onClick={() => setQuickAddGroup(null)}
            >
              <div className="gr-modal" onClick={(e) => e.stopPropagation()}>
                <div className="gr-modal-header">
                  <div>
                    <h3>
                      <FiUserPlus /> Add Students
                    </h3>
                    <p className="gr-sub">
                      Group: <strong>{quickAddGroup.name}</strong>
                    </p>
                  </div>
                  <button
                    className="gr-close"
                    onClick={() => setQuickAddGroup(null)}
                  >
                    <FiX />
                  </button>
                </div>
                <form className="gr-form" onSubmit={handleQuickAdd}>
                  <div className="gr-search-inner">
                    <FiSearch />
                    <input
                      placeholder="Search students..."
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="gr-student-list">
                    {quickFilteredStudents.length === 0 ? (
                      <p className="gr-muted center">No available students</p>
                    ) : (
                      quickFilteredStudents.map((s) => {
                        const name =
                          s.name ||
                          `${s.first_name || ""} ${s.last_name || ""}`.trim();
                        const selected = quickSelected.includes(s.id);
                        const transfer =
                          s.group_id && s.group_id !== quickAddGroup.id;
                        return (
                          <div
                            key={s.id}
                            className={`gr-student-row ${selected ? "on" : ""}`}
                            onClick={() =>
                              setQuickSelected((prev) =>
                                selected
                                  ? prev.filter((id) => id !== s.id)
                                  : [...prev, s.id],
                              )
                            }
                          >
                            <div>
                              <span className="gr-s-name">{name}</span>
                              {transfer && (
                                <span className="gr-transfer">Transfer</span>
                              )}
                            </div>
                            <div className={`gr-check ${selected ? "on" : ""}`}>
                              {selected && <FiCheck />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="gr-footer-btns">
                    <button
                      type="button"
                      className="gr-btn-cancel"
                      onClick={() => setQuickAddGroup(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="gr-submit auto"
                      disabled={saving || !quickSelected.length}
                    >
                      {saving
                        ? "Adding..."
                        : `Add Selected (${quickSelected.length})`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete confirm */}
          {deleteId && (
            <div className="gr-overlay" onClick={() => setDeleteId(null)}>
              <div
                className="gr-modal gr-confirm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="gr-confirm-icon danger">
                  <FiAlertTriangle />
                </div>
                <h3>Delete Group</h3>
                <p>
                  Are you sure you want to delete this group? Students will be
                  unassigned. This cannot be undone.
                </p>
                <div className="gr-confirm-btns">
                  <button
                    className="gr-btn-cancel"
                    onClick={() => setDeleteId(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="gr-btn-danger"
                    onClick={confirmDelete}
                    disabled={saving}
                  >
                    {saving ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Remove student */}
          {removeStudentData && (
            <div
              className="gr-overlay gr-z-high"
              onClick={() => setRemoveStudentData(null)}
            >
              <div
                className="gr-modal gr-confirm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="gr-confirm-icon danger">
                  <FiUserMinus />
                </div>
                <h3>Remove Student</h3>
                <p>
                  Remove <strong>{removeStudentData.name}</strong> from this
                  group?
                </p>
                <div className="gr-confirm-btns">
                  <button
                    className="gr-btn-cancel"
                    onClick={() => setRemoveStudentData(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="gr-btn-danger"
                    onClick={confirmRemoveStudent}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {errorModal && (
            <div className="gr-overlay" onClick={() => setErrorModal(null)}>
              <div
                className="gr-modal gr-confirm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="gr-confirm-icon danger">
                  <FiAlertTriangle />
                </div>
                <h3>Error</h3>
                <p>{errorModal}</p>
                <div className="gr-confirm-btns single">
                  <button
                    className="gr-submit auto"
                    onClick={() => setErrorModal(null)}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body,
      )}
    </div>
  );
}