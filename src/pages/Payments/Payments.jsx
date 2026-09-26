import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  FiUpload,
  FiEye,
  FiTrash2,
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

  const [collectOpen, setCollectOpen] = useState(false);
  const [collectStudent, setCollectStudent] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);

  // History Modal
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("today");

  const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("uz-UZ").format(value) + " so'm";

  const getTodayStr = () => new Date().toISOString().slice(0, 10);

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

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

  const getRelativeDay = (dateStr) => {
    if (!dateStr) return null;
    const today = getTodayStr();
    const yesterday = getYesterdayStr();
    if (dateStr === today) return "today";
    if (dateStr === yesterday) return "yesterday";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff < 7) return "week";
    return "older";
  };

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
    method,
  }) => {
    const esc = (v) =>
      String(v ?? "—")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const methodLabel =
      method === "click"
        ? "CLICK (Card)"
        : method === "cash"
        ? "CASH (Naqd)"
        : "—";

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
    <div class="row"><span>Method:</span><span>${esc(methodLabel)}</span></div>
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
      method: s.payment_method,
    });
  };

  const printFromEdit = () => {
    if (!editData?.paid) return;
    const payDate = editData.payment_date || getTodayStr();
    const nextDate = editData.next_payment_date;

    printPaymentReceipt({
      studentName: `${editData.first_name || ""} ${
        editData.last_name || ""
      }`.trim(),
      phone: formatPhoneDisplay(editData.phone),
      course: editData.courses?.name || "—",
      teacher: editData.teachers?.name || "—",
      group: editData.groups?.name || "—",
      amount: formatCurrency(editData.monthly_fee || 0),
      paymentDate: formatShortDate(payDate),
      fromMonth: formatMonthYear(payDate),
      toMonth: formatMonthYear(nextDate),
      method: editData.payment_method,
    });
  };

  const uploadScreenshot = async (file, studentId) => {
    if (!file) return null;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${branchId}/${studentId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("payment-screenshots")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) throw error;

    const { data } = supabase.storage
      .from("payment-screenshots")
      .getPublicUrl(path);

    return data.publicUrl;
  };

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
            .update({
              paid: false,
              payment_method: null,
              payment_screenshot: null,
            })
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

  const openCollectModal = (student) => {
    setCollectStudent(student);
    setPaymentMethod("cash");
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setCollectOpen(true);
  };

  const handleScreenshotSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Faqat rasm yuklash mumkin (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Rasm hajmi 5 MB dan oshmasligi kerak");
      return;
    }
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const clearScreenshot = () => {
    setScreenshotFile(null);
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmCollect = async () => {
    if (!collectStudent) return;
    if (paymentMethod === "click" && !screenshotFile) {
      alert("Click to‘lovi uchun skrinshot yuklash majburiy!");
      return;
    }

    setUploading(true);
    const today = getTodayStr();
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const nextDate = d.toISOString().slice(0, 10);

    try {
      let screenshotUrl = null;
      if (paymentMethod === "click" && screenshotFile) {
        screenshotUrl = await uploadScreenshot(
          screenshotFile,
          collectStudent.id
        );
      }

      const { error } = await supabase
        .from("students")
        .update({
          paid: true,
          payment_date: today,
          next_payment_date: nextDate,
          payment_method: paymentMethod,
          payment_screenshot: screenshotUrl,
        })
        .eq("id", collectStudent.id);

      if (error) throw error;

      setStudents((prev) =>
        prev.map((s) =>
          s.id === collectStudent.id
            ? {
                ...s,
                paid: true,
                payment_date: today,
                next_payment_date: nextDate,
                payment_method: paymentMethod,
                payment_screenshot: screenshotUrl,
              }
            : s
        )
      );

      printPaymentReceipt({
        studentName: `${collectStudent.first_name || ""} ${
          collectStudent.last_name || ""
        }`.trim(),
        phone: formatPhoneDisplay(collectStudent.phone),
        course: collectStudent.courses?.name || "—",
        teacher: collectStudent.teachers?.name || "—",
        group: collectStudent.groups?.name || "—",
        amount: formatCurrency(collectStudent.monthly_fee || 0),
        paymentDate: formatShortDate(today),
        fromMonth: formatMonthYear(today),
        toMonth: formatMonthYear(nextDate),
        method: paymentMethod,
      });

      setCollectOpen(false);
      setCollectStudent(null);
      clearScreenshot();
    } catch (err) {
      alert("Xatolik: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleRefund = async (student) => {
    if (!window.confirm("To‘lovni bekor qilmoqchimisiz?")) return;

    const oldStudents = [...students];
    setStudents((prev) =>
      prev.map((s) =>
        s.id === student.id
          ? {
              ...s,
              paid: false,
              payment_date: null,
              next_payment_date: null,
              payment_method: null,
              payment_screenshot: null,
            }
          : s
      )
    );

    const { error } = await supabase
      .from("students")
      .update({
        paid: false,
        payment_date: null,
        next_payment_date: null,
        payment_method: null,
        payment_screenshot: null,
      })
      .eq("id", student.id);

    if (error) {
      setStudents(oldStudents);
      alert("Update failed: " + error.message);
    }
  };

  const handleSave = async () => {
    if (!editData?.id) return;
    setSaving(true);

    try {
      let screenshotUrl = editData.payment_screenshot || null;
      if (editData._newScreenshotFile) {
        screenshotUrl = await uploadScreenshot(
          editData._newScreenshotFile,
          editData.id
        );
      }

      const { error } = await supabase
        .from("students")
        .update({
          monthly_fee: Number(editData.monthly_fee) || 0,
          paid: Boolean(editData.paid),
          payment_date: editData.payment_date || null,
          next_payment_date: editData.next_payment_date || null,
          payment_method: editData.paid
            ? editData.payment_method || "cash"
            : null,
          payment_screenshot:
            editData.paid && editData.payment_method === "click"
              ? screenshotUrl
              : null,
        })
        .eq("id", editData.id);

      if (error) throw error;
      setEditOpen(false);
      fetchData(true);
    } catch (err) {
      alert(err.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
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
          if (!updated.payment_method) updated.payment_method = "cash";
        } else {
          updated.payment_date = null;
          updated.next_payment_date = null;
          updated.payment_method = null;
          updated.payment_screenshot = null;
        }
      }
      return updated;
    });
  };

  const handleEditScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Faqat rasm yuklash mumkin");
      return;
    }
    setEditData((prev) => ({
      ...prev,
      _newScreenshotFile: file,
      _previewUrl: URL.createObjectURL(file),
    }));
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
  }, [
    students,
    search,
    filterStatus,
    filterCourse,
    filterGroup,
    filterMonth,
  ]);

  const unpaidList = useMemo(
    () => processedStudents.filter((s) => !s.paid),
    [processedStudents]
  );
  const paidList = useMemo(
    () => processedStudents.filter((s) => s.paid),
    [processedStudents]
  );

  const paymentHistory = useMemo(() => {
    const paid = students.filter((s) => s.paid && s.payment_date);
    const groups = { today: [], yesterday: [], week: [], older: [] };

    paid.forEach((s) => {
      const rel = getRelativeDay(s.payment_date);
      if (rel === "today") groups.today.push(s);
      else if (rel === "yesterday") groups.yesterday.push(s);
      else if (rel === "week") groups.week.push(s);
      else groups.older.push(s);
    });

    const sortByDate = (a, b) =>
      (b.payment_date || "").localeCompare(a.payment_date || "");

    groups.today.sort(sortByDate);
    groups.yesterday.sort(sortByDate);
    groups.week.sort(sortByDate);
    groups.older.sort(sortByDate);

    return groups;
  }, [students]);

  const historyStats = useMemo(() => {
    const sum = (arr) =>
      arr.reduce((acc, s) => acc + (s.monthly_fee || 0), 0);
    return {
      todayCount: paymentHistory.today.length,
      todaySum: sum(paymentHistory.today),
      yesterdayCount: paymentHistory.yesterday.length,
      yesterdaySum: sum(paymentHistory.yesterday),
      weekCount:
        paymentHistory.today.length +
        paymentHistory.yesterday.length +
        paymentHistory.week.length,
      weekSum:
        sum(paymentHistory.today) +
        sum(paymentHistory.yesterday) +
        sum(paymentHistory.week),
      allCount: students.filter((s) => s.paid && s.payment_date).length,
      allSum: students
        .filter((s) => s.paid && s.payment_date)
        .reduce((acc, s) => acc + (s.monthly_fee || 0), 0),
    };
  }, [paymentHistory, students]);

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

  const currentHistoryList = useMemo(() => {
    if (historyFilter === "today") return paymentHistory.today;
    if (historyFilter === "yesterday") return paymentHistory.yesterday;
    if (historyFilter === "week")
      return [
        ...paymentHistory.today,
        ...paymentHistory.yesterday,
        ...paymentHistory.week,
      ];
    return [
      ...paymentHistory.today,
      ...paymentHistory.yesterday,
      ...paymentHistory.week,
      ...paymentHistory.older,
    ];
  }, [historyFilter, paymentHistory]);

  if (!branchId) {
    return (
      <div className="ia-pay">
        <div className="ia-pay-empty">
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
        className={
          !s.paid
            ? overdue
              ? "ia-pay-row--overdue"
              : "ia-pay-row--unpaid"
            : ""
        }
      >
        <td data-label="Student">
          <div className="ia-pay-user">
            <div
              className={`ia-pay-avatar ${
                !s.paid ? "ia-pay-avatar--unpaid" : ""
              }`}
            >
              {(s.first_name?.[0] || "").toUpperCase()}
              {(s.last_name?.[0] || "").toUpperCase()}
            </div>
            <div className="ia-pay-user-meta">
              <span className="ia-pay-name">
                {s.first_name} {s.last_name}
              </span>
              <span className="ia-pay-phone">
                {formatPhoneDisplay(s.phone)}
              </span>
            </div>
          </div>
        </td>
        <td data-label="Course / Group">
          <div className="ia-pay-course-group">
            <span className="ia-pay-course-tag">
              {s.courses?.name || "—"}
            </span>
            <span className="ia-pay-group-name">{s.groups?.name || "—"}</span>
          </div>
        </td>
        <td className="ia-pay-fee" data-label="Monthly fee">
          {formatCurrency(s.monthly_fee || 0)}
        </td>
        <td data-label="Status">
          <div className="ia-pay-status">
            <span
              className={`ia-pay-badge ${
                s.paid
                  ? "ia-pay-badge--success"
                  : overdue
                  ? "ia-pay-badge--warning"
                  : "ia-pay-badge--danger"
              }`}
            >
              {s.paid ? "PAID" : overdue ? "OVERDUE" : "DEBTOR"}
            </span>
            {s.paid && s.payment_method && (
              <span
                className={`ia-pay-method ${
                  s.payment_method === "click"
                    ? "ia-pay-method--click"
                    : "ia-pay-method--cash"
                }`}
              >
                {s.payment_method === "click" ? "CLICK" : "CASH"}
              </span>
            )}
          </div>
        </td>
        <td data-label="Payment">
          <div className="ia-pay-date">
            {s.payment_date ? formatShortDate(s.payment_date) : "—"}
          </div>
        </td>
        <td data-label="Next">
          <div
            className={`ia-pay-date ${!s.paid ? "ia-pay-date--danger" : ""}`}
          >
            {s.next_payment_date
              ? formatShortDate(s.next_payment_date)
              : "—"}
          </div>
        </td>
        <td data-label="Actions">
          <div className="ia-pay-actions">
            {s.paid && s.payment_screenshot && (
              <button
                className="ia-pay-icon-btn"
                title="Skrinshotni ko‘rish"
                onClick={() => setPreviewUrl(s.payment_screenshot)}
                type="button"
              >
                <FiEye size={14} />
              </button>
            )}
            {s.paid && (
              <button
                className="ia-pay-icon-btn"
                title="Print receipt"
                onClick={() => openReceiptForStudent(s)}
                type="button"
              >
                <FiPrinter size={14} />
              </button>
            )}
            <button
              className="ia-pay-icon-btn"
              title="Edit"
              onClick={() => {
                setEditData({ ...s });
                setEditOpen(true);
              }}
              type="button"
            >
              <FiEdit2 size={14} />
            </button>
            {s.paid ? (
              <button
                className="ia-pay-pill ia-pay-pill--refund"
                onClick={() => handleRefund(s)}
                type="button"
              >
                <FiCreditCard size={13} />
                Refund
              </button>
            ) : (
              <button
                className="ia-pay-pill ia-pay-pill--collect"
                onClick={() => openCollectModal(s)}
                type="button"
              >
                <FiCreditCard size={13} />
                Collect
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderHistoryItem = (s) => (
    <div key={s.id} className="ia-pay-history-item">
      <div className="ia-pay-history-avatar">
        {(s.first_name?.[0] || "").toUpperCase()}
        {(s.last_name?.[0] || "").toUpperCase()}
      </div>
      <div className="ia-pay-history-meta">
        <span className="ia-pay-history-name">
          {s.first_name} {s.last_name}
        </span>
        <span className="ia-pay-history-sub">
          {s.courses?.name || "—"} · {s.groups?.name || "—"} ·{" "}
          {formatShortDate(s.payment_date)}
        </span>
      </div>
      <div className="ia-pay-history-right">
        <span className="ia-pay-history-amount">
          {formatCurrency(s.monthly_fee || 0)}
        </span>
        <span
          className={`ia-pay-method ${
            s.payment_method === "click"
              ? "ia-pay-method--click"
              : "ia-pay-method--cash"
          }`}
        >
          {s.payment_method === "click" ? "CLICK" : "CASH"}
        </span>
      </div>
    </div>
  );

  return (
    <div className="ia-pay">
      <header className="ia-pay-header">
        <div className="ia-pay-title-wrap">
          <h1 className="ia-pay-title">{activeBranch?.name} • Payments</h1>
          <p className="ia-pay-desc">
            Automatic payment system — <strong>{students.length}</strong> active
            students
            {stats.countOverdue > 0 && (
              <span className="ia-pay-overdue-hint">
                · <FiClock size={12} /> {stats.countOverdue} overdue
              </span>
            )}
          </p>
        </div>

        <div className="ia-pay-header-actions">
          <button
            className="ia-pay-history-btn"
            onClick={() => setHistoryOpen(true)}
            type="button"
          >
            <FiClock size={16} />
            <span>To‘lovlar tarixi</span>
            {historyStats.todayCount > 0 && (
              <em>{historyStats.todayCount}</em>
            )}
          </button>

          <button
            className="ia-pay-refresh"
            onClick={() => fetchData()}
            disabled={loading}
            title="Refresh"
            type="button"
          >
            <FiRefreshCw className={loading ? "ia-pay-spin" : ""} size={15} />
          </button>
        </div>
      </header>

      <section className="ia-pay-stats">
        <button
          type="button"
          className={`ia-pay-stat ${
            filterStatus === "all" && !hasActiveFilters
              ? "ia-pay-stat--active"
              : ""
          }`}
          onClick={() => setFilterStatus("all")}
        >
          <div className="ia-pay-stat-icon ia-pay-stat-icon--income">
            <FiDollarSign size={16} />
          </div>
          <div className="ia-pay-stat-body">
            <span className="ia-pay-stat-label">Total collected</span>
            <strong className="ia-pay-stat-value">
              {formatCurrency(stats.total)}
            </strong>
          </div>
        </button>
        <button
          type="button"
          className={`ia-pay-stat ${
            filterStatus === "paid" ? "ia-pay-stat--active" : ""
          }`}
          onClick={() => setFilterStatus("paid")}
        >
          <div className="ia-pay-stat-icon ia-pay-stat-icon--paid">
            <FiCheckCircle size={16} />
          </div>
          <div className="ia-pay-stat-body">
            <span className="ia-pay-stat-label">Paid</span>
            <strong className="ia-pay-stat-value">{stats.countPaid}</strong>
          </div>
        </button>
        <button
          type="button"
          className={`ia-pay-stat ${
            filterStatus === "unpaid" ? "ia-pay-stat--active" : ""
          }`}
          onClick={() => setFilterStatus("unpaid")}
        >
          <div className="ia-pay-stat-icon ia-pay-stat-icon--unpaid">
            <FiAlertCircle size={16} />
          </div>
          <div className="ia-pay-stat-body">
            <span className="ia-pay-stat-label">Debtors</span>
            <strong className="ia-pay-stat-value">{stats.countUnpaid}</strong>
          </div>
        </button>
        <div className="ia-pay-stat ia-pay-stat--debt">
          <div className="ia-pay-stat-icon ia-pay-stat-icon--total">
            <FiUsers size={16} />
          </div>
          <div className="ia-pay-stat-body">
            <span className="ia-pay-stat-label">Debt amount</span>
            <strong className="ia-pay-stat-value ia-pay-stat-value--danger">
              {formatCurrency(stats.debt)}
            </strong>
          </div>
        </div>
      </section>

      <div className="ia-pay-toolbar">
        <div className="ia-pay-search">
          <FiSearch size={15} />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="ia-pay-search-clear"
              onClick={() => setSearch("")}
              type="button"
            >
              <FiX size={13} />
            </button>
          )}
        </div>
        <div className="ia-pay-filters">
          <div className="ia-pay-select">
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
          <div className="ia-pay-select">
            <FiBookOpen size={13} />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <option hidden value="all">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ia-pay-select">
            <FiUsers size={13} />
            <select 
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
            >
              <option hidden value="all">All groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ia-pay-select">
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
              className="ia-pay-clear"
              onClick={clearFilters}
              type="button"
            >
              <FiX size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="ia-pay-card">
        {loading ? (
          <div className="ia-pay-skeleton">
            <div className="ia-pay-skel-header">
              <div className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w120" />
              <div className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w100" />
              <div className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w80" />
              <div className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w70" />
              <div className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w80" />
              <div className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w70" />
              <div className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w90" />
            </div>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="ia-pay-skel-row">
                <div className="ia-pay-skel-user">
                  <div className="ia-pay-skel ia-pay-skel--circle" />
                  <div className="ia-pay-skel-user-meta">
                    <div className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w140" />
                    <div
                      className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w100"
                      style={{ marginTop: 6 }}
                    />
                  </div>
                </div>
                <div className="ia-pay-skel-col">
                  <div className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w110" />
                  <div
                    className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w80"
                    style={{ marginTop: 6 }}
                  />
                </div>
                <div className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w90" />
                <div className="ia-pay-skel ia-pay-skel--badge" />
                <div className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w80" />
                <div className="ia-pay-skel ia-pay-skel--line ia-pay-skel--w80" />
                <div className="ia-pay-skel-actions">
                  <div className="ia-pay-skel ia-pay-skel--circle-sm" />
                  <div className="ia-pay-skel ia-pay-skel--circle-sm" />
                  <div className="ia-pay-skel ia-pay-skel--pill" />
                </div>
              </div>
            ))}
          </div>
        ) : processedStudents.length === 0 ? (
          <div className="ia-pay-empty-inside">
            <FiUsers size={36} style={{ opacity: 0.35 }} />
            <p>No students found</p>
            <span>Try changing the filters</span>
          </div>
        ) : (
          <div className="ia-pay-table-wrap">
            <table className="ia-pay-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course / Group</th>
                  <th>Monthly fee</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Next</th>
                  <th className="ia-pay-text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {unpaidList.length > 0 && (
                  <>
                    <tr className="ia-pay-section-row">
                      <td colSpan={7}>
                        <div className="ia-pay-section ia-pay-section--unpaid">
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
                    <tr className="ia-pay-section-row">
                      <td colSpan={7}>
                        <div className="ia-pay-section ia-pay-section--paid">
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

      {/* HISTORY MODAL */}
      {historyOpen && (
        <div
          className="ia-pay-overlay"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="ia-pay-history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ia-pay-modal-accent" />
            <div className="ia-pay-modal-header">
              <div className="ia-pay-history-modal-title">
                <FiClock size={20} />
                <h2>To‘lovlar tarixi</h2>
              </div>
              <button
                className="ia-pay-modal-close"
                onClick={() => setHistoryOpen(false)}
                type="button"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="ia-pay-history-modal-body">
              <div className="ia-pay-history-tabs">
                <button
                  type="button"
                  className={`ia-pay-history-tab ${
                    historyFilter === "today" ? "ia-pay-history-tab--active" : ""
                  }`}
                  onClick={() => setHistoryFilter("today")}
                >
                  Bugun
                  {historyStats.todayCount > 0 && (
                    <em>{historyStats.todayCount}</em>
                  )}
                </button>
                <button
                  type="button"
                  className={`ia-pay-history-tab ${
                    historyFilter === "yesterday"
                      ? "ia-pay-history-tab--active"
                      : ""
                  }`}
                  onClick={() => setHistoryFilter("yesterday")}
                >
                  Kecha
                  {historyStats.yesterdayCount > 0 && (
                    <em>{historyStats.yesterdayCount}</em>
                  )}
                </button>
                <button
                  type="button"
                  className={`ia-pay-history-tab ${
                    historyFilter === "week" ? "ia-pay-history-tab--active" : ""
                  }`}
                  onClick={() => setHistoryFilter("week")}
                >
                  7 kun
                  {historyStats.weekCount > 0 && (
                    <em>{historyStats.weekCount}</em>
                  )}
                </button>
                <button
                  type="button"
                  className={`ia-pay-history-tab ${
                    historyFilter === "all" ? "ia-pay-history-tab--active" : ""
                  }`}
                  onClick={() => setHistoryFilter("all")}
                >
                  Barchasi
                  {historyStats.allCount > 0 && (
                    <em>{historyStats.allCount}</em>
                  )}
                </button>
              </div>

              <div className="ia-pay-history-summary">
                <div className="ia-pay-history-chip">
                  <span>Bugun</span>
                  <strong>{formatCurrency(historyStats.todaySum)}</strong>
                  <small>{historyStats.todayCount} ta</small>
                </div>
                <div className="ia-pay-history-chip">
                  <span>Kecha</span>
                  <strong>{formatCurrency(historyStats.yesterdaySum)}</strong>
                  <small>{historyStats.yesterdayCount} ta</small>
                </div>
                <div className="ia-pay-history-chip">
                  <span>7 kun</span>
                  <strong>{formatCurrency(historyStats.weekSum)}</strong>
                  <small>{historyStats.weekCount} ta</small>
                </div>
              </div>

              <div className="ia-pay-history-list">
                {currentHistoryList.length === 0 ? (
                  <div className="ia-pay-history-empty">
                    <FiClock size={32} />
                    <p>Bu davrda to‘lovlar yo‘q</p>
                  </div>
                ) : (
                  currentHistoryList.map(renderHistoryItem)
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COLLECT MODAL */}
      {collectOpen && collectStudent && (
        <div
          className="ia-pay-overlay"
          onClick={() => !uploading && setCollectOpen(false)}
        >
          <div className="ia-pay-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ia-pay-modal-accent" />
            <div className="ia-pay-modal-header">
              <h2>To‘lovni qabul qilish</h2>
              <button
                className="ia-pay-modal-close"
                onClick={() => !uploading && setCollectOpen(false)}
                type="button"
                disabled={uploading}
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="ia-pay-modal-body">
              <div className="ia-pay-collect-student">
                <strong>
                  {collectStudent.first_name} {collectStudent.last_name}
                </strong>
                <span>{formatCurrency(collectStudent.monthly_fee || 0)}</span>
              </div>
              <div className="ia-pay-method-select">
                <label className="ia-pay-method-label">To‘lov usuli</label>
                <div className="ia-pay-method-options">
                  <button
                    type="button"
                    className={`ia-pay-method-btn ${
                      paymentMethod === "cash" ? "ia-pay-method-btn--active" : ""
                    }`}
                    onClick={() => {
                      setPaymentMethod("cash");
                      clearScreenshot();
                    }}
                    disabled={uploading}
                  >
                    <FiDollarSign size={18} />
                    <span>Naqd (Cash)</span>
                  </button>
                  <button
                    type="button"
                    className={`ia-pay-method-btn ${
                      paymentMethod === "click"
                        ? "ia-pay-method-btn--active"
                        : ""
                    }`}
                    onClick={() => setPaymentMethod("click")}
                    disabled={uploading}
                  >
                    <FiCreditCard size={18} />
                    <span>Click</span>
                  </button>
                </div>
              </div>
              {paymentMethod === "click" && (
                <div className="ia-pay-screenshot">
                  <label className="ia-pay-method-label">
                    Click skrinshoti <em>(majburiy)</em>
                  </label>
                  {screenshotPreview ? (
                    <div className="ia-pay-screenshot-preview">
                      <img src={screenshotPreview} alt="Preview" />
                      <button
                        type="button"
                        className="ia-pay-screenshot-remove"
                        onClick={clearScreenshot}
                        disabled={uploading}
                      >
                        <FiTrash2 size={14} /> O‘chirish
                      </button>
                    </div>
                  ) : (
                    <div
                      className="ia-pay-screenshot-drop"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FiUpload size={24} />
                      <span>Rasmni tanlang yoki tashlang</span>
                      <small>JPG, PNG, WEBP · max 5 MB</small>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleScreenshotSelect}
                    style={{ display: "none" }}
                  />
                </div>
              )}
            </div>
            <div className="ia-pay-modal-footer">
              <button
                className="ia-pay-btn-cancel"
                onClick={() => setCollectOpen(false)}
                type="button"
                disabled={uploading}
              >
                Bekor qilish
              </button>
              <button
                className="ia-pay-btn-save"
                onClick={confirmCollect}
                disabled={uploading}
                type="button"
              >
                {uploading ? "Saqlanmoqda..." : "Tasdiqlash va chek chiqarish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editOpen && editData && (
        <div
          className="ia-pay-overlay"
          onClick={() => setEditOpen(false)}
        >
          <div className="ia-pay-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ia-pay-modal-accent" />
            <div className="ia-pay-modal-header">
              <h2>Payment settings</h2>
              <button
                className="ia-pay-modal-close"
                onClick={() => setEditOpen(false)}
                type="button"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="ia-pay-modal-body">
              <div className="ia-pay-form-grid">
                <div className="ia-pay-form-item ia-pay-form-item--full">
                  <label>Monthly fee (so'm)</label>
                  <input
                    type="number"
                    name="monthly_fee"
                    value={editData.monthly_fee || 0}
                    onChange={handleChange}
                  />
                </div>
                <div className="ia-pay-form-item">
                  <label>Payment date</label>
                  <input
                    type="date"
                    name="payment_date"
                    value={editData.payment_date || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="ia-pay-form-item">
                  <label>Next payment</label>
                  <input
                    type="date"
                    name="next_payment_date"
                    value={editData.next_payment_date || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <label className="ia-pay-checkbox">
                <input
                  type="checkbox"
                  name="paid"
                  checked={editData.paid || false}
                  onChange={handleChange}
                />
                <span>Mark as paid for the current month</span>
              </label>
              {editData.paid && (
                <>
                  <div className="ia-pay-method-select" style={{ marginTop: 16 }}>
                    <label className="ia-pay-method-label">To‘lov usuli</label>
                    <div className="ia-pay-method-options">
                      <button
                        type="button"
                        className={`ia-pay-method-btn ${
                          editData.payment_method === "cash"
                            ? "ia-pay-method-btn--active"
                            : ""
                        }`}
                        onClick={() =>
                          setEditData((p) => ({
                            ...p,
                            payment_method: "cash",
                            payment_screenshot: null,
                            _newScreenshotFile: null,
                            _previewUrl: null,
                          }))
                        }
                      >
                        <FiDollarSign size={16} />
                        <span>Naqd</span>
                      </button>
                      <button
                        type="button"
                        className={`ia-pay-method-btn ${
                          editData.payment_method === "click"
                            ? "ia-pay-method-btn--active"
                            : ""
                        }`}
                        onClick={() =>
                          setEditData((p) => ({
                            ...p,
                            payment_method: "click",
                          }))
                        }
                      >
                        <FiCreditCard size={16} />
                        <span>Click</span>
                      </button>
                    </div>
                  </div>
                  {editData.payment_method === "click" && (
                    <div className="ia-pay-screenshot" style={{ marginTop: 12 }}>
                      <label className="ia-pay-method-label">Skrinshot</label>
                      {(editData._previewUrl ||
                        editData.payment_screenshot) && (
                        <div className="ia-pay-screenshot-preview">
                          <img
                            src={
                              editData._previewUrl ||
                              editData.payment_screenshot
                            }
                            alt="Screenshot"
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleEditScreenshot}
                        style={{ marginTop: 8 }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="ia-pay-modal-footer">
              <div className="ia-pay-modal-footer-left">
                {editData.paid && (
                  <button
                    className="ia-pay-btn-print"
                    onClick={printFromEdit}
                    type="button"
                    title="Chek chiqarish"
                  >
                    <FiPrinter size={15} />
                    Chek chiqarish
                  </button>
                )}
              </div>
              <div className="ia-pay-modal-footer-right">
                <button
                  className="ia-pay-btn-cancel"
                  onClick={() => setEditOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="ia-pay-btn-save"
                  onClick={handleSave}
                  disabled={saving}
                  type="button"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div
          className="ia-pay-overlay"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="ia-pay-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="ia-pay-modal-close"
              onClick={() => setPreviewUrl(null)}
              type="button"
            >
              <FiX size={18} />
            </button>
            <img src={previewUrl} alt="Payment screenshot" />
          </div>
        </div>
      )}
    </div>
  );
}