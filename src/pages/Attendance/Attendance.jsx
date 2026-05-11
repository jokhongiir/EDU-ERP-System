import { useEffect, useState, useCallback, useMemo } from "react";
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
  FiFilter,
  FiInfo,
} from "react-icons/fi";
import "./Attendance.css";

const MAX_LESSONS = 12;

export default function Attendance({ activeBranch }) {
  const branchId = activeBranch?.id;

  // ================= STATE =================
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

  const [modal, setModal] = useState({ open: false, message: "", type: "success" });

  // ================= HELPERS =================
  const updateState = (payload) => setState((prev) => ({ ...prev, ...payload }));

  const cycleKey = useMemo(
    () => `${currentYear}-${currentMonth + 1}`,
    [currentYear, currentMonth]
  );

  const showModal = (message, type = "success") => {
    setModal({ open: true, message, type });
    setTimeout(() => setModal({ open: false, message: "", type: "success" }), 2500);
  };

  // ================= DATA LOADING =================
  const fetchGroups = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase
      .from("groups")
      .select("*")
      .eq("branch_id", branchId);
    updateState({ groups: data || [] });
  }, [branchId]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const fetchFullData = useCallback(async (groupId, month, year) => {
    updateState({ isLoading: true });
    const key = `${year}-${month + 1}`;

    const [studentsRes, attendanceRes] = await Promise.all([
      supabase.from("students").select("*").eq("group_id", groupId).eq("paid", true),
      supabase.from("attendance").select("*").eq("group_id", groupId).like("lesson_key", `${key}%`)
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
      isLoading: false,
    });
  }, []);

  // ================= ACTIONS =================
  const handleSelectGroup = (group) => {
    updateState({ selectedGroup: group });
    fetchFullData(group.id, currentMonth, currentYear);
  };

  const changeMonth = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }

    updateState({ currentMonth: newMonth, currentYear: newYear });
    if (selectedGroup) fetchFullData(selectedGroup.id, newMonth, newYear);
  };

  const toggleAttendance = (studentId, lessonKey) => {
    const studentData = attendanceMap[studentId] || {};
    updateState({
      attendanceMap: {
        ...attendanceMap,
        [studentId]: { ...studentData, [lessonKey]: !studentData[lessonKey] },
      },
    });
  };

  const saveAttendance = async () => {
    updateState({ isSaving: true });
    const rows = [];

    Object.entries(attendanceMap).forEach(([sId, lessons]) => {
      Object.entries(lessons).forEach(([key, val]) => {
        if (val !== originalAttendanceMap[sId]?.[key]) {
          rows.push({ student_id: sId, group_id: selectedGroup.id, lesson_key: key, present: val });
        }
      });
    });

    if (!rows.length) {
      showModal("No changes detected", "info");
      updateState({ isSaving: false });
      return;
    }

    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "student_id,lesson_key" });

    if (error) {
      showModal("Error saving data", "error");
    } else {
      updateState({ originalAttendanceMap: JSON.parse(JSON.stringify(attendanceMap)) });
      showModal("Attendance saved successfully", "success");
    }
    updateState({ isSaving: false });
  };

  // ================= COMPUTATIONS =================
  const lessons = useMemo(() => {
    if (!selectedGroup) return [];
    const type = selectedGroup.lesson_days || "odd";
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      if ((type === "odd" && i % 2 !== 0) || (type === "even" && i % 2 === 0)) days.push(i);
    }
    return days.slice(0, MAX_LESSONS).map((day, i) => ({
      key: `${cycleKey}-L${i + 1}`,
      index: i + 1,
      day,
    }));
  }, [selectedGroup, cycleKey, currentMonth, currentYear]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const getStats = (studentId) => {
    const data = attendanceMap[studentId] || {};
    const present = Object.values(data).filter(Boolean).length;
    return { present, percent: Math.round((present / MAX_LESSONS) * 100) };
  };

  // ================= RENDER =================
  return (
    <div className="attendance-pro-container">
      {/* 🟢 TOP ACTION BAR */}
      <header className="attendance-header">
        <div className="header-title">
          <h1>Attendance System</h1>
          <p><FiHome /> {activeBranch?.name} / <FiLayers /> {selectedGroup?.name || "Select a group"}</p>
        </div>

        <div className="header-actions">
          <div className="search-box">
            <FiSearch />
            <input 
              type="text" 
              placeholder="Search student..." 
              value={searchQuery}
              onChange={(e) => updateState({ searchQuery: e.target.value })}
            />
          </div>
          <button className={`save-btn ${isSaving ? "loading" : ""}`} onClick={saveAttendance} disabled={isSaving || !selectedGroup}>
            {isSaving ? <FiLoader className="spin" /> : <FiDatabase />}
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </header>

      {/* 🟢 STATS & INFO CARDS */}
      <section className="stats-row">
        <div className="stat-card-mini">
          <div className="icon blue"><FiUsers /></div>
          <div className="data">
            <span>Students</span>
            <strong>{students.length} Total</strong>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="icon orange"><FiClock /></div>
          <div className="data">
            <span>Lesson Cycle</span>
            <strong>{MAX_LESSONS} Lessons</strong>
          </div>
        </div>
        <div className={`stat-card-mini schedule ${selectedGroup?.lesson_days}`}>
           <div className="icon">
             {selectedGroup?.lesson_days === "odd" ? <FiMoon /> : <FiSun />}
           </div>
           <div className="data">
             <span>Schedule</span>
             <strong>{selectedGroup ? (selectedGroup.lesson_days === "odd" ? "Odd Days" : "Even Days") : "N/A"}</strong>
           </div>
        </div>
      </section>

      {/* 🟢 GROUP SELECTOR (Scrollable) */}
      <nav className="group-navigation">
        {groups.map((group) => (
          <button
            key={group.id}
            className={`group-pill ${selectedGroup?.id === group.id ? "active" : ""}`}
            onClick={() => handleSelectGroup(group)}
          >
            <FiLayers />
            <span>{group.name}</span>
          </button>
        ))}
      </nav>

      {/* 🟢 MAIN ATTENDANCE INTERFACE */}
      <main className="attendance-board">
        {selectedGroup && (
          <div className="board-toolbar">
            <div className="month-picker">
              <button onClick={() => changeMonth(-1)}><FiChevronLeft /></button>
              <h3>
                <FiCalendar /> 
                {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(currentYear, currentMonth))}
              </h3>
              <button onClick={() => changeMonth(1)}><FiChevronRight /></button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <FiLoader className="spin-lg" />
            <p>Fetching data...</p>
          </div>
        ) : selectedGroup ? (
          <div className="table-responsive">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th className="sticky-col">Student Name</th>
                  {lessons.map((l) => (
                    <th key={l.key} className="lesson-head">
                      <span className="l-idx">L{l.index}</span>
                      <span className="l-date">Day {l.day}</span>
                    </th>
                  ))}
                  <th className="stats-head"><FiTrendingUp /></th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => {
                    const stats = getStats(s.id);
                    return (
                      <tr key={s.id}>
                        <td className="sticky-col">
                          <div className="student-info">
                            <div className="avatar">{s.first_name[0]}</div>
                            <span>{s.first_name} {s.last_name}</span>
                          </div>
                        </td>
                        {lessons.map((l) => (
                          <td key={l.key} className="check-cell">
                            <label className="custom-check">
                              <input
                                type="checkbox"
                                checked={!!attendanceMap[s.id]?.[l.key]}
                                onChange={() => toggleAttendance(s.id, l.key)}
                              />
                              <span className="checkmark"></span>
                            </label>
                          </td>
                        ))}
                        <td className="stats-cell">
                          <div className={`percent-circle ${stats.percent > 70 ? 'good' : stats.percent > 40 ? 'warning' : 'bad'}`}>
                            {stats.percent}%
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={lessons.length + 2} className="no-results">
                      No students found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FiLayers size={48} />
            <h2>No Group Selected</h2>
            <p>Please select a group from the list above to manage attendance.</p>
          </div>
        )}
      </main>

      {/* 🟢 TOAST MODAL */}
      {modal.open && (
        <div className={`toast-message ${modal.type} active`}>
          {modal.type === "success" && <FiCheckCircle />}
          {modal.type === "error" && <FiXCircle />}
          {modal.type === "info" && <FiInfo />}
          <span>{modal.message}</span>
        </div>
      )}
    </div>
  );
}