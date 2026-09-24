import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiSearch,
  FiX,
  FiCheckCircle,
  FiCreditCard,
  FiEdit2,
  FiCalendar,
  FiDollarSign,
  FiAlertCircle,
  FiFilter,
  FiRefreshCw,
  FiPrinter,
  FiBookOpen,
  FiUsers,
  FiLayers,
  FiClock,
} from "react-icons/fi";
import "./Payments.css";

export default function Payments({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("uz-UZ").format(value) + " so'm";

  const getTodayStr = () => new Date().toISOString().slice(0, 10);

  const formatPhoneDisplay = (value) => {
    if (!value) return "—";
    const digits = String(value).replace(/\D/g, "");
    if (digits.length < 12) return value;
    return `+${digits.slice(0, 3)} (${digits.slice(3, 5)}) ${digits.slice(
      5,
      8
    )}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  };

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isOverdue = (s) => {
    if (s.paid) return false;
    if (!s.next_payment_date) return false;
    return s.next_payment_date < getTodayStr();
  };

  // ========== Print receipt ==========
  const printPaymentReceipt = ({
    studentName,
    phone,
    course,
    teacher,
    group,
    amount,
    paymentDate,
    fromMonth,
    toMonth,
  }) => {
    const esc = (v) =>
      String(v ?? "—")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 72mm; max-width: 72mm; margin: 0 auto; padding: 0;
      font-family: "Courier New", Courier, monospace;
      font-size: 12px; font-weight: 600; color: #000; background: #fff; line-height: 1.35;
    }
    .content { padding: 3px 5px 0; }
    .center { text-align: center; }
    .logo { width: 100px; height: 100px; margin: 0 auto 3px; display: block; }
    .brand { font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.2; }
    .sub { font-size: 11px; font-weight: 700; margin: 3px 0 5px; }
    .line { border-top: 1.5px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; gap: 4px; font-weight: 600; }
    .row span:last-child { text-align: right; font-weight: 800; max-width: 58%; word-break: break-word; }
    .amount { font-size: 17px; font-weight: 900; text-align: center; margin: 9px 0 4px; }
    .status { text-align: center; font-weight: 900; font-size: 14px; margin-bottom: 4px; }
    .footer { text-align: center; font-size: 11px; font-weight: 700; margin-top: 7px; line-height: 1.4; }
    .admin { font-size: 11px; font-weight: 700; text-align: center; margin-top: 3px; }
    .stamp { width: 200px; height: 200px; margin: 10px auto 0; display: block; }
    .bottom-space { height: 1600mm; }
  </style>
</head>
<body>
  <div class="content">
    <img class="logo" src="/logo-ia.png" alt="IA" onerror="this.style.display='none'" />
    <div class="center brand">INTELLECT ACADEMY</div>
    <div class="center brand" style="font-size:15px;">LEARNING CENTER</div>
    <div class="center sub">PAYMENT RECEIPT</div>
    <div class="line"></div>
    <div class="row"><span>Student:</span><span>${esc(studentName)}</span></div>
    <div class="row"><span>Phone:</span><span>${esc(phone)}</span></div>
    <div class="row"><span>Course:</span><span>${esc(course)}</span></div>
    <div class="row"><span>Teacher:</span><span>${esc(teacher)}</span></div>
    <div class="row"><span>Group:</span><span>${esc(group)}</span></div>
    <div class="line"></div>
    <div class="row"><span>Date:</span><span>${esc(paymentDate)}</span></div>
    <div class="line"></div>
    <div class="row"><span>From:</span><span>${esc(fromMonth)}</span></div>
    <div class="row"><span>Until:</span><span>${esc(toMonth)}</span></div>
    <div class="line"></div>
    <div class="amount">${esc(amount)}</div>
    <div class="status">PAID</div>
    <div class="line"></div>
    <div class="footer">Thank you!<br>INTELLECT ACADEMY</div>
    <div class="admin">Admin: +998 94 618 89 39</div>
    <img class="stamp" src="/stamp-ia.png" alt="Stamp" onerror="this.style.display='none'" />
  </div>
  <div class="bottom-space"></div>
</body>
</html>`;

    const old = document.getElementById("receipt-print-iframe");
    if (old) old.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "receipt-print-iframe";
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 6000);
    }, 500);
  };

  const openReceiptForStudent = (s) => {
    const payDate = s.payment_date || getTodayStr();
    const nextDate = s.next_payment_date;

    printPaymentReceipt({
      studentName: `${s.first_name || ""} ${s.last_name || ""}`.trim(),
      phone: formatPhoneDisplay(s.phone),
      course: s.courses?.name || "—",
      teacher: s.teachers?.name || "—",
      group: s.groups?.name || "—",
      amount: formatCurrency(s.monthly_fee || 0),
      paymentDate: formatShortDate(payDate),
      fromMonth: formatMonthYear(payDate),
      toMonth: formatMonthYear(nextDate),
    });
  };

  // ========== Fetch ==========
  const fetchData = useCallback(
    async (silent = false) => {
      if (!branchId) return;
      if (!silent) setLoading(true);

      try {
        const [stuRes, courseRes, groupRes] = await Promise.all([
          supabase
            .from("students")
            .select(`*, courses(name), teachers(name), groups(name)`)
            .eq("branch_id", branchId)
            .eq("is_free", false)
            .eq("is_archived", false)
            .order("created_at", { ascending: false }),
          supabase
            .from("courses")
            .select("id, name")
            .eq("branch_id", branchId)
            .order("name"),
          supabase
            .from("groups")
            .select("id, name")
            .eq("branch_id", branchId)
            .order("name"),
        ]);

        if (stuRes.error) throw stuRes.error;

        const today = getTodayStr();
        const expiredIds = (stuRes.data || [])
          .filter(
            (s) =>
              s.paid && s.next_payment_date && s.next_payment_date <= today
          )
          .map((s) => s.id);

        if (expiredIds.length > 0) {
          await supabase
            .from("students")
            .update({ paid: false })
            .in("id", expiredIds);
          return fetchData(true);
        }

        setStudents(stuRes.data || []);
        setCourses(courseRes.data || []);
        setGroups(groupRes.data || []);
      } catch (err) {
        console.error("Fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    },
    [branchId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ========== Collect / Refund ==========
  const togglePayment = async (student) => {
    const isNowPaid = !student.paid;
    const today = getTodayStr();

    let nextDate = null;
    if (isNowPaid) {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      nextDate = d.toISOString().slice(0, 10);
    }

    const oldStudents = [...students];
    setStudents((prev) =>
      prev.map((s) =>
        s.id === student.id
          ? {
              ...s,
              paid: isNowPaid,
              payment_date: isNowPaid ? today : null,
              next_payment_date: nextDate,
            }
          : s
      )
    );

    const { error } = await supabase
      .from("students")
      .update({
        paid: isNowPaid,
        payment_date: isNowPaid ? today : null,
        next_payment_date: nextDate,
      })
      .eq("id", student.id);

    if (error) {
      setStudents(oldStudents);
      alert("Update failed: " + error.message);
      return;
    }

    if (isNowPaid) {
      printPaymentReceipt({
        studentName: `${student.first_name || ""} ${
          student.last_name || ""
        }`.trim(),
        phone: formatPhoneDisplay(student.phone),
        course: student.courses?.name || "—",
        teacher: student.teachers?.name || "—",
        group: student.groups?.name || "—",
        amount: formatCurrency(student.monthly_fee || 0),
        paymentDate: formatShortDate(today),
        fromMonth: formatMonthYear(today),
        toMonth: formatMonthYear(nextDate),
      });
    }
  };

  // ========== Edit modal ==========
  const handleSave = async () => {
    if (!editData?.id) return;
    setSaving(true);

    const { error } = await supabase
      .from("students")
      .update({
        monthly_fee: Number(editData.monthly_fee) || 0,
        paid: Boolean(editData.paid),
        payment_date: editData.payment_date || null,
        next_payment_date: editData.next_payment_date || null,
      })
      .eq("id", editData.id);

    setSaving(false);
    if (error) return alert(error.message);

    setEditOpen(false);
    fetchData(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "paid") {
        if (checked) {
          const today = getTodayStr();
          const d = new Date();
          d.setMonth(d.getMonth() + 1);
          updated.payment_date = today;
          updated.next_payment_date = d.toISOString().slice(0, 10);
        } else {
          updated.payment_date = null;
          updated.next_payment_date = null;
        }
      }

      return updated;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterCourse("all");
    setFilterGroup("all");
    setFilterMonth("all");
  };

  const hasActiveFilters =
    search ||
    filterStatus !== "all" ||
    filterCourse !== "all" ||
    filterGroup !== "all" ||
    filterMonth !== "all";

  // ========== Month options ==========
  const monthOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All months" }];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const label = d.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      opts.push({ value, label });
    }
    return opts;
  }, []);

  // ========== Filtered + Sorted ==========
  const processedStudents = useMemo(() => {
    const filtered = students.filter((s) => {
      const fullName = `${s.first_name || ""} ${
        s.last_name || ""
      }`.toLowerCase();
      const matchesSearch = fullName.includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === "all"
          ? true
          : filterStatus === "paid"
          ? s.paid === true
          : s.paid === false;

      const matchesCourse =
        filterCourse === "all" || String(s.course_id) === String(filterCourse);

      const matchesGroup =
        filterGroup === "all" || String(s.group_id) === String(filterGroup);

      let matchesMonth = true;
      if (filterMonth !== "all") {
        if (!s.payment_date) matchesMonth = false;
        else matchesMonth = s.payment_date.slice(0, 7) === filterMonth;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCourse &&
        matchesGroup &&
        matchesMonth
      );
    });

    return filtered.sort((a, b) => {
      if (a.paid !== b.paid) return a.paid ? 1 : -1;

      if (!a.paid && !b.paid) {
        const aOver = isOverdue(a);
        const bOver = isOverdue(b);
        if (aOver !== bOver) return aOver ? -1 : 1;
      }

      const nameA = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
      const nameB = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
      return nameA.localeCompare(nameB, "en");
    });
  }, [students, search, filterStatus, filterCourse, filterGroup, filterMonth]);

  const unpaidList = useMemo(
    () => processedStudents.filter((s) => !s.paid),
    [processedStudents]
  );
  const paidList = useMemo(
    () => processedStudents.filter((s) => s.paid),
    [processedStudents]
  );

  const stats = useMemo(() => {
    const paid = processedStudents.filter((s) => s.paid);
    const unpaid = processedStudents.filter((s) => !s.paid);
    const overdue = unpaid.filter((s) => isOverdue(s));
    return {
      total: paid.reduce((sum, s) => sum + (s.monthly_fee || 0), 0),
      debt: unpaid.reduce((sum, s) => sum + (s.monthly_fee || 0), 0),
      countPaid: paid.length,
      countUnpaid: unpaid.length,
      countOverdue: overdue.length,
      countAll: processedStudents.length,
    };
  }, [processedStudents]);

  if (!branchId) {
    return (
      <div className="pay-page">
        <div className="pay-empty">
          <FiLayers size={40} />
          <h3>No branch selected</h3>
          <p>Please select a branch to view payments</p>
        </div>
      </div>
    );
  }

  const renderRow = (s) => {
    const overdue = isOverdue(s);

    return (
      <tr
        key={s.id}
        className={!s.paid ? (overdue ? "row-overdue" : "row-unpaid") : ""}
      >
        <td data-label="Student">
          <div className="pay-user">
            <div className={`pay-avatar ${!s.paid ? "unpaid" : ""}`}>
              {(s.first_name?.[0] || "").toUpperCase()}
              {(s.last_name?.[0] || "").toUpperCase()}
            </div>
            <div className="pay-user-meta">
              <span className="pay-name">
                {s.first_name} {s.last_name}
              </span>
              <span className="pay-phone">
                {formatPhoneDisplay(s.phone)}
              </span>
            </div>
          </div>
        </td>

        <td data-label="Course / Group">
          <div className="pay-course-group">
            <span className="pay-course-tag">{s.courses?.name || "—"}</span>
            <span className="pay-group-name">{s.groups?.name || "—"}</span>
          </div>
        </td>

        <td className="pay-fee" data-label="Monthly fee">
          {formatCurrency(s.monthly_fee || 0)}
        </td>

        <td data-label="Status">
          <div className="pay-status-wrap">
            <span
              className={`pay-badge ${
                s.paid ? "success" : overdue ? "warning" : "danger"
              }`}
            >
              {s.paid ? "PAID" : overdue ? "OVERDUE" : "DEBTOR"}
            </span>
          </div>
        </td>

        <td data-label="Payment">
          <div className="pay-date">
            {s.payment_date ? formatShortDate(s.payment_date) : "—"}
          </div>
        </td>

        <td data-label="Next">
          <div className={`pay-date ${!s.paid ? "danger" : ""}`}>
            {s.next_payment_date
              ? formatShortDate(s.next_payment_date)
              : "—"}
          </div>
        </td>

        <td data-label="Actions">
          <div className="pay-actions">
            {s.paid && (
              <button
                className="pay-icon-btn"
                title="Print receipt"
                onClick={() => openReceiptForStudent(s)}
                type="button"
              >
                <FiPrinter size={14} />
              </button>
            )}
            <button
              className="pay-icon-btn"
              title="Edit"
              onClick={() => {
                setEditData({ ...s });
                setEditOpen(true);
              }}
              type="button"
            >
              <FiEdit2 size={14} />
            </button>
            <button
              className={`pay-pill ${s.paid ? "refund" : "collect"}`}
              onClick={() => togglePayment(s)}
              type="button"
            >
              <FiCreditCard size={13} />
              {s.paid ? "Refund" : "Collect"}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="pay-page">
      {/* HEADER */}
      <header className="pay-header">
        <div className="pay-title-area">
          <h1 className="pay-title">{activeBranch?.name} • Payments</h1>
          <p className="pay-desc">
            Automatic payment system — <strong>{students.length}</strong> active
            students
            {stats.countOverdue > 0 && (
              <span className="pay-overdue-hint">
                · <FiClock size={12} /> {stats.countOverdue} overdue
              </span>
            )}
          </p>
        </div>
        <button
          className="pay-refresh-btn"
          onClick={() => fetchData()}
          disabled={loading}
          title="Refresh"
          type="button"
        >
          <FiRefreshCw className={loading ? "spin" : ""} size={15} />
        </button>
      </header>

      {/* STATS */}
      <section className="pay-stats">
        <button
          type="button"
          className={`pay-stat-card ${
            filterStatus === "all" && !hasActiveFilters ? "active" : ""
          }`}
          onClick={() => setFilterStatus("all")}
        >
          <div className="pay-stat-icon income">
            <FiDollarSign size={16} />
          </div>
          <div className="pay-stat-body">
            <span className="pay-stat-label">Total collected</span>
            <strong className="pay-stat-value">
              {formatCurrency(stats.total)}
            </strong>
          </div>
        </button>

        <button
          type="button"
          className={`pay-stat-card ${filterStatus === "paid" ? "active" : ""}`}
          onClick={() => setFilterStatus("paid")}
        >
          <div className="pay-stat-icon paid">
            <FiCheckCircle size={16} />
          </div>
          <div className="pay-stat-body">
            <span className="pay-stat-label">Paid</span>
            <strong className="pay-stat-value">{stats.countPaid}</strong>
          </div>
        </button>

        <button
          type="button"
          className={`pay-stat-card ${
            filterStatus === "unpaid" ? "active" : ""
          }`}
          onClick={() => setFilterStatus("unpaid")}
        >
          <div className="pay-stat-icon unpaid">
            <FiAlertCircle size={16} />
          </div>
          <div className="pay-stat-body">
            <span className="pay-stat-label">Debtors</span>
            <strong className="pay-stat-value">{stats.countUnpaid}</strong>
          </div>
        </button>

        <div className="pay-stat-card debt">
          <div className="pay-stat-icon total">
            <FiUsers size={16} />
          </div>
          <div className="pay-stat-body">
            <span className="pay-stat-label">Debt amount</span>
            <strong className="pay-stat-value danger">
              {formatCurrency(stats.debt)}
            </strong>
          </div>
        </div>
      </section>

      {/* TOOLBAR */}
      <div className="pay-toolbar">
        <div className="pay-search">
          <FiSearch size={15} />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="pay-search-clear"
              onClick={() => setSearch("")}
              type="button"
            >
              <FiX size={13} />
            </button>
          )}
        </div>

        <div className="pay-filters">
          <div className="pay-select-wrap">
            <FiFilter size={13} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Debtors</option>
            </select>
          </div>

          <div className="pay-select-wrap">
            <FiBookOpen size={13} />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <option value="all">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pay-select-wrap">
            <FiUsers size={13} />
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
            >
              <option value="all">All groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pay-select-wrap">
            <FiCalendar size={13} />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              className="pay-clear-btn"
              onClick={clearFilters}
              type="button"
            >
              <FiX size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="pay-card">
        {loading ? (
          <div className="pay-skeleton">
            {/* Header skeleton */}
            <div className="pay-skel-header">
              <div className="skel line w120" />
              <div className="skel line w100" />
              <div className="skel line w80" />
              <div className="skel line w70" />
              <div className="skel line w80" />
              <div className="skel line w70" />
              <div className="skel line w90" />
            </div>

            {/* Rows */}
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="pay-skel-row">
                <div className="pay-skel-user">
                  <div className="skel circle" />
                  <div className="pay-skel-user-meta">
                    <div className="skel line w140" />
                    <div className="skel line w100" style={{ marginTop: 6 }} />
                  </div>
                </div>

                <div className="pay-skel-col">
                  <div className="skel line w110" />
                  <div className="skel line w80" style={{ marginTop: 6 }} />
                </div>

                <div className="skel line w90" />
                <div className="skel badge" />
                <div className="skel line w80" />
                <div className="skel line w80" />

                <div className="pay-skel-actions">
                  <div className="skel circle-sm" />
                  <div className="skel circle-sm" />
                  <div className="skel pill" />
                </div>
              </div>
            ))}
          </div>
        ) : processedStudents.length === 0 ? (
          <div className="pay-empty-inside">
            <FiUsers size={36} style={{ opacity: 0.35 }} />
            <p>No students found</p>
            <span>Try changing the filters</span>
          </div>
        ) : (
          <div className="pay-table-wrap">
            <table className="pay-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course / Group</th>
                  <th>Monthly fee</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Next</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {unpaidList.length > 0 && (
                  <>
                    <tr className="pay-section-row">
                      <td colSpan={7}>
                        <div className="pay-section unpaid">
                          <FiAlertCircle size={14} />
                          <span>Debtors</span>
                          <em>{unpaidList.length}</em>
                        </div>
                      </td>
                    </tr>
                    {unpaidList.map(renderRow)}
                  </>
                )}

                {paidList.length > 0 && (
                  <>
                    <tr className="pay-section-row">
                      <td colSpan={7}>
                        <div className="pay-section paid">
                          <FiCheckCircle size={14} />
                          <span>Paid</span>
                          <em>{paidList.length}</em>
                        </div>
                      </td>
                    </tr>
                    {paidList.map(renderRow)}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editOpen && editData && (
        <div
          className="pay-modal-overlay"
          onClick={() => setEditOpen(false)}
        >
          <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pay-modal-accent" />
            <div className="pay-modal-header">
              <h2>Payment settings</h2>
              <button
                className="pay-modal-close"
                onClick={() => setEditOpen(false)}
                type="button"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="pay-modal-body">
              <div className="pay-form-grid">
                <div className="pay-form-item full">
                  <label>Monthly fee (so'm)</label>
                  <input
                    type="number"
                    name="monthly_fee"
                    value={editData.monthly_fee || 0}
                    onChange={handleChange}
                  />
                </div>
                <div className="pay-form-item">
                  <label>Payment date</label>
                  <input
                    type="date"
                    name="payment_date"
                    value={editData.payment_date || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="pay-form-item">
                  <label>Next payment</label>
                  <input
                    type="date"
                    name="next_payment_date"
                    value={editData.next_payment_date || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <label className="pay-checkbox-row">
                <input
                  type="checkbox"
                  name="paid"
                  checked={editData.paid || false}
                  onChange={handleChange}
                />
                <span>Mark as paid for the current month</span>
              </label>
            </div>

            <div className="pay-modal-footer">
              <button
                className="pay-btn-cancel"
                onClick={() => setEditOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="pay-btn-save"
                onClick={handleSave}
                disabled={saving}
                type="button"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}