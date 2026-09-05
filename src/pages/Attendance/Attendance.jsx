import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
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
  FiBookOpen,
  FiUser,
} from "react-icons/fi";
import "./Attendance.css";

export default function Attendance({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [originalMap, setOriginalMap] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [mainSearch, setMainSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  const cycleKey = useMemo(
    () => `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
    [currentYear, currentMonth],
  );

  const showToast = useCallback((message, type = "success") => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast({ open: false, message: "", type: "success" }), 2500);
  }, []);

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    try {
      const [g, c, t] = await Promise.all([
        supabase.from("groups").select("*").eq("branch_id", branchId),
        supabase.from("courses").select("*").eq("branch_id", branchId),
        supabase.from("teachers").select("*").eq("branch_id", branchId),
      ]);
      setGroups(g.data || []);
      setCourses(c.data || []);
      setTeachers(t.data || []);
    } catch {
      showToast("Failed to load groups", "error");
    }
  }, [branchId, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const fetchFullData = useCallback(async (groupId, month, year) => {
    setIsLoading(true);
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        supabase
          .from("students")
          .select("*")
          .eq("group_id", groupId)
          .eq("is_archived", false),
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

      setStudents(studentsRes.data || []);
      setAttendanceMap(map);
      setOriginalMap(JSON.parse(JSON.stringify(map)));
    } catch (err) {
      console.error(err);
      showToast("Failed to load attendance", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const openGroup = (group) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
    setSearchQuery("");
    fetchFullData(group.id, currentMonth, currentYear);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
  };

  const changeMonth = (dir) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m > 11) {
      m = 0;
      y++;
    }
    if (m < 0) {
      m = 11;
      y--;
    }
    setCurrentMonth(m);
    setCurrentYear(y);
    if (selectedGroup) fetchFullData(selectedGroup.id, m, y);
  };

  const toggleAttendance = (studentId, lessonKey) => {
    setAttendanceMap((prev) => {
      const studentData = prev[studentId] || {};
      return {
        ...prev,
        [studentId]: { ...studentData, [lessonKey]: !studentData[lessonKey] },
      };
    });
  };

  const saveAttendance = async () => {
    if (!selectedGroup) return;
    setIsSaving(true);

    const rows = [];
    Object.entries(attendanceMap).forEach(([sId, lessonsMap]) => {
      Object.entries(lessonsMap).forEach(([key, val]) => {
        if (val !== originalMap[sId]?.[key]) {
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
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from("attendance")
      .upsert(rows, { onConflict: "student_id,lesson_key" });

    if (error) {
      showToast("Error saving data!", "error");
    } else {
      setOriginalMap(JSON.parse(JSON.stringify(attendanceMap)));
      showToast("Attendance saved successfully!", "success");
    }
    setIsSaving(false);
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
      const isOdd = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
      const isEven = dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6;

      if (type === "all") daysList.push({ dayNum: i, dateObj, isSunday });
      else if (type === "odd" && isOdd)
        daysList.push({ dayNum: i, dateObj, isSunday: false });
      else if (type === "even" && isEven)
        daysList.push({ dayNum: i, dateObj, isSunday: false });
    }

    const today = new Date();
    const isCurrent =
      today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    const todayNum = today.getDate();

    return daysList.map((item, i) => {
      const { dayNum, dateObj, isSunday } = item;
      return {
        key: `${cycleKey}-L${i + 1}`,
        index: i + 1,
        day: dayNum,
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`,
        formattedDate: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          weekday: "short",
        }).format(dateObj),
        isSunday,
        isToday: isCurrent && dayNum === todayNum,
      };
    });
  }, [selectedGroup, cycleKey, currentMonth, currentYear]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchSearch = g.name
        ?.toLowerCase()
        .includes(mainSearch.toLowerCase());
      const matchCourse = selectedCourse
        ? String(g.course_id) === String(selectedCourse)
        : true;
      const matchTeacher = selectedTeacher
        ? String(g.teacher_id) === String(selectedTeacher)
        : true;
      return matchSearch && matchCourse && matchTeacher;
    });
  }, [groups, mainSearch, selectedCourse, selectedTeacher]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) =>
      `${s.first_name || ""} ${s.last_name || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [students, searchQuery]);

  const getStats = (studentId) => {
    const data = attendanceMap[studentId] || {};
    const total = lessons.length;
    const present = Object.values(data).filter(Boolean).length;
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, percent, total };
  };

  const scheduleLabel = (type) => {
    if (type === "odd") return "Odd Days (Mon-Wed-Fri)";
    if (type === "even") return "Even Days (Tue-Thu-Sat)";
    return "All Days";
  };

  return (
    <div className="at-root">
      {/* Header */}
      <div className="at-header">
        <div>
          <h1 className="at-title">
            {activeBranch?.name || "Branch"} • Attendance
          </h1>
          <p className="at-desc">
            <FiHome /> Select a group to manage attendance
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="at-filters">
        <div className="at-search">
          <FiSearch />
          <input
            placeholder="Search groups..."
            value={mainSearch}
            onChange={(e) => setMainSearch(e.target.value)}
          />
        </div>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
        >
          <option value="">All Teachers</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Groups grid */}
      <h2 className="at-section-title">Available Groups</h2>

      {filteredGroups.length === 0 ? (
        <div className="at-empty">
          <FiLayers size={44} />
          <h3>No groups found</h3>
          <p>No groups match your filter criteria</p>
        </div>
      ) : (
        <div className="at-grid">
          {filteredGroups.map((g) => (
            <div
              key={g.id}
              className="at-card"
              onClick={() => openGroup(g)}
            >
              <div className="at-card-top" />
              <div className="at-card-body">
                <div className="at-card-head">
                  <div className="at-card-icon">
                    <FiLayers />
                  </div>
                  <span className={`at-badge ${g.schedule_type || "all"}`}>
                    {scheduleLabel(g.schedule_type)}
                  </span>
                </div>
                <h3>{g.name}</h3>
                <div className="at-card-foot">
                  <span>
                    <FiClock /> Click to view
                  </span>
                  <FiEye className="at-eye" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen &&
        createPortal(
          <div className="at-overlay" onClick={closeModal}>
            <div
              className="at-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="at-modal-header">
                <div>
                  <h2>{selectedGroup?.name} — Attendance</h2>
                  <p>
                    Schedule: <strong>{scheduleLabel(selectedGroup?.schedule_type)}</strong>
                    {" · "}
                    Lessons: <strong>{lessons.length}</strong>
                  </p>
                </div>
                <button className="at-close" onClick={closeModal}>
                  <FiX />
                </button>
              </div>

              {/* Toolbar */}
              <div className="at-toolbar">
                <div className="at-month">
                  <button onClick={() => changeMonth(-1)}>
                    <FiChevronLeft />
                  </button>
                  <h3>
                    <FiCalendar />
                    {new Intl.DateTimeFormat("en-US", {
                      month: "long",
                      year: "numeric",
                    }).format(new Date(currentYear, currentMonth))}
                  </h3>
                  <button onClick={() => changeMonth(1)}>
                    <FiChevronRight />
                  </button>
                </div>

                <div className="at-toolbar-right">
                  <div className="at-search sm">
                    <FiSearch />
                    <input
                      placeholder="Search student..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    className="at-save-btn"
                    onClick={saveAttendance}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <FiLoader className="at-spin" />
                    ) : (
                      <FiDatabase />
                    )}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="at-table-wrap">
                {isLoading ? (
                  <div className="at-loading">
                    <FiLoader className="at-spin-lg" />
                    <p>Loading attendance...</p>
                  </div>
                ) : (
                  <div className="at-table-scroll">
                    <table className="at-table">
                      <thead>
                        <tr>
                          <th className="at-sticky">Student</th>
                          {lessons.map((l) => (
                            <th
                              key={l.key}
                              className={`at-lesson-head ${l.isSunday ? "sun" : ""} ${l.isToday ? "today" : ""}`}
                              title={l.date}
                            >
                              <span className="at-l-idx">L{l.index}</span>
                              <span className="at-l-date">{l.formattedDate}</span>
                              {l.isSunday && (
                                <span className="at-chip sun">Sun</span>
                              )}
                              {l.isToday && (
                                <span className="at-chip today">Today</span>
                              )}
                            </th>
                          ))}
                          <th className="at-stats-head">
                            <FiTrendingUp />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td
                              colSpan={lessons.length + 2}
                              className="at-no-data"
                            >
                              No students found
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((s) => {
                            const stats = getStats(s.id);
                            return (
                              <tr key={s.id}>
                                <td className="at-sticky">
                                  <div className="at-student">
                                    <div className="at-avatar">
                                      {s.first_name?.[0] || "?"}
                                    </div>
                                    <span>
                                      {s.first_name} {s.last_name}
                                    </span>
                                  </div>
                                </td>
                                {lessons.map((l) => {
                                  const checked = Boolean(
                                    attendanceMap[s.id]?.[l.key],
                                  );
                                  return (
                                    <td
                                      key={l.key}
                                      className={`at-cell ${l.isSunday ? "sun" : ""} ${l.isToday ? "today" : ""}`}
                                    >
                                      <label className="at-check">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() =>
                                            toggleAttendance(s.id, l.key)
                                          }
                                        />
                                        <span className="at-checkmark" />
                                      </label>
                                    </td>
                                  );
                                })}
                                <td className="at-stats-cell">
                                  <span
                                    className={`at-percent ${
                                      stats.percent > 70
                                        ? "good"
                                        : stats.percent > 40
                                          ? "warn"
                                          : "bad"
                                    }`}
                                  >
                                    {stats.percent}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Toast */}
      {toast.open && (
        <div className={`at-toast ${toast.type}`}>
          {toast.type === "success" && <FiCheckCircle />}
          {toast.type === "error" && <FiXCircle />}
          {toast.type === "info" && <FiInfo />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}