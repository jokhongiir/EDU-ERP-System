import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  FiGift,
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
  return new Intl.NumberFormat("en-US").format(num);
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
  const [searchParams] = useSearchParams();
  const branchId = activeBranch?.id;
  const isEdit = !!editStudent;

  const [dbData, setDbData] = useState({
    courses: [],
    teachers: [],
    groups: [],
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success",
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
    is_free: false,
  });

  const getTodayStr = () => new Date().toISOString().slice(0, 10);

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

  // Auto-set Free mode when URL has ?type=free
  useEffect(() => {
    if (searchParams.get("type") === "free" && !editStudent) {
      setForm((prev) => ({
        ...prev,
        is_free: true,
        monthly_fee: "0",
        paid: true,
        payment_date: getTodayStr(),
        next_payment_date: "",
      }));
    }
  }, [searchParams, editStudent]);

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
        is_free: !!editStudent.is_free,
      });
    }
  }, [editStudent]);

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

  useEffect(() => {
    document.body.style.overflow = alertModal.isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [alertModal.isOpen]);

  const filteredTeachers = useMemo(() => {
    if (!form.course_id) return dbData.teachers;
    return dbData.teachers.filter(
      (t) => String(t.course_id) === String(form.course_id),
    );
  }, [dbData.teachers, form.course_id]);

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

      // Force uppercase for first and last name
      if (name === "first_name" || name === "last_name") {
        val = value.toUpperCase();
      }

      setForm((prev) => {
        const next = { ...prev, [name]: val };

        // Handle Student Type change
        if (name === "is_free") {
          const isFree = value === "true" || value === true;
          next.is_free = isFree;

          if (isFree) {
            next.monthly_fee = "0";
            next.paid = true;
            next.payment_date = getTodayStr();
            next.next_payment_date = "";
          } else {
            // When switching to Paid, restore course price if available
            const selectedCourse = dbData.courses.find(
              (c) => String(c.id) === String(prev.course_id),
            );
            if (selectedCourse?.price) {
              next.monthly_fee = formatMoney(selectedCourse.price);
            }
            next.paid = false;
            next.payment_date = "";
            next.next_payment_date = "";
          }
        }

        if (name === "course_id") {
          next.teacher_id = "";
          next.group_id = "";
          const selectedCourse = dbData.courses.find(
            (c) => String(c.id) === String(value),
          );
          if (selectedCourse?.price && !prev.is_free) {
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

    const cleanFirstName = form.first_name?.trim();
    const cleanLastName = form.last_name?.trim();

    if (!cleanFirstName || !cleanLastName) {
      return showAlert("error", "Please enter both First Name and Last Name.");
    }

    setLoading(true);

    try {
      const payload = {
        branch_id: branchId,
        first_name: cleanFirstName.toUpperCase(),
        last_name: cleanLastName.toUpperCase(),
        phone: normalizePhone(form.phone),
        parent_phone: normalizePhone(form.parent_phone),
        course_id: form.course_id || null,
        teacher_id: form.teacher_id || null,
        group_id: form.group_id || null,
        start_date: form.start_date || null,
        payment_date: form.payment_date || null,
        next_payment_date: form.next_payment_date || null,
        monthly_fee: form.is_free
          ? 0
          : Number(onlyDigits(form.monthly_fee)) || 0,
        teacher_percent: Number(onlyDigits(form.teacher_percent)) || 0,
        paid: form.is_free ? true : Boolean(form.paid),
        is_free: Boolean(form.is_free),
      };

      const { error } = isEdit
        ? await supabase
            .from("students")
            .update(payload)
            .eq("id", editStudent.id)
        : await supabase.from("students").insert([payload]);

      if (error) throw error;

      const successMessage = form.is_free
        ? isEdit
          ? "Free student record updated successfully!"
          : "New free student enrolled successfully!"
        : isEdit
          ? "Student record updated successfully!"
          : "New student enrolled successfully!";

      showAlert("success", successMessage, () => {
        if (onFinish) {
          onFinish();
        } else {
          const target = form.is_free ? "freestudents" : "students";
          navigate(`/dashboard/${branchId}/${target}`);
        }
      });
    } catch (err) {
      console.error("Submission error:", err);

      let errorMessage = "Something went wrong. Please try again.";

      if (err.code === "23505") {
        errorMessage = "This phone number is already registered.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      showAlert("error", errorMessage);
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
        {form.is_free ? <FiGift /> : <FiUserCheck />}
        {isEdit
          ? form.is_free
            ? " Edit Free Student"
            : " Edit Student Profile"
          : form.is_free
            ? " Free Student Enrollment"
            : " Student Enrollment Form"}
      </h2>

      {fetching && (
        <div className="loading-bar">Synchronizing parameters...</div>
      )}

      <form onSubmit={handleSubmit} className="form">
        {/* ========== PERSONAL INFORMATION ========== */}
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

            {/* Student Type Select */}
            <Field label="Student Type *">
              <div className="input-group-container">
                <FiGift />
                <select
                  name="is_free"
                  value={form.is_free ? "true" : "false"}
                  onChange={handleChange}
                  className="type-select"
                >
                  <option value="false">Paid</option>
                  <option value="true">Free</option>
                </select>
              </div>
            </Field>
          </div>
        </div>

        {/* ========== ACADEMIC ALLOCATION ========== */}
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
                      ? "No groups available for this filter"
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

        {/* ========== FINANCIAL ========== */}
        <div className="section">
          <h4>
            <FiCreditCard /> Financial Ledger Configuration
            {form.is_free && (
              <span
                style={{
                  marginLeft: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#059669",
                  background: "#ecfdf5",
                  padding: "4px 10px",
                  borderRadius: 6,
                }}
              >
                FREE STUDENT
              </span>
            )}
          </h4>

          <div className="grid">
            <Field label="Payment Settlement Date">
              <DateInput
                name="payment_date"
                value={form.payment_date}
                onChange={handleChange}
                disabled={form.is_free}
              />
            </Field>

            <Field label="Next Invoice Maturity Date">
              <DateInput
                name="next_payment_date"
                value={form.next_payment_date}
                onChange={handleChange}
                disabled={form.is_free}
              />
            </Field>

            <Field label="Monthly Premium Fee (UZS)">
              <Input
                icon={<FiTrendingUp />}
                name="monthly_fee"
                value={form.is_free ? "0" : form.monthly_fee}
                onChange={handleChange}
                placeholder="0"
                disabled={form.is_free}
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

          {!form.is_free && (
            <label className="checkbox-wrapper-label">
              <input
                type="checkbox"
                name="paid"
                id="paid-status-checkbox"
                checked={form.paid}
                onChange={handleChange}
                className="hidden-checkbox-input"
              />
              <div
                className={`custom-checkbox-ui ${form.paid ? "checked" : ""}`}
              >
                <FiCheckCircle />
              </div>
              <span>
                Approve immediate payment allocation for current tracking period
              </span>
            </label>
          )}

          {form.is_free && (
            <div
              style={{
                marginTop: 16,
                padding: "14px 18px",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 10,
                color: "#065f46",
                fontSize: 14,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <FiGift size={18} />
              This student will be saved as <strong>Free</strong>. No payment is
              required.
            </div>
          )}
        </div>

        {/* ========== ACTIONS ========== */}
        <div className="actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            <FiSave />
            {loading
              ? "Processing..."
              : isEdit
                ? "Update Master Record"
                : form.is_free
                  ? "Add Free Student"
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

/* ==================== HELPER COMPONENTS ==================== */

const Field = ({ label, children }) => (
  <div className="field">
    <label>{label}</label>
    {children}
  </div>
);

const Input = ({ icon, disabled, ...props }) => (
  <div className={`input-group-container ${disabled ? "disabled" : ""}`}>
    {icon}
    <input {...props} disabled={disabled} autoComplete="new-password" />
  </div>
);

const Select = ({
  icon,
  options,
  placeholder = "Select option",
  disabled,
  ...props
}) => (
  <div className={`input-group-container ${disabled ? "disabled" : ""}`}>
    {icon}
    <select {...props} disabled={disabled}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name || o.group_name || o.title}
        </option>
      ))}
    </select>
  </div>
);

const DateInput = ({ disabled, ...props }) => (
  <div className={`input-group-container ${disabled ? "disabled" : ""}`}>
    <FiCalendar />
    <input type="date" {...props} disabled={disabled} />
  </div>
);