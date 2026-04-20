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

  // ================= STATE =================
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

  // 📞 PHONE (FIXED BACKSPACE +998)
  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, "");

    if (!digits.startsWith("998")) {
      digits = "998" + digits;
    }

    digits = digits.slice(0, 12);

    let result = "+998";

    if (digits.length > 3) result += " " + digits.slice(3, 5);
    if (digits.length > 5) result += " " + digits.slice(5, 8);
    if (digits.length > 8) result += " " + digits.slice(8, 10);
    if (digits.length > 10) result += " " + digits.slice(10, 12);

    return result;
  };

  // 💰 MONEY
  const formatMoney = (value) => {
    let num = value.replace(/\D/g, "");
    if (!num) return "";
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
  };

  // 📊 PERCENT
  const formatPercent = (value) => {
    let num = value.replace(/\D/g, "");
    if (!num) return "";
    return num + "%";
  };

  const unformat = (value) => value.replace(/\D/g, "");

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

        if (c.error) throw c.error;
        if (t.error) throw t.error;
        if (g.error) throw g.error;

        setCourses(c.data || []);
        setTeachers(t.data || []);
        setGroups(g.data || []);
      } catch (err) {
        setError("❌ Data load error");
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

      if (name === "monthly_fee") {
        newValue = formatMoney(value);
      }

      if (name === "teacher_percent") {
        newValue = formatPercent(value);
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

    if (!branchId) return alert("Branch topilmadi!");

    const errMsg = validate();
    if (errMsg) return alert(errMsg);

    try {
      setLoading(true);

      const payload = {
        ...form,
        branch_id: branchId,
        phone: unformat(form.phone),
        parent_phone: unformat(form.parent_phone),
        monthly_fee: Number(unformat(form.monthly_fee)) || 0,
        teacher_percent: Number(unformat(form.teacher_percent)) || 0,
      };

      const { error } = await supabase.from("students").insert([payload]);
      if (error) throw error;

      alert("✅ Student added successfully");
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

      <h2>Add New Student</h2>

      {error && <p className="error">{error}</p>}
      {fetchLoading && <p>Loading...</p>}

      <form onSubmit={handleSubmit} className="add-form">

        {/* NAME */}
        <div className="form-row">
          <Input icon={<FiUser />} label="First Name" name="first_name" value={form.first_name} onChange={handleChange} />
          <Input icon={<FiUser />} label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} />
        </div>

        {/* PHONE */}
        <div className="form-row">
          <Input icon={<FiPhone />} label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <Input icon={<FiPhone />} label="Parent Phone" name="parent_phone" value={form.parent_phone} onChange={handleChange} />
        </div>

        {/* COURSE */}
        <Select icon={<FiBookOpen />} label="Course" name="course_id" value={form.course_id} onChange={handleChange} options={courses} />

        {/* TEACHER + GROUP */}
        <div className="form-row">
          <Select icon={<FiUsers />} label="Teacher" name="teacher_id" value={form.teacher_id} onChange={handleChange} options={filteredTeachers} />
          <Select icon={<FiUsers />} label="Group" name="group_id" value={form.group_id} onChange={handleChange} options={filteredGroups} />
        </div>

        {/* DATES */}
        <div className="form-row">
          <DateInput label="Start Date" name="start_date" value={form.start_date} onChange={handleChange} />
          <DateInput label="Arrived Date" name="arrived_date" value={form.arrived_date} onChange={handleChange} />
        </div>

        <div className="form-row">
          <DateInput label="Payment Date" name="payment_date" value={form.payment_date} onChange={handleChange} />
          <DateInput label="Next Payment Date" name="next_payment_date" value={form.next_payment_date} onChange={handleChange} />
        </div>

        {/* MONEY */}
        <div className="form-row">
          <Input icon={<FiDollarSign />} label="Monthly Fee" name="monthly_fee" value={form.monthly_fee} onChange={handleChange} />
          <Input icon={<FiDollarSign />} label="Teacher %" name="teacher_percent" value={form.teacher_percent} onChange={handleChange} />
        </div>

        {/* CHECKBOX */}
        <label className="checkbox">
          <input type="checkbox" name="paid" checked={form.paid} onChange={handleChange} />
          <FiCheckCircle /> Payment Completed
        </label>

        {/* ACTIONS */}
        <div className="actions">
          <button type="submit" disabled={loading}>
            <FiSave /> {loading ? "Saving..." : "Save Student"}
          </button>

          <button type="button" onClick={() => navigate(-1)}>
            <FiX /> Cancel
          </button>
        </div>

      </form>
    </div>
  );
}

// ================= REUSABLE COMPONENTS =================

const Input = ({ icon, label, ...props }) => (
  <div className="input-group">
    {icon}
    <label>{label}</label>
    <input {...props} />
  </div>
);

const Select = ({ icon, label, options = [], ...props }) => (
  <div className="input-group">
    {icon}
    <label>{label}</label>
    <select {...props}>
      <option value="">Select</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  </div>
);

const DateInput = ({ label, ...props }) => (
  <div className="input-group">
    <FiCalendar />
    <label>{label}</label>
    <input type="date" {...props} />
  </div>
);