import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiCalendar,
  FiDatabase,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiLayers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiMoon,
  FiSun,
  FiUsers,
  FiTrendingUp,
  FiSearch,
  FiInfo,
} from "react-icons/fi";
import "./Attendance.css";

const MAX_LESSONS = 12;

// ==========================================
// 🧱 ATOMIC MEMOIZED SUB-COMPONENTS
// ==========================================

// Statik mini kartochkalar (Render yukini kamaytirish uchun)
const StatCard = React.memo(({ icon, iconClass, label, value }) => (
  <div className="erp-stat-card-mini">
    <div className={`card-icon-wrapper ${iconClass}`}>{icon}</div>
    <div className="card-meta-stack">
      <span className="card-label">{label}</span>
      <strong className="card-value">{value}</strong>
    </div>
  </div>
));
StatCard.displayName = "StatCard";

// Davomat katakchasi (Checkbox re-render optimizatsiyasi)
const AttendanceCell = React.memo(({ isChecked, onToggle }) => (
  <td className="erp-check-cell">
    <label className="erp-checkbox-wrapper">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onToggle}
        className="erp-native-checkbox"
      />
      <span className="erp-custom-checkmark"></span>
    </label>
  </td>
));
AttendanceCell.displayName = "AttendanceCell";

// Jadval qatori (Har safar bir katak o'zgarganda butun jadval qayta o'qilmasligi uchun)
const StudentRow = React.memo(({ student, lessons, attendanceMap, onToggle, stats }) => {
  const avatarLetter = useMemo(() => student.first_name?.[0] || "S", [student.first_name]);
  
  const statusClass = useMemo(() => {
    if (stats.percent > 70) return "good";
    if (stats.percent > 40) return "warning";
    return "bad";
  }, [stats.percent]);

  return (
    <tr className="erp-table-row">
      <td className="erp-sticky-col">
        <div className="erp-student-profile-cell">
          <div className="erp-mini-avatar">{avatarLetter}</div>
          <span className="erp-student-name">
            {student.first_name} {student.last_name}
          </span>
        </div>
      </td>
      {lessons.map((lesson) => {
        const isPresent = !!attendanceMap[lesson.key];
        return (
          <AttendanceCell
            key={lesson.key}
            isChecked={isPresent}
            onToggle={() => onToggle(student.id, lesson.key)}
          />
        );
      })}
      <td className="erp-stats-cell">
        <div className={`erp-percent-badge ${statusClass}`}>
          {stats.percent}%
        </div>
      </td>
    </tr>
  );
});
StudentRow.displayName = "StudentRow";

// ==========================================
// 🚀 MAIN ATTENDANCE ENTERPRISE COMPONENT
// ==========================================
export default function Attendance({ activeBranch }) {
  const branchId = activeBranch?.id;

  // Global state holati (Unified Core Matrix)
  const [state, setState] = useState({
    groups: [],
    students: [],
    selectedGroup: null,
    attendanceMap: {},
    originalAttendanceMap: {},
    isLoading: false,
    isSaving: false,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    searchQuery: "",
  });

  const {
    groups,
    students,
    selectedGroup,
    attendanceMap,
    originalAttendanceMap,
    isLoading,
    isSaving,
    currentMonth,
    currentYear,
    searchQuery,
  } = state;

  // Xabarnomalar tizimi (Toast System)
  const [modal, setModal] = useState({ open: false, message: "", type: "success" });

  const updateState = useCallback((payload) => {
    setState((prev) => ({ ...prev, ...payload }));
  }, []);

  const cycleKey = useMemo(() => `${currentYear}-${currentMonth + 1}`, [currentYear, currentMonth]);

  const showModal = useCallback((message, type = "success") => {
    setModal({ open: true, message, type });
    setTimeout(() => setModal({ open: false, message: "", type: "success" }), 2500);
  }, []);

  // Filial guruhlarini yuklash
  const fetchGroups = useCallback(async () => {
    if (!branchId) return;
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("branch_id", branchId);
      if (error) throw error;
      updateState({ groups: data || [] });
    } catch (err) {
      console.error("Guruhlarni yuklashda xatolik:", err);
    }
  }, [branchId, updateState]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Talabalar va tanlangan oydagi davomat xaritasini yuklash
  const fetchFullData = useCallback(async (groupId, month, year) => {
    updateState({ isLoading: true });
    const key = `${year}-${month + 1}`;
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        supabase.from("students").select("*").eq("group_id", groupId),
        supabase
          .from("attendance")
          .select("*")
          .eq("group_id", groupId)
          .like("lesson_key", `${key}%`),
      ]);

      const map = {};
      attendanceRes.data?.forEach((row) => {
        if (!map[row.student_id]) map[row.student_id] = {};
        map[row.student_id][row.lesson_key] = row.present;
      });

      updateState({
        students: studentsRes.data || [],
        attendanceMap: map,
        originalAttendanceMap: JSON.parse(JSON.stringify(map)),
      });
    } catch (err) {
      console.error("Ma'lumotlar sinxronizatsiyasida xatolik:", err);
    } finally {
      updateState({ isLoading: false });
    }
  }, [updateState]);

  const handleSelectGroup = useCallback((group) => {
    updateState({ selectedGroup: group });
    fetchFullData(group.id, currentMonth, currentYear);
  }, [currentMonth, currentYear, fetchFullData, updateState]);

  const changeMonth = useCallback((direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    updateState({ currentMonth: newMonth, currentYear: newYear });
    if (selectedGroup) fetchFullData(selectedGroup.id, newMonth, newYear);
  }, [currentMonth, currentYear, selectedGroup, fetchFullData, updateState]);

  // Katakcha bosilganda holatni o'zgartirish (Toggle)
  const handleToggleAttendance = useCallback((studentId, lessonKey) => {
    setState((prev) => {
      const currentStudentMap = prev.attendanceMap[studentId] || {};
      return {
        ...prev,
        attendanceMap: {
          ...prev.attendanceMap,
          [studentId]: {
            ...currentStudentMap,
            [lessonKey]: !currentStudentMap[lessonKey],
          },
        },
      };
    });
  }, []);

  // O'zgarishlarni bazaga yozish (Upsert Operational Core)
  const saveAttendance = async () => {
    updateState({ isSaving: true });
    const rows = [];
    
    Object.entries(attendanceMap).forEach(([sId, lessons]) => {
      Object.entries(lessons).forEach(([key, val]) => {
        if (val !== originalAttendanceMap[sId]?.[key]) {
          rows.push({
            student_id: sId,
            group_id: selectedGroup.id,
            lesson_key: key,
            present: val,
          });
        }
      });
    });

    if (!rows.length) {
      showModal("No structural changes detected.", "info");
      updateState({ isSaving: false });
      return;
    }

    try {
      const { error } = await supabase
        .from("attendance")
        .upsert(rows, { onConflict: "student_id,lesson_key" });

      if (error) throw error;

      updateState({
        originalAttendanceMap: JSON.parse(JSON.stringify(attendanceMap)),
      });
      showModal("Attendance matrix saved successfully.", "success");
    } catch (err) {
      console.error(err);
      showModal("Database rejected current payload data.", "error");
    } finally {
      updateState({ isSaving: false });
    }
  };

  // Tanlangan oy va dars kunlari formulasini hisoblash
  const lessons = useMemo(() => {
    if (!selectedGroup) return [];
    const type = selectedGroup.schedule_type || "all";
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      if (
        type === "all" ||
        (type === "odd" && i % 2 !== 0) ||
        (type === "even" && i % 2 === 0)
      ) {
        days.push(i);
      }
    }
    
    return days.slice(0, MAX_LESSONS).map((day, i) => ({
      key: `${cycleKey}-L${i + 1}`,
      index: i + 1,
      day,
    }));
  }, [selectedGroup, cycleKey, currentMonth, currentYear]);

  // Qidiruv filtri
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter((s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Talabaning foiz ko'rsatkichlari (Memoized statistic solver)
  const studentStatsMap = useMemo(() => {
    const stats = {};
    students.forEach((s) => {
      const data = attendanceMap[s.id] || {};
      const present = Object.values(data).filter(Boolean).length;
      stats[s.id] = {
        present,
        percent: Math.round((present / MAX_LESSONS) * 100),
      };
    });
    return stats;
  }, [students, attendanceMap]);

  const formattedCalendarDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date(currentYear, currentMonth));
  }, [currentYear, currentMonth]);

  return (
    <div className="erp-attendance-page">
      
      {/* 🚀 HUB CONTROL HEADER */}
      <header className="erp-dashboard-header">
        <div className="header-identity">
          <h1>Attendance Management</h1>
          <p className="breadcrumb-path">
            <FiHome /> <span className="path-node">{activeBranch?.name || "Corporate"}</span> / <FiLayers />{" "}
            <span className="path-node active">{selectedGroup?.name || "Select Target Group"}</span>
          </p>
        </div>
        
        <div className="header-controls">
          <div className="erp-search-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search student profile..."
              value={searchQuery}
              onChange={(e) => updateState({ searchQuery: e.target.value })}
              className="erp-search-input"
            />
          </div>
          
          <button
            className={`erp-btn-save ${isSaving ? "is-loading" : ""}`}
            onClick={saveAttendance}
            disabled={isSaving || !selectedGroup}
          >
            {isSaving ? <FiLoader className="spin-animation" /> : <FiDatabase />}
            <span>{isSaving ? "Saving Matrix..." : "Commit Matrix Changes"}</span>
          </button>
        </div>
      </header>

      {/* 📊 CORE OPERATIONAL DATA TILES */}
      <section className="erp-summary-strip">
        <StatCard
          icon={<FiUsers />}
          iconClass="blue"
          label="Total Active Cohorts"
          value={`${students.length} Enrolled`}
        />
        <StatCard
          icon={<FiClock />}
          iconClass="orange"
          label="Max Tracking Span"
          value={`${MAX_LESSONS} Lessons`}
        />
        <StatCard
          icon={selectedGroup?.lesson_days === "odd" ? <FiMoon /> : <FiSun />}
          iconClass={`schedule ${selectedGroup?.schedule_type || "default"}`}
          label="Syllabus Schedule"
          value={
            selectedGroup
              ? selectedGroup.lesson_days === "odd"
                ? "Odd Day Cycle"
                : "Even Day Cycle"
              : "Not Configured"
          }
        />
      </section>

      {/* 💊 COHORT SELECTOR PILLS */}
      <nav className="erp-navigation-bar">
        {groups.map((group) => {
          const isGroupActive = selectedGroup?.id === group.id;
          return (
            <button
              key={group.id}
              className={`erp-pill-nav-item ${isGroupActive ? "is-active" : ""}`}
              onClick={() => handleSelectGroup(group)}
            >
              <FiLayers />
              <span>{group.name}</span>
            </button>
          );
        })}
      </nav>

      {/* 📋 MAIN INTERACTIVE ATTENDANCE BOARD */}
      <main className="erp-board-wrapper">
        {selectedGroup && (
          <div className="erp-board-toolbar">
            <div className="erp-month-navigation">
              <button className="nav-arrow" onClick={() => changeMonth(-1)}>
                <FiChevronLeft />
              </button>
              <h3 className="current-month-display">
                <FiCalendar />
                <span>{formattedCalendarDate}</span>
              </h3>
              <button className="nav-arrow" onClick={() => changeMonth(1)}>
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="erp-loading-placeholder">
            <FiLoader className="spin-animation-lg" />
            <p>Sourcing system matrix from cloud engine...</p>
          </div>
        ) : selectedGroup ? (
          <div className="erp-table-scroll-container">
            <table className="erp-attendance-table">
              <thead>
                <tr>
                  <th className="erp-sticky-col header-cell">Student Identity</th>
                  {lessons.map((l) => (
                    <th key={l.key} className="erp-lesson-head-cell">
                      <span className="index-label">L{l.index}</span>
                      <span className="date-label">Day {l.day}</span>
                    </th>
                  ))}
                  <th className="erp-stats-head-cell">
                    <FiTrendingUp />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      lessons={lessons}
                      attendanceMap={attendanceMap[student.id] || {}}
                      onToggle={handleToggleAttendance}
                      stats={studentStatsMap[student.id] || { present: 0, percent: 0 }}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={lessons.length + 2} className="erp-table-empty-row">
                      No matching student identities found in this tracking matrix.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="erp-empty-state-view">
            <div className="empty-state-icon-box">
              <FiLayers />
            </div>
            <h2>No Cohort Context Selected</h2>
            <p>Please click and mount one of the active educational groups from the navigation strip above to access the ledger matrix.</p>
          </div>
        )}
      </main>

      {/* 🚨 CONTEXT NOTIFICATION TOAST SYSTEM */}
      {modal.open && (
        <div className={`erp-toast-notification ${modal.type} is-active`}>
          <div className="toast-icon-slot">
            {modal.type === "success" && <FiCheckCircle />}
            {modal.type === "error" && <FiXCircle />}
            {modal.type === "info" && <FiInfo />}
          </div>
          <span className="toast-message-text">{modal.message}</span>
        </div>
      )}
    </div>
  );
}