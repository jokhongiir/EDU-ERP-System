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
} from "react-icons/fi";

const MAX_LESSONS = 12;

export default function Attendance({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [attendance, setAttendance] = useState({});
  const [initialAttendance, setInitialAttendance] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const cycleKey = useMemo(() => `${year}-${month + 1}`, [year, month]);

  // ================= LOAD GROUPS =================
  useEffect(() => {
    if (!branchId) return;

    const load = async () => {
      const { data } = await supabase
        .from("groups")
        .select("*")
        .eq("branch_id", branchId);

      setGroups(data || []);
    };

    load();
  }, [branchId]);

  // ================= LOAD STUDENTS =================
  const loadStudents = useCallback(async (groupId) => {
    const { data } = await supabase
      .from("students")
      .select("id, first_name, last_name")
      .eq("group_id", groupId)
      .eq("paid", true);

    setStudents(data || []);
  }, []);

  // ================= LOAD ATTENDANCE =================
  const loadAttendance = useCallback(async (groupId) => {
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("group_id", groupId)
      .like("lesson_key", `${cycleKey}%`);

    const map = {};

    data?.forEach((row) => {
      if (!map[row.student_id]) map[row.student_id] = {};
      map[row.student_id][row.lesson_key] = row.present;
    });

    setAttendance(map);
    setInitialAttendance(map);
  }, [cycleKey]);

  // ================= SELECT GROUP =================
  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    setLoading(true);

    await Promise.all([
      loadStudents(group.id),
      loadAttendance(group.id),
    ]);

    setLoading(false);
  };

  // ================= AUTO RESET =================
  useEffect(() => {
    if (!selectedGroup) return;

    const reload = async () => {
      setLoading(true);
      setAttendance({});
      setInitialAttendance({});
      await loadAttendance(selectedGroup.id);
      setLoading(false);
    };

    reload();
  }, [month, year]);

  // ================= LESSON GENERATOR (ODD / EVEN) =================
  const lessons = useMemo(() => {
    if (!selectedGroup) return [];

    const type = selectedGroup.lesson_days || "odd";

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const lessonDays = [];

    for (let d = 1; d <= daysInMonth; d++) {
      if (type === "odd" && d % 2 === 1) lessonDays.push(d);
      if (type === "even" && d % 2 === 0) lessonDays.push(d);
    }

    const limited = lessonDays.slice(0, MAX_LESSONS);

    return limited.map((day, i) => ({
      index: i + 1,
      day,
      key: `${cycleKey}-L${i + 1}`,
    }));
  }, [cycleKey, selectedGroup]);

  // ================= MONTH CONTROL =================
  const changeMonth = (dir) => {
    setMonth((prev) => {
      let next = prev + dir;

      if (next > 11) {
        setYear((y) => y + 1);
        return 0;
      }
      if (next < 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return next;
    });
  };

  // ================= TOGGLE =================
  const toggleAttendance = (studentId, lessonKey) => {
    const studentLessons = attendance?.[studentId] || {};
    const presentCount = Object.values(studentLessons).filter(Boolean).length;

    const isChecked = studentLessons[lessonKey];

    if (!isChecked && presentCount >= MAX_LESSONS) {
      alert("Max 12 lessons reached!");
      return;
    }

    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [lessonKey]: !isChecked,
      },
    }));
  };

  // ================= SAVE =================
  const saveAttendance = async () => {
    setSaving(true);

    const rows = [];

    for (const studentId in attendance) {
      for (const lessonKey in attendance[studentId]) {
        const current = attendance[studentId][lessonKey];
        const initial = initialAttendance?.[studentId]?.[lessonKey];

        if (current !== initial) {
          rows.push({
            student_id: studentId,
            group_id: selectedGroup.id,
            lesson_key: lessonKey,
            present: current,
          });
        }
      }
    }

    if (rows.length === 0) {
      alert("No changes");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("attendance")
      .upsert(rows, {
        onConflict: "student_id,lesson_key",
      });

    if (error) {
      console.error(error);
      alert("Error saving");
    } else {
      alert("Saved 🚀");
      setInitialAttendance(attendance);
    }

    setSaving(false);
  };

  // ================= STATS =================
  const getStats = (studentId) => {
    const data = attendance?.[studentId] || {};
    const present = Object.values(data).filter(Boolean).length;

    return {
      present,
      percent: Math.round((present / MAX_LESSONS) * 100),
    };
  };

  return (
    <div className="attendance">

      {/* INFO */}
      <div className="infoPanel">
        <div className="infoCard"><FiHome /> {activeBranch?.name || "-"}</div>
        <div className="infoCard"><FiLayers /> {selectedGroup?.name || "Select Group"}</div>
        <div className="infoCard"><FiClock /> 12 lessons</div>
        <div className="infoCard">
          <FiCalendar /> {year}/{month + 1}
        </div>
        <div className="infoCard">
          <FiCalendar />
          {selectedGroup?.lesson_days === "even" ? "Even Days" : "Odd Days"}
        </div>
      </div>

      {/* GROUPS */}
      <div className="groups">
        {groups.map((g) => (
          <div
            key={g.id}
            className={`group ${selectedGroup?.id === g.id ? "active" : ""}`}
            onClick={() => handleSelectGroup(g)}
          >
            {g.name}
          </div>
        ))}
      </div>

      {/* MONTH */}
      {selectedGroup && (
        <div className="monthBar">
          <button onClick={() => changeMonth(-1)}>
            <FiChevronLeft />
          </button>

          <h3>{year} / {month + 1}</h3>

          <button onClick={() => changeMonth(1)}>
            <FiChevronRight />
          </button>

          <button onClick={saveAttendance} disabled={saving}>
            <FiDatabase />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="loading">
          <FiLoader className="spin" />
        </div>
      )}

      {/* TABLE */}
      {selectedGroup && !loading && (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>

                {lessons.map((l) => (
                  <th key={l.key}>
                    L{l.index}
                    <br />
                    <span style={{ fontSize: 10, color: "#6b7280" }}>
                      {l.day}-day
                    </span>
                  </th>
                ))}

                <th>%</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s) => {
                const stats = getStats(s.id);

                return (
                  <tr key={s.id}>
                    <td>{s.first_name} {s.last_name}</td>

                    {lessons.map((l) => (
                      <td key={l.key}>
                        <input
                          type="checkbox"
                          checked={!!attendance?.[s.id]?.[l.key]}
                          onChange={() =>
                            toggleAttendance(s.id, l.key)
                          }
                        />
                      </td>
                    ))}

                    <td>
                      {stats.present}/{MAX_LESSONS} <br />
                      <b>{stats.percent}%</b>
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