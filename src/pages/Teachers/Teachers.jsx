import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../services/supabaseClient";
import "./Teachers.css";

import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiSearch,
  FiSave,
  FiUser,
  FiPhone,
  FiBookOpen,
  FiUsers,
  FiDollarSign,
  FiAlertTriangle,
  FiUserPlus,
  FiMail,
  FiEye,
  FiEyeOff,
  FiLock,
} from "react-icons/fi";

export default function Teachers({ activeBranch }) {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [editId, setEditId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    course_id: "",
    salary_paid: false,
    last_payment: "",
    next_payment: "",
    notes: "",
  });

  const branchId = activeBranch?.id;
  const getTodayStr = () => new Date().toISOString().slice(0, 10);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!branchId) return;

      if (!silent) setLoading(true);
      try {
        const [tRes, cRes, sRes] = await Promise.all([
          supabase
            .from("teachers")
            .select("*")
            .eq("branch_id", branchId)
            .order("created_at", { ascending: false }),
          supabase.from("courses").select("*").eq("branch_id", branchId),
          supabase.from("students").select("*").eq("branch_id", branchId),
        ]);

        if (tRes.error) throw tRes.error;
        if (cRes.error) throw cRes.error;
        if (sRes.error) throw sRes.error;

        setTeachers(tRes.data || []);
        setCourses(cRes.data || []);
        setStudents(sRes.data || []);
      } catch (err) {
        console.error("Error loading teachers data:", err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [branchId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const anyOpen = modalOpen || viewOpen || deleteId;
    document.body.style.overflow = anyOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalOpen, viewOpen, deleteId]);

  const courseMap = useMemo(() => {
    return new Map(courses.map((c) => [c.id, c.name]));
  }, [courses]);

  const teacherStatsMap = useMemo(() => {
    const stats = {};
    teachers.forEach((teacher) => {
      stats[String(teacher.id)] = { count: 0, active: 0, income: 0 };
    });

    students.forEach((student) => {
      const teacherId = String(student.teacher_id || "");
      if (!teacherId || !stats[teacherId]) return;

      stats[teacherId].count += 1;
      if (student.paid) {
        stats[teacherId].active += 1;
      }

      const monthlyFee = Number(student.monthly_fee) || 0;
      const teacherPercent = Number(student.teacher_percent) || 0;

      stats[teacherId].income += student.paid
        ? (monthlyFee * teacherPercent) / 100
        : 0;
    });

    return stats;
  }, [teachers, students]);

  const getCourseName = (id) => courseMap.get(id) || "No course assigned";

  const filteredTeachers = useMemo(() => {
    const query = search.toLowerCase().trim();
    return teachers.filter((t) => {
      const matchesSearch =
        !query ||
        t.name.toLowerCase().includes(query) ||
        (t.phone && t.phone.includes(query)) ||
        (t.email && t.email.toLowerCase().includes(query));

      const matchesCourse =
        filterCourse === "all" || t.course_id === filterCourse;

      return matchesSearch && matchesCourse;
    });
  }, [teachers, search, filterCourse]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      let updated = { ...prev, [name]: type === "checkbox" ? checked : value };

      if (name === "salary_paid") {
        if (checked) {
          const today = getTodayStr();
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);

          updated.last_payment = today;
          updated.next_payment = nextMonth.toISOString().slice(0, 10);
        } else {
          updated.last_payment = "";
          updated.next_payment = "";
        }
      }

      return updated;
    });
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      password: "",
      course_id: "",
      salary_paid: false,
      last_payment: "",
      next_payment: "",
      notes: "",
    });
    setEditId(null);
    setShowPassword(false);
    setModalOpen(false);
  };

  const openEditModal = (teacher) => {
    setEditId(teacher.id);
    setForm({
      name: teacher.name || "",
      phone: teacher.phone || "",
      email: teacher.email || "",
      password: "",
      course_id: teacher.course_id || "",
      salary_paid: teacher.salary_paid || false,
      last_payment: teacher.last_payment || "",
      next_payment: teacher.next_payment || "",
      notes: teacher.notes || "",
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !branchId) return;

    setSaving(true);
    try {
      let authId = null;

      if (!editId) {
        if (form.email && form.password) {
          const { data: authData, error: authError } =
            await supabase.auth.signUp({
              email: form.email.trim(),
              password: form.password,
            });
          if (authError) throw authError;
          authId = authData?.user?.id || null;
        }

        const newTeacher = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          password: form.password || null,
          course_id: form.course_id || null,
          salary_paid: form.salary_paid,
          last_payment: form.last_payment || null,
          next_payment: form.next_payment || null,
          notes: form.notes || "",
          branch_id: branchId,
          auth_id: authId,
        };

        const { error } = await supabase.from("teachers").insert([newTeacher]);
        if (error) throw error;
      } else {
        const currentTeacher = teachers.find((t) => t.id === editId);
        authId = currentTeacher?.auth_id || null;

        if (!authId && form.email && form.password) {
          const { data: authData, error: authError } =
            await supabase.auth.signUp({
              email: form.email.trim(),
              password: form.password,
            });
          if (!authError) {
            authId = authData?.user?.id || null;
          }
        }

        const updatedTeacher = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          course_id: form.course_id || null,
          salary_paid: form.salary_paid,
          last_payment: form.last_payment || null,
          next_payment: form.next_payment || null,
          notes: form.notes || "",
          auth_id: authId,
          updated_at: new Date(),
        };

        if (form.password) {
          updatedTeacher.password = form.password;
        }

        const { error } = await supabase
          .from("teachers")
          .update(updatedTeacher)
          .eq("id", editId);

        if (error) throw error;
      }

      resetForm();
      fetchData(true);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;

      setTeachers((prev) => prev.filter((t) => t.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const renderModals = () =>
    createPortal(
      <>
        {/* VIEW MODAL */}
        {viewOpen && viewData && (
          <div className="portal-overlay" onClick={() => setViewOpen(false)}>
            <div
              className="portal-modal-card view-teacher-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-top-accent"></div>
              <button
                className="close-x-btn"
                onClick={() => setViewOpen(false)}
              >
                <FiX />
              </button>

              <div className="modal-body-content">
                <div className="profile-section">
                  <div className="profile-avatar">
                    <FiUser />
                  </div>
                  <h2 className="profile-name">{viewData.name}</h2>
                  <p className="profile-role">
                    {viewData.email || "No email provided"}
                  </p>
                  <div
                    className={`status-label ${
                      viewData.salary_paid ? "paid" : "pending"
                    }`}
                  >
                    {viewData.salary_paid ? "Salary Paid" : "Salary Pending"}
                  </div>
                </div>

                <div className="info-grid-details">
                  <div className="info-item">
                    <label>
                      <FiPhone /> Phone
                    </label>
                    <span>{viewData.phone || "Not available"}</span>
                  </div>
                  <div className="info-item">
                    <label>
                      <FiMail /> Email
                    </label>
                    <span>{viewData.email || "Not available"}</span>
                  </div>
                  <div className="info-item">
                    <label>
                      <FiLock /> Password
                    </label>
                    <span>{viewData.password || "Not available"}</span>
                  </div>
                  <div className="info-item">
                    <label>
                      <FiBookOpen /> Course
                    </label>
                    <span>{getCourseName(viewData.course_id)}</span>
                  </div>
                  <div className="info-item">
                    <label>
                      <FiUsers /> Students
                    </label>
                    <span>
                      {teacherStatsMap[String(viewData.id)]?.count || 0}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>
                      <FiDollarSign /> Income
                    </label>
                    <span className="income-highlight">
                      {(
                        teacherStatsMap[String(viewData.id)]?.income || 0
                      ).toLocaleString()}{" "}
                      UZS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD / EDIT MODAL */}
        {modalOpen && (
          <div className="portal-overlay" onClick={resetForm}>
            <div
              className="portal-modal-card form-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-standard">
                <h3>
                  {editId ? (
                    <>
                      <FiEdit /> Edit Teacher
                    </>
                  ) : (
                    <>
                      <FiUserPlus /> Add New Teacher
                    </>
                  )}
                </h3>
                <button className="close-icon-btn" onClick={resetForm}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSaveTeacher} className="modal-form-main">
                <div className="input-group-full">
                  <label>Full Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Anvar Karimov"
                    required
                  />
                </div>

                <div className="input-row-double">
                  <div className="input-group-half">
                    <label>Phone Number</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      placeholder="+998 90 123 45 67"
                    />
                  </div>

                  <div className="input-group-half">
                    <label>Assigned Course</label>
                    <select
                      name="course_id"
                      value={form.course_id}
                      onChange={handleInputChange}
                    >
                      <option hidden value="">
                        Select course
                      </option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-row-double">
                  <div className="input-group-half">
                    <label>Email (for login)</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="teacher@gmail.com"
                    />
                  </div>

                  <div className="input-group-half">
                    <label>
                      {editId ? "New Password (optional)" : "Password *"}
                    </label>
                    <div className="password-input-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleInputChange}
                        placeholder={
                          editId
                            ? "Leave blank to keep current"
                            : "Min 6 characters"
                        }
                        required={!editId && Boolean(form.email)}
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <FiEyeOff size={18} />
                        ) : (
                          <FiEye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="input-row-double">
                  <div className="input-group-half">
                    <label>Last Payment Date</label>
                    <input
                      type="date"
                      name="last_payment"
                      value={form.last_payment}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="input-group-half">
                    <label>Next Payment Date</label>
                    <input
                      type="date"
                      name="next_payment"
                      value={form.next_payment}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="checkbox-control-wrapper">
                  <div className="custom-checkbox-row">
                    <input
                      type="checkbox"
                      id="salary_paid"
                      name="salary_paid"
                      checked={form.salary_paid}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="salary_paid">
                      Salary paid for the current month
                    </label>
                  </div>
                </div>

                <div className="form-actions-footer">
                  <button
                    type="button"
                    className="btn-cancel-form"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit-form"
                    disabled={saving}
                  >
                    {saving ? (
                      "Saving..."
                    ) : (
                      <>
                        <FiSave /> Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM MODAL */}
        {deleteId && (
          <div className="portal-overlay" onClick={() => setDeleteId(null)}>
            <div
              className="portal-modal-card confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-icon-wrapper">
                <FiAlertTriangle />
              </div>
              <h3>Delete Teacher</h3>
              <p>
                Are you sure you want to permanently delete this teacher? This
                action cannot be undone.
              </p>
              <div className="confirm-footer-btns">
                <button className="btn-no" onClick={() => setDeleteId(null)}>
                  Cancel
                </button>
                <button className="btn-yes" onClick={confirmDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </>,
      document.body
    );

  return (
    <div className="teachers-page-container">
      {/* HEADER */}
      <header className="teachers-header-box">
        <div className="title-area">
          <h1 className="page-main-title">
            {activeBranch
              ? `${activeBranch.name} • Teachers`
              : "Teachers"}
          </h1>
          <p className="page-description">
            Manage teachers and track monthly salary payments by branch
          </p>
        </div>

        <button
          className="btn-prime-add"
          disabled={!branchId}
          onClick={() => setModalOpen(true)}
        >
          <FiPlus /> Add Teacher
        </button>
      </header>

      {/* CONTROLS */}
      <div className="teachers-controls-bar">
        <div className="search-input-field">
          <FiSearch className="search-icon-fixed" />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-dropdown-select"
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
        >
          <option value="all">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="teachers-table-overflow">
        <table className="modern-data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>Phone</th>
              <th>Course</th>
              <th>Students</th>
              <th>Income</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td>
                    <div className="skeleton skeleton-id"></div>
                  </td>
                  <td>
                    <div className="skeleton skeleton-name"></div>
                  </td>
                  <td>
                    <div className="skeleton skeleton-phone"></div>
                  </td>
                  <td>
                    <div className="skeleton skeleton-badge"></div>
                  </td>
                  <td>
                    <div className="skeleton skeleton-badge"></div>
                  </td>
                  <td>
                    <div className="skeleton skeleton-price"></div>
                  </td>
                  <td>
                    <div className="skeleton skeleton-status"></div>
                  </td>
                  <td>
                    <div className="skeleton-actions">
                      <div className="skeleton skeleton-btn"></div>
                      <div className="skeleton skeleton-btn"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="teachers-empty">
                    <FiUser size={42} style={{ opacity: 0.35 }} />
                    <p>No teachers found matching the selected filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTeachers.map((t, idx) => (
                <tr
                  key={t.id}
                  onClick={() => {
                    setViewData(t);
                    setViewOpen(true);
                  }}
                >
                  <td data-label="#">{idx + 1}</td>
                  <td data-label="Full Name" className="font-bold-name">
                    {t.name}
                  </td>
                  <td data-label="Phone">{t.phone || "—"}</td>
                  <td data-label="Course">
                    <span className="badge-course">
                      {getCourseName(t.course_id)}
                    </span>
                  </td>
                  <td data-label="Students">
                    <span className="students-count">
                      <FiUsers />
                      {teacherStatsMap[String(t.id)]?.count || 0}
                    </span>
                  </td>
                  <td data-label="Income" className="price-col">
                    {(
                      teacherStatsMap[String(t.id)]?.income || 0
                    ).toLocaleString()}{" "}
                    UZS
                  </td>
                  <td data-label="Status">
                    <span
                      className={`status-pill-small ${
                        t.salary_paid ? "paid" : "unpaid"
                      }`}
                    >
                      {t.salary_paid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td
                    data-label="Actions"
                    className="actions-cell-row"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="row-btn edit"
                      onClick={() => openEditModal(t)}
                      title="Edit"
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="row-btn delete"
                      onClick={() => setDeleteId(t.id)}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {renderModals()}
    </div>
  );
}