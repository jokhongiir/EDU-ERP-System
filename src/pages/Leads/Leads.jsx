import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../services/supabaseClient";
import {
  FiPlus,
  FiTarget,
  FiUsers,
  FiBookOpen,
  FiTrash2,
  FiX,
  FiEdit3,
  FiAlertCircle,
  FiAlertTriangle,
  FiPhone,
  FiCalendar,
  FiFilter,
  FiSearch,
  FiClock,
  FiMessageSquare,
  FiGlobe,
} from "react-icons/fi";
import "./Leads.css";

export default function Leads({ activeBranch }) {
  const [leads, setLeads] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modalMode, setModalMode] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  // Form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("new");
  const [source, setSource] = useState("instagram");
  const [notes, setNotes] = useState("");
  const [firstContactAt, setFirstContactAt] = useState("");
  const [lastContactAt, setLastContactAt] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterDate, setFilterDate] = useState("today");
  const [customDate, setCustomDate] = useState("");

  // ========== Phone helpers ==========
  const formatPhoneDisplay = (value) => {
    if (!value) return "—";
    const digits = value.replace(/\D/g, "");
    if (digits.length < 12) return value;
    return `+${digits.slice(0, 3)} (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  };

  const handlePhoneChange = (e) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, "");

    if (digits.length <= 3) {
      setPhone("+998");
      return;
    }

    const rest = digits.slice(3, 12);
    let formatted = "+998";

    if (rest.length > 0) formatted += " (" + rest.slice(0, 2);
    if (rest.length >= 2) formatted += ")";
    if (rest.length > 2) formatted += " " + rest.slice(2, 5);
    if (rest.length > 5) formatted += "-" + rest.slice(5, 7);
    if (rest.length > 7) formatted += "-" + rest.slice(7, 9);

    setPhone(formatted);
  };

  const getCleanPhone = (formatted) => {
    const digits = formatted.replace(/\D/g, "");
    return digits.length >= 12 ? `+${digits}` : null;
  };

  // ========== Relative time ==========
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

  // ========== Fetch (umumiy — filialga bog‘lanmagan) ==========
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

  // ========== Filters ==========
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

    if (filterCourse !== "all") {
      result = result.filter((l) => l.course_id === filterCourse);
    }
    if (filterStatus !== "all") {
      result = result.filter((l) => l.status === filterStatus);
    }
    if (filterSource !== "all") {
      result = result.filter((l) => l.source === filterSource);
    }

    if (filterDate === "today") {
      const today = new Date().toISOString().slice(0, 10);
      result = result.filter((l) => l.created_at?.startsWith(today));
    } else if (filterDate === "custom" && customDate) {
      result = result.filter((l) => l.created_at?.startsWith(customDate));
    }

    return result;
  }, [
    leads,
    search,
    filterCourse,
    filterStatus,
    filterSource,
    filterDate,
    customDate,
  ]);

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return leads.filter((l) => l.created_at?.startsWith(today)).length;
  }, [leads]);

  const courseStats = useMemo(() => {
    const map = {};
    leads.forEach((l) => {
      const key = l.course_id || "no_course";
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [leads]);

  useEffect(() => {
    document.body.style.overflow = modalMode ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalMode]);

  // ========== Actions ==========
  const openCreate = () => {
    const now = new Date().toISOString().slice(0, 16);
    setFullName("");
    setPhone("+998");
    setCourseId("");
    setStatus("new");
    setSource("instagram");
    setNotes("");
    setFirstContactAt(now);
    setLastContactAt(now);
    setSelectedLead(null);
    setModalMode("create");
  };

  const openEdit = (lead) => {
    setSelectedLead(lead);
    setFullName(lead.full_name || "");
    setPhone(
      formatPhoneDisplay(lead.phone) === "—"
        ? "+998"
        : formatPhoneDisplay(lead.phone)
    );
    setCourseId(lead.course_id || "");
    setStatus(lead.status || "new");
    setSource(lead.source || "instagram");
    setNotes(lead.notes || "");
    setFirstContactAt(
      lead.first_contact_at
        ? new Date(lead.first_contact_at).toISOString().slice(0, 16)
        : lead.created_at
          ? new Date(lead.created_at).toISOString().slice(0, 16)
          : ""
    );
    setLastContactAt(
      lead.last_contact_at
        ? new Date(lead.last_contact_at).toISOString().slice(0, 16)
        : ""
    );
    setModalMode("edit");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setActionLoading(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        phone: getCleanPhone(phone),
        course_id: courseId || null,
        status,
        source,
        notes: notes.trim() || null,
        first_contact_at: firstContactAt
          ? new Date(firstContactAt).toISOString()
          : new Date().toISOString(),
        last_contact_at: lastContactAt
          ? new Date(lastContactAt).toISOString()
          : new Date().toISOString(),
        // branch_id yo‘q — leadlar umumiy
      };

      if (modalMode === "create") {
        const { error } = await supabase.from("leads").insert(payload);
        if (error) throw error;
      } else if (modalMode === "edit" && selectedLead) {
        const { error } = await supabase
          .from("leads")
          .update(payload)
          .eq("id", selectedLead.id);
        if (error) throw error;
      }

      setModalMode(null);
      fetchData();
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setActionLoading(false);
    }
  };

  const quickStatusChange = async (leadId, newStatus) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          status: newStatus,
          last_contact_at: new Date().toISOString(),
        })
        .eq("id", leadId);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Statusni o'zgartirishda xatolik");
    }
  };

  const confirmDelete = async () => {
    if (!selectedLead) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", selectedLead.id);
      if (error) throw error;
      setModalMode(null);
      setSelectedLead(null);
      fetchData();
    } catch (err) {
      alert(err.message || "O'chirishda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

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

  // ========== Modal ==========
  const renderModal = () => {
    if (!modalMode) return null;

    return createPortal(
      <div className="ld-modal-overlay" onClick={() => setModalMode(null)}>
        {modalMode === "delete_confirm" ? (
          <div
            className="ld-modal-content ld-confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ld-confirm-icon">
              <FiAlertTriangle />
            </div>
            <h3>Lidni o'chirish</h3>
            <p>
              <strong>{selectedLead?.full_name}</strong> ni o'chirishni
              tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className="ld-confirm-btns">
              <button className="ld-btn-no" onClick={() => setModalMode(null)}>
                Bekor qilish
              </button>
              <button
                className="ld-btn-yes"
                onClick={confirmDelete}
                disabled={actionLoading}
              >
                {actionLoading ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="ld-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ld-modal-header">
              <h3>
                {modalMode === "create"
                  ? "Yangi lid qo'shish"
                  : "Lidni tahrirlash"}
              </h3>
              <button className="ld-close" onClick={() => setModalMode(null)}>
                <FiX />
              </button>
            </div>

            <form className="ld-form" onSubmit={handleSubmit}>
              <div className="ld-input-group">
                <label>To'liq ism *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Masalan: Aliyev Vali"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="ld-input-group">
                <label>Telefon raqami</label>
                <input
                  type="tel"
                  placeholder="+998 (90) 555-55-55"
                  value={phone}
                  onChange={handlePhoneChange}
                />
              </div>

              <div className="ld-form-row">
                <div className="ld-input-group">
                  <label>Manba</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="marketing">Marketing</option>
                    <option value="instagram">Instagram</option>
                    <option value="telegram">Telegram</option>
                    <option value="facebook">Facebook</option>
                    <option value="call">Qo'ng'iroq</option>
                    <option value="walkin">Kelib tushgan</option>
                    <option value="other">Boshqa</option>
                  </select>
                </div>

                <div className="ld-input-group">
                  <label>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="new">Yangi</option>
                    <option value="interested">Qiziqmoqda</option>
                    <option value="student">O'quvchimiz</option>
                    <option value="postponed">Keyinga qoldirildi</option>
                    <option value="rejected">Rad etildi</option>
                  </select>
                </div>
              </div>

              <div className="ld-input-group">
                <label>Qiziqayotgan kurs</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                >
                  <option value="">Kursni tanlang</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ld-form-row">
                <div className="ld-input-group">
                  <label>Birinchi murojaat</label>
                  <input
                    type="datetime-local"
                    value={firstContactAt}
                    onChange={(e) => setFirstContactAt(e.target.value)}
                  />
                </div>

                <div className="ld-input-group">
                  <label>Oxirgi aloqa</label>
                  <input
                    type="datetime-local"
                    value={lastContactAt}
                    onChange={(e) => setLastContactAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="ld-input-group">
                <label>Izoh (Notes)</label>
                <textarea
                  rows={3}
                  placeholder="Masalan: Shanba kuni kelishini aytdi. Rus tili kursi ochilganda chaqirish kerak..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="ld-submit-btn"
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Saqlanmoqda..."
                  : modalMode === "create"
                    ? "Lid qo'shish"
                    : "Saqlash"}
              </button>
            </form>
          </div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div className="ld-module-root">
      {/* Header */}
      <div className="ld-header">
        <div>
          <h1 className="ld-title">
            {activeBranch?.name ? `${activeBranch.name} • Leads` : "Leads"}
          </h1>
          <p className="ld-desc">
            Call Center — barcha filiallar uchun umumiy leadlar
          </p>
        </div>
        <button className="ld-create-btn" onClick={openCreate}>
          <FiPlus /> Yangi lid
        </button>
      </div>

      {/* Stats */}
      <div className="ld-stats-row">
        <div className="ld-stat-card">
          <div className="ld-stat-icon" style={{ background: "#376fff" }}>
            <FiTarget />
          </div>
          <div>
            <span className="ld-stat-label">Bugungi lidlar</span>
            <strong className="ld-stat-value">{todayCount}</strong>
          </div>
        </div>
        <div className="ld-stat-card">
          <div className="ld-stat-icon" style={{ background: "#10b981" }}>
            <FiUsers />
          </div>
          <div>
            <span className="ld-stat-label">Jami lidlar</span>
            <strong className="ld-stat-value">{leads.length}</strong>
          </div>
        </div>
        <div className="ld-stat-card">
          <div className="ld-stat-icon" style={{ background: "#f59e0b" }}>
            <FiBookOpen />
          </div>
          <div>
            <span className="ld-stat-label">Kurslar</span>
            <strong className="ld-stat-value">{courses.length}</strong>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="ld-filters">
        <div className="ld-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Ism, telefon yoki izoh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ld-filter-item">
          <FiFilter />
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="today">Bugun</option>
            <option value="all">Barcha vaqt</option>
            <option value="custom">Boshqa sana</option>
          </select>
        </div>

        {filterDate === "custom" && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="ld-date-input"
          />
        )}

        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
        >
          <option value="all">Barcha manbalar</option>
          <option value="marketing">Marketing</option>
          <option value="instagram">Instagram</option>
          <option value="telegram">Telegram</option>
          <option value="facebook">Facebook</option>
          <option value="call">Qo'ng'iroq</option>
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
              {c.name} ({courseStats[c.id] || 0})
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
          <option value="student">O'quvchimiz</option>
          <option value="postponed">Keyinga qoldirildi</option>
          <option value="rejected">Rad etildi</option>
        </select>
      </div>

      {error && (
        <div className="ld-error">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={fetchData}>Qayta urinish</button>
        </div>
      )}

      {loading ? (
        <div className="ld-loading">Lidlar yuklanmoqda...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="ld-empty">
          <FiTarget size={48} />
          <h3>Lidlar topilmadi</h3>
          <p>
            {filterDate === "today"
              ? "Bugun hali lid yo'q."
              : "Tanlangan filterlarga mos lid yo'q."}
          </p>
        </div>
      ) : (
        <div className="ld-table-wrapper">
          <table className="ld-table">
            <thead>
              <tr>
                <th>Ism</th>
                <th>Telefon</th>
                <th>Manba</th>
                <th>Kurs</th>
                <th>Status</th>
                <th>Birinchi murojaat</th>
                <th>Oxirgi aloqa</th>
                <th style={{ textAlign: "center" }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong>{lead.full_name}</strong>
                    {lead.notes && (
                      <div className="ld-notes-preview" title={lead.notes}>
                        <FiMessageSquare size={12} />{" "}
                        {lead.notes.slice(0, 45)}
                        {lead.notes.length > 45 ? "..." : ""}
                      </div>
                    )}
                  </td>
                  <td>
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="ld-phone">
                        <FiPhone /> {formatPhoneDisplay(lead.phone)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className="ld-source-badge">
                      <FiGlobe size={12} />{" "}
                      {sourceLabel[lead.source] || lead.source || "—"}
                    </span>
                  </td>
                  <td>
                    {lead.courses?.name ? (
                      <span className="ld-course-badge">
                        {lead.courses.name}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <select
                      className="ld-status-select"
                      value={lead.status}
                      onChange={(e) =>
                        quickStatusChange(lead.id, e.target.value)
                      }
                      style={{
                        background:
                          (statusColor[lead.status] || "#64748b") + "18",
                        color: statusColor[lead.status] || "#64748b",
                        borderColor:
                          (statusColor[lead.status] || "#64748b") + "40",
                      }}
                    >
                      <option value="new">Yangi</option>
                      <option value="interested">Qiziqmoqda</option>
                      <option value="student">O'quvchimiz</option>
                      <option value="postponed">Keyinga qoldirildi</option>
                      <option value="rejected">Rad etildi</option>
                    </select>
                  </td>
                  <td>
                    <span className="ld-date">
                      <FiCalendar />{" "}
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
                    <span className="ld-last-contact">
                      <FiClock />{" "}
                      {getRelativeTime(
                        lead.last_contact_at || lead.created_at
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="ld-actions">
                      <button
                        className="ld-action-btn"
                        onClick={() => openEdit(lead)}
                        title="Tahrirlash"
                      >
                        <FiEdit3 />
                      </button>
                      <button
                        className="ld-action-btn ld-del"
                        onClick={() => {
                          setSelectedLead(lead);
                          setModalMode("delete_confirm");
                        }}
                        title="O'chirish"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {renderModal()}
    </div>
  );
}