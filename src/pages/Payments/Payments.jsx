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
} from "react-icons/fi";
import "./Payments.css";

export default function Payments({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("uz-UZ").format(value) + " UZS";

  const getTodayStr = () => new Date().toISOString().slice(0, 10);

  const formatPhoneDisplay = (value) => {
    if (!value) return "—";
    const digits = String(value).replace(/\D/g, "");
    if (digits.length < 12) return value;
    return `+${digits.slice(0, 3)} (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  };

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("uz-UZ", { month: "long", year: "numeric" });
  };

  // ========== Xprinter 80mm chek (qalin matn + INTELLECT ACADEMY) ==========
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
  <title>To'lov cheki</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 72mm;
      max-width: 72mm;
      margin: 0 auto;
      padding: 0;
      font-family: "Courier New", Courier, monospace;
      font-size: 12px;
      font-weight: 600;
      color: #000;
      background: #fff;
      line-height: 1.35;
    }
    .content {
      padding: 3px 5px 0;
    }
    .center { text-align: center; }
    .logo {
      width: 42px;
      height: 42px;
      margin: 0 auto 3px;
      display: block;
    }
    .brand {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      line-height: 1.2;
    }
    .sub {
      font-size: 11px;
      font-weight: 700;
      margin: 3px 0 5px;
    }
    .line {
      border-top: 1.5px dashed #000;
      margin: 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      gap: 4px;
      font-weight: 600;
    }
    .row span:first-child {
      font-weight: 600;
    }
    .row span:last-child {
      text-align: right;
      font-weight: 800;
      max-width: 58%;
      word-break: break-word;
    }
    .amount {
      font-size: 17px;
      font-weight: 900;
      text-align: center;
      margin: 9px 0 4px;
    }
    .status {
      text-align: center;
      font-weight: 900;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      margin-top: 7px;
      line-height: 1.4;
    }
    .admin {
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      margin-top: 3px;
    }
    .bottom-space {
      height: 70mm;
    }
  </style>
</head>
<body>
  <div class="content">
    <img class="logo" src="/logo-ia.png" alt="IA" onerror="this.style.display='none'" />

    <div class="center brand">INTELLECT ACADEMY</div>
    <div class="center brand" style="font-size:10px;">LEARNING CENTER</div>
    <div class="center sub">TO'LOV CHEKI</div>
    <div class="line"></div>

    <div class="row"><span>O'quvchi:</span><span>${esc(studentName)}</span></div>
    <div class="row"><span>Telefon:</span><span>${esc(phone)}</span></div>
    <div class="row"><span>Kurs:</span><span>${esc(course)}</span></div>
    <div class="row"><span>Ustoz:</span><span>${esc(teacher)}</span></div>
    <div class="row"><span>Guruh:</span><span>${esc(group)}</span></div>
    <div class="row"><span>Sana:</span><span>${esc(paymentDate)}</span></div>

    <div class="line"></div>

    <div class="row"><span>Davr:</span><span>${esc(fromMonth)}</span></div>
    <div class="row"><span>gacha:</span><span>${esc(toMonth)}</span></div>

    <div class="line"></div>

    <div class="amount">${esc(amount)}</div>
    <div class="status">TO'LANDI</div>

    <div class="line"></div>
    <div class="footer">
      Rahmat!<br>
      INTELLECT ACADEMY
    </div>
    <div class="admin">Admin: +998 94 618 89 39</div>
  </div>

  <div class="bottom-space"></div>
</body>
</html>`;

    const old = document.getElementById("receipt-print-iframe");
    if (old) old.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "receipt-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      setTimeout(() => {
        iframe.remove();
      }, 6000);
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
      paymentDate: new Date(payDate).toLocaleDateString("uz-UZ"),
      fromMonth: formatMonthYear(payDate),
      toMonth: formatMonthYear(nextDate),
    });
  };

  // ========== Fetch ==========
  const fetchPayments = useCallback(
    async (showSilent = false) => {
      if (!branchId) return;
      if (!showSilent) setLoading(true);

      try {
        const { data, error } = await supabase
          .from("students")
          .select(`*, courses(name), teachers(name), groups(name)`)
          .eq("branch_id", branchId)
          .eq("is_free", false)
          .eq("is_archived", false)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const today = getTodayStr();
        const expiredIds = (data || [])
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

          return fetchPayments(true);
        }

        setStudents(data || []);
      } catch (err) {
        console.error("Fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    },
    [branchId]
  );

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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
        studentName: `${student.first_name || ""} ${student.last_name || ""}`.trim(),
        phone: formatPhoneDisplay(student.phone),
        course: student.courses?.name || "—",
        teacher: student.teachers?.name || "—",
        group: student.groups?.name || "—",
        amount: formatCurrency(student.monthly_fee || 0),
        paymentDate: new Date(today).toLocaleDateString("uz-UZ"),
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
    fetchPayments(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditData((prev) => {
      const updatedData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "paid") {
        if (checked) {
          const today = getTodayStr();
          const d = new Date();
          d.setMonth(d.getMonth() + 1);
          updatedData.payment_date = today;
          updatedData.next_payment_date = d.toISOString().slice(0, 10);
        } else {
          updatedData.payment_date = null;
          updatedData.next_payment_date = null;
        }
      }

      return updatedData;
    });
  };

  // ========== Filter ==========
  const processedStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = `${s.first_name || ""} ${s.last_name || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filterStatus === "all"
          ? true
          : filterStatus === "paid"
            ? s.paid === true
            : s.paid === false;

      return matchesSearch && matchesFilter;
    });
  }, [students, search, filterStatus]);

  const stats = useMemo(() => {
    const paid = students.filter((s) => s.paid);
    return {
      total: paid.reduce((sum, s) => sum + (s.monthly_fee || 0), 0),
      countPaid: paid.length,
      countUnpaid: students.length - paid.length,
    };
  }, [students]);

  if (!branchId) {
    return (
      <div className="payments-container">
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
          Filial tanlanmagan
        </div>
      </div>
    );
  }

  return (
    <div className="payments-container">
      <header className="payments-header">
        <div className="header-info">
          <h1>{activeBranch?.name || "Management"} • Payments</h1>
          <p>
            Avtomatik to‘lov tizimi — {students.length} ta faol o‘quvchi
          </p>
        </div>
        <button
          className="refresh-btn"
          onClick={() => fetchPayments()}
          disabled={loading}
          title="Yangilash"
        >
          <FiRefreshCw className={loading ? "spin" : ""} />
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="icon-box income">
            <FiDollarSign />
          </div>
          <div className="stat-val">
            <h3>{formatCurrency(stats.total)}</h3>
            <span>Jami yig‘ilgan</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-box paid">
            <FiCheckCircle />
          </div>
          <div className="stat-val">
            <h3>{stats.countPaid}</h3>
            <span>Shu oy to‘lagan</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-box unpaid">
            <FiAlertCircle />
          </div>
          <div className="stat-val">
            <h3>{stats.countUnpaid}</h3>
            <span>Qarzdor</span>
          </div>
        </div>
      </section>

      <div className="table-toolbar">
        <div className="search-wrapper">
          <FiSearch />
          <input
            type="text"
            placeholder="O‘quvchi qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-wrapper">
          <FiFilter />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Barchasi</option>
            <option value="paid">To‘langan</option>
            <option value="unpaid">Qarzdor</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="professional-loader">
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>O‘quvchi</th>
                <th>Kurs</th>
                <th>Oylik to‘lov</th>
                <th>Status</th>
                <th>Keyingi to‘lov</th>
                <th align="right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {processedStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                    O‘quvchi topilmadi
                  </td>
                </tr>
              ) : (
                processedStudents.map((s) => (
                  <tr key={s.id} className={!s.paid ? "row-unpaid" : ""}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">
                          {s.first_name?.[0] || ""}
                          {s.last_name?.[0] || ""}
                        </div>
                        <div>
                          <div className="full-name">
                            {s.first_name} {s.last_name}
                          </div>
                          <div className="sub-text">
                            {formatPhoneDisplay(s.phone)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="course-tag">
                        {s.courses?.name || "N/A"}
                      </span>
                    </td>
                    <td className="fee-cell">
                      {formatCurrency(s.monthly_fee)}
                    </td>
                    <td>
                      <span className={`badge ${s.paid ? "bg-success" : "bg-danger"}`}>
                        {s.paid ? "TO‘LANGAN" : "QARZDOR"}
                      </span>
                    </td>
                    <td>
                      <div className={`due-date ${!s.paid ? "text-danger" : ""}`}>
                        <FiCalendar /> {s.next_payment_date || "Sana yo‘q"}
                      </div>
                    </td>
                    <td align="right">
                      <div className="action-btns">
                        {s.paid && (
                          <button
                            className="icon-btn edit"
                            title="Chek chiqarish"
                            onClick={() => openReceiptForStudent(s)}
                          >
                            <FiPrinter />
                          </button>
                        )}
                        <button
                          className="icon-btn edit"
                          title="Tahrirlash"
                          onClick={() => {
                            setEditData({ ...s });
                            setEditOpen(true);
                          }}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className={`action-pill ${s.paid ? "is-paid" : "is-unpaid"}`}
                          onClick={() => togglePayment(s)}
                        >
                          <FiCreditCard /> {s.paid ? "Refund" : "Collect"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {editOpen && editData && (
        <div className="professional-modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>To‘lov sozlamalari</h2>
              <button onClick={() => setEditOpen(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-form">
              <div className="input-grid">
                <div className="form-item">
                  <label>Oylik to‘lov (UZS)</label>
                  <input
                    type="number"
                    name="monthly_fee"
                    value={editData.monthly_fee || 0}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-item">
                  <label>Keyingi to‘lov sanasi</label>
                  <input
                    type="date"
                    name="next_payment_date"
                    value={editData.next_payment_date || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="paidCheck"
                  name="paid"
                  checked={editData.paid || false}
                  onChange={handleChange}
                />
                <label htmlFor="paidCheck">
                  Joriy oy uchun to‘langan deb belgilash
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditOpen(false)}>
                Bekor qilish
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}