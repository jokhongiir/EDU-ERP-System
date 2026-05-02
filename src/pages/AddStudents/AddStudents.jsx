import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

import {
  FiUser, FiPhone, FiBookOpen, FiUsers, FiCalendar,
  FiDollarSign, FiCheckCircle, FiSave, FiX, FiHome,
  FiClipboard, FiUserCheck, FiTrendingUp, FiCreditCard,
} from "react-icons/fi";

import "./AddStudents.css";

// ================= HELPERS =================
const onlyDigits = (v = "") => v?.toString().replace(/\D/g, "") || "";

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

// ================= MAIN COMPONENT =================
export default function AddStudents({ activeBranch, editStudent = null, onFinish }) {
  const navigate = useNavigate();
  const branchId = activeBranch?.id;
  const isEdit = !!editStudent;

  // --- Data States ---
  const [dbData, setDbData] = useState({
    courses: [],
    teachers: [],
    groups: [],
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // --- Form State ---
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

  // --- Initial Load (Edit Mode) ---
  useEffect(() => {
    if (editStudent) {
      setForm({
        ...editStudent,
        phone: editStudent.phone ? formatPhone(editStudent.phone) : "+998 ",
        parent_phone: editStudent.parent_phone ? formatPhone(editStudent.parent_phone) : "+998 ",
        monthly_fee: formatMoney(editStudent.monthly_fee),
        teacher_percent: formatPercent(editStudent.teacher_percent),
        course_id: editStudent.course_id || "",
        teacher_id: editStudent.teacher_id || "",
        group_id: editStudent.group_id || "",
      });
    }
  }, [editStudent]);

  // --- Fetch Global Data ---
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

  // --- Filtered Lists ---
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

  // --- Handlers ---
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let val = type === "checkbox" ? checked : value;

    if (name === "phone" || name === "parent_phone") val = formatPhone(value);
    if (name === "monthly_fee") val = formatMoney(value);
    if (name === "teacher_percent") val = formatPercent(value);

    setForm((prev) => {
      const next = { ...prev, [name]: val };
      
      // Kurs o'zgarsa bog'liqlarni tozalash
      if (name === "course_id") {
        next.teacher_id = "";
        next.group_id = "";
      }
      // O'qituvchi o'zgarsa guruhni tozalash
      if (name === "teacher_id") {
        next.group_id = "";
      }
      
      return next;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      return alert("Ism va familiya majburiy!");
    }

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

    const { error } = isEdit
      ? await supabase.from("students").update(payload).eq("id", editStudent.id)
      : await supabase.from("students").insert(payload);

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      onFinish ? onFinish() : navigate(`/dashboard/${branchId}/students`);
    }
  };

  if (!branchId) return <div className="p-4">Branch topilmadi...</div>;

  return (
    <div className="add-page">
      {/* HEADER */}
      <div className="header">
        <FiHome />
        <div>
          <p>Filial</p>
          <h3>{activeBranch?.name}</h3>
        </div>
      </div>

      <h2>
        <FiUserCheck />
        {isEdit ? " O'quvchini tahrirlash" : " Yangi o'quvchi qo'shish"}
      </h2>

      {fetching && <div className="loading-bar">Yuklanmoqda...</div>}

      <form onSubmit={handleSubmit} className="form">
        {/* SHAXSIY MA'LUMOTLAR */}
        <div className="section">
          <h4><FiUser /> Shaxsiy ma'lumotlar</h4>
          <div className="grid">
            <Field label="Ismi">
              <Input icon={<FiUserCheck />} name="first_name" value={form.first_name} onChange={handleChange} required />
            </Field>
            <Field label="Familiyasi">
              <Input icon={<FiUser />} name="last_name" value={form.last_name} onChange={handleChange} required />
            </Field>
            <Field label="O'quvchi telefoni">
              <Input icon={<FiPhone />} name="phone" value={form.phone} onChange={handleChange} />
            </Field>
            <Field label="Ota-ona telefoni">
              <Input icon={<FiPhone />} name="parent_phone" value={form.parent_phone} onChange={handleChange} />
            </Field>
          </div>
        </div>

        {/* TA'LIM */}
        <div className="section">
          <h4><FiBookOpen /> Ta'lim ma'lumotlari</h4>
          <div className="grid">
            <Field label="Kurs">
              <Select 
                icon={<FiBookOpen />} 
                name="course_id" 
                value={form.course_id} 
                onChange={handleChange} 
                options={dbData.courses} 
              />
            </Field>
            <Field label="O'qituvchi">
              <Select 
                icon={<FiUsers />} 
                name="teacher_id" 
                value={form.teacher_id} 
                onChange={handleChange} 
                options={filteredTeachers}
                disabled={!form.course_id}
                placeholder={form.course_id ? "Tanlang" : "Oldin kursni tanlang"}
              />
            </Field>
            <Field label="Guruh">
              <Select 
                icon={<FiClipboard />} 
                name="group_id" 
                value={form.group_id} 
                onChange={handleChange} 
                options={filteredGroups}
                disabled={!form.course_id || filteredGroups.length === 0}
                placeholder={
                  !form.course_id 
                  ? "Kursni tanlang" 
                  : filteredGroups.length === 0 
                  ? "Guruh mavjud emas" 
                  : "Guruhni tanlang"
                }
              />
            </Field>
            <Field label="Boshlash sanasi">
              <DateInput name="start_date" value={form.start_date} onChange={handleChange} />
            </Field>
          </div>
        </div>

        {/* TO'LOV */}
        <div className="section">
          <h4><FiCreditCard /> To'lov ma'lumotlari</h4>
          <div className="grid">
            <Field label="To'lov sanasi">
              <DateInput name="payment_date" value={form.payment_date} onChange={handleChange} />
            </Field>
            <Field label="Keyingi to'lov sanasi">
              <DateInput name="next_payment_date" value={form.next_payment_date} onChange={handleChange} />
            </Field>
            <Field label="Oylik to'lov">
              <Input icon={<FiTrendingUp />} name="monthly_fee" value={form.monthly_fee} onChange={handleChange} />
            </Field>
            <Field label="O'qituvchi ulushi (%)">
              <Input icon={<FiDollarSign />} name="teacher_percent" value={form.teacher_percent} onChange={handleChange} />
            </Field>
          </div>
          <label className="checkbox">
            <input type="checkbox" name="paid" checked={form.paid} onChange={handleChange} />
            <FiCheckCircle color={form.paid ? "#22c55e" : "#ccc"} /> To'lov qilindi
          </label>
        </div>

        {/* BUTTONS */}
        <div className="actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            <FiSave />
            {loading ? "Saqlanmoqda..." : (isEdit ? "Yangilash" : "Saqlash")}
          </button>
          <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
            <FiX /> Bekor qilish
          </button>
        </div>
      </form>
    </div>
  );
}

// ================= UI COMPONENTS =================
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