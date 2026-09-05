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

  // Filters
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("today");
  const [customDate, setCustomDate] = useState("");

  const branchId = activeBranch?.id;

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

    // Agar +998 dan kam raqam qolsa → faqat +998
    if (digits.length <= 3) {
      setPhone("+998");
      return;
    }

    // Faqat 9 ta raqam ruxsat (998 dan keyin)
    const rest = digits.slice(3, 12);

    let formatted = "+998";

    if (rest.length > 0) {
      formatted += " (" + rest.slice(0, 2);
    }
    if (rest.length >= 2) {
      formatted += ")";
    }
    if (rest.length > 2) {
      formatted += " " + rest.slice(2, 5);
    }
    if (rest.length > 5) {
      formatted += "-" + rest.slice(5, 7);
    }
    if (rest.length > 7) {
      formatted += "-" + rest.slice(7, 9);
    }

    setPhone(formatted);
  };

  const getCleanPhone = (formatted) => {
    const digits = formatted.replace(/\D/g, "");
    return digits.length >= 12 ? `+${digits}` : null;
  };

  // ========== Fetch ==========
  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, coursesRes] = await Promise.all([
        supabase
          .from("leads")
          .select("*, courses(name)")
          .eq("branch_id", branchId)
          .order("created_at", { ascending: false }),
        supabase.from("courses").select("id, name").eq("branch_id", branchId),
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setLeads(leadsRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

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
          l.phone?.includes(q),
      );
    }

    if (filterCourse !== "all") {
      result = result.filter((l) => l.course_id === filterCourse);
    }
    if (filterStatus !== "all") {
      result = result.filter((l) => l.status === filterStatus);
    }

    const today = new Date().toISOString().slice(0, 10);
    if (filterDate === "today") {
      result = result.filter((l) => l.created_at?.startsWith(today));
    } else if (filterDate === "custom" && customDate) {
      result = result.filter((l) => l.created_at?.startsWith(customDate));
    }

    return result;
  }, [leads, search, filterCourse, filterStatus, filterDate, customDate]);

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
    setFullName("");
    setPhone("+998");
    setCourseId("");
    setStatus("new");
    setSelectedLead(null);
    setModalMode("create");
  };

  const openEdit = (lead) => {
    setSelectedLead(lead);
    setFullName(lead.full_name || "");
    setPhone(
      formatPhoneDisplay(lead.phone) === "—"
        ? "+998"
        : formatPhoneDisplay(lead.phone),
    );
    setCourseId(lead.course_id || "");
    setStatus(lead.status || "new");
    setModalMode("edit");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !branchId) return;

    setActionLoading(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        phone: getCleanPhone(phone),
        course_id: courseId || null,
        status,
        branch_id: branchId,
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
      alert(err.message || "Something went wrong");
    } finally {
      setActionLoading(false);
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
      alert(err.message || "Failed to delete");
    } finally {
      setActionLoading(false);
    }
  };

  const statusLabel = {
    new: "New",
    contacted: "Contacted",
    enrolled: "Enrolled",
    rejected: "Rejected",
  };

  const statusColor = {
    new: "#376fff",
    contacted: "#f59e0b",
    enrolled: "#10b981",
    rejected: "#ef4444",
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
            <h3>Delete Lead</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedLead?.full_name}</strong>? This action cannot be
              undone.
            </p>
            <div className="ld-confirm-btns">
              <button className="ld-btn-no" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button
                className="ld-btn-yes"
                onClick={confirmDelete}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete"}
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
                {modalMode === "create" ? "Add New Lead" : "Edit Lead"}
              </h3>
              <button className="ld-close" onClick={() => setModalMode(null)}>
                <FiX />
              </button>
            </div>

            <form className="ld-form" onSubmit={handleSubmit}>
              <div className="ld-input-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Aliyev Vali"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="ld-input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="+998 (90) 555-55-55"
                  value={phone}
                  onChange={handlePhoneChange}
                />
              </div>

              <div className="ld-input-group">
                <label>Interested Course</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ld-input-group">
                <label>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <button
                type="submit"
                className="ld-submit-btn"
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Saving..."
                  : modalMode === "create"
                    ? "Add Lead"
                    : "Save Changes"}
              </button>
            </form>
          </div>
        )}
      </div>,
      document.body,
    );
  };

  return (
    <div className="ld-module-root">
      {/* Header */}
      <div className="ld-header">
        <div>
          <h1 className="ld-title">
            {activeBranch ? `${activeBranch.name} • Leads` : "Leads"}
          </h1>
          <p className="ld-desc">
            Track potential students interested in your courses
          </p>
        </div>
        <button
          className="ld-create-btn"
          onClick={openCreate}
          disabled={!branchId}
        >
          <FiPlus /> Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="ld-stats-row">
        <div className="ld-stat-card">
          <div className="ld-stat-icon" style={{ background: "#376fff" }}>
            <FiTarget />
          </div>
          <div>
            <span className="ld-stat-label">Today's Leads</span>
            <strong className="ld-stat-value">{todayCount}</strong>
          </div>
        </div>
        <div className="ld-stat-card">
          <div className="ld-stat-icon" style={{ background: "#10b981" }}>
            <FiUsers />
          </div>
          <div>
            <span className="ld-stat-label">Total Leads</span>
            <strong className="ld-stat-value">{leads.length}</strong>
          </div>
        </div>
        <div className="ld-stat-card">
          <div className="ld-stat-icon" style={{ background: "#f59e0b" }}>
            <FiBookOpen />
          </div>
          <div>
            <span className="ld-stat-label">Courses</span>
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
            placeholder="Search by name or phone..."
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
            <option value="today">Today</option>
            <option value="all">All time</option>
            <option value="custom">Custom date</option>
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
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
        >
          <option value="all">All courses</option>
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
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="enrolled">Enrolled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="ld-error">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="ld-loading">Loading leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="ld-empty">
          <FiTarget size={48} />
          <h3>No leads found</h3>
          <p>
            {filterDate === "today"
              ? "No one has expressed interest in a course today yet."
              : "No leads match the selected filters."}
          </p>
        </div>
      ) : (
        <div className="ld-table-wrapper">
          <table className="ld-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Course</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong>{lead.full_name}</strong>
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
                    {lead.courses?.name ? (
                      <span className="ld-course-badge">
                        {lead.courses.name}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span
                      className="ld-status-badge"
                      style={{
                        background: statusColor[lead.status] + "18",
                        color: statusColor[lead.status],
                      }}
                    >
                      {statusLabel[lead.status] || lead.status}
                    </span>
                  </td>
                  <td>
                    <span className="ld-date">
                      <FiCalendar />{" "}
                      {new Date(lead.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </td>
                  <td>
                    <div className="ld-actions">
                      <button
                        className="ld-action-btn"
                        onClick={() => openEdit(lead)}
                        title="Edit"
                      >
                        <FiEdit3 />
                      </button>
                      <button
                        className="ld-action-btn ld-del"
                        onClick={() => {
                          setSelectedLead(lead);
                          setModalMode("delete_confirm");
                        }}
                        title="Delete"
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