import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import "./Attendance.css";

import {
  FiUsers,
  FiCalendar,
  FiSave,
  FiCheckSquare,
  FiSquare,
  FiRefreshCw,
} from "react-icons/fi";

export default function Attendance({ activeBranch }) {
  const branchId = activeBranch?.id;

  // ================= STATE =================
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [lessons, setLessons] = useState([]);
  const [attendance, setAttendance] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
 
  useEffect(() => {
    if (!branchId) return;

    const loadGroups = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("branch_id", branchId);

      if (error) console.log(error.message);
      setGroups(data || []);

      setLoading(false);
    };

    loadGroups();
  }, [branchId]);

  // ================= LESSON GENERATOR =================
  const generateLessons = useCallback((startDate, type) => {
    const list = [];
    let current = new Date(startDate);

    while (list.length < 12) {
      const day = current.getDate();

      const valid =
        type === "all" ||
        (type === "odd" && day % 2 === 1) ||
        (type === "even" && day % 2 === 0);

      if (valid) {
        list.push({
          index: list.length,
          date: current.toISOString().split("T")[0],
        });
      }

      current.setDate(current.getDate() + 1);
    }

    setLessons(list);
  }, []);

  // ================= LOAD ATTENDANCE =================
  const loadAttendance = useCallback(async (groupId) => {
    const { data, error } = await supabase
      .from("attendance")
      .select("student_id, lesson_index, present")
      .eq("group_id", groupId);

    if (error) {
      console.log(error.message);
      return;
    }

    const map = {};

    (data || []).forEach((row) => {
      if (!map[row.student_id]) map[row.student_id] = {};
      map[row.student_id][row.lesson_index] = row.present;
    });

    setAttendance(map);
  }, []);

  // ================= SELECT GROUP =================
  const handleSelectGroup = async (group) => {
    if (!group) return;

    setSelectedGroup(group);
    setStudents([]);
    setLessons([]);
    setAttendance({});
    setLoading(true);

    try {
      const { data: studentsData, error } = await supabase
        .from("students")
        .select("id, first_name, last_name")
        .eq("group_id", group.id)
        .eq("paid", true);

      if (error) console.log(error.message);

      setStudents(studentsData || []);

      if (group.start_date) {
        generateLessons(group.start_date, group.schedule_type);
      }

      await loadAttendance(group.id);
    } catch (err) {
      console.log(err.message);
    }

    setLoading(false);
  };

  // ================= TOGGLE =================
  const toggleCheck = (studentId, lessonIndex) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [lessonIndex]: !prev?.[studentId]?.[lessonIndex],
      },
    }));
  };

  // ================= BULK =================
  const markAll = () => {
    const map = {};

    students.forEach((s) => {
      map[s.id] = {};
      lessons.forEach((l) => {
        map[s.id][l.index] = true;
      });
    });

    setAttendance(map);
  };

  const clearAll = () => setAttendance({});

  const reload = () => {
    if (selectedGroup) handleSelectGroup(selectedGroup);
  };

  // ================= SAVE =================
  const handleSave = async () => {
    if (!selectedGroup || saving) return;

    setSaving(true);

    const rows = [];

    students.forEach((s) => {
      lessons.forEach((l) => {
        rows.push({
          student_id: s.id,
          group_id: selectedGroup.id,
          lesson_index: l.index,
          date: l.date,
          present: !!attendance?.[s.id]?.[l.index],
        });
      });
    });

    const { error } = await supabase
      .from("attendance")
      .upsert(rows, {
        onConflict: "student_id,group_id,lesson_index,date",
      });

    if (error) {
      console.log("SAVE ERROR:", error.message);
    }

    setSaving(false);
  };

  // ================= HELPERS =================
  const getScheduleLabel = (type) => {
    if (type === "odd") return "Toq kunlar";
    if (type === "even") return "Juft kunlar";
    return "Har kuni";
  };

  const totalLessons = lessons.length;

  const getProgress = (studentId) => {
    const data = attendance[studentId] || {};
    return Object.values(data).filter(Boolean).length;
  };

  // ================= UI =================
  return (
    <div className="attendance">

      {/* HEADER */}
      <div className="attendance__header">
        <h2><FiCalendar /> Attendance System</h2>
        <p>Professional ERP Attendance Panel</p>
      </div>

      {/* GROUPS */}
      <div className="attendance__groups">
        {groups.map((g) => (
          <div
            key={g.id}
            className={`groupCard ${selectedGroup?.id === g.id ? "active" : ""}`}
            onClick={() => handleSelectGroup(g)}
          >
            <FiUsers />
            <div>
              <h4>{g.name}</h4>
              <small>{getScheduleLabel(g.schedule_type)}</small>
            </div>
          </div>
        ))}
      </div>

      {/* LOADING */}
      {loading && <div className="loading">Loading...</div>}

      {/* EMPTY */}
      {!loading && selectedGroup && students.length === 0 && (
        <div className="empty">No students found</div>
      )}

      {/* TABLE */}
      {selectedGroup && students.length > 0 && (
        <div className="attendance__tableWrapper">

          {/* TOP BAR */}
          <div className="attendance__topbar">
            <h3>{selectedGroup.name}</h3>

            <div className="actions">

              <button onClick={markAll}>
                <FiCheckSquare /> All
              </button>

              <button onClick={clearAll}>
                <FiSquare /> Clear
              </button>

              <button onClick={reload}>
                <FiRefreshCw /> Reload
              </button>

              <button
                className="saveBtn inline"
                onClick={handleSave}
                disabled={saving}
              >
                <FiSave />
                {saving ? "Saving..." : "Save"}
              </button>

            </div>
          </div>

          {/* TABLE */}
          <table className="attendance__table">
            <thead>
              <tr>
                <th>Student</th>

                {lessons.map((l) => (
                  <th key={l.index}>
                    {l.index + 1}
                    <br />
                    <small>{l.date}</small>
                  </th>
                ))}

                <th>Progress</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="student">
                    {s.first_name} {s.last_name}
                  </td>

                  {lessons.map((l) => (
                    <td key={l.index}>
                      <input
                        type="checkbox"
                        checked={!!attendance?.[s.id]?.[l.index]}
                        onChange={() => toggleCheck(s.id, l.index)}
                      />
                    </td>
                  ))}

                  <td className="progress">
                    {getProgress(s.id)} / {totalLessons}
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