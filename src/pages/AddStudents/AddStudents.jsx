import { useEffect, useMemo, useState } from "react";
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

  // ================= DATA STATE =================
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);

  // ================= UI STATE =================
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  // ================= FORM =================
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

  // ================= HELPERS =================
  const onlyDigits = (v = "") => v.toString().replace(/\D/g, "");

  const formatPhone = (value) => {
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

  // ================= FETCH DATA =================
  useEffect(() => {
    if (!branchId) return;

    const load = async () => {
      try {
        setFetching(true);
        setError("");

        const [c, t, g] = await Promise.all([
          supabase.from("courses").select("*").eq("branch_id", branchId),
          supabase.from("teachers").select("*").eq("branch_id", branchId),
          supabase.from("groups").select("*").eq("branch_id", branchId),
        ]);

        if (c.error || t.error || g.error)
          throw c.error || t.error || g.error;

        setCourses(c.data || []);
        setTeachers(t.data || []);
        setGroups(g.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    };

    load();
  }, [branchId]);

  // ================= FILTER LOGIC (SMART) =================
  const filteredTeachers = useMemo(() => {
    if (!form.course_id) return teachers;
    return teachers.filter((t) => t.course_id === form.course_id);
  }, [teachers, form.course_id]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const byCourse = !form.course_id || g.course_id === form.course_id;
      const byTeacher = !form.teacher_id || g.teacher_id === form.teacher_id;
      return byCourse && byTeacher;
    });
  }, [groups, form.course_id, form.teacher_id]);

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let newValue = value;

    if (type !== "checkbox") {
      if (name === "phone" || name === "parent_phone") {
        newValue = formatPhone(value);
      }
    }

    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : newValue,
    }));
  };

  // ================= VALIDATION =================
  const validate = () => {
    if (!form.first_name.trim()) return "First name is required";
    if (!form.last_name.trim()) return "Last name is required";
    if (onlyDigits(form.phone).length < 12) return "Phone number invalid";
    return null;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!branchId) return alert("Branch not selected");

    const err = validate();
    if (err) return alert(err);

    try {
      setLoading(true);

      const payload = {
        branch_id: branchId,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),

        phone: onlyDigits(form.phone),
        parent_phone: onlyDigits(form.parent_phone),

        course_id: form.course_id || null,
        teacher_id: form.teacher_id || null,
        group_id: form.group_id || null,

        start_date: form.start_date || null,
        arrived_date: form.arrived_date || null,
        payment_date: form.payment_date || null,
        next_payment_date: form.next_payment_date || null,

        monthly_fee: Number(onlyDigits(form.monthly_fee)) || 0,
        teacher_percent: Number(onlyDigits(form.teacher_percent)) || 0,

        paid: form.paid,
      };

      const { error } = await supabase.from("students").insert(payload);

      if (error) throw error;

      alert("Student created successfully 🚀");

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

      {/* HEADER */}
      <div className="branch-header-pro">
        <FiHome />
        <div>
          <p>Active Branch</p>
          <h3>{activeBranch?.name || "No branch selected"}</h3>
        </div>
      </div>

      <h2>Create New Student</h2>

      {error && <div className="error">{error}</div>}
      {fetching && <p>Loading data...</p>}

      <form className="add-form" onSubmit={handleSubmit}>

        {/* NAME */}
        <div className="form-row">
          <Input icon={<FiUser />} name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} />
          <Input icon={<FiUser />} name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} />
        </div>

        {/* PHONE */}
        <div className="form-row">
          <Input icon={<FiPhone />} name="phone" placeholder="Student Phone" value={form.phone} onChange={handleChange} />
          <Input icon={<FiPhone />} name="parent_phone" placeholder="Parent Phone" value={form.parent_phone} onChange={handleChange} />
        </div>

        {/* COURSE */}
        <Select icon={<FiBookOpen />} name="course_id" value={form.course_id} onChange={handleChange} options={courses} />

        {/* TEACHER / GROUP */}
        <div className="form-row">
          <Select icon={<FiUsers />} name="teacher_id" value={form.teacher_id} onChange={handleChange} options={filteredTeachers} />
          <Select icon={<FiUsers />} name="group_id" value={form.group_id} onChange={handleChange} options={filteredGroups} />
        </div>

        {/* DATES */}
        <div className="form-row">
          <DateInput name="start_date" value={form.start_date} onChange={handleChange} />
          <DateInput name="arrived_date" value={form.arrived_date} onChange={handleChange} />
        </div>

        <div className="form-row">
          <DateInput name="payment_date" value={form.payment_date} onChange={handleChange} />
          <DateInput name="next_payment_date" value={form.next_payment_date} onChange={handleChange} />
        </div>

        {/* MONEY */}
        <div className="form-row">
          <Input icon={<FiDollarSign />} name="monthly_fee" placeholder="Monthly Fee" value={form.monthly_fee} onChange={handleChange} />
          <Input icon={<FiDollarSign />} name="teacher_percent" placeholder="Teacher Percent" value={form.teacher_percent} onChange={handleChange} />
        </div>

        {/* PAYMENT */}
        <label className="checkbox">
          <input type="checkbox" name="paid" checked={form.paid} onChange={handleChange} />
          <FiCheckCircle /> Payment Completed
        </label>

        {/* ACTIONS */}
        <div className="actions">
          <button type="submit" disabled={loading}>
            <FiSave /> {loading ? "Saving..." : "Create Student"}
          </button>

          <button type="button" onClick={() => navigate(-1)}>
            <FiX /> Cancel
          </button>
        </div>

      </form>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

const Input = ({ icon, ...props }) => (
  <div className="input-group">
    {icon}
    <input {...props} />
  </div>
);

const Select = ({ icon, options, ...props }) => (
  <div className="input-group">
    {icon}
    <select {...props}>
      <option value="">Select option</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  </div>
);

const DateInput = (props) => (
  <div className="input-group">
    <FiCalendar />
    <input type="date" {...props} />
  </div>
);