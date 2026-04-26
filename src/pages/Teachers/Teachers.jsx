import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiUser,
  FiPhone,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiUsers,
  FiSearch,
  FiSave,
} from "react-icons/fi";
import "./Teachers.css";

export default function Teachers({ activeBranch }) {
  const branchId = activeBranch?.id;

  // ================= STATE =================
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // MODALS
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // FORM
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "+998 ",
    course_id: "",
    salary_paid: false,
    last_payment: "",
    next_payment: "",
  });

  // ================= NOTIFY (simple) =================
  const notify = (msg) => alert(msg);

  // ================= FORMAT =================
  const onlyDigits = (v = "") => v.toString().replace(/\D/g, "");

  const formatPhone = (value = "") => {
    let d = onlyDigits(value);
    if (!d.startsWith("998")) d = "998" + d;
    d = d.slice(0, 12);

    let res = "+998";
    if (d.length > 3) res += " " + d.slice(3, 5);
    if (d.length > 5) res += " " + d.slice(5, 8);
    if (d.length > 8) res += " " + d.slice(8, 10);
    if (d.length > 10) res += " " + d.slice(10, 12);
    return res;
  };

  const unformat = (v = "") => v.replace(/\D/g, "");

  const formatMoney = (n = 0) =>
    Number(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";

  // ================= FETCH =================
  const fetchData = async () => {
    if (!branchId) return;

    setLoading(true);

    const [t, c, g, s] = await Promise.all([
      supabase.from("teachers").select("*").eq("branch_id", branchId),
      supabase.from("courses").select("*").eq("branch_id", branchId),
      supabase.from("groups").select("*").eq("branch_id", branchId),
      supabase.from("students").select("*").eq("branch_id", branchId),
    ]);

    setTeachers(t.data || []);
    setCourses(c.data || []);
    setGroups(g.data || []);
    setStudents(s.data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  // ================= HELPERS =================
  const getCourse = (id) => courses.find((c) => c.id === id)?.name || "—";

  const getGroupsCount = (id) =>
    groups.filter((g) => g.teacher_id === id).length;

  const getIncome = (id) =>
    students
      .filter((s) => s.teacher_id === id && s.paid)
      .reduce((sum, s) => sum + ((s.monthly_fee || 0) * (s.teacher_percent || 0)) / 100, 0);

  // ================= HANDLE =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let val = value;

    if (name === "phone") val = formatPhone(value);

    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : val,
    }));
  };

  const reset = () => {
    setForm({
      name: "",
      phone: "+998 ",
      course_id: "",
      salary_paid: false,
      last_payment: "",
      next_payment: "",
    });
    setEditId(null);
    setModalOpen(false);
  };

  const handleEdit = (t) => {
    setForm({
      name: t.name || "",
      phone: formatPhone(t.phone || ""),
      course_id: t.course_id || "",
      salary_paid: t.salary_paid || false,
      last_payment: t.last_payment || "",
      next_payment: t.next_payment || "",
    });
    setEditId(t.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return notify("Name required");

    setLoading(true);

    const payload = {
      branch_id: branchId,
      name: form.name,
      phone: unformat(form.phone),
      course_id: form.course_id || null,
      salary_paid: form.salary_paid,
      last_payment: form.last_payment || null,
      next_payment: form.next_payment || null,
    };

    let res;

    if (editId) {
      res = await supabase
        .from("teachers")
        .update(payload)
        .eq("id", editId);
    } else {
      res = await supabase.from("teachers").insert(payload);
    }

    setLoading(false);

    if (res.error) return notify(res.error.message);

    notify(editId ? "Updated" : "Created");
    reset();
    fetchData();
  };

  const handleDelete = async () => {
    await supabase.from("teachers").delete().eq("id", confirmDelete);
    setConfirmDelete(null);
    fetchData();
  };

  // ================= FILTER =================
  const filtered = useMemo(() => {
    return teachers.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [teachers, search]);

  // ================= UI =================
  return (
    <div className="teachers">

      {/* HEADER */}
      <div className="teachers__header">
        <h2>Teachers</h2>
        <button onClick={() => setModalOpen(true)}>
          <FiPlus /> Add
        </button>
      </div>

      {/* SEARCH */}
      <div className="teachers__search">
        <FiSearch />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
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
              <th>Groups</th>
              <th>Income</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((t, i) => (
              <tr key={t.id}>
                <td>{i + 1}</td>
                <td>{t.name}</td>
                <td>{formatPhone(t.phone)}</td>
                <td>{getCourse(t.course_id)}</td>
                <td>{getGroupsCount(t.id)}</td>
                <td>{formatMoney(getIncome(t.id))}</td>
                <td>{t.salary_paid ? "Paid" : "Unpaid"}</td>
                <td>
                  <button onClick={() => handleEdit(t)}><FiEdit2 /></button>
                  <button onClick={() => setConfirmDelete(t.id)}><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="modal">
          <div className="modal__box">

            <h3>{editId ? "Edit" : "Add"} Teacher</h3>

            <form onSubmit={handleSubmit}>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
              <input name="phone" value={form.phone} onChange={handleChange} />

              <select name="course_id" value={form.course_id} onChange={handleChange}>
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <input type="date" name="last_payment" value={form.last_payment} onChange={handleChange} />
              <input type="date" name="next_payment" value={form.next_payment} onChange={handleChange} />

              <label>
                <input type="checkbox" name="salary_paid" checked={form.salary_paid} onChange={handleChange} /> Paid
              </label>

              <button type="submit" disabled={loading}>
                <FiSave /> Save
              </button>

              <button type="button" onClick={reset}><FiX /> Cancel</button>
            </form>

          </div>
        </div>
      )}

      {/* DELETE */}
      {confirmDelete && (
        <div className="modal">
          <div className="modal__box">
            <p>Delete teacher?</p>
            <button onClick={handleDelete}>Yes</button>
            <button onClick={() => setConfirmDelete(null)}>No</button>
          </div>
        </div>
      )}

    </div>
  );
}
