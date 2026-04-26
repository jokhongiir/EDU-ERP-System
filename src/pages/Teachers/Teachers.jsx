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
    <div className="teachers">
      <div className="teachers__header">
        <div>
          <h2>{activeBranch?.name || "Branch"} • Teachers</h2>
          <p className="teachers__sub">Manage all teachers in your branch</p>
        </div>

        <button onClick={() => setModalOpen(true)}>
          <FiPlus /> Add Teacher
        </button>
      </div>
      {/* SEARCH */}
      <div className="teachers__search">
        <FiSearch />
        <input
          placeholder="Search teacher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="teachers__table">
        <table>
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
                onClick={() => openView(t)}
                style={{ cursor: "pointer" }}
              >
                <td>{i + 1}</td>
                <td>{t.name}</td>
                <td>{t.phone}</td>
                <td>{getCourseName(t.course_id)}</td>
                <td>{getStudentsCount(t.id)}</td>
                <td>{getIncome(t.id).toFixed(0)} so'm</td>
                <td className={t.salary_paid ? "paid" : "unpaid"}>
                  {t.salary_paid ? "Paid" : "Unpaid"}
                </td>

                <td onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(t)}>
                    <FiEdit />
                  </button>
                  <button onClick={() => setDeleteId(t.id)}>
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
        <div className="modal">
          <div className="modal__box view">
            <div className="modal__header">
              <h3>Teacher Details</h3>
              <button onClick={() => setViewOpen(false)}>
                <FiX />
              </button>
            </div>

            <div className="view__grid">
              <div className="view__card">
                <FiUser />
                <div>
                  <p>Name</p>
                  <h4>{viewData.name}</h4>
                </div>
              </div>

              <div className="view__card">
                <FiPhone />
                <div>
                  <p>Phone</p>
                  <h4>{viewData.phone}</h4>
                </div>
              </div>

              <div className="view__card">
                <FiBookOpen />
                <div>
                  <p>Course</p>
                  <h4>{getCourseName(viewData.course_id)}</h4>
                </div>
              </div>

              <div className="view__card">
                <FiUsers />
                <div>
                  <p>Students</p>
                  <h4>{getStudentsCount(viewData.id)}</h4>
                </div>
              </div>

              <div className="view__card">
                <FiDollarSign />
                <div>
                  <p>Income</p>
                  <h4>{getIncome(viewData.id).toFixed(0)} so'm</h4>
                </div>
              </div>

              <div className="view__card">
                <FiCheckCircle />
                <div>
                  <p>Status</p>
                  <h4 className={viewData.salary_paid ? "paid" : "unpaid"}>
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
        <div className="modal">
          <div className="modal__box">
            <div className="modal__header">
              <h3>{editId ? "Edit Teacher" : "Add Teacher"}</h3>
              <button onClick={resetForm}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form">
              {/* NAME */}
              <div className="form__group">
                <label>Teacher Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter teacher name"
                />
              </div>

              {/* PHONE */}
              <div className="form__group">
                <label>Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+998 90 123 45 67"
                />
              </div>

              {/* COURSE */}
              <div className="form__group">
                <label>Course</label>
                <select
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
              <div className="form__group">
                <label>Last Payment Date</label>
                <input
                  type="date"
                  name="last_payment"
                  value={form.last_payment}
                  onChange={handleChange}
                />
              </div>

              {/* NEXT PAYMENT */}
              <div className="form__group">
                <label>Next Payment Date</label>
                <input
                  type="date"
                  name="next_payment"
                  value={form.next_payment}
                  onChange={handleChange}
                />
              </div>

              {/* STATUS */}
              <div className="form__group checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="salary_paid"
                    checked={form.salary_paid}
                    onChange={handleChange}
                  />
                  Salary Paid
                </label>
              </div>

              {/* BUTTON */}
              <button type="submit" className="save-btn">
                <FiSave /> Save Teacher
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE */}
      {deleteId && (
        <div className="modal">
          <div className="modal__box">
            <p>Delete teacher?</p>
            <button onClick={handleDelete}>Yes</button>
            <button onClick={() => setDeleteId(null)}>No</button>
          </div>
        </div>
      )}
    </div>
  );
}
