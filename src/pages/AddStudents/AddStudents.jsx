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
  FiAlertCircle,
} from "react-icons/fi";

import "./AddStudents.css";

const onlyDigits = (v = "") => v?.toString().replace(/\D/g, "") || "";

const normalizePhone = (value) => {
  const digits = onlyDigits(value);
  if (!digits) return null;
  let d = digits;
  if (d.length === 9) d = "998" + d;
  if (d.length !== 12) return null;
  return d;
};

const formatPhone = (value) => {
  let d = onlyDigits(value);
  if (!d) return "+998 ";
  if (!d.startsWith("998")) d = "998" + d;
  d = d.slice(0, 12);

  let res = "+998";
  if (d.length > 3) res += " (" + d.slice(3, 5);
  if (d.length > 5) res += ") " + d.slice(5, 8);
  if (d.length > 8) res += "-" + d.slice(8, 10);
  if (d.length > 10) res += "-" + d.slice(10, 12);

  return res;
};

const formatMoney = (value) => {
  const num = onlyDigits(value);
  if (!num) return "";
  return new Intl.NumberFormat("en-US").format(num); // Standardizing thousands separator
};

const formatPercent = (value) => {
  const num = onlyDigits(value);
  if (!num) return "";
  const parsed = Math.min(Number(num), 100);
  return parsed + "%";
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

  // 🔔 Custom Modal State for Notifications and Alerts
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success", // "success" | "error"
    message: "",
    onCloseCallback: null,
  });

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

  const getTodayStr = () => new Date().toISOString().slice(0, 10);

  // ⚙️ Alert Trigger System
  const showAlert = (type, message, callback = null) => {
    setAlertModal({
      isOpen: true,
      type,
      message,
      onCloseCallback: callback,
    });
  };

  const closeAlert = () => {
    const callback = alertModal.onCloseCallback;
    setAlertModal((prev) => ({ ...prev, isOpen: false }));
    if (callback) callback();
  };

  // 📝 Pre-populate Form on Edit Mode
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
        start_date: editStudent.start_date || "",
        payment_date: editStudent.payment_date || "",
        next_payment_date: editStudent.next_payment_date || "",
        paid: !!editStudent.paid,
      });
    }
  }, [editStudent]);

  // 🔄 Fetching Context-specific Dynamic Data
  useEffect(() => {
    if (!branchId) return;

    const loadBranchData = async () => {
      setFetching(true);
      try {
        const [c, t, g] = await Promise.all([
          supabase
            .from("courses")
            .select("*")
            .eq("branch_id", branchId)
            .order("name"),
          supabase
            .from("teachers")
            .select("*")
            .eq("branch_id", branchId)
            .order("name"),
          supabase
            .from("groups")
            .select("*")
            .eq("branch_id", branchId)
            .order("name"),
        ]);

        setDbData({
          courses: c.data || [],
          teachers: t.data || [],
          groups: g.data || [],
        });
      } catch (err) {
        console.error("Fetch data error:", err);
      } finally {
        setFetching(false);
      }
    };

    loadBranchData();
  }, [branchId]);

  // Lock body scroll on overlay open
  useEffect(() => {
    document.body.style.overflow = alertModal.isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [alertModal.isOpen]);

  // Cascading Logic: Instructors by Course
  const filteredTeachers = useMemo(() => {
    if (!form.course_id) return dbData.teachers;
    return dbData.teachers.filter(
      (t) => String(t.course_id) === String(form.course_id),
    );
  }, [dbData.teachers, form.course_id]);

  // Cascading Logic: Classrooms by Course and Instructor
  const filteredGroups = useMemo(() => {
    return dbData.groups.filter((g) => {
      const matchCourse =
        !form.course_id || String(g.course_id) === String(form.course_id);
      const matchTeacher =
        !form.teacher_id || String(g.teacher_id) === String(form.teacher_id);
      return matchCourse && matchTeacher;
    });
  }, [dbData.groups, form.course_id, form.teacher_id]);

  const handleChange = useCallback(
    (e) => {
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
          const selectedCourse = dbData.courses.find(
            (c) => String(c.id) === String(value),
          );
          if (selectedCourse?.price) {
            next.monthly_fee = formatMoney(selectedCourse.price);
          }
        }

        if (name === "teacher_id") {
          next.group_id = "";
        }

        if (name === "paid") {
          if (checked) {
            const today = getTodayStr();
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            next.payment_date = today;
            next.next_payment_date = nextMonth.toISOString().slice(0, 10);
          } else {
            next.payment_date = "";
            next.next_payment_date = "";
          }
        }

        return next;
      });
    },
    [dbData.courses],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      return showAlert(
        "error",
        "First name and last name are strictly required fields!",
      );
    }

    setLoading(true);

    try {
      const cleanStudentPhone = normalizePhone(form.phone);
      const cleanParentPhone = normalizePhone(form.parent_phone);

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
          return showAlert(
            "error",
            "A student record with this phone number already exists.",
          );
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
        paid: Boolean(form.paid),
      };

      const { error } = isEdit
        ? await supabase
            .from("students")
            .update(payload)
            .eq("id", editStudent.id)
        : await supabase.from("students").insert([payload]);

      if (error) throw error;

      showAlert(
        "success",
        isEdit
          ? "Student profile updated successfully!"
          : "New student has been successfully enrolled!",
        () => {
          if (onFinish) {
            onFinish();
          } else {
            navigate(`/dashboard/${branchId}/students`);
          }
        },
      );
    } catch (err) {
      console.error("Mutation error:", err);
      showAlert("error", err.message || "An unexpected system error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!branchId) {
    return (
      <div className="p-6 text-center text-red-500 font-semibold">
        Active branch context not found...
      </div>
    );
  }

  return (
    <div className="add-page">
      <div className="header">
        <FiHome />
        <div>
          <p>Active Context</p>
          <h3>{activeBranch?.name}</h3>
        </div>
      </div>

      <h2>
        <FiUserCheck />
        {isEdit ? " Edit Student Profile" : " Student Enrollment Form"}
      </h2>

      {fetching && (
        <div className="loading-bar">Synchronizing parameters...</div>
      )}

      <form onSubmit={handleSubmit} className="form">
        {/* SECTION 1: PERSONAL */}
        <div className="section">
          <h4>
            <FiUser /> Personal Information
          </h4>
          <div className="grid">
            <Field label="First Name *">
              <Input
                icon={<FiUserCheck />}
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="John"
                required
              />
            </Field>
            <Field label="Last Name *">
              <Input
                icon={<FiUser />}
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Doe"
                required
              />
            </Field>
            <Field label="Student Phone">
              <Input
                icon={<FiPhone />}
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={19}
              />
            </Field>
            <Field label="Parent / Guardian Phone">
              <Input
                icon={<FiPhone />}
                name="parent_phone"
                value={form.parent_phone}
                onChange={handleChange}
                maxLength={19}
              />
            </Field>
          </div>
        </div>

        {/* SECTION 2: ACADEMICS */}
        <div className="section">
          <h4>
            <FiBookOpen /> Academic Allocation
          </h4>
          <div className="grid">
            <Field label="Course / Program">
              <Select
                icon={<FiBookOpen />}
                name="course_id"
                value={form.course_id}
                onChange={handleChange}
                options={dbData.courses}
                placeholder="Select core course"
              />
            </Field>
            <Field label="Assigned Teacher">
              <Select
                icon={<FiUsers />}
                name="teacher_id"
                value={form.teacher_id}
                onChange={handleChange}
                options={filteredTeachers}
                disabled={!form.course_id}
                placeholder={
                  form.course_id ? "Select instructor" : "Choose a course first"
                }
              />
            </Field>
            <Field label="Classroom Group">
              <Select
                icon={<FiClipboard />}
                name="group_id"
                value={form.group_id}
                onChange={handleChange}
                options={filteredGroups}
                disabled={!form.course_id || filteredGroups.length === 0}
                placeholder={
                  !form.course_id
                    ? "Choose a course first"
                    : filteredGroups.length === 0
                      ? "No groups setup for this filter"
                      : "Select group class"
                }
              />
            </Field>
            <Field label="Commencement Date (Start)">
              <DateInput
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </Field>
          </div>
        </div>

        {/* SECTION 3: BILLING */}
        <div className="section">
          <h4>
            <FiCreditCard /> Financial Ledger Configuration
          </h4>
          <div className="grid">
            <Field label="Payment Settlement Date">
              <DateInput
                name="payment_date"
                value={form.payment_date}
                onChange={handleChange}
              />
            </Field>
            <Field label="Next Invoice Maturity Date">
              <DateInput
                name="next_payment_date"
                value={form.next_payment_date}
                onChange={handleChange}
              />
            </Field>
            <Field label="Monthly Premium Fee (UZS)">
              <Input
                icon={<FiTrendingUp />}
                name="monthly_fee"
                value={form.monthly_fee}
                onChange={handleChange}
                placeholder="0"
              />
            </Field>
            <Field label="Teacher Payout Yield (%)">
              <Input
                icon={<FiDollarSign />}
                name="teacher_percent"
                value={form.teacher_percent}
                onChange={handleChange}
                placeholder="0%"
              />
            </Field>
          </div>

          <label className="checkbox-wrapper-label">
            <input
              type="checkbox"
              name="paid"
              id="paid-status-checkbox"
              checked={form.paid}
              onChange={handleChange}
              className="hidden-checkbox-input"
            />
            <div className={`custom-checkbox-ui ${form.paid ? "checked" : ""}`}>
              <FiCheckCircle />
            </div>
            <span>
              Approve immediate payment allocation for current tracking period
            </span>
          </label>
        </div>

        {/* ACTIONS */}
        <div className="actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            <FiSave />
            {loading
              ? "Processing..."
              : isEdit
                ? "Update Master Record"
                : "Finalize Enrollment"}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            <FiX /> Discard
          </button>
        </div>
      </form>

      {/* 🚨 PREMIUM ALERT MODAL SYSTEM */}
      {alertModal.isOpen && (
        <div className="alert-modal-overlay" onClick={closeAlert}>
          <div
            className={`alert-modal-box ${alertModal.type}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="alert-modal-icon">
              {alertModal.type === "success" ? (
                <FiCheckCircle />
              ) : (
                <FiAlertCircle />
              )}
            </div>
            <div className="alert-modal-content">
              <h3>
                {alertModal.type === "success"
                  ? "Operation Successful"
                  : "Validation Notice"}
              </h3>
              <p>{alertModal.message}</p>
            </div>
            <button
              type="button"
              className="alert-modal-close-btn"
              onClick={closeAlert}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 🧱 Sub-components
const Field = ({ label, children }) => (
  <div className="field">
    <label>{label}</label>
    {children}
  </div>
);

const Input = ({ icon, ...props }) => (
  <div className="input-group-container">
    {icon}
    <input {...props} autoComplete="new-password" />
  </div>
);

const Select = ({ icon, options, placeholder = "Select option", ...props }) => (
  <div className="input-group-container">
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
  <div className="input-group-container">
    <FiCalendar />
    <input type="date" {...props} />
  </div>
);
