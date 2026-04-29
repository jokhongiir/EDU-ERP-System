import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../../services/supabaseClient";
import "./Attendance.css";

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
  FiRepeat,
  FiSun,
  FiMoon,
} from "react-icons/fi";

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
  } = state;

  const cycleKey = useMemo(
    () => `${currentYear}-${currentMonth + 1}`,
    [currentYear, currentMonth],
  );

  // ================= MODAL =================
  const [modal, setModal] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const showModal = (message, type = "success") => {
    setModal({ open: true, message, type });
    setTimeout(
      () => setModal({ open: false, message: "", type: "success" }),
      2000,
    );
  };

  const updateState = (payload) =>
    setState((prev) => ({ ...prev, ...payload }));

  // ================= LOAD GROUPS =================
  const fetchGroups = useCallback(async () => {
    if (!branchId) return;

    const { data } = await supabase
      .from("groups")
      .select("*")
      .eq("branch_id", branchId);

    updateState({ groups: data || [] });
  }, [branchId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ================= LOAD STUDENTS =================
  const fetchStudents = useCallback(async (groupId) => {
    const { data } = await supabase
      .from("students")
      .select("id, first_name, last_name")
      .eq("group_id", groupId)
      .eq("paid", true);

    updateState({ students: data || [] });
  }, []);

  // ================= LOAD ATTENDANCE =================
  const fetchAttendance = useCallback(async (groupId, month, year) => {
    const key = `${year}-${month + 1}`;

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("group_id", groupId)
      .like("lesson_key", `${key}%`);

    const map = {};

    data?.forEach((row) => {
      if (!map[row.student_id]) map[row.student_id] = {};
      map[row.student_id][row.lesson_key] = row.present;
    });

    updateState({
      attendanceMap: map,
      originalAttendanceMap: map,
    });
  }, []);

  // ================= SELECT GROUP =================
  const handleSelectGroup = async (group) => {
    updateState({
      selectedGroup: group,
      isLoading: true,
      attendanceMap: {},
      originalAttendanceMap: {},
    });

    await Promise.all([
      fetchStudents(group.id),
      fetchAttendance(group.id, currentMonth, currentYear),
    ]);

    updateState({ isLoading: false });
  };

  // ================= CHANGE MONTH =================
  const changeMonth = async (direction) => {
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

    updateState({
      currentMonth: newMonth,
      currentYear: newYear,
      attendanceMap: {},
      originalAttendanceMap: {},
      isLoading: true,
    });

    if (selectedGroup) {
      await fetchAttendance(selectedGroup.id, newMonth, newYear);
    }

    updateState({ isLoading: false });
  };

  // ================= LESSONS =================
  const lessons = useMemo(() => {
    if (!selectedGroup) return [];

    const type = selectedGroup.lesson_days || "odd";
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];

    for (let i = 1; i <= daysInMonth; i++) {
      if (type === "odd" && i % 2 === 1) days.push(i);
      if (type === "even" && i % 2 === 0) days.push(i);
    }

    return days.slice(0, MAX_LESSONS).map((day, index) => ({
      key: `${cycleKey}-L${index + 1}`,
      index: index + 1,
      day,
    }));
  }, [selectedGroup, cycleKey, currentMonth, currentYear]);

  // ================= TOGGLE ATTENDANCE =================
  const toggleAttendance = (studentId, lessonKey) => {
    const studentData = attendanceMap?.[studentId] || {};

    updateState({
      attendanceMap: {
        ...attendanceMap,
        [studentId]: {
          ...studentData,
          [lessonKey]: !studentData[lessonKey],
        },
      },
    });
  };

  // ================= SAVE =================
  const saveAttendance = async () => {
    updateState({ isSaving: true });

    const rows = [];

    Object.entries(attendanceMap).forEach(([studentId, lessons]) => {
      Object.entries(lessons).forEach(([key, value]) => {
        if (value !== originalAttendanceMap?.[studentId]?.[key]) {
          rows.push({
            student_id: studentId,
            group_id: selectedGroup.id,
            lesson_key: key,
            present: value,
          });
        }
      });
    });

    if (!rows.length) {
      updateState({ isSaving: false });
      showModal("No changes detected", "error");
      return;
    }

    const { error } = await supabase.from("attendance").upsert(rows, {
      onConflict: "student_id,lesson_key",
    });

    if (error) {
      showModal("Something went wrong", "error");
    } else {
      updateState({ originalAttendanceMap: attendanceMap });
      showModal("Saved successfully ✔", "success");
    }

    updateState({ isSaving: false });
  };

  // ================= STATS =================
  const getStats = (studentId) => {
    const data = attendanceMap?.[studentId] || {};
    const present = Object.values(data).filter(Boolean).length;

    return {
      present,
      percent: Math.round((present / MAX_LESSONS) * 100),
    };
  };

  // ================= UI =================
  return (
    <div className="attendance">
      {modal.open && (
        <div className="modalOverlay">
          <div className={`modalBox ${modal.type}`}>
            {modal.type === "success" ? <FiCheckCircle /> : <FiXCircle />}
            <p>{modal.message}</p>
          </div>
        </div>
      )}

      <div className="infoPanel">
        <div>
          <FiHome /> {activeBranch?.name}
        </div>

        <div>
          <FiLayers /> {selectedGroup?.name || "Group"}
        </div>

        <div>
          <FiClock /> {MAX_LESSONS} Lessons
        </div>

        <div>
          <FiCalendar /> {currentYear}/{currentMonth + 1}
        </div>

        {/* ✅ SCHEDULE CARD */}
        <div className={`scheduleCard ${selectedGroup?.schedule_type}`}>
          <div className="scheduleIcon">
            {selectedGroup?.schedule_type === "odd" ? (
              <FiMoon />
            ) : selectedGroup?.schedule_type === "even" ? (
              <FiSun />
            ) : (
              <FiRepeat />
            )}
          </div>

        
            <span className="value">
              {selectedGroup?.schedule_type === "odd"
                ? "Odd Days"
                : selectedGroup?.schedule_type === "even"
                  ? "Even Day"
                  : "Every Day"}
            </span>
        </div>
      </div>

      <div className="groups">
        {groups.map((group) => (
          <div
            key={group.id}
            className={`groupCard ${
              selectedGroup?.id === group.id ? "active" : ""
            }`}
            onClick={() => handleSelectGroup(group)}
          >
            <FiLayers /> {group.name}
          </div>
        ))}
      </div>

      {selectedGroup && (
        <div className="monthBar">
          <button onClick={() => changeMonth(-1)}>
            <FiChevronLeft />
          </button>

          <h3>
            {currentYear}/{currentMonth + 1}
          </h3>

          <button onClick={() => changeMonth(1)}>
            <FiChevronRight />
          </button>

          <button onClick={saveAttendance} disabled={isSaving}>
            <FiDatabase /> {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      )}

      {isLoading && <FiLoader className="spin" />}

      {selectedGroup && !isLoading && (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>

                {lessons.map((l) => (
                  <th key={l.key}>L{l.index}</th>
                ))}

                <th>%</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s) => {
                const stats = getStats(s.id);

                return (
                  <tr key={s.id}>
                    <td>
                      {s.first_name} {s.last_name}
                    </td>

                    {lessons.map((l) => (
                      <td key={l.key}>
                        <input
                          type="checkbox"
                          checked={!!attendanceMap?.[s.id]?.[l.key]}
                          onChange={() => toggleAttendance(s.id, l.key)}
                        />
                      </td>
                    ))}

                    <td>
                      {stats.present}/{MAX_LESSONS}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
