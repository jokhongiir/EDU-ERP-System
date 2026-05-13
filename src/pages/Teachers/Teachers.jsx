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
  FiCalendar,
  FiAlertTriangle,
  FiUserPlus,
  FiMapPin,
} from "react-icons/fi";

export default function Teachers({ activeBranch }) {
  // ==========================================================================
  // STATES
  // ==========================================================================
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [editId, setEditId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    phone: "",
    course_id: "",
    salary_paid: false,
    last_payment: "",
    next_payment: "",
    notes: "",
  });

  // ==========================================================================
  // FETCH ALL BRANCHES DATA
  // ==========================================================================

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();

      const user = authData?.user;

      if (!user) return;

      // ================= GET ALL BRANCHES =================
      const { data: branchesData, error: branchError } = await supabase
        .from("branches")
        .select("*")
        .eq("owner_uid", user.id);

      if (branchError) throw branchError;

      setBranches(branchesData || []);

      const branchIds = (branchesData || []).map((b) => b.id);

      if (branchIds.length === 0) {
        setTeachers([]);
        setCourses([]);
        setStudents([]);
        return;
      }

      // ================= FETCH ALL DATA =================
      const [tRes, cRes, sRes] = await Promise.all([
        supabase
          .from("teachers")
          .select("*")
          .in("branch_id", branchIds)
          .order("created_at", { ascending: false }),

        supabase
          .from("courses")
          .select("*")
          .in("branch_id", branchIds),

        supabase
          .from("students")
          .select("*")
          .in("branch_id", branchIds),
      ]);

      if (tRes.error) throw tRes.error;

      setTeachers(tRes.data || []);
      setCourses(cRes.data || []);
      setStudents(sRes.data || []);
    } catch (err) {
      console.error("Error while loading data:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getCourseName = (id) =>
    courses.find((c) => c.id === id)?.name || "Course not assigned";

  const getBranchName = (id) =>
    branches.find((b) => b.id === id)?.name || "Unknown Branch";

  const getTeacherStats = useCallback(
    (teacherId) => {
      const teacherStudents = students.filter(
        (s) => s.teacher_id === teacherId
      );

      const activeStudents = teacherStudents.filter(
        (s) => s.status === "active" || s.paid
      ).length;

      const totalIncome = teacherStudents
        .filter((s) => s.paid)
        .reduce((sum, s) => {
          const fee = s.monthly_fee || 0;
          const percent = s.teacher_percent || 0;

          return sum + (fee * percent) / 100;
        }, 0);

      return {
        count: teacherStudents.length,
        active: activeStudents,
        income: totalIncome,
      };
    },
    [students]
  );

  // ==========================================================================
  // FILTER
  // ==========================================================================

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.phone && t.phone.includes(search));

      const matchesCourse =
        filterCourse === "all" || t.course_id === filterCourse;

      return matchesSearch && matchesCourse;
    });
  }, [teachers, search, filterCourse]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      course_id: "",
      salary_paid: false,
      last_payment: "",
      next_payment: "",
      notes: "",
    });

    setEditId(null);
    setModalOpen(false);
  };

  const openEditModal = (teacher) => {
    setEditId(teacher.id);

    setForm({
      name: teacher.name || "",
      phone: teacher.phone || "",
      course_id: teacher.course_id || "",
      salary_paid: teacher.salary_paid || false,
      last_payment: teacher.last_payment || "",
      next_payment: teacher.next_payment || "",
      notes: teacher.notes || "",
    });

    setModalOpen(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return;

    setSaving(true);

    const teacherData = {
      ...form,
      branch_id: activeBranch?.id,
      course_id: form.course_id || null,
      updated_at: new Date(),
    };

    try {
      if (editId) {
        const { error } = await supabase
          .from("teachers")
          .update(teacherData)
          .eq("id", editId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("teachers")
          .insert([teacherData]);

        if (error) throw error;
      }

      resetForm();
      fetchData();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setDeleteId(null);
      fetchData();
    } catch (err) {
      alert("An error occurred while deleting");
    }
  };

  // ==========================================================================
  // MODALS
  // ==========================================================================

  const renderAllModals = () => {
    return createPortal(
      <>
        {/* VIEW MODAL */}
        {viewOpen && viewData && (
          <div
            className="portal-overlay"
            onClick={() => setViewOpen(false)}
          >
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
                    Professional Teacher
                  </p>

                  <div
                    className={`status-label ${
                      viewData.salary_paid
                        ? "paid"
                        : "pending"
                    }`}
                  >
                    {viewData.salary_paid
                      ? "Salary Paid"
                      : "Payment Pending"}
                  </div>
                </div>

                <div className="info-grid-details">
                  <div className="info-item">
                    <label>
                      <FiPhone /> Phone
                    </label>

                    <span>
                      {viewData.phone || "Not provided"}
                    </span>
                  </div>

                  <div className="info-item">
                    <label>
                      <FiBookOpen /> Course
                    </label>

                    <span>
                      {getCourseName(viewData.course_id)}
                    </span>
                  </div>

                  <div className="info-item">
                    <label>
                      <FiMapPin /> Branch
                    </label>

                    <span>
                      {getBranchName(viewData.branch_id)}
                    </span>
                  </div>

                  <div className="info-item">
                    <label>
                      <FiUsers /> Students
                    </label>

                    <span>
                      {getTeacherStats(viewData.id).count} students
                    </span>
                  </div>

                  <div className="info-item">
                    <label>
                      <FiDollarSign /> Income
                    </label>

                    <span className="income-highlight">
                      {getTeacherStats(viewData.id).income.toLocaleString()} UZS
                    </span>
                  </div>
                </div>

                <div className="payment-timeline">
                  <h4>
                    <FiCalendar /> Payment Timeline
                  </h4>

                  <div className="timeline-row">
                    <div className="t-point">
                      <small>Last Payment</small>
                      <p>{viewData.last_payment || "—"}</p>
                    </div>

                    <div className="t-divider"></div>

                    <div className="t-point">
                      <small>Next Payment</small>
                      <p>{viewData.next_payment || "—"}</p>
                    </div>
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

                <button
                  className="close-icon-btn"
                  onClick={resetForm}
                >
                  <FiX />
                </button>
              </div>

              <form
                onSubmit={handleSaveTeacher}
                className="modal-form-main"
              >
                <div className="input-group-full">
                  <label>Teacher Full Name *</label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Example: John Smith"
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
                      placeholder="+998"
                    />
                  </div>

                  <div className="input-group-half">
                    <label>Specialization</label>

                    <select
                      name="course_id"
                      value={form.course_id}
                      onChange={handleInputChange}
                    >
                      <option value="">
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
                      Salary has been paid for this month
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

        {/* DELETE MODAL */}
        {deleteId && (
          <div
            className="portal-overlay"
            onClick={() => setDeleteId(null)}
          >
            <div
              className="portal-modal-card confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-icon-wrapper">
                <FiAlertTriangle />
              </div>

              <h3>Delete Teacher</h3>

              <p>
                Are you sure you want to delete this teacher?
              </p>

              <div className="confirm-footer-btns">
                <button
                  className="btn-no"
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </button>

                <button
                  className="btn-yes"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </>,
      document.body
    );
  };

  // ==========================================================================
  // UI
  // ==========================================================================

  return (
    <div className="teachers-page-container">
      {/* HEADER */}
      <header className="teachers-header-box">
        <div className="title-area">
          <h1 className="page-main-title">
            All Branch • Teachers
          </h1>

          <p className="page-description">
            Teachers from all branches are displayed here
          </p>
        </div>

        <button
          className="btn-prime-add"
          onClick={() => setModalOpen(true)}
        >
          <FiPlus /> Add Teacher
        </button>
      </header>

      {/* SEARCH */}
      <div className="teachers-controls-bar">
        <div className="search-input-field">
          <FiSearch className="search-icon-fixed" />

          <input
            type="text"
            placeholder="Search by name or phone..."
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
              <th>Teacher Name</th>
              <th>Branch</th>
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
              <tr>
                <td colSpan="9" className="td-loader">
                  Loading data...
                </td>
              </tr>
            ) : filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan="9" className="td-empty">
                  No data found
                </td>
              </tr>
            ) : (
              filteredTeachers.map((t, idx) => {
                const stats = getTeacherStats(t.id);

                return (
                  <tr
                    key={t.id}
                    onClick={() => {
                      setViewData(t);
                      setViewOpen(true);
                    }}
                  >
                    <td>{idx + 1}</td>

                    <td className="font-bold-name">
                      {t.name}
                    </td>

                    <td>
                      <span className="badge-course">
                        {getBranchName(t.branch_id)}
                      </span>
                    </td>

                    <td>{t.phone || "—"}</td>

                    <td>
                      <span className="badge-course">
                        {getCourseName(t.course_id)}
                      </span>
                    </td>

                    <td>
                      <FiUsers style={{ marginRight: "5px" }} />
                      {stats.count} students
                    </td>

                    <td className="price-col">
                      {stats.income.toLocaleString()} UZS
                    </td>

                    <td>
                      <span
                        className={`status-pill-small ${
                          t.salary_paid
                            ? "paid"
                            : "unpaid"
                        }`}
                      >
                        {t.salary_paid ? "Paid" : "Unpaid"}
                      </span>
                    </td>

                    <td
                      className="actions-cell-row"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >
                      <button
                        className="row-btn edit"
                        onClick={() => openEditModal(t)}
                      >
                        <FiEdit />
                      </button>

                      <button
                        className="row-btn delete"
                        onClick={() =>
                          setDeleteId(t.id)
                        }
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODALS */}
      {renderAllModals()}
    </div>
  );
}