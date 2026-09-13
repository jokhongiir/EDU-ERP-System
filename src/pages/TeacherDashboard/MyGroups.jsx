import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import {
  FiLayers,
  FiClock,
  FiUsers,
  FiArrowLeft,
  FiBookOpen,
  FiCalendar,
  FiUser,
  FiSearch,
  FiLoader,
} from "react-icons/fi";
import "./MyGroups.css";

export default function MyGroups() {
  const { teacher } = useOutletContext();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail view
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      if (!teacher?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("groups")
          .select("*, courses(name)")
          .eq("teacher_id", teacher.id)
          .order("name");

        if (error) throw error;
        setGroups(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [teacher]);

  const openGroup = useCallback(async (group) => {
    setSelectedGroup(group);
    setSearch("");
    setDetailLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("group_id", group.id)
        .eq("is_archived", false)
        .order("first_name");

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error(err);
      setStudents([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeGroup = () => {
    setSelectedGroup(null);
    setStudents([]);
    setSearch("");
  };

  const scheduleLabel = (type) => {
    if (type === "odd") return "Toq kunlar (Dush-Chor-Jum)";
    if (type === "even") return "Juft kunlar (Sesh-Pay-Shan)";
    return "Har kuni";
  };

  const scheduleBadgeClass = (type) => {
    if (type === "odd") return "odd";
    if (type === "even") return "even";
    return "all";
  };

  const filteredStudents = students.filter((s) =>
    `${s.first_name || ""} ${s.last_name || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /* ========== LOADING ========== */
  if (loading) {
    return (
      <div className="mg-loading">
        <FiLoader className="mg-spin" />
        <p>Guruhlar yuklanmoqda...</p>
      </div>
    );
  }

  /* ========== GROUP DETAIL VIEW ========== */
  if (selectedGroup) {
    return (
      <div className="mg-page">
        <button className="mg-back-btn" onClick={closeGroup}>
          <FiArrowLeft /> Orqaga
        </button>

        {/* Group info card */}
        <div className="mg-detail-header">
          <div className="mg-detail-icon">
            <FiLayers />
          </div>
          <div className="mg-detail-info">
            <h1>{selectedGroup.name}</h1>
            <div className="mg-detail-meta">
              <span className="mg-meta-item">
                <FiBookOpen /> {selectedGroup.courses?.name || "Kurs noma'lum"}
              </span>
              <span className="mg-meta-item">
                <FiCalendar /> {scheduleLabel(selectedGroup.schedule_type)}
              </span>
              <span className="mg-meta-item">
                <FiUsers /> {students.length} o'quvchi
              </span>
              {selectedGroup.lesson_time && (
                <span className="mg-meta-item">
                  <FiClock /> {selectedGroup.lesson_time}
                </span>
              )}
            </div>
          </div>
          <span
            className={`mg-badge ${scheduleBadgeClass(
              selectedGroup.schedule_type
            )}`}
          >
            {scheduleLabel(selectedGroup.schedule_type)}
          </span>
        </div>

        {/* Students section */}
        <div className="mg-students-section">
          <div className="mg-students-toolbar">
            <h2>
              <FiUsers /> Guruh o'quvchilari
            </h2>
            <div className="mg-search">
              <FiSearch />
              <input
                type="text"
                placeholder="O'quvchini qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {detailLoading ? (
            <div className="mg-loading small">
              <FiLoader className="mg-spin" />
              <p>O'quvchilar yuklanmoqda...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="mg-empty">
              <FiUsers size={40} />
              <h3>O'quvchilar topilmadi</h3>
              <p>
                {search
                  ? "Qidiruv bo'yicha natija yo'q"
                  : "Bu guruhda hozircha o'quvchi yo'q"}
              </p>
            </div>
          ) : (
            <div className="mg-students-table-wrap">
              <table className="mg-students-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>O'quvchi</th>
                    <th>Telefon</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="mg-num">{idx + 1}</td>
                      <td>
                        <div className="mg-student-cell">
                          <div className="mg-avatar">
                            {s.first_name?.[0] || "?"}
                          </div>
                          <div>
                            <span className="mg-student-name">
                              {s.first_name} {s.last_name}
                            </span>
                            {s.parent_name && (
                              <span className="mg-student-sub">
                                Ota-ona: {s.parent_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="mg-phone">
                        {s.phone || s.parent_phone || "—"}
                      </td>
                      <td>
                        <span className="mg-status active">Faol</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ========== GROUPS LIST VIEW ========== */
  return (
    <div className="mg-page">
      <div className="mg-page-header">
        <div>
          <h1 className="mg-title">Mening Guruhlarim</h1>
          <p className="mg-subtitle">
            Sizga biriktirilgan faol o'quv guruhlari
          </p>
        </div>
        <div className="mg-stat-chip">
          <FiLayers /> {groups.length} guruh
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mg-empty">
          <FiLayers size={48} />
          <h3>Guruhlar topilmadi</h3>
          <p>Sizga hozircha guruh biriktirilmagan</p>
        </div>
      ) : (
        <div className="mg-grid">
          {groups.map((g) => (
            <div
              key={g.id}
              className="mg-card"
              onClick={() => openGroup(g)}
            >
              <div className="mg-card-top" />
              <div className="mg-card-body">
                <div className="mg-card-head">
                  <div className="mg-card-icon">
                    <FiLayers />
                  </div>
                  <span
                    className={`mg-badge ${scheduleBadgeClass(g.schedule_type)}`}
                  >
                    {g.schedule_type === "odd"
                      ? "Toq"
                      : g.schedule_type === "even"
                      ? "Juft"
                      : "Har kuni"}
                  </span>
                </div>

                <h3 className="mg-card-title">{g.name}</h3>

                <div className="mg-card-meta">
                  <span>
                    <FiBookOpen /> {g.courses?.name || "Kurs noma'lum"}
                  </span>
                  {g.lesson_time && (
                    <span>
                      <FiClock /> {g.lesson_time}
                    </span>
                  )}
                </div>

                <div className="mg-card-footer">
                  <span className="mg-card-action">
                    <FiUsers /> O'quvchilarni ko'rish
                  </span>
                  <span className="mg-card-arrow">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}