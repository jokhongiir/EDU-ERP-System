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
  FiInfo,
  FiSearch,
  FiX,
  FiEye,
  FiTrendingUp,
} from "react-icons/fi";
import "./Attendance.css";

export default function Attendance({ activeBranch }) {
  const branchId = activeBranch?.id;

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
    isModalOpen: false,
    mainSearch: "",
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
    isModalOpen,
    mainSearch,
  } = state;

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const updateState = (payload) =>
    setState((prev) => ({ ...prev, ...payload }));

  const cycleKey = useMemo(
    () => `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
    [currentYear, currentMonth],
  );

  const showToast = useCallback((message, type = "success") => {
    setToast({ open: true, message, type });
    const timer = setTimeout(
      () => setToast({ open: false, message: "", type: "success" }),
      2500,
    );
    return () => clearTimeout(timer);
  }, []);

  const fetchGroups = useCallback(async () => {
    if (!branchId) return;
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("branch_id", branchId);
    
    if (error) {
      showToast("Failed to fetch groups", "error");
      return;
    }
    updateState({ groups: data || [] });
  }, [branchId, showToast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const fetchFullData = useCallback(async (groupId, month, year) => {
    updateState({ isLoading: true });
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;

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
        map[row.student_id][row.lesson_key] = Boolean(row.present);
      });

      updateState({
        students: studentsRes.data || [],
        attendanceMap: map,
        originalAttendanceMap: JSON.parse(JSON.stringify(map)),
        isLoading: false,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      updateState({ isLoading: false });
    }
  }, []);

  const handleOpenGroupModal = (group) => {
    updateState({ selectedGroup: group, isModalOpen: true, searchQuery: "" });
    fetchFullData(group.id, currentMonth, currentYear);
  };

  const handleCloseModal = () => {
    updateState({ isModalOpen: false, selectedGroup: null });
  };

  const changeMonth = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    updateState({ currentMonth: newMonth, currentYear: newYear });
    if (selectedGroup) fetchFullData(selectedGroup.id, newMonth, newYear);
  };

  const toggleAttendance = (studentId, lessonKey) => {
    const studentData = attendanceMap[studentId] || {};
    const nextVal = !studentData[lessonKey];
    
    updateState({
      attendanceMap: {
        ...attendanceMap,
        [studentId]: { ...studentData, [lessonKey]: nextVal },
      },
    });
  };

  const saveAttendance = async () => {
    if (!selectedGroup) return;
    updateState({ isSaving: true });
    const rows = [];

    Object.entries(attendanceMap).forEach(([sId, lessonsMap]) => {
      Object.entries(lessonsMap).forEach(([key, val]) => {
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
      showToast("No changes detected", "info");
      updateState({ isSaving: false });
      return;
    }

    const { error } = await supabase
      .from("attendance")
      .upsert(rows, { onConflict: "student_id,lesson_key" });

    if (error) {
      console.error("Error saving attendance:", error);
      showToast("Error saving data!", "error");
    } else {
      updateState({
        originalAttendanceMap: JSON.parse(JSON.stringify(attendanceMap)),
      });
      showToast("Attendance saved successfully!", "success");
    }
    updateState({ isSaving: false });
  };

  const lessons = useMemo(() => {
    if (!selectedGroup) return [];

    const type = selectedGroup.schedule_type || "all";
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysList = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(currentYear, currentMonth, i);
      const dayOfWeek = dateObj.getDay();

      const isSunday = dayOfWeek === 0;
      const isOddDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
      const isEvenDay = dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6;

      if (type === "all") {
        daysList.push({ dayNum: i, dateObj, isSunday });
      } else if (type === "odd" && isOddDay) {
        daysList.push({ dayNum: i, dateObj, isSunday: false });
      } else if (type === "even" && isEvenDay) {
        daysList.push({ dayNum: i, dateObj, isSunday: false });
      }
    }

    const todayDate = new Date();
    const isCurrentMonthYear =
      todayDate.getMonth() === currentMonth &&
      todayDate.getFullYear() === currentYear;
    const currentDayNum = todayDate.getDate();

    return daysList.map((item, i) => {
      const { dayNum, dateObj, isSunday } = item;
      const isToday = isCurrentMonthYear && dayNum === currentDayNum;

      const formattedIsoDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

      const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
      }).format(dateObj);

      return {
        key: `${cycleKey}-L${i + 1}`,
        index: i + 1,
        day: dayNum,
        date: formattedIsoDate,
        formattedDate,
        isSunday,
        isToday,
      };
    });
  }, [selectedGroup, cycleKey, currentMonth, currentYear]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) =>
      g.name.toLowerCase().includes(mainSearch.toLowerCase()),
    );
  }, [groups, mainSearch]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) =>
      `${s.first_name} ${s.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [students, searchQuery]);

  const getStats = (studentId) => {
    const data = attendanceMap[studentId] || {};
    const totalLessons = lessons.length;
    const present = Object.values(data).filter(Boolean).length;
    const percent = totalLessons > 0 ? Math.round((present / totalLessons) * 100) : 0;
    return { present, percent, totalLessons };
  };

  return (
    <div className="attendance-pro-container">
      <header className="attendance-header">
        <div className="header-title">
          <h1>Attendance System</h1>
          <p>
            <FiHome /> {activeBranch?.name || "Branch"} / Select a group to manage attendance
          </p>
        </div>

        <div className="header-actions">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search groups..."
              value={mainSearch}
              onChange={(e) => updateState({ mainSearch: e.target.value })}
            />
          </div>
        </div>
      </header>

      <main className="attendance-board">
        <div className="groups-grid-section">
          <h2>Available Groups</h2>
          <div className="groups-grid">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className="group-card-pro"
                  onClick={() => handleOpenGroupModal(group)}
                >
                  <div className="group-card-header">
                    <FiLayers className="group-icon" />
                    <span className={`schedule-badge ${group.schedule_type || ""}`}>
                      {group.schedule_type === "odd"
                        ? "Odd Days (Mon-Wed-Fri)"
                        : group.schedule_type === "even"
                        ? "Even Days (Tue-Thu-Sat)"
                        : "All Days"}
                    </span>
                  </div>
                  <h3>{group.name}</h3>
                  <div className="group-card-footer">
                    <span><FiClock /> Click to view attendance</span>
                    <FiEye className="view-icon" />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <FiLayers size={48} />
                <h2>No Groups Found</h2>
                <p>No groups match your search criteria.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-pro">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <h2>{selectedGroup?.name} - Attendance</h2>
                <p>
                  Schedule: <strong>{selectedGroup?.schedule_type === "odd" ? "Odd Days (Mon-Wed-Fri)" : selectedGroup?.schedule_type === "even" ? "Even Days (Tue-Thu-Sat)" : "All Days"}</strong> | Total Lessons: <strong>{lessons.length}</strong>
                </p>
              </div>
              <button className="close-modal-btn" onClick={handleCloseModal}>
                <FiX size={22} />
              </button>
            </div>

            <div className="modal-toolbar">
              <div className="month-picker">
                <button onClick={() => changeMonth(-1)} title="Previous Month">
                  <FiChevronLeft />
                </button>
                <h3>
                  <FiCalendar />
                  {new Intl.DateTimeFormat("en-US", {
                    month: "long",
                    year: "numeric",
                  }).format(new Date(currentYear, currentMonth))}
                </h3>
                <button onClick={() => changeMonth(1)} title="Next Month">
                  <FiChevronRight />
                </button>
              </div>

              <div className="modal-right-actions">
                <div className="search-box">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={searchQuery}
                    onChange={(e) => updateState({ searchQuery: e.target.value })}
                  />
                </div>
                <button
                  className={`save-btn ${isSaving ? "loading" : ""}`}
                  onClick={saveAttendance}
                  disabled={isSaving}
                >
                  {isSaving ? <FiLoader className="spin" /> : <FiDatabase />}
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>

            <div className="modal-body-table">
              {isLoading ? (
                <div className="loading-state">
                  <FiLoader className="spin-lg" />
                  <p>Fetching students and attendance...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th className="sticky-col">Student Full Name</th>
                        {lessons.map((l) => {
                          let headClass = "lesson-head";
                          if (l.isSunday) headClass += " sunday-head";
                          if (l.isToday) headClass += " today-head";

                          return (
                            <th key={l.key} className={headClass} title={`Date: ${l.date}`}>
                              <span className="l-idx">L{l.index}</span>
                              <span className="l-date">{l.formattedDate}</span>
                              {l.isSunday && <span className="badge-sunday">Sun</span>}
                              {l.isToday && <span className="badge-today">Today</span>}
                            </th>
                          );
                        })}
                        <th className="stats-head">
                          <FiTrendingUp />
                        </th>
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
                                  <div className="avatar">{s.first_name?.[0] || "?"}</div>
                                  <span>
                                    {s.first_name} {s.last_name}
                                  </span>
                                </div>
                              </td>
                              {lessons.map((l) => {
                                let cellClass = "check-cell";
                                if (l.isSunday) cellClass += " sunday-cell";
                                if (l.isToday) cellClass += " today-cell";

                                const isChecked = Boolean(attendanceMap[s.id]?.[l.key]);

                                return (
                                  <td key={l.key} className={cellClass}>
                                    <label className="custom-check">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleAttendance(s.id, l.key)}
                                      />
                                      <span className="checkmark"></span>
                                    </label>
                                  </td>
                                );
                              })}
                              <td className="stats-cell">
                                <div
                                  className={`percent-circle ${
                                    stats.percent > 70
                                      ? "good"
                                      : stats.percent > 40
                                      ? "warning"
                                      : "bad"
                                  }`}
                                >
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
              )}
            </div>
          </div>
        </div>
      )}

      {toast.open && (
        <div className={`toast-message ${toast.type} active`}>
          {toast.type === "success" && <FiCheckCircle />}
          {toast.type === "error" && <FiXCircle />}
          {toast.type === "info" && <FiInfo />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}