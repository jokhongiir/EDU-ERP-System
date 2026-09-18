import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiTarget,
  FiUsers,
  FiBookOpen,
  FiTrendingUp,
  FiPhone,
  FiCalendar,
  FiClock,
  FiMessageSquare,
  FiGlobe,
  FiSearch,
  FiRefreshCw,
} from "react-icons/fi";
import "./LeadsDashboard.css";

export default function LeadsDashboard({ activeBranch }) {
  const [leads, setLeads] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterDate, setFilterDate] = useState("all");

  // ========== Helpers ==========
  const formatPhoneDisplay = (value) => {
    if (!value) return "—";
    const digits = value.replace(/\D/g, "");
    if (digits.length < 12) return value;
    return `+${digits.slice(0, 3)} (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Bugun";
    if (diffDays === 1) return "Kecha";
    if (diffDays === 2) return "2 kun avval";
    if (diffDays === 3) return "3 kun avval";
    if (diffDays < 7) return `${diffDays} kun avval`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta avval`;
    return date.toLocaleDateString("uz-UZ");
  };

  // ========== Fetch (barcha filial uchun umumiy) ==========
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [leadsRes, coursesRes] = await Promise.all([
        supabase
          .from("leads")
          .select("*, courses(name)")
          .order("created_at", { ascending: false }),
        supabase.from("courses").select("id, name"),
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setLeads(leadsRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
      setLeads([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ========== Filtered ==========
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.full_name?.toLowerCase().includes(q) ||
          l.phone?.includes(q) ||
          l.notes?.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((l) => l.status === filterStatus);
    }
    if (filterSource !== "all") {
      result = result.filter((l) => l.source === filterSource);
    }
    if (filterCourse !== "all") {
      result = result.filter((l) => l.course_id === filterCourse);
    }

    if (filterDate === "today") {
      const today = new Date().toISOString().slice(0, 10);
      result = result.filter((l) => l.created_at?.startsWith(today));
    } else if (filterDate === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter((l) => new Date(l.created_at) >= weekAgo);
    }

    return result;
  }, [leads, search, filterStatus, filterSource, filterCourse, filterDate]);

  // ========== Stats ==========
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayLeads = leads.filter((l) =>
      l.created_at?.startsWith(today)
    ).length;

    const byStatus = {
      new: 0,
      interested: 0,
      student: 0,
      postponed: 0,
      rejected: 0,
    };
    leads.forEach((l) => {
      if (byStatus[l.status] !== undefined) byStatus[l.status]++;
    });

    const bySource = {};
    leads.forEach((l) => {
      const key = l.source || "other";
      bySource[key] = (bySource[key] || 0) + 1;
    });

    const conversion =
      leads.length > 0
        ? Math.round((byStatus.student / leads.length) * 100)
        : 0;

    return {
      total: leads.length,
      today: todayLeads,
      courses: courses.length,
      conversion,
      byStatus,
      bySource,
    };
  }, [leads, courses]);

  const statusLabel = {
    new: "Yangi",
    interested: "Qiziqmoqda",
    student: "O'quvchimiz",
    postponed: "Keyinga qoldirildi",
    rejected: "Rad etildi",
  };

  const statusColor = {
    new: "#376fff",
    interested: "#8b5cf6",
    student: "#10b981",
    postponed: "#f59e0b",
    rejected: "#ef4444",
  };

  const sourceLabel = {
    marketing: "Marketing",
    instagram: "Instagram",
    telegram: "Telegram",
    facebook: "Facebook",
    call: "Qo'ng'iroq",
    walkin: "Kelib tushgan",
    other: "Boshqa",
  };

  return (
    <div className="ldb-root">
      <div className="ldb-header">
        <div>
          <h1 className="ldb-title">
            {activeBranch?.name
              ? `${activeBranch.name} • Leads Dashboard`
              : "Leads Dashboard"}
          </h1>
          <p className="ldb-desc">
            Barcha filiallar uchun umumiy leadlar
          </p>
        </div>
        <button
          className="ldb-refresh-btn"
          onClick={fetchData}
          disabled={loading}
        >
          <FiRefreshCw className={loading ? "spin" : ""} />
          Yangilash
        </button>
      </div>

      {/* KPI */}
      <div className="ldb-kpi-row">
        <div className="ldb-kpi-card">
          <div className="ldb-kpi-icon" style={{ background: "#376fff" }}>
            <FiTarget />
          </div>
          <div>
            <span className="ldb-kpi-label">Bugungi lidlar</span>
            <strong className="ldb-kpi-value">{stats.today}</strong>
          </div>
        </div>

        <div className="ldb-kpi-card">
          <div className="ldb-kpi-icon" style={{ background: "#10b981" }}>
            <FiUsers />
          </div>
          <div>
            <span className="ldb-kpi-label">Jami lidlar</span>
            <strong className="ldb-kpi-value">{stats.total}</strong>
          </div>
        </div>

        <div className="ldb-kpi-card">
          <div className="ldb-kpi-icon" style={{ background: "#f59e0b" }}>
            <FiBookOpen />
          </div>
          <div>
            <span className="ldb-kpi-label">Kurslar</span>
            <strong className="ldb-kpi-value">{stats.courses}</strong>
          </div>
        </div>

        <div className="ldb-kpi-card">
          <div className="ldb-kpi-icon" style={{ background: "#8b5cf6" }}>
            <FiTrendingUp />
          </div>
          <div>
            <span className="ldb-kpi-label">Konversiya</span>
            <strong className="ldb-kpi-value">{stats.conversion}%</strong>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="ldb-breakdown-row">
        <div className="ldb-card">
          <h3 className="ldb-card-title">Status bo‘yicha</h3>
          <div className="ldb-status-list">
            {Object.entries(stats.byStatus).map(([key, count]) => (
              <div key={key} className="ldb-status-item">
                <div className="ldb-status-left">
                  <span
                    className="ldb-status-dot"
                    style={{ background: statusColor[key] }}
                  />
                  <span>{statusLabel[key]}</span>
                </div>
                <div className="ldb-status-right">
                  <strong>{count}</strong>
                  <span className="ldb-status-bar-wrap">
                    <span
                      className="ldb-status-bar"
                      style={{
                        width: stats.total
                          ? `${(count / stats.total) * 100}%`
                          : "0%",
                        background: statusColor[key],
                      }}
                    />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ldb-card">
          <h3 className="ldb-card-title">Manba bo‘yicha</h3>
          <div className="ldb-source-list">
            {Object.entries(stats.bySource).length === 0 ? (
              <p className="ldb-empty-text">Hali ma’lumot yo‘q</p>
            ) : (
              Object.entries(stats.bySource)
                .sort((a, b) => b[1] - a[1])
                .map(([key, count]) => (
                  <div key={key} className="ldb-source-item">
                    <span className="ldb-source-name">
                      <FiGlobe size={13} /> {sourceLabel[key] || key}
                    </span>
                    <strong>{count}</strong>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="ldb-filters">
        <div className="ldb-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Ism, telefon yoki izoh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        >
          <option value="all">Barcha vaqt</option>
          <option value="today">Bugun</option>
          <option value="week">Oxirgi 7 kun</option>
        </select>

        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
        >
          <option value="all">Barcha manbalar</option>
          <option value="marketing">Marketing</option>
          <option value="instagram">Instagram</option>
          <option value="telegram">Telegram</option>
          <option value="facebook">Facebook</option>
          <option value="call">Qo‘ng‘iroq</option>
          <option value="walkin">Kelib tushgan</option>
          <option value="other">Boshqa</option>
        </select>

        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
        >
          <option value="all">Barcha kurslar</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Barcha statuslar</option>
          <option value="new">Yangi</option>
          <option value="interested">Qiziqmoqda</option>
          <option value="student">O‘quvchimiz</option>
          <option value="postponed">Keyinga qoldirildi</option>
          <option value="rejected">Rad etildi</option>
        </select>
      </div>

      {error && (
        <div className="ldb-error">
          <span>{error}</span>
          <button onClick={fetchData}>Qayta urinish</button>
        </div>
      )}

      {loading ? (
        <div className="ldb-loading">Ma’lumotlar yuklanmoqda...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="ldb-empty">
          <FiTarget size={44} />
          <h3>Lidlar topilmadi</h3>
          <p>Tanlangan filterlarga mos lid yo‘q.</p>
        </div>
      ) : (
        <div className="ldb-table-wrapper">
          <table className="ldb-table">
            <thead>
              <tr>
                <th>Ism</th>
                <th>Telefon</th>
                <th>Manba</th>
                <th>Kurs</th>
                <th>Status</th>
                <th>Birinchi murojaat</th>
                <th>Oxirgi aloqa</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong>{lead.full_name}</strong>
                    {lead.notes && (
                      <div className="ldb-notes" title={lead.notes}>
                        <FiMessageSquare size={12} />
                        {lead.notes.slice(0, 48)}
                        {lead.notes.length > 48 ? "..." : ""}
                      </div>
                    )}
                  </td>
                  <td>
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="ldb-phone">
                        <FiPhone size={13} /> {formatPhoneDisplay(lead.phone)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className="ldb-badge source">
                      {sourceLabel[lead.source] || lead.source || "—"}
                    </span>
                  </td>
                  <td>
                    {lead.courses?.name ? (
                      <span className="ldb-badge course">
                        {lead.courses.name}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span
                      className="ldb-badge status"
                      style={{
                        background:
                          (statusColor[lead.status] || "#64748b") + "18",
                        color: statusColor[lead.status] || "#64748b",
                      }}
                    >
                      {statusLabel[lead.status] || lead.status}
                    </span>
                  </td>
                  <td>
                    <span className="ldb-date">
                      <FiCalendar size={13} />
                      {lead.first_contact_at
                        ? new Date(lead.first_contact_at).toLocaleDateString(
                            "uz-UZ"
                          )
                        : lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString(
                              "uz-UZ"
                            )
                          : "—"}
                    </span>
                  </td>
                  <td>
                    <span className="ldb-date">
                      <FiClock size={13} />
                      {getRelativeTime(
                        lead.last_contact_at || lead.created_at
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}