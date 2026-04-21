import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiPhone,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiX,
  FiDollarSign,
} from "react-icons/fi";
import "./Teachers.css";

export default function Teachers({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);

  // MODALS
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // NOTIFICATION MODAL
  const [notify, setNotify] = useState({ show: false, type: "", message: "" });

  const [formData, setFormData] = useState({
    name: "",
    phone: "+998 ",
    course_id: "",
    salary_paid: false,
    last_payment: "",
    next_payment: "",
  });

  // ================= NOTIFY =================
  const showNotify = (type, message) => {
    setNotify({ show: true, type, message });

    setTimeout(() => {
      setNotify({ show: false, type: "", message: "" });
    }, 2500);
  };

  // ================= FORMAT =================
  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, "");
    if (!digits.startsWith("998")) digits = "998" + digits;
    digits = digits.slice(0, 12);

    let res = "+998";
    if (digits.length > 3) res += " " + digits.slice(3, 5);
    if (digits.length > 5) res += " " + digits.slice(5, 8);
    if (digits.length > 8) res += " " + digits.slice(8, 10);
    if (digits.length > 10) res += " " + digits.slice(10, 12);

    return res;
  };

  const unformat = (v = "") => v.replace(/\D/g, "");

  const formatMoney = (num = 0) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";

  // ================= FETCH =================
  useEffect(() => {
    if (!branchId) return;
    fetchData();
  }, [branchId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [t, c, g, s] = await Promise.all([
        supabase.from("teachers").select("*").eq("branch_id", branchId),
        supabase.from("courses").select("*").eq("branch_id", branchId),
        supabase.from("groups").select("*").eq("branch_id", branchId),
        supabase.from("students").select("*").eq("branch_id", branchId),
      ]);

      if (t.error || c.error || g.error || s.error) {
        throw t.error || c.error || g.error || s.error;
      }

      setTeachers(t.data || []);
      setCourses(c.data || []);
      setGroups(g.data || []);
      setStudents(s.data || []);
    } catch (err) {
      showNotify("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= HELPERS =================
  const getCourse = (id) =>
    courses.find((c) => c.id === id)?.name || "—";

  const getGroupsCount = (id) =>
    groups.filter((g) => g.teacher_id === id).length;

  const getIncome = (id) =>
    students
      .filter((s) => s.teacher_id === id && s.paid)
      .reduce((sum, s) => sum + (s.monthly_fee * s.teacher_percent) / 100, 0);

  // ================= CHANGE =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let newValue = value;

    if (name === "phone") newValue = formatPhone(value);

    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : newValue,
    }));
  };

  // ================= RESET =================
  const reset = () => {
    setFormData({
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

  // ================= EDIT =================
  const handleEdit = (t) => {
    setFormData({
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

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim())
      return showNotify("error", "Name required");

    try {
      setLoading(true);

      const payload = {
        ...formData,
        branch_id: branchId,
        phone: unformat(formData.phone),
      };

      let res;

      if (editId) {
        res = await supabase
          .from("teachers")
          .update(payload)
          .eq("id", editId);
      } else {
        res = await supabase.from("teachers").insert([payload]);
      }

      if (res.error) throw res.error;

      showNotify("success", editId ? "Updated" : "Created");
      reset();
      fetchData();
    } catch (err) {
      showNotify("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async () => {
    try {
      await supabase.from("teachers").delete().eq("id", confirmDelete);

      setTeachers((p) => p.filter((t) => t.id !== confirmDelete));
      setConfirmDelete(null);

      showNotify("success", "Deleted");
    } catch (err) {
      showNotify("error", err.message);
    }
  };

  // ================= UI =================
  return (
    <div className="teachers">

      {/* HEADER */}
      <div className="teachers__header">
        <h1>Teachers</h1>
        <button onClick={() => setModalOpen(true)}>
          <FiPlus /> Add Teacher
        </button>
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
            {teachers.map((t, i) => (
              <tr key={t.id}>
                <td>{i + 1}</td>
                <td>{t.name}</td>
                <td>{formatPhone(t.phone)}</td>
                <td>{getCourse(t.course_id)}</td>
                <td>{getGroupsCount(t.id)}</td>
                <td>{formatMoney(getIncome(t.id))}</td>

                <td>
                  <span className={t.salary_paid ? "paid" : "unpaid"}>
                    {t.salary_paid ? "Paid" : "Unpaid"}
                  </span>
                </td>

                <td>
                  <button onClick={() => handleEdit(t)}>
                    <FiEdit2 />
                  </button>

                  <button onClick={() => setConfirmDelete(t.id)}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {modalOpen && (
        <div className="modal">
          <div className="modal__content">

            <div className="modal__header">
              <h2>{editId ? "Edit" : "Add"} Teacher</h2>
              <FiX onClick={reset} />
            </div>

            <form onSubmit={handleSubmit}>

              <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" />

              <input name="phone" value={formData.phone} onChange={handleChange} />

              <select name="course_id" value={formData.course_id} onChange={handleChange}>
                <option value="">Optional Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <input type="date" name="last_payment" value={formData.last_payment} onChange={handleChange} />
              <input type="date" name="next_payment" value={formData.next_payment} onChange={handleChange} />

              <label>
                <input type="checkbox" name="salary_paid" checked={formData.salary_paid} onChange={handleChange} />
                Salary Paid
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {confirmDelete && (
        <div className="modal">
          <div className="modal__content">
            <h3>Delete teacher?</h3>

            <button onClick={handleDelete}>Yes</button>
            <button onClick={() => setConfirmDelete(null)}>No</button>
          </div>
        </div>
      )}

      {/* NOTIFY */}
      {notify.show && (
        <div className={`notify ${notify.type}`}>
          {notify.message}
        </div>
      )}

    </div>
  );
}