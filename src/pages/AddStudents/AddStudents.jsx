import React, { useEffect, useMemo, useState, useCallback } from "react";
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

const onlyDigits = (v = "") => v?.toString().replace(/\D/g, "") || "";

const normalizePhone = (value) => {
  const digits = onlyDigits(value);

  if (!digits) return null;

  // agar user 9 digit yozsa ham +998 bilan to'ldiramiz
  let d = digits;

  if (d.length === 9) {
    d = "998" + d;
  }

  if (d.length !== 12) return null;

  return d;
};

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

export default function AddStudents({
  activeBranch,
  editStudent = null,
  onFinish,
}) {
  const navigate = useNavigate();
  const branchId = activeBranch?.id;
  const isEdit = !!editStudent;
  const [dbData, setDbData] = useState({
    courses: [],
    teachers: [],
    groups: [],
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

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

  useEffect(() => {
    if (editStudent) {
      setForm({
        ...editStudent,
        phone: editStudent.phone ? formatPhone(editStudent.phone) : "+998 ",
        parent_phone: editStudent.parent_phone
          ? formatPhone(editStudent.parent_phone)
          : "+998 ",
        monthly_fee: formatMoney(editStudent.monthly_fee),
        teacher_percent: formatPercent(editStudent.teacher_percent),
        course_id: editStudent.course_id || "",
        teacher_id: editStudent.teacher_id || "",
        group_id: editStudent.group_id || "",
      });
    }
  }, [editStudent]);

  useEffect(() => {
    if (!branchId) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const [c, t, g] = await Promise.all([
          supabase.from("courses").select("*").eq("branch_id", branchId),
          supabase.from("teachers").select("*").eq("branch_id", branchId),
          supabase.from("groups").select("*").eq("branch_id", branchId),
        ]);

        setDbData({
          courses: c.data || [],
          teachers: t.data || [],
          groups: g.data || [],
        });
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [branchId]);

  const filteredTeachers = useMemo(() => {
    if (!form.course_id) return dbData.teachers;
    return dbData.teachers.filter((t) => t.course_id == form.course_id);
  }, [dbData.teachers, form.course_id]);

  const filteredGroups = useMemo(() => {
    return dbData.groups.filter((g) => {
      const matchCourse = !form.course_id || g.course_id == form.course_id;
      const matchTeacher = !form.teacher_id || g.teacher_id == form.teacher_id;
      return matchCourse && matchTeacher;
    });
  }, [dbData.groups, form.course_id, form.teacher_id]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let val = type === "checkbox" ? checked : value;

    if (name === "phone" || name === "parent_phone") val = formatPhone(value);
    if (name === "monthly_fee") val = formatMoney(value);
    if (name === "teacher_percent") val = formatPercent(value);

    setForm((prev) => {
      const next = { ...prev, [name]: val };

      if (name === "course_id") {
        next.teacher_id = "";
        next.group_id = "";
      }
      if (name === "teacher_id") {
        next.group_id = "";
      }

      return next;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      return alert("First name and last name are required!");
    }

    setLoading(true);

    try {
      const cleanStudentPhone = normalizePhone(form.phone);
      const cleanParentPhone = normalizePhone(form.parent_phone);

      // 👉 NO ERROR VALIDATION AT ALL FOR PHONE
      // faqat duplicate check qoladi

      if (cleanStudentPhone) {
        const { data: existingStudent } = await supabase
          .from("students")
          .select("id")
          .eq("phone", cleanStudentPhone)
          .maybeSingle();

        if (
          existingStudent &&
          (!isEdit || existingStudent.id !== editStudent?.id)
        ) {
          setLoading(false);
          return alert("This phone number already exists!");
        }
      }

      const payload = {
        branch_id: branchId,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),

        phone: cleanStudentPhone,
        parent_phone: cleanParentPhone,

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

      const { error } = isEdit
        ? await supabase
            .from("students")
            .update(payload)
            .eq("id", editStudent.id)
        : await supabase.from("students").insert([payload]);

      if (error) throw error;

      alert(isEdit ? "Updated!" : "Student added!");

      onFinish ? onFinish() : navigate(`/dashboard/${branchId}/students`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  if (!branchId) return <div className="p-4">Branch not found...</div>;

  return (
    <div className="add-page">
      <div className="header">
        <FiHome />
        <div>
          <p>Branch</p>
          <h3>{activeBranch?.name}</h3>
        </div>
      </div>
      <h2>
        <FiUserCheck />
        {isEdit ? " Edit Student" : " Add New Student"}
      </h2>

      {fetching && <div className="loading-bar">Loading...</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="section">
          <h4>
            <FiUser /> Personal Information
          </h4>
          <div className="grid">
            <Field label="First Name">
              <Input
                icon={<FiUserCheck />}
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
              />
            </Field>
            <Field label="Last Name">
              <Input
                icon={<FiUser />}
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </Field>
            <Field label="Student Phone">
              <Input
                icon={<FiPhone />}
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={17}
              />
            </Field>

            <Field label="Parent Phone">
              <Input
                icon={<FiPhone />}
                name="parent_phone"
                value={form.parent_phone}
                onChange={handleChange}
                maxLength={17}
              />
            </Field>
          </div>
        </div>

        <div className="section">
          <h4>
            <FiBookOpen /> Education Details
          </h4>
          <div className="grid">
            <Field label="Course">
              <Select
                icon={<FiBookOpen />}
                name="course_id"
                value={form.course_id}
                onChange={handleChange}
                options={dbData.courses}
              />
            </Field>
            <Field label="Teacher">
              <Select
                icon={<FiUsers />}
                name="teacher_id"
                value={form.teacher_id}
                onChange={handleChange}
                options={filteredTeachers}
                disabled={!form.course_id}
                placeholder={form.course_id ? "Select" : "Select course first"}
              />
            </Field>
            <Field label="Group">
              <Select
                icon={<FiClipboard />}
                name="group_id"
                value={form.group_id}
                onChange={handleChange}
                options={filteredGroups}
                disabled={!form.course_id || filteredGroups.length === 0}
                placeholder={
                  !form.course_id
                    ? "Select course"
                    : filteredGroups.length === 0
                      ? "No groups available"
                      : "Select group"
                }
              />
            </Field>
            <Field label="Start Date">
              <DateInput
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </Field>
          </div>
        </div>

        <div className="section">
          <h4>
            <FiCreditCard /> Payment Details
          </h4>
          <div className="grid">
            <Field label="Payment Date">
              <DateInput
                name="payment_date"
                value={form.payment_date}
                onChange={handleChange}
              />
            </Field>
            <Field label="Next Payment Date">
              <DateInput
                name="next_payment_date"
                value={form.next_payment_date}
                onChange={handleChange}
              />
            </Field>
            <Field label="Monthly Fee">
              <Input
                icon={<FiTrendingUp />}
                name="monthly_fee"
                value={form.monthly_fee}
                onChange={handleChange}
              />
            </Field>
            <Field label="Teacher's Share (%)">
              <Input
                icon={<FiDollarSign />}
                name="teacher_percent"
                value={form.teacher_percent}
                onChange={handleChange}
              />
            </Field>
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              name="paid"
              checked={form.paid}
              onChange={handleChange}
            />
            <FiCheckCircle color={form.paid ? "#22c55e" : "#ccc"} /> Paid
          </label>
        </div>

        <div className="actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            <FiSave />
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(-1)}
          >
            <FiX /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div className="field">
    <label>{label}</label>
    {children}
  </div>
);

const Input = ({ icon, ...props }) => (
  <div className="input">
    {icon}
    <input {...props} autoComplete="off" />
  </div>
);

const Select = ({ icon, options, placeholder = "Select", ...props }) => (
  <div className="input">
    {icon}
    <select {...props}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name || o.group_name || o.title}
        </option>
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
