import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import "./Students.css";

import {
  FiEdit,
  FiTrash2,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiSave,
  FiUser,
  FiCalendar,
  FiFilter,
} from "react-icons/fi";

export default function Students({ activeBranch }) {
  const navigate = useNavigate();
  const branchId = activeBranch?.id;

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [viewData, setViewData] = useState(null);
  const [editData, setEditData] = useState(null);

  const [saving, setSaving] = useState(false);

  const [filterCourse, setFilterCourse] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  
  const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("en-US").format(value) + " UZS";

  // 🔄 Ma'lumotlarni xavfsiz yuklash (useCallback bilan)
  const fetchData = useCallback(async () => {
    if (!branchId) return;

    setLoading(true);
    try {
      const [s, c, t, g] = await Promise.all([
        supabase
          .from("students")
          .select("*, courses(name), teachers(name), groups(name)")
          .eq("branch_id", branchId)
          .order("created_at", { ascending: false }),

        supabase.from("courses").select("*").eq("branch_id", branchId),
        supabase.from("teachers").select("*").eq("branch_id", branchId),
        supabase.from("groups").select("*").eq("branch_id", branchId),
      ]);

      setStudents(s.data || []);
      setCourses(c.data || []);
      setTeachers(t.data || []);
      setGroups(g.data || []);
    } catch (err) {
      console.error("Error loading students data:", err.message);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🚫 Modal ochilganda scrollni professional bloklash
  useEffect(() => {
    document.body.style.overflow = viewOpen || editOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [viewOpen, editOpen]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this student profile?")) return;

    try {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const openView = (student) => {
    setViewData(student);
    setViewOpen(true);
  };

  const openEdit = (student) => {
    if (!student) return;

    setEditData({
      id: student.id,
      first_name: student.first_name ?? "",
      last_name: student.last_name ?? "",
      phone: student.phone ?? "",
      parent_phone: student.parent_phone ?? "",
      course_id: student.course_id ?? "",
      teacher_id: student.teacher_id ?? "",
      group_id: student.group_id ?? "",
      start_date: student.start_date ?? "",
      payment_date: student.payment_date ?? "",
      next_payment_date: student.next_payment_date ?? "",
      monthly_fee: student.monthly_fee ?? 0,
      teacher_percent: student.teacher_percent ?? 0,
      paid: student.paid ?? false,
    });

    setEditOpen(true);
  };

  // ⚡️ Avtomatlashtirish: Checkbox holatiga qarab sanalarni to'g'ri boshqarish
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditData((prev) => {
      let updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
      };

      if (name === "paid") {
        if (checked) {
          const today = getTodayStr();
          const d = new Date();
          d.setMonth(d.getMonth() + 1); // Aniq 1 kalendar oyi qo'shish

          updated.payment_date = today;
          updated.next_payment_date = d.toISOString().slice(0, 10);
        } else {
          updated.payment_date = "";
          updated.next_payment_date = "";
        }
      }

      return updated;
    });
  };

  const handleSave = async () => {
    if (!editData?.id) return;

    setSaving(true);
    const payload = {
      first_name: editData.first_name?.trim() || "",
      last_name: editData.last_name?.trim() || "",
      phone: editData.phone?.trim() || null,
      parent_phone: editData.parent_phone?.trim() || null,
      course_id: editData.course_id || null,
      teacher_id: editData.teacher_id || null,
      group_id: editData.group_id || null,
      start_date: editData.start_date || null,
      payment_date: editData.payment_date || null,
      next_payment_date: editData.next_payment_date || null,
      monthly_fee: Number(editData.monthly_fee) || 0,
      teacher_percent: Number(editData.teacher_percent) || 0,
      paid: Boolean(editData.paid),
    };

    try {
      const { error } = await supabase
        .from("students")
        .update(payload)
        .eq("id", editData.id);

      if (error) throw error;

      await fetchData();
      setEditOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const fullName = `${s.first_name || ""} ${s.last_name || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const courseMatch = filterCourse ? s.course_id === filterCourse : true;
      const teacherMatch = filterTeacher ? s.teacher_id === filterTeacher : true;
      const groupMatch = filterGroup ? s.group_id === filterGroup : true;

      return fullName && courseMatch && teacherMatch && groupMatch;
    });
  }, [students, search, filterCourse, filterTeacher, filterGroup]);

  return (
    <div className="students">
      <div className="Column-Table-Students">
           <div className="students__header">
        <div className="title-area">
          <h1 className="page-main-title">
            {activeBranch?.name || "Management"} • Students
          </h1>
          <p className="page-description">Manage and monitor student enrollments, details and invoices</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => navigate(`/dashboard/${branchId}/addstudents`)}
          disabled={!branchId}
        >
          + Add Student
        </button>
      </div>

      <div className="students__search-wrapper">
        <div className="students__search">
          <FiSearch />
          <input
            placeholder="Search student profiles by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-select-box">
          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-select-box">
          <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
            <option value="">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-select-box">
          <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>
      </div>
     

      <div className="students__table-wrapper">
        <table className="students__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>Contact Phone</th>
              <th>Enrolled Course</th>
              <th>Assigned Teacher</th>
              <th>Group Class</th>
              <th>Billing Status</th>
              <th align="center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td><div className="skeleton skeleton-id"></div></td>
                  <td>
                    <div className="student-user">
                      <div className="skeleton skeleton-avatar"></div>
                      <div className="student-user-info">
                        <div className="skeleton skeleton-name"></div>
                        <div className="skeleton skeleton-sub"></div>
                      </div>
                    </div>
                  </td>
                  <td><div className="skeleton skeleton-phone"></div></td>
                  <td><div className="skeleton skeleton-badge"></div></td>
                  <td><div className="skeleton skeleton-badge"></div></td>
                  <td><div className="skeleton skeleton-badge"></div></td>
                  <td><div className="skeleton skeleton-status"></div></td>
                  <td>
                    <div className="student-actions-loading">
                      <div className="skeleton skeleton-btn"></div>
                      <div className="skeleton skeleton-btn"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="students__empty">
                    <FiUser size={40} style={{ marginBottom: "12px", opacity: 0.4 }} />
                    <p>No active records matching the selected parameters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((s, i) => (
                <tr key={s.id} onClick={() => openView(s)}>
                  <td>{i + 1}</td>
                  <td className="font-bold-name">
                    {s.first_name} {s.last_name}
                  </td>
                  <td>{s.phone || "—"}</td>
                  <td><span className="badge-course">{s.courses?.name || "N/A"}</span></td>
                  <td>{s.teachers?.name || "—"}</td>
                  <td>{s.groups?.name || "—"}</td>
                  <td>
                    <span className={`status-pill-small ${s.paid ? "paid" : "unpaid"}`}>
                      {s.paid ? "COLLECTED" : "OVERDUE"}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()} align="center">
                    <div className="actions-cell-row">
                      <button className="row-btn edit" onClick={() => openEdit(s)} title="Edit Configuration">
                        <FiEdit />
                      </button>
                      <button className="row-btn delete" onClick={() => handleDelete(s.id)} title="Delete Profile">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 👁️ VIEW DETAILS MODAL */}
      {viewOpen && viewData && (
        <div className="modal" onClick={() => setViewOpen(false)}>
          <div className="modal__box view__box" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Student Master Record</h3>
              <button onClick={() => setViewOpen(false)}><FiX /></button>
            </div>
            <div className="view__grid">
              <div className="view__column">
                <div className="view__field">
                  <label>Full Name</label>
                  <div className="view__value">{viewData.first_name} {viewData.last_name}</div>
                </div>
                <div className="view__field">
                  <label>Personal Mobile</label>
                  <div className="view__value">{viewData.phone || "Not specified"}</div>
                </div>
                <div className="view__field">
                  <label>Emergency Parent Contact</label>
                  <div className="view__value">{viewData.parent_phone || "Not specified"}</div>
                </div>
                <div className="view__field">
                  <label>Program / Course</label>
                  <div className="view__value">{viewData.courses?.name || "Unassigned"}</div>
                </div>
                <div className="view__field">
                  <label>Primary Instructor</label>
                  <div className="view__value">{viewData.teachers?.name || "Unassigned"}</div>
                </div>
              </div>

              <div className="view__column">
                <div className="view__field">
                  <label>Allocated Group</label>
                  <div className="view__value">{viewData.groups?.name || "Unassigned"}</div>
                </div>
                <div className="view__field">
                  <label>Enrollment Commencement</label>
                  <div className="view__value"><FiCalendar /> {viewData.start_date || "—"}</div>
                </div>
                <div className="view__field">
                  <label>Latest Settlement Date</label>
                  <div className="view__value">{viewData.payment_date || "—"}</div>
                </div>
                <div className="view__field">
                  <label>Next Invoicing Cycle</label>
                  <div className="view__value">{viewData.next_payment_date || "—"}</div>
                </div>
                <div className="view__field">
                  <label>Standard Monthly Fee</label>
                  <div className="view__value income-highlight">{formatCurrency(viewData.monthly_fee)}</div>
                </div>
                <div className="view__field">
                  <label>Teacher Share Yield</label>
                  <div className="view__value">{viewData.teacher_percent || 0}%</div>
                </div>
                <div className="view__field">
                  <label>Current Status</label>
                  <div className={`status-pill-small ${viewData.paid ? "paid" : "unpaid"}`} style={{ display: "inline-block" }}>
                    {viewData.paid ? "PAID" : "UNPAID"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📝 UPDATE PROFILE MODAL */}
      {editOpen && editData && (
        <div className="modal" onClick={() => setEditOpen(false)}>
          <div className="modal__box" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Update Student Parameters</h3>
              <button onClick={() => setEditOpen(false)}><FiX /></button>
            </div>
            <div className="modal__form">
              {[
                { label: "First Name *", name: "first_name" },
                { label: "Last Name *", name: "last_name" },
                { label: "Phone Connection", name: "phone" },
                { label: "Parent Emergency Contact", name: "parent_phone" },
              ].map((f) => (
                <div className="form__group" key={f.name}>
                  <label>{f.label}</label>
                  <input
                    name={f.name}
                    value={editData[f.name] || ""}
                    onChange={handleChange}
                  />
                </div>
              ))}

              <div className="form__group">
                <label>Program Specialization</label>
                <select name="course_id" value={editData.course_id || ""} onChange={handleChange}>
                  <option value="">Select program...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form__group">
                <label>Assigned Instructor</label>
                <select name="teacher_id" value={editData.teacher_id || ""} onChange={handleChange}>
                  <option value="">Select teacher...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="form__group">
                <label>Classroom Group</label>
                <select name="group_id" value={editData.group_id || ""} onChange={handleChange}>
                  <option value="">Select group...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {[
                { label: "Start Date", field: "start_date" },
                { label: "Payment Date", field: "payment_date" },
                { label: "Next Payment Date", field: "next_payment_date" }
              ].map((d) => (
                <div className="form__group" key={d.field}>
                  <label>{d.label}</label>
                  <input
                    type="date"
                    name={d.field}
                    value={editData[d.field] || ""}
                    onChange={handleChange}
                  />
                </div>
              ))}

              <div className="form__group">
                <label>Monthly Assessment Fee (UZS)</label>
                <input
                  type="number"
                  name="monthly_fee"
                  value={editData.monthly_fee || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form__group">
                <label>Instructor Percent Share (%)</label>
                <input
                  type="number"
                  name="teacher_percent"
                  value={editData.teacher_percent || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form__group full">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    name="paid"
                    checked={editData.paid || false}
                    onChange={handleChange}
                  />
                  Mark student active and paid for current tracking month
                </label>
              </div>
            </div>
            <div className="modal__actions">
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                <FiSave /> {saving ? "Saving Changes..." : "Commit Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}