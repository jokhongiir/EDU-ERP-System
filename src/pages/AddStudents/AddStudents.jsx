import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import "./AddStudents.css";

export default function AddStudents({ activeBranch }) {
  const navigate = useNavigate();
  const branchId = activeBranch?.id;

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    course_id: "",
    teacher_id: "",
    group_id: "",
    monthly_fee: 0,
    teacher_percent: 0,
    last_payment: "",
    next_payment: "",
    paid: false,
  });

  // ================= LOAD SELECT DATA =================
  useEffect(() => {
    if (!branchId) return;

    const load = async () => {
      const [c, t, g] = await Promise.all([
        supabase.from("courses").select("*").eq("branch_id", branchId),
        supabase.from("teachers").select("*").eq("branch_id", branchId),
        supabase.from("groups").select("*").eq("branch_id", branchId),
      ]);

      setCourses(c.data || []);
      setTeachers(t.data || []);
      setGroups(g.data || []);
    };

    load();
  }, [branchId]);

  // ================= HANDLE =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      branch_id: branchId,
      monthly_fee: Number(form.monthly_fee),
      teacher_percent: Number(form.teacher_percent),
    };

    await supabase.from("students").insert([payload]);

    navigate("/dashboard/students");
  };

  return (
    <div className="add-student-page">

      <h2>Add Student</h2>

      <form onSubmit={handleSubmit} className="add-form">

        <input
          name="first_name"
          placeholder="First name"
          onChange={handleChange}
          required
        />

        <input
          name="last_name"
          placeholder="Last name"
          onChange={handleChange}
          required
        />

        <input
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
        />

        <select name="course_id" onChange={handleChange}>
          <option value="">Course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select name="teacher_id" onChange={handleChange}>
          <option value="">Teacher</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select name="group_id" onChange={handleChange}>
          <option value="">Group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        <input
          type="number"
          name="monthly_fee"
          placeholder="Monthly fee"
          onChange={handleChange}
        />

        <input
          type="number"
          name="teacher_percent"
          placeholder="Teacher %"
          onChange={handleChange}
        />

        <input type="date" name="last_payment" onChange={handleChange} />
        <input type="date" name="next_payment" onChange={handleChange} />

        <label>
          <input type="checkbox" name="paid" onChange={handleChange} />
          Paid
        </label>

        <button type="submit">Save Student</button>
      </form>

    </div>
  );
}