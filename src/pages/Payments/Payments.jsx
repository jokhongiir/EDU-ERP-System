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
    new Intl.NumberFormat("en-US").format(value) + " UZS";

  const getTodayStr = () => new Date().toISOString().slice(0, 10);

  const fetchPayments = useCallback(
    async (showSilent = false) => {
      if (!branchId) return;
      if (!showSilent) setLoading(true);

      try {
        const { data, error } = await supabase
          .from("students")
          .select(`*, courses(name), teachers(name), groups(name)`)
          .eq("branch_id", branchId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const today = getTodayStr();
        const expiredIds = data
          .filter(
            (s) =>
              s.paid && s.next_payment_date && s.next_payment_date <= today,
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
    [branchId],
  );

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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
          : s,
      ),
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
    }
  };

  const handleSave = async () => {
    if (!editData?.id) return;
    setSaving(true);

    const { error } = await supabase
      .from("students")
      .update({
        monthly_fee: Number(editData.monthly_fee),
        paid: Boolean(editData.paid),
        payment_date: editData.payment_date,
        next_payment_date: editData.next_payment_date,
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
      let updatedData = {
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

  return (
    <div className="payments-container">
      <header className="payments-header">
        <div className="header-info">
          <h1>{activeBranch?.name || "Management"} • Payments</h1>
          <p>Automated billing system for {students.length} active students</p>
        </div>
        <button
          className="refresh-btn"
          onClick={() => fetchPayments()}
          disabled={loading}
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
            <span>Total Collected</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-box paid">
            <FiCheckCircle />
          </div>
          <div className="stat-val">
            <h3>{stats.countPaid}</h3>
            <span>Paid This Month</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon-box unpaid">
            <FiAlertCircle />
          </div>
          <div className="stat-val">
            <h3>{stats.countUnpaid}</h3>
            <span>Pending Payments</span>
          </div>
        </div>
      </section>

      <div className="table-toolbar">
        <div className="search-wrapper">
          <FiSearch />
          <input
            type="text"
            placeholder="Search students..."
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
            <option hidden value="all">All Students</option>
            <option value="paid">Paid Only</option>
            <option value="unpaid">Unpaid/Due</option>
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
                <th>Student Details</th>
                <th>Course Info</th>
                <th>Monthly Fee</th>
                <th>Payment Status</th>
                <th>Next Due Date</th>
                <th align="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedStudents.map((s) => (
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
                          {s.groups?.name || "No Group"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="course-tag">
                      {s.courses?.name || "N/A"}
                    </span>
                  </td>
                  <td className="fee-cell">{formatCurrency(s.monthly_fee)}</td>
                  <td>
                    <span
                      className={`badge ${s.paid ? "bg-success" : "bg-danger"}`}
                    >
                      {s.paid ? "COLLECTED" : "OVERDUE"}
                    </span>
                  </td>
                  <td>
                    <div className={`due-date ${!s.paid ? "text-danger" : ""}`}>
                      <FiCalendar /> {s.next_payment_date || "Set Date"}
                    </div>
                  </td>
                  <td align="right">
                    <div className="action-btns">
                      <button
                        className="icon-btn edit"
                        onClick={() => {
                          setEditData(s);
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
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editOpen && editData && (
        <div className="professional-modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Payment Settings</h2>
              <button onClick={() => setEditOpen(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-form">
              <div className="input-grid">
                <div className="form-item">
                  <label>Monthly Fee</label>
                  <input
                    type="number"
                    name="monthly_fee"
                    value={editData.monthly_fee || 0}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-item">
                  <label>Next Due Date</label>
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
                  Mark as Paid for current cycle
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Processing..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
