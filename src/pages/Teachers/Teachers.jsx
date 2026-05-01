import { useEffect, useMemo, useState } from "react";
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
  FiCheckCircle,
} from "react-icons/fi";

export default function Teachers({ activeBranch }) {
  const branchId = activeBranch?.id;

  // ================= STATE =================
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // MODALS
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [editId, setEditId] = useState(null);

  // FORM
  const [form, setForm] = useState({
    name: "",
    phone: "",
    course_id: "",
    salary_paid: false,
    last_payment: "",
    next_payment: "",
  });

  // ================= FETCH =================
  const fetchData = async () => {
    if (!branchId) return;

    setLoading(true);

    const [t, c, s] = await Promise.all([
      supabase.from("teachers").select("*").eq("branch_id", branchId),
      supabase.from("courses").select("*").eq("branch_id", branchId),
      supabase.from("students").select("*").eq("branch_id", branchId),
    ]);

    setTeachers(t.data || []);
    setCourses(c.data || []);
    setStudents(s.data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  // ================= HELPERS =================
  const getCourseName = (id) => courses.find((c) => c.id === id)?.name || "—";

  const getStudentsCount = (id) =>
    students.filter((s) => s.teacher_id === id).length;

  const getIncome = (id) =>
    students
      .filter((s) => s.teacher_id === id && s.paid)
      .reduce(
        (sum, s) =>
          sum + ((s.monthly_fee || 0) * (s.teacher_percent || 0)) / 100,
        0,
      );

  // ================= VIEW =================
  const openView = (t) => {
    setViewData(t);
    setViewOpen(true);
  };

  // ================= INPUT =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((p) => ({
      ...p,
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
    });
    setEditId(null);
    setModalOpen(false);
  };

  // ================= EDIT =================
  const openEdit = (t) => {
    setForm({
      name: t.name || "",
      phone: t.phone || "",
      course_id: t.course_id || "",
      salary_paid: t.salary_paid || false,
      last_payment: t.last_payment || "",
      next_payment: t.next_payment || "",
    });

    setEditId(t.id);
    setModalOpen(true);
  };

  // ================= SAVE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return alert("Name required");

    setLoading(true);

    const payload = {
      branch_id: branchId,
      name: form.name,
      phone: form.phone,
      course_id: form.course_id || null,
      salary_paid: form.salary_paid,
      last_payment: form.last_payment || null,
      next_payment: form.next_payment || null,
    };

    if (editId) {
      await supabase.from("teachers").update(payload).eq("id", editId);
    } else {
      await supabase.from("teachers").insert(payload);
    }

    setLoading(false);
    resetForm();
    fetchData();
  };

  // ================= DELETE =================
  const handleDelete = async () => {
    await supabase.from("teachers").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchData();
  };

  // ================= FILTER =================
  const filtered = useMemo(() => {
    return teachers.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [teachers, search]);

  // ================= UI =================
  return (
    <div className="teachers-main-container">
      <div className="teachers-top-bar">
        <div className="teachers-info-header">
          <h2 className="branch-title-text">{activeBranch?.name || "Branch"} • Teachers</h2>
          <p className="branch-subtitle-text">Manage all teachers in your branch</p>
        </div>

        <button className="add-teacher-btn" onClick={() => setModalOpen(true)}>
          <FiPlus /> Add Teacher
        </button>
      </div>
      
      {/* SEARCH */}
      <div className="teachers-search-wrapper">
        <FiSearch className="search-icon-fixed" />
        <input
          className="search-input-field"
          placeholder="Search teacher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="teachers-list-table-box">
        <table className="teachers-data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Course</th>
              <th>Students</th>
              <th>Income</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((t, i) => (
              <tr
                key={t.id}
                className="table-body-row"
                onClick={() => openView(t)}
              >
                <td>{i + 1}</td>
                <td className="teacher-name-col">{t.name}</td>
                <td>{t.phone}</td>
                <td>{getCourseName(t.course_id)}</td>
                <td>{getStudentsCount(t.id)}</td>
                <td className="income-amount-col">{getIncome(t.id).toFixed(0)} so'm</td>
                <td className={`status-cell ${t.salary_paid ? "status-paid" : "status-unpaid"}`}>
                  {t.salary_paid ? "Paid" : "Unpaid"}
                </td>

                <td className="actions-col" onClick={(e) => e.stopPropagation()}>
                  <button className="action-btn-edit" onClick={() => openEdit(t)}>
                    <FiEdit />
                  </button>
                  <button className="action-btn-delete" onClick={() => setDeleteId(t.id)}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= VIEW MODAL ================= */}
      {viewOpen && viewData && (
        <div className="overlay-modal">
          <div className="modal-container-box view-mode">
            <div className="modal-header-section">
              <h3 className="modal-title-text">Teacher Details</h3>
              <button className="modal-close-trigger" onClick={() => setViewOpen(false)}>
                <FiX />
              </button>
            </div>

            <div className="details-info-grid">
              <div className="detail-stat-card">
                <FiUser className="stat-icon" />
                <div className="stat-content">
                  <p className="stat-label">Name</p>
                  <h4 className="stat-value">{viewData.name}</h4>
                </div>
              </div>

              <div className="detail-stat-card">
                <FiPhone className="stat-icon" />
                <div className="stat-content">
                  <p className="stat-label">Phone</p>
                  <h4 className="stat-value">{viewData.phone}</h4>
                </div>
              </div>

              <div className="detail-stat-card">
                <FiBookOpen className="stat-icon" />
                <div className="stat-content">
                  <p className="stat-label">Course</p>
                  <h4 className="stat-value">{getCourseName(viewData.course_id)}</h4>
                </div>
              </div>

              <div className="detail-stat-card">
                <FiUsers className="stat-icon" />
                <div className="stat-content">
                  <p className="stat-label">Students</p>
                  <h4 className="stat-value">{getStudentsCount(viewData.id)}</h4>
                </div>
              </div>

              <div className="detail-stat-card">
                <FiDollarSign className="stat-icon" />
                <div className="stat-content">
                  <p className="stat-label">Income</p>
                  <h4 className="stat-value">{getIncome(viewData.id).toFixed(0)} so'm</h4>
                </div>
              </div>

              <div className="detail-stat-card">
                <FiCheckCircle className="stat-icon" />
                <div className="stat-content">
                  <p className="stat-label">Status</p>
                  <h4 className={`stat-value status-text ${viewData.salary_paid ? "status-paid" : "status-unpaid"}`}>
                    {viewData.salary_paid ? "Paid" : "Unpaid"}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= FORM MODAL ================= */}
      {modalOpen && (
        <div className="overlay-modal">
          <div className="modal-container-box">
            <div className="modal-header-section">
              <h3 className="modal-title-text">{editId ? "Edit Teacher" : "Add Teacher"}</h3>
              <button className="modal-close-trigger" onClick={resetForm}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="teacher-entry-form">
              {/* NAME */}
              <div className="form-input-group">
                <label className="field-label">Teacher Name</label>
                <input
                  className="field-input"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter teacher name"
                />
              </div>

              {/* PHONE */}
              <div className="form-input-group">
                <label className="field-label">Phone Number</label>
                <input
                  className="field-input"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+998 90 123 45 67"
                />
              </div>

              {/* COURSE */}
              <div className="form-input-group">
                <label className="field-label">Course</label>
                <select
                  className="field-select"
                  name="course_id"
                  value={form.course_id}
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

              {/* LAST PAYMENT */}
              <div className="form-input-group">
                <label className="field-label">Last Payment Date</label>
                <input
                  className="field-date-picker"
                  type="date"
                  name="last_payment"
                  value={form.last_payment}
                  onChange={handleChange}
                />
              </div>

              {/* NEXT PAYMENT */}
              <div className="form-input-group">
                <label className="field-label">Next Payment Date</label>
                <input
                  className="field-date-picker"
                  type="date"
                  name="next_payment"
                  value={form.next_payment}
                  onChange={handleChange}
                />
              </div>

              {/* STATUS */}
              <div className="form-checkbox-control">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    className="hidden-checkbox"
                    name="salary_paid"
                    checked={form.salary_paid}
                    onChange={handleChange}
                  />
                  <span className="checkbox-label-text">Salary Paid</span>
                </label>
              </div>

              {/* BUTTON */}
              <button type="submit" className="form-submit-btn">
                <FiSave /> Save Teacher
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE */}
      {deleteId && (
        <div className="overlay-modal">
          <div className="modal-container-box confirm-box">
            <p className="confirm-message-text">Delete teacher?</p>
            <div className="confirm-btn-group">
              <button className="confirm-yes-btn" onClick={handleDelete}>Yes</button>
              <button className="confirm-no-btn" onClick={() => setDeleteId(null)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}