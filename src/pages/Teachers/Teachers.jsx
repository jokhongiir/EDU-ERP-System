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

  const [form, setForm] = useState({
    name: "",
    phone: "",
    course_id: "",
    salary_paid: false,
    last_payment: "",
    next_payment: "",
    notes: "",
  });

  const branchId = activeBranch?.id;
  const fetchData = useCallback(async () => {
    if (!branchId) return;

    setLoading(true);
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
      console.error("Error while loading data:", err.message);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const courseMap = useMemo(() => {
    return new Map(courses.map((c) => [c.id, c.name]));
  }, [courses]);
  const teacherStatsMap = useMemo(() => {
    const stats = {};

    // Har bir teacher uchun boshlang'ich statistika
    teachers.forEach((teacher) => {
      stats[String(teacher.id)] = {
        count: 0,
        active: 0,
        income: 0,
      };
    });

    // Studentlar bo'yicha hisoblash
    students.forEach((student) => {
      const teacherId = String(student.teacher_id || "");

      if (!teacherId || !stats[teacherId]) return;

      // Student soni
      stats[teacherId].count += 1;

      // Aktiv student
      if (student.paid) {
        stats[teacherId].active += 1;
      }

      // O'qituvchi daromadi
      const monthlyFee = Number(student.monthly_fee) || 0;
      const teacherPercent = Number(student.teacher_percent) || 0;

      stats[teacherId].income += student.paid
        ? (monthlyFee * teacherPercent) / 100
        : 0;
    });

    return stats;
  }, [teachers, students]);

  const getCourseName = (id) => courseMap.get(id) || "Course not assigned";
  const filteredTeachers = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    return teachers.filter((t) => {
      const matchesSearch =
        !searchLower ||
        t.name.toLowerCase().includes(searchLower) ||
        (t.phone && t.phone.includes(searchLower));

      const matchesCourse =
        filterCourse === "all" || t.course_id === filterCourse;

      return matchesSearch && matchesCourse;
    });
  }, [teachers, search, filterCourse]);

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
    if (!form.name.trim() || !branchId) return;

    setSaving(true);
    const teacherData = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      course_id: form.course_id || null,
      salary_paid: form.salary_paid,
      last_payment: form.last_payment || null,
      next_payment: form.next_payment || null,
      notes: form.notes || "",
      branch_id: branchId,
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
        const { error } = await supabase.from("teachers").insert([teacherData]);
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

      setTeachers((prev) => prev.filter((t) => t.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert("An error occurred while deleting");
    }
  };

  const renderAllModals = () => {
    return createPortal(
      <>
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
                  <p className="profile-role">Professional Teacher</p>
                  <div
                    className={`status-label ${viewData.salary_paid ? "paid" : "pending"}`}
                  >
                    {viewData.salary_paid ? "Salary Paid" : "Payment Pending"}
                  </div>
                </div>

                <div className="info-grid-details">
                  <div className="info-item">
                    <label>
                      <FiPhone /> Phone
                    </label>
                    <span>{viewData.phone || "Not provided"}</span>
                  </div>

                  <div className="info-item">
                    <label>
                      <FiBookOpen /> Course
                    </label>
                    <span>{getCourseName(viewData.course_id)}</span>
                  </div>

                  <div className="info-item">
                    <label>
                      <FiMapPin /> Branch
                    </label>
                    <span>{activeBranch?.name || "This Branch"}</span>
                  </div>

                  <div className="info-item">
                    <label>
                      <FiUsers /> Students
                    </label>
                    <span>
                      {teacherStatsMap[String(viewData.id)]?.count || 0}{" "}
                      students
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
                      <option value="">Select course</option>
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
              <p>Are you sure you want to delete this teacher?</p>
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
    <div className="teachers-page-container">
      <header className="teachers-header-box">
        <div className="title-area">
          <h1 className="page-main-title">
            {activeBranch ? `${activeBranch.name} • Teachers` : "Teachers"}
          </h1>
          <p className="page-description">
            Manage instructors and trace payroll balances for this branch
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
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="teacher-skeleton sk-id"></div>
                  </td>
                  <td>
                    <div className="teacher-user-cell">
                      <div className="teacher-skeleton sk-avatar"></div>
                      <div className="teacher-user-info">
                        <div className="teacher-skeleton sk-name"></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="teacher-skeleton sk-badge"></div>
                  </td>
                  <td>
                    <div className="teacher-skeleton sk-phone"></div>
                  </td>
                  <td>
                    <div className="teacher-skeleton sk-badge"></div>
                  </td>
                  <td>
                    <div className="teacher-skeleton sk-students"></div>
                  </td>
                  <td>
                    <div className="teacher-skeleton sk-income"></div>
                  </td>
                  <td>
                    <div className="teacher-skeleton sk-status"></div>
                  </td>
                  <td>
                    <div className="teacher-actions-loading">
                      <div className="teacher-skeleton sk-btn"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan="9" className="td-empty">
                  No teachers found for this branch
                </td>
              </tr>
            ) : (
              filteredTeachers.map((t, idx) => {
                const stats = teacherStatsMap[t.id] || { count: 0, income: 0 };

                return (
                  <tr
                    key={t.id}
                    onClick={() => {
                      setViewData(t);
                      setViewOpen(true);
                    }}
                  >
                    <td>{idx + 1}</td>
                    <td className="font-bold-name">{t.name}</td>
                    <td>
                      <span className="badge-course">
                        {activeBranch?.name || "This Branch"}
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
                      {teacherStatsMap[String(t.id)]?.count || 0} students
                    </td>
                    <td className="price-col">
                      {(
                        teacherStatsMap[String(t.id)]?.income || 0
                      ).toLocaleString()}{" "}
                      UZS
                    </td>
                    <td>
                      <span
                        className={`status-pill-small ${t.salary_paid ? "paid" : "unpaid"}`}
                      >
                        {t.salary_paid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td
                      className="actions-cell-row"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="row-btn edit"
                        onClick={() => openEditModal(t)}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="row-btn delete"
                        onClick={() => setDeleteId(t.id)}
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

      {renderAllModals()}
    </div>
  );
}
