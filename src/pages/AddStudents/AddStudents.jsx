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
  FiClipboard,
  FiUserCheck,
  FiTrendingUp,
  FiCreditCard,
} from "react-icons/fi";

import "./AddStudents.css";

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

const formatMoney = (value) => {
  const num = onlyDigits(value);
  if (!num) return "";
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const formatPercent = (value) => {
  const num = onlyDigits(value);
  if (!num) return "";
  return num + "%";
};

// ================= MAIN =================
export default function AddStudents({
  activeBranch,
  editStudent = null,   // 👈 EDIT MODE
  onFinish,
}) {
  const navigate = useNavigate();
  const branchId = activeBranch?.id;

  // ================= MODE =================
  const isEdit = !!editStudent;

  // ================= DATA =================
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);

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
    payment_date: "",
    next_payment_date: "",
    monthly_fee: "",
    teacher_percent: "",
    paid: false,
  });

  // ================= LOAD EDIT DATA =================
  useEffect(() => {
    if (editStudent) {
      setForm({
        first_name: editStudent.first_name || "",
        last_name: editStudent.last_name || "",
        phone: editStudent.phone ? "+998 " + editStudent.phone : "+998 ",
        parent_phone: editStudent.parent_phone ? "+998 " + editStudent.parent_phone : "+998 ",
        course_id: editStudent.course_id || "",
        teacher_id: editStudent.teacher_id || "",
        group_id: editStudent.group_id || "",
        start_date: editStudent.start_date || "",
        payment_date: editStudent.payment_date || "",
        next_payment_date: editStudent.next_payment_date || "",
        monthly_fee: editStudent.monthly_fee?.toString() || "",
        teacher_percent: editStudent.teacher_percent?.toString() || "",
        paid: editStudent.paid || false,
      });
    }
  }, [editStudent]);

  // ================= FETCH =================
  useEffect(() => {
    if (!branchId) return;

    const load = async () => {
      setFetching(true);

      const [c, t, g] = await Promise.all([
        supabase.from("courses").select("*").eq("branch_id", branchId),
        supabase.from("teachers").select("*").eq("branch_id", branchId),
        supabase.from("groups").select("*").eq("branch_id", branchId),
      ]);

      setCourses(c.data || []);
      setTeachers(t.data || []);
      setGroups(g.data || []);

      setFetching(false);
    };

    load();
  }, [branchId]);

  // ================= FILTER =================
// ================= FILTER =================
const filteredTeachers = useMemo(() => {
  if (!form.course_id) return teachers;
  return teachers.filter((t) => t.course_id === form.course_id);
}, [teachers, form.course_id]);

const filteredGroups = useMemo(() => {
  return groups.filter((g) => {
    return (
      (!form.course_id || g.course_id === form.course_id) &&
      (!form.teacher_id || g.teacher_id === form.teacher_id)
    );
  });
}, [groups, form.course_id, form.teacher_id]);

  // ================= HANDLE =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let val = value;

    if (name === "phone" || name === "parent_phone") val = formatPhone(value);
    if (name === "monthly_fee") val = formatMoney(value);
    if (name === "teacher_percent") val = formatPercent(value);

    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : val,
    }));
  };

  // ================= VALIDATION =================
  const validate = () => {
    if (!form.first_name.trim()) return "First name required";
    if (!form.last_name.trim()) return "Last name required";
    if (onlyDigits(form.phone).length < 12) return "Phone invalid";
    return null;
  };

  // ================= SUBMIT (ADD + EDIT) =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validate();
    if (err) return alert(err);

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
      payment_date: form.payment_date || null,
      next_payment_date: form.next_payment_date || null,
      monthly_fee: Number(onlyDigits(form.monthly_fee)) || 0,
      teacher_percent: Number(onlyDigits(form.teacher_percent)) || 0,
      paid: form.paid,
    };

    let result;

    if (isEdit) {
      result = await supabase
        .from("students")
        .update(payload)
        .eq("id", editStudent.id);
    } else {
      result = await supabase.from("students").insert(payload);
    }

    setLoading(false);

    if (result.error) return alert(result.error.message);

    if (onFinish) return onFinish();
    navigate(`/dashboard/${branchId}/students`);
  };

  // ================= UI =================
  if (!branchId) return <div>No branch selected</div>;

  return (
    <div className="add-page">

      {/* HEADER */}
      <div className="header">
        <FiHome />
        <div>
          <p>Active Branch</p>
          <h3>{activeBranch?.name}</h3>
        </div>
      </div>

      <h2>
        <FiUserCheck />
        {isEdit ? " Edit Student" : " Create New Student"}
      </h2>

      {fetching && <p>Loading...</p>}

      <form onSubmit={handleSubmit} className="form">

        {/* PERSONAL */}
        <div className="section">
          <h4><FiUser /> Personal Info</h4>

          <div className="grid">

            <Field label="First Name">
              <Input icon={<FiUserCheck />} name="first_name" value={form.first_name} onChange={handleChange} />
            </Field>

            <Field label="Last Name">
              <Input icon={<FiUser />} name="last_name" value={form.last_name} onChange={handleChange} />
            </Field>

            <Field label="Student Phone">
              <Input icon={<FiPhone />} name="phone" value={form.phone} onChange={handleChange} />
            </Field>

            <Field label="Parent Phone">
              <Input icon={<FiPhone />} name="parent_phone" value={form.parent_phone} onChange={handleChange} />
            </Field>

          </div>
        </div>

        {/* EDUCATION */}
        <div className="section">
          <h4><FiBookOpen /> Education</h4>

          <div className="grid">

            <Field label="Course">
              <Select icon={<FiBookOpen />} name="course_id" value={form.course_id} onChange={handleChange} options={courses} />
            </Field>

            <Field label="Teacher">
              <Select icon={<FiUsers />} name="teacher_id" value={form.teacher_id} onChange={handleChange} options={filteredTeachers} />
            </Field>

            <Field label="Group">
              <Select icon={<FiClipboard />} name="group_id" value={form.group_id} onChange={handleChange} options={filteredGroups} />
            </Field>

            <Field label="Start Date">
              <DateInput name="start_date" value={form.start_date} onChange={handleChange} />
            </Field>

          </div>
        </div>

        {/* PAYMENT */}
        <div className="section">
          <h4><FiCreditCard /> Payment</h4>

          <div className="grid">

            <Field label="Payment Date">
              <DateInput name="payment_date" value={form.payment_date} onChange={handleChange} />
            </Field>

            <Field label="Next Payment Date">
              <DateInput name="next_payment_date" value={form.next_payment_date} onChange={handleChange} />
            </Field>

            <Field label="Monthly Fee">
              <Input icon={<FiTrendingUp />} name="monthly_fee" value={form.monthly_fee} onChange={handleChange} />
            </Field>

            <Field label="Teacher %">
              <Input icon={<FiDollarSign />} name="teacher_percent" value={form.teacher_percent} onChange={handleChange} />
            </Field>

          </div>

          <label className="checkbox">
            <input type="checkbox" name="paid" checked={form.paid} onChange={handleChange} />
            <FiCheckCircle /> Paid
          </label>
        </div>

        {/* ACTIONS */}
        <div className="actions">
          <button type="submit" disabled={loading}>
            <FiSave />
            {loading ? "Saving..." : isEdit ? "Update Student" : "Create Student"}
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

const Field = ({ label, children }) => (
  <div className="field">
    <label>{label}</label>
    {children}
  </div>
);

const Input = ({ icon, ...props }) => (
  <div className="input">
    {icon}
    <input {...props} />
  </div>
);

const Select = ({ icon, options, ...props }) => (
  <div className="input">
    {icon}
    <select {...props}>
      <option value="">Select</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  </div>
);

const DateInput = (props) => (
  <div className="input">
    <FiCalendar />
    <input type="date" {...props} />
  </div>
);