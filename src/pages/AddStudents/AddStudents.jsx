import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import {
  FiUser,
  FiPhone,
  FiBookOpen,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiCheckCircle,
  FiSave,
  FiX,
  FiHome,
} from "react-icons/fi";
import "./AddStudents.css";

export default function AddStudents({ activeBranch }) {
  const navigate = useNavigate();
  const branchId = activeBranch?.id;

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "+998 ",
    parent_phone: "+998 ",
    course_id: "",
    teacher_id: "",
    group_id: "",
    start_date: "",
    arrived_date: "",
    payment_date: "",
    next_payment_date: "",
    monthly_fee: "",
    teacher_percent: "",
    paid: false,
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

  const unformat = (v = "") => v.replace(/\D/g, "");

  const cleanDate = (v) => (v ? v : null);

  // ================= FETCH =================

  useEffect(() => {
    if (!branchId) return;

    const fetchData = async () => {
      try {
        setFetchLoading(true);

        const [c, t, g] = await Promise.all([
          supabase.from("courses").select("*").eq("branch_id", branchId),
          supabase.from("teachers").select("*").eq("branch_id", branchId),
          supabase.from("groups").select("*").eq("branch_id", branchId),
        ]);

        if (c.error || t.error || g.error) {
          throw c.error || t.error || g.error;
        }

        setCourses(c.data || []);
        setTeachers(t.data || []);
        setGroups(g.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [branchId]);

  // ================= FILTER =================

  const filteredTeachers = teachers.filter(
    (t) => !form.course_id || t.course_id === form.course_id
  );

  const filteredGroups = groups.filter(
    (g) =>
      (!form.course_id || g.course_id === form.course_id) &&
      (!form.teacher_id || g.teacher_id === form.teacher_id)
  );

  // ================= CHANGE =================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let newValue = value;

    if (type !== "checkbox") {
      if (name === "phone" || name === "parent_phone") {
        newValue = formatPhone(value);
      }

      // 👉 IMPORTANT: DB uchun number
      if (name === "monthly_fee" || name === "teacher_percent") {
        newValue = value.replace(/\D/g, "");
      }
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : newValue,
    }));
  };

  // ================= VALIDATION =================

  const validate = () => {
    if (!form.first_name.trim()) return "First name required";
    if (!form.last_name.trim()) return "Last name required";
    if (unformat(form.phone).length < 12) return "Phone invalid";
    if (!form.course_id) return "Course required";
    return null;
  };

  // ================= SUBMIT =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!branchId) return alert("Branch not found!");

    const err = validate();
    if (err) return alert(err);

    try {
      setLoading(true);

      const payload = {
        branch_id: branchId,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: unformat(form.phone),
        parent_phone: unformat(form.parent_phone),

        course_id: form.course_id || null,
        teacher_id: form.teacher_id || null,
        group_id: form.group_id || null,

        start_date: cleanDate(form.start_date),
        arrived_date: cleanDate(form.arrived_date),
        payment_date: cleanDate(form.payment_date),
        next_payment_date: cleanDate(form.next_payment_date),

        monthly_fee: Number(form.monthly_fee) || 0,
        teacher_percent: Number(form.teacher_percent) || 0,

        paid: form.paid,
      };

      const { error } = await supabase.from("students").insert([payload]);

      if (error) throw error;

      alert("✅ Student successfully added");

      navigate(`/dashboard/${branchId}/students`);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================

  return (
    <div className="add-student-page">

      <div className="branch-header-pro">
        <FiHome />
        <div>
          <p>Active Branch</p>
          <h3>{activeBranch?.name || "No branch"}</h3>
        </div>
      </div>

      <h2>Add Student</h2>

      {error && <p className="error">{error}</p>}
      {fetchLoading && <p>Loading...</p>}

      <form onSubmit={handleSubmit} className="add-form">

        <div className="form-row">
          <Input icon={<FiUser />} name="first_name" value={form.first_name} onChange={handleChange} placeholder="First Name" />
          <Input icon={<FiUser />} name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last Name" />
        </div>

        <div className="form-row">
          <Input icon={<FiPhone />} name="phone" value={form.phone} onChange={handleChange} />
          <Input icon={<FiPhone />} name="parent_phone" value={form.parent_phone} onChange={handleChange} />
        </div>

        <Select icon={<FiBookOpen />} name="course_id" value={form.course_id} onChange={handleChange} options={courses} />

        <div className="form-row">
          <Select icon={<FiUsers />} name="teacher_id" value={form.teacher_id} onChange={handleChange} options={filteredTeachers} />
          <Select icon={<FiUsers />} name="group_id" value={form.group_id} onChange={handleChange} options={filteredGroups} />
        </div>

        <div className="form-row">
          <DateInput name="start_date" value={form.start_date} onChange={handleChange} />
          <DateInput name="arrived_date" value={form.arrived_date} onChange={handleChange} />
        </div>

        <div className="form-row">
          <DateInput name="payment_date" value={form.payment_date} onChange={handleChange} />
          <DateInput name="next_payment_date" value={form.next_payment_date} onChange={handleChange} />
        </div>

        <div className="form-row">
          <Input icon={<FiDollarSign />} name="monthly_fee" value={form.monthly_fee} onChange={handleChange} />
          <Input icon={<FiDollarSign />} name="teacher_percent" value={form.teacher_percent} onChange={handleChange} />
        </div>

        <label className="checkbox">
          <input type="checkbox" name="paid" checked={form.paid} onChange={handleChange} />
          <FiCheckCircle /> Paid
        </label>

        <div className="actions">
          <button type="submit" disabled={loading}>
            <FiSave /> {loading ? "Saving..." : "Save"}
          </button>

          <button type="button" onClick={() => navigate(-1)}>
            <FiX /> Cancel
          </button>
        </div>

      </form>
    </div>
  );
}

// ================= COMPONENTS =================

const Input = (p) => (
  <div className="input-group">
    {p.icon}
    <input {...p} />
  </div>
);

const Select = ({ icon, options, ...p }) => (
  <div className="input-group">
    {icon}
    <select {...p}>
      <option value="">Select</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  </div>
);

const DateInput = (p) => (
  <div className="input-group">
    <FiCalendar />
    <input type="date" {...p} />
  </div>
);