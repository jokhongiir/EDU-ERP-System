import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiTrendingUp,
  FiSave,
  FiUsers,
  FiLayers,
} from "react-icons/fi";
import "./TeacherAttendance.css";

export default function TeacherAttendance() {
  const { teacher } = useOutletContext();
  const currentTeacherId = teacher?.id;

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [teacherGroups, setTeacherGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupStudents, setGroupStudents] = useState([]);
  const [studentsMonthAttendance, setStudentsMonthAttendance] = useState({});
  const [originalStudentsAttendance, setOriginalStudentsAttendance] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const cycleKey = useMemo(
    () => `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
    [currentYear, currentMonth]
  );

  const showToast = useCallback((message, type = "success") => {
    setToast({ open: true, message, type });
    setTimeout(
      () => setToast({ open: false, message: "", type: "success" }),
      2500
    );
  }, []);

  // O'qituvchining o'z guruhlarini yuklash
  useEffect(() => {
    if (!currentTeacherId) return;

    const fetchTeacherGroups = async () => {
      try {
        const { data, error } = await supabase
          .from("groups")
          .select("*")
          .eq("teacher_id", currentTeacherId);

        if (error) throw error;
        setTeacherGroups(data || []);
        if (data && data.length > 0) {
          setSelectedGroup((prev) => prev || data[0]);
        }
      } catch (err) {
        console.error("Guruhlarni yuklashda xatolik:", err);
      }
    };

    fetchTeacherGroups();
  }, [currentTeacherId]);

  // Tanlangan guruhdagi o'quvchilar va davomatini yuklash
  const fetchGroupStudentsAttendance = useCallback(
    async (groupId, month, year) => {
      if (!groupId) return;
      setIsLoading(true);
      const keyPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

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
            .like("lesson_key", `${keyPrefix}%`),
        ]);

        const map = {};
        attendanceRes.data?.forEach((row) => {
          if (!map[row.student_id]) map[row.student_id] = {};
          map[row.student_id][row.lesson_key] = Boolean(row.present);
        });

        setGroupStudents(studentsRes.data || []);
        setStudentsMonthAttendance(map);
        setOriginalStudentsAttendance(JSON.parse(JSON.stringify(map)));
      } catch (err) {
        console.error(err);
        showToast("O'quvchilar davomatini yuklashda xatolik", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (selectedGroup?.id) {
      fetchGroupStudentsAttendance(selectedGroup.id, currentMonth, currentYear);
    }
  }, [selectedGroup, currentMonth, currentYear, fetchGroupStudentsAttendance]);

  // Jadval kunlari
  const lessons = useMemo(() => {
    const type = selectedGroup?.schedule_type || "all";
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysList = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(currentYear, currentMonth, i);
      const dayOfWeek = dateObj.getDay();
      const isSunday = dayOfWeek === 0;
      const isOdd = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
      const isEven = dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6;

      if (type === "all") {
        if (!isSunday) daysList.push({ dayNum: i, dateObj, isSunday: false });
      } else if (type === "odd" && isOdd) {
        daysList.push({ dayNum: i, dateObj, isSunday: false });
      } else if (type === "even" && isEven) {
        daysList.push({ dayNum: i, dateObj, isSunday: false });
      }
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
        formattedDate: new Intl.DateTimeFormat("uz-UZ", {
          month: "short",
          day: "numeric",
          weekday: "short",
        }).format(dateObj),
        isSunday,
        isToday: isCurrent && dayNum === todayNum,
      };
    });
  }, [selectedGroup, cycleKey, currentMonth, currentYear]);

  const changeMonth = (direction) => {
    let month = currentMonth + direction;
    let year = currentYear;
    if (month > 11) {
      month = 0;
      year++;
    }
    if (month < 0) {
      month = 11;
      year--;
    }
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  const toggleStudentAttendance = (studentId, lessonKey) => {
    setStudentsMonthAttendance((prev) => {
      const studentData = prev[studentId] || {};
      return {
        ...prev,
        [studentId]: { ...studentData, [lessonKey]: !studentData[lessonKey] },
      };
    });
  };

  const saveStudentsAttendance = async () => {
    if (!selectedGroup?.id) return;
    setIsSaving(true);

    const rows = [];
    Object.entries(studentsMonthAttendance).forEach(([sId, lessonsMap]) => {
      Object.entries(lessonsMap).forEach(([key, val]) => {
        if (val !== originalStudentsAttendance[sId]?.[key]) {
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
      showToast("O'zgarishlar aniqlanmadi", "info");
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from("attendance")
      .upsert(rows, { onConflict: "student_id,lesson_key" });

    if (error) {
      showToast("Saqlashda xatolik yuz berdi!", "error");
    } else {
      setOriginalStudentsAttendance(
        JSON.parse(JSON.stringify(studentsMonthAttendance))
      );
      showToast("O'quvchilar davomati saqlandi!", "success");
    }
    setIsSaving(false);
  };

  const getStudentStats = (studentId) => {
    const data = studentsMonthAttendance[studentId] || {};
    const total = lessons.length;
    const present = Object.values(data).filter(Boolean).length;
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, percent, total };
  };

  const scheduleLabel = (type) => {
    if (type === "odd") return "Toq kunlar (Dush-Chor-Jum)";
    if (type === "even") return "Juft kunlar (Sesh-Pay-Shan)";
    return "Har kuni";
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <div className="attendance-header__info">
          <h1 className="attendance-title">O'quvchilar davomati</h1>
          <p className="attendance-subtitle">
            <FiUsers /> Guruhlaringizdagi o'quvchilar davomatini boshqaring
          </p>
        </div>
      </div>

      <div className="attendance-group-selector-wrapper">
        <select
          value={selectedGroup?.id || ""}
          onChange={(e) => {
            const found = teacherGroups.find((g) => String(g.id) === e.target.value);
            setSelectedGroup(found || null);
          }}
          className="attendance-group-select"
        >
          {teacherGroups.length === 0 ? (
            <option value="">Sizga guruhlar biriktirilmagan</option>
          ) : (
            teacherGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({scheduleLabel(group.schedule_type)})
              </option>
            ))
          )}
        </select>
      </div>

      <div className="attendance-toolbar">
        <div className="attendance-calendar-navigation">
          <button className="attendance-nav-btn" onClick={() => changeMonth(-1)}>
            <FiChevronLeft />
          </button>
          <h3 className="attendance-current-month-title">
            <FiCalendar />
            {new Intl.DateTimeFormat("uz-UZ", {
              month: "long",
              year: "numeric",
            }).format(new Date(currentYear, currentMonth))}
          </h3>
          <button className="attendance-nav-btn" onClick={() => changeMonth(1)}>
            <FiChevronRight />
          </button>
        </div>

        <div className="attendance-toolbar__actions">
          <button
            className="attendance-save-btn"
            onClick={saveStudentsAttendance}
            disabled={isSaving || !selectedGroup}
          >
            {isSaving ? <FiLoader className="attendance-spinner" /> : <FiSave />}
            {isSaving ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
          </button>
        </div>
      </div>

      <div className="attendance-table-wrapper">
        {isLoading ? (
          <div className="attendance-loading-state">
            <FiLoader className="attendance-spinner attendance-spinner--large" />
            <p>O'quvchilar davomati yuklanmoqda...</p>
          </div>
        ) : (
          <div className="attendance-table-scrollable">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th className="attendance-table__sticky-col">O'quvchi</th>
                  {lessons.map((lesson) => (
                    <th
                      key={lesson.key}
                      className={`attendance-lesson-header ${
                        lesson.isToday ? "attendance-lesson-header--today" : ""
                      }`}
                      title={lesson.date}
                    >
                      <span className="attendance-lesson-index">L{lesson.index}</span>
                      <span className="attendance-lesson-date">
                        {lesson.formattedDate}
                      </span>
                      {lesson.isToday && (
                        <span className="attendance-badge attendance-badge--today">
                          Bugun
                        </span>
                      )}
                    </th>
                  ))}
                  <th className="attendance-stats-header">
                    <FiTrendingUp />
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupStudents.length === 0 ? (
                  <tr>
                    <td colSpan={lessons.length + 2} className="attendance-no-data">
                      Bu guruhda o'quvchilar topilmadi yoki guruh tanlanmagan
                    </td>
                  </tr>
                ) : (
                  groupStudents.map((student) => {
                    const stats = getStudentStats(student.id);
                    return (
                      <tr key={student.id}>
                        <td className="attendance-table__sticky-col">
                          <div className="attendance-user-profile">
                            <div className="attendance-avatar">
                              {student.first_name?.[0] || "?"}
                            </div>
                            <span>
                              {student.first_name} {student.last_name}
                            </span>
                          </div>
                        </td>
                        {lessons.map((lesson) => {
                          const checked = Boolean(
                            studentsMonthAttendance[student.id]?.[lesson.key]
                          );
                          return (
                            <td
                              key={lesson.key}
                              className={`attendance-cell ${
                                lesson.isToday ? "attendance-cell--today" : ""
                              }`}
                            >
                              <label className="attendance-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    toggleStudentAttendance(student.id, lesson.key)
                                  }
                                />
                                <span className="attendance-custom-checkbox" />
                              </label>
                            </td>
                          );
                        })}
                        <td className="attendance-stats-cell">
                          <span
                            className={`attendance-percentage ${
                              stats.percent > 70
                                ? "attendance-percentage--good"
                                : stats.percent > 40
                                ? "attendance-percentage--warning"
                                : "attendance-percentage--bad"
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

      {toast.open && (
        <div className={`attendance-toast attendance-toast--${toast.type}`}>
          {toast.type === "success" && <FiCheckCircle />}
          {toast.type === "error" && <FiXCircle />}
          {toast.type === "info" && <FiInfo />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}