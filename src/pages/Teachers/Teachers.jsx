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
  FiDollarSign
} from "react-icons/fi";
import "./Teachers.css";

export default function Teachers({ activeBranch }) {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "+998 ",
    course_id: "",
    salary_paid: false,
    last_payment: "",
    next_payment: "",
  });

  // ================= FORMATTERS =================

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

  const unformat = (v) => v.replace(/\D/g, "");

  const formatMoney = (num) => {
    if (!num) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
  };

  // ================= FETCH =================

  useEffect(() => {
    if (!activeBranch?.id) return;
    fetchData();
  }, [activeBranch]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [t, c, g, s] = await Promise.all([
        supabase.from("teachers").select("*").eq("branch_id", activeBranch.id),
        supabase.from("courses").select("*").eq("branch_id", activeBranch.id),
        supabase.from("groups").select("*").eq("branch_id", activeBranch.id),
        supabase.from("students").select("*").eq("branch_id", activeBranch.id),
      ]);

      if (t.error) throw t.error;
      if (c.error) throw c.error;
      if (g.error) throw g.error;
      if (s.error) throw s.error;

      setTeachers(t.data || []);
      setCourses(c.data || []);
      setGroups(g.data || []);
      setStudents(s.data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= LOGIC =================

  const getCourse = (id) =>
    courses.find((c) => c.id === id)?.name || "-";

  const getGroupsCount = (teacherId) =>
    groups.filter((g) => g.teacher_id === teacherId).length;

  const getTeacherIncome = (teacherId) => {
    return students
      .filter((s) => s.teacher_id === teacherId && s.paid)
      .reduce((sum, s) => {
        const fee = s.monthly_fee || 0;
        const percent = s.teacher_percent || 0;
        return sum + (fee * percent) / 100;
      }, 0);
  };

  // ================= CHANGE =================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let newValue = value;

    if (name === "phone") {
      newValue = formatPhone(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : newValue,
    }));
  };

  // ================= SUBMIT =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        ...formData,
        branch_id: activeBranch.id,
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

      resetForm();
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE =================

  const handleDelete = async (id) => {
    if (!confirm("Delete teacher?")) return;

    await supabase.from("teachers").delete().eq("id", id);
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  // ================= EDIT =================

  const handleEdit = (t) => {
    setFormData({
      name: t.name,
      phone: formatPhone(t.phone || ""),
      course_id: t.course_id || "",
      salary_paid: t.salary_paid || false,
      last_payment: t.last_payment || "",
      next_payment: t.next_payment || "",
    });

    setEditId(t.id);
    setModalOpen(true);
  };

  // ================= RESET =================

  const resetForm = () => {
    setModalOpen(false);
    setEditId(null);

    setFormData({
      name: "",
      phone: "+998 ",
      course_id: "",
      salary_paid: false,
      last_payment: "",
      next_payment: "",
    });
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
              <th><FiUser /> Name</th>
              <th><FiPhone /> Phone</th>
              <th><FiBookOpen /> Course</th>
              <th>Groups</th>
              <th><FiDollarSign /> Income</th>
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
                <td>{formatMoney(getTeacherIncome(t.id))}</td>

                <td>
                  <span className={t.salary_paid ? "paid" : "unpaid"}>
                    {t.salary_paid ? "Paid" : "Unpaid"}
                  </span>
                </td>

                <td className="actions">
                  <button onClick={() => handleEdit(t)}>
                    <FiEdit2 />
                  </button>

                  <button onClick={() => handleDelete(t.id)}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="modal">
          <div className="modal__content">

            <div className="modal__header">
              <h2>{editId ? "Edit Teacher" : "Add Teacher"}</h2>
              <FiX onClick={resetForm} />
            </div>

            <form onSubmit={handleSubmit}>

              <div className="input">
                <FiUser />
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required />
              </div>

              <div className="input">
                <FiPhone />
                <input name="phone" value={formData.phone} onChange={handleChange} />
              </div>

              <div className="input">
                <FiBookOpen />
                <select name="course_id" value={formData.course_id} onChange={handleChange}>
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="input">
                  <FiCalendar />
                  <input type="date" name="last_payment" value={formData.last_payment} onChange={handleChange} />
                </div>

                <div className="input">
                  <FiCalendar />
                  <input type="date" name="next_payment" value={formData.next_payment} onChange={handleChange} />
                </div>
              </div>

              {/* INCOME PREVIEW */}
              {editId && (
                <div className="teacher-income-box">
                  <p>Income from students</p>
                  <h3>{formatMoney(getTeacherIncome(editId))}</h3>
                </div>
              )}

              <label className="checkbox">
                <input type="checkbox" name="salary_paid" checked={formData.salary_paid} onChange={handleChange} />
                <FiCheckCircle /> Salary Paid
              </label>

              <button type="submit" className="submit">
                {editId ? "Update" : "Create"}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}