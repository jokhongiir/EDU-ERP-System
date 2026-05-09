import { useEffect, useMemo, useState } from "react";
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
} from "react-icons/fi";

export default function Students({ activeBranch }) {
  const navigate = useNavigate();
  const branchId = activeBranch?.id;

  // ================= STATE =================
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

  // ================= FETCH =================
  const fetchData = async () => {
    if (!branchId) return;

    setLoading(true);

    const [s, c, t, g] = await Promise.all([
      supabase
        .from("students")
        .select("*, courses(name), teachers(name), groups(name)")
        .eq("branch_id", branchId),

      supabase.from("courses").select("*").eq("branch_id", branchId),
      supabase.from("teachers").select("*").eq("branch_id", branchId),
      supabase.from("groups").select("*").eq("branch_id", branchId),
    ]);

    setStudents(s.data || []);
    setCourses(c.data || []);
    setTeachers(t.data || []);
    setGroups(g.data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  // ================= YANGI QO'SHILGAN QISM: MODAL SCROLL CONTROL =================
  useEffect(() => {
    if (viewOpen || editOpen) {
      document.body.style.overflow = "hidden"; // Modal ochiqligida orqa fon skroll bo'lmaydi
    } else {
      document.body.style.overflow = "unset"; // Modal yopilganda skroll tiklanadi
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [viewOpen, editOpen]);

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!confirm("Delete student?")) return;

    await supabase.from("students").delete().eq("id", id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // ================= OPEN VIEW =================
  const openView = (student) => {
    setViewData(student);
    setViewOpen(true);
  };

  // ================= OPEN EDIT =================
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

  // ================= CHANGE INPUT =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  // ================= SAVE EDIT =================
  const handleSave = async () => {
    if (!editData?.id) return;

    setSaving(true);

    const payload = {
      first_name: editData.first_name || "",
      last_name: editData.last_name || "",
      phone: editData.phone || "",
      parent_phone: editData.parent_phone || "",
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

    const { error } = await supabase
      .from("students")
      .update(payload)
      .eq("id", editData.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    await fetchData();
    setEditOpen(false);
  };

  // ================= SEARCH =================
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const fullName = `${s.first_name} ${s.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const courseMatch = filterCourse ? s.course_id === filterCourse : true;

      const teacherMatch = filterTeacher
        ? s.teacher_id === filterTeacher
        : true;

      const groupMatch = filterGroup ? s.group_id === filterGroup : true;

      return fullName && courseMatch && teacherMatch && groupMatch;
    });
  }, [students, search, filterCourse, filterTeacher, filterGroup]);

  // ========================= UI =========================
  return (
    <div className="students">
      {/* ================= HEADER ================= */}
      <div className="students__header">
        <div className="title-area">
          <h1 className="page-main-title">
            {activeBranch?.name || "Branch"} • Students
          </h1>

          <p className="page-description">Manage all students in your branch</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => navigate(`/dashboard/${branchId}/addstudents`)}
        >
          + Add Student
        </button>
      </div>

      {/* ================= SEARCH ================= */}
      <div className="students__search-wrapper">
        {/* SEARCH */}
        <div className="students__search">
          <FiSearch />
          <input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* COURSE FILTER */}
        <select
          className="students__filter"
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

        {/* TEACHER FILTER */}
        <select
          className="students__filter"
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

        {/* GROUP FILTER */}
        <select
          className="students__filter"
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
        >
          <option value="">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* ================= TABLE CONTENT ================= */}
      <div className="students__table-wrapper">
        <table className="students__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>Phone</th>
              <th>Course</th>
              <th>Teacher</th>
              <th>Group</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <tr key={`loading-${i}`}>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: "1.5rem",
                      color: "#666",
                    }}
                  >
                    <div className="loading-row">Loading data...</div>
                  </td>
                </tr>
              ))
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div
                    className="students__empty"
                    style={{ padding: "3rem 0" }}
                  >
                    <FiUser
                      size={40}
                      style={{ marginBottom: "10px", opacity: 0.5 }}
                    />
                    <p>No students found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((s, i) => (
                <tr key={s.id} onClick={() => openView(s)}>
                  <td>{i + 1}</td>
                  <td>
                    {s.first_name} {s.last_name}
                  </td>
                  <td>{s.phone}</td>
                  <td>{s.courses?.name || "-"}</td>
                  <td>{s.teachers?.name || "-"}</td>
                  <td>{s.groups?.name || "-"}</td>

                  <td>
                    {s.paid ? (
                      <span className="status paid">
                        <FiCheckCircle /> Paid
                      </span>
                    ) : (
                      <span className="status unpaid">Unpaid</span>
                    )}
                  </td>

                  <td onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(s)} title="Edit">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDelete(s.id)} title="Delete">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= VIEW MODAL ================= */}
      {viewOpen && viewData && (
        <div className="modal" onClick={() => setViewOpen(false)}>
          {" "}
          {/* Tashqarini bosganda yopiladi */}
          <div
            className="modal__box view__box"
            onClick={(e) => e.stopPropagation()}
          >
            {" "}
            {/* Ichkarini bosganda yopilmaydi */}
            <div className="modal__header">
              <h3>Student Details</h3>
              <button onClick={() => setViewOpen(false)}>
                <FiX />
              </button>
            </div>
            <div className="view__grid">
              <div className="view__column">
                <div className="view__field">
                  <label>Full Name</label>
                  <div className="view__value">
                    {viewData.first_name} {viewData.last_name}
                  </div>
                </div>

                <div className="view__field">
                  <label>Phone</label>
                  <div className="view__value">{viewData.phone || "-"}</div>
                </div>

                <div className="view__field">
                  <label>Parent Phone</label>
                  <div className="view__value">
                    {viewData.parent_phone || "-"}
                  </div>
                </div>

                <div className="view__field">
                  <label>Course</label>
                  <div className="view__value">
                    {viewData.courses?.name || "-"}
                  </div>
                </div>

                <div className="view__field">
                  <label>Teacher</label>
                  <div className="view__value">
                    {viewData.teachers?.name || "-"}
                  </div>
                </div>
              </div>

              <div className="view__column">
                <div className="view__field">
                  <label>Group</label>
                  <div className="view__value">
                    {viewData.groups?.name || "-"}
                  </div>
                </div>

                <div className="view__field">
                  <label>Start Date</label>
                  <div className="view__value">
                    {viewData.start_date || "-"}
                  </div>
                </div>

                <div className="view__field">
                  <label>Payment Date</label>
                  <div className="view__value">
                    {viewData.payment_date || "-"}
                  </div>
                </div>

                <div className="view__field">
                  <label>Next Payment</label>
                  <div className="view__value">
                    {viewData.next_payment_date || "-"}
                  </div>
                </div>

                <div className="view__field">
                  <label>Monthly Fee</label>
                  <div className="view__value">{viewData.monthly_fee || 0}</div>
                </div>

                <div className="view__field">
                  <label>Teacher %</label>
                  <div className="view__value">
                    {viewData.teacher_percent || 0}%
                  </div>
                </div>

                <div className="view__field">
                  <label>Status</label>
                  <div
                    className={`view__badge ${viewData.paid ? "paid" : "unpaid"}`}
                  >
                    {viewData.paid ? "Paid" : "Unpaid"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {editOpen && editData && (
        <div className="modal" onClick={() => setEditOpen(false)}>
          {" "}
          {/* Tashqarini bosganda yopiladi */}
          <div className="modal__box" onClick={(e) => e.stopPropagation()}>
            {" "}
            {/* Ichkarini bosganda yopilmaydi */}
            <div className="modal__header">
              <h3>Edit Student</h3>
              <button onClick={() => setEditOpen(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal__form">
              {[
                { label: "First Name", name: "first_name" },
                { label: "Last Name", name: "last_name" },
                { label: "Phone", name: "phone" },
                { label: "Parent Phone", name: "parent_phone" },
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
                <label>Course</label>
                <select
                  name="course_id"
                  value={editData.course_id || ""}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form__group">
                <label>Teacher</label>
                <select
                  name="teacher_id"
                  value={editData.teacher_id || ""}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form__group">
                <label>Group</label>
                <select
                  name="group_id"
                  value={editData.group_id || ""}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {["start_date", "payment_date", "next_payment_date"].map((d) => (
                <div className="form__group" key={d}>
                  <label style={{ textTransform: "capitalize" }}>
                    {d.replaceAll("_", " ")}
                  </label>
                  <input
                    type="date"
                    name={d}
                    value={editData[d] || ""}
                    onChange={handleChange}
                  />
                </div>
              ))}

              <div className="form__group">
                <label>Monthly Fee</label>
                <input
                  type="number"
                  name="monthly_fee"
                  value={editData.monthly_fee || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form__group">
                <label>Teacher %</label>
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
                  Paid Student
                </label>
              </div>
            </div>
            <div className="modal__actions">
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                <FiSave />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
