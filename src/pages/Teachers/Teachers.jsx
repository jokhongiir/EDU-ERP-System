import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import "./Teachers.css";

export default function Teachers({ activeBranch }) {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "+998 ",
    courseId: "",
    salaryPaid: false,
    lastPayment: "",
    nextPayment: "",
  });

  // ================= FETCH =================
  useEffect(() => {
    if (!activeBranch?.id) return;

    fetchData();
  }, [activeBranch]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [teachersRes, coursesRes, groupsRes] = await Promise.all([
        supabase.from("teachers").select("*").eq("branch_id", activeBranch.id),
        supabase.from("courses").select("*").eq("branch_id", activeBranch.id),
        supabase.from("groups").select("*").eq("branch_id", activeBranch.id),
      ]);

      if (teachersRes.error) throw teachersRes.error;
      if (coursesRes.error) throw coursesRes.error;
      if (groupsRes.error) throw groupsRes.error;

      setTeachers(teachersRes.data || []);
      setCourses(coursesRes.data || []);
      setGroups(groupsRes.data || []);
    } catch (err) {
      console.error("FETCH ERROR:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= CHANGE =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!activeBranch?.id) {
      alert("Branch tanlanmagan!");
      return;
    }

    const payload = {
      name: formData.name,
      phone: formData.phone,
      course_id: formData.courseId || null, // 👈 SHU
      salary_paid: formData.salaryPaid,
      last_payment: formData.lastPayment || null,
      next_payment: formData.nextPayment || null,
      branch_id: activeBranch.id,
    };

    try {
      setLoading(true);

      let result;

      if (editId) {
        result = await supabase
          .from("teachers")
          .update(payload)
          .eq("id", editId);
      } else {
        result = await supabase.from("teachers").insert([payload]);
      }

      if (result.error) throw result.error;

      setModalOpen(false);
      setEditId(null);

      setFormData({
        name: "",
        phone: "+998 ",
        courseId: "",
        salaryPaid: false,
        lastPayment: "",
        nextPayment: "",
      });

      await fetchData();
    } catch (err) {
      console.error("SUBMIT ERROR:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("O‘chirishni tasdiqlaysizmi?")) return;

    try {
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTeachers((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err.message);
    }
  };

  // ================= HELPERS =================
  const getCourseName = (id) =>
    courses.find((c) => c.id === id)?.name || "-";

  const getTeacherGroups = (teacherId) =>
    groups.filter((g) => g.teacherId === teacherId).length;

  // ================= UI =================
  return (
    <div className="teachers">

      <div className="teachers__header">
        <h1>Teachers - {activeBranch?.name}</h1>

        <button onClick={() => setModalOpen(true)}>
          + Add Teacher
        </button>
      </div>

      {/* LOADING */}
      {loading && <p>Loading...</p>}

      {/* MODAL */}
      {modalOpen && (
        <div className="teachers__modal">
          <div className="teachers__modal-content">

            <h2>{editId ? "Edit Teacher" : "Add Teacher"}</h2>

            <form onSubmit={handleSubmit} className="teachers__form">

              <input
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <input
                name="phone"
                placeholder="+998..."
                value={formData.phone}
                onChange={handleChange}
                required
              />

              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
              >
                <option value="">Select Course (optional)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="form-row">
                <input
                  type="date"
                  name="lastPayment"
                  value={formData.lastPayment}
                  onChange={handleChange}
                />
                <input
                  type="date"
                  name="nextPayment"
                  value={formData.nextPayment}
                  onChange={handleChange}
                />
              </div>

              <label>
                <input
                  type="checkbox"
                  name="salaryPaid"
                  checked={formData.salaryPaid}
                  onChange={handleChange}
                />
                Salary Paid
              </label>

              <button type="submit">
                {editId ? "Update" : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="teachers__table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Course</th>
              <th>Groups</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((t, i) => (
              <tr key={t.id}>
                <td>{i + 1}</td>
                <td>{t.name}</td>
                <td>{t.phone}</td>
                <td>{getCourseName(t.courseId)}</td>
                <td>{getTeacherGroups(t.id)}</td>
                <td>{t.salaryPaid ? "Paid" : "Unpaid"}</td>
                <td>
                  <button onClick={() => {
                    setFormData(t);
                    setEditId(t.id);
                    setModalOpen(true);
                  }}>
                    Edit
                  </button>

                  <button onClick={() => handleDelete(t.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}