import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiClock,
  FiUser,
  FiBookOpen,
  FiRefreshCw,
  FiFilter,
  FiCalendar,
  FiLayers,
} from "react-icons/fi";
import "./TeacherSchedule.css";

const WORK_START = 9;
const WORK_END = 20;
const SLOT_MIN = 30;
const TOTAL_MIN = (WORK_END - WORK_START) * 60;

const DAY_OPTIONS = [
  { value: "all", label: "Barcha kunlar" },
  { value: "odd", label: "Toq kunlar (Du, Cho, Ju)" },
  { value: "even", label: "Juft kunlar (Se, Pa, Sha)" },
];

function toMinutes(t) {
  if (!t) return null;
  const [h, m] = String(t).split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
}

function toLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function matchesDayType(scheduleType, selectedDay) {
  if (selectedDay === "all") return true;
  if (!scheduleType || scheduleType === "all") return true;
  return scheduleType === selectedDay;
}

function blockStyle(startMin, endMin) {
  const workStartMin = WORK_START * 60;
  const left = ((startMin - workStartMin) / TOTAL_MIN) * 100;
  const width = ((endMin - startMin) / TOTAL_MIN) * 100;
  return {
    left: `${Math.max(0, left)}%`,
    width: `${Math.min(100 - Math.max(0, left), Math.max(width, 1.2))}%`,
  };
}

export default function TeacherSchedule({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayType, setDayType] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [tooltip, setTooltip] = useState(null);

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [t, g, c] = await Promise.all([
        supabase
          .from("teachers")
          .select("id, name")
          .eq("branch_id", branchId)
          .order("name"),
        supabase
          .from("groups")
          .select(
            "id, name, teacher_id, course_id, start_time, end_time, schedule_type"
          )
          .eq("branch_id", branchId),
        supabase.from("courses").select("id, name").eq("branch_id", branchId),
      ]);
      setTeachers(t.data || []);
      setGroups(g.data || []);
      setCourses(c.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const courseMap = useMemo(
    () => new Map(courses.map((c) => [c.id, c.name])),
    [courses]
  );

  /* 09:00, 09:30, 10:00, 10:30 ... 20:00 — hammasi */
  const timeMarks = useMemo(() => {
    const arr = [];
    for (let m = WORK_START * 60; m <= WORK_END * 60; m += SLOT_MIN) {
      arr.push({
        mins: m,
        label: toLabel(m),
        isHour: m % 60 === 0,
      });
    }
    return arr;
  }, []);

  const schedule = useMemo(() => {
    return teachers.map((teacher) => {
      const teacherGroups = groups.filter(
        (g) =>
          String(g.teacher_id) === String(teacher.id) &&
          g.start_time &&
          g.end_time &&
          matchesDayType(g.schedule_type, dayType)
      );

      const blocks = teacherGroups
        .map((g) => {
          const start = toMinutes(g.start_time);
          const end = toMinutes(g.end_time);
          if (start == null || end == null || end <= start) return null;
          return {
            id: g.id,
            name: g.name,
            course: courseMap.get(g.course_id) || "—",
            start,
            end,
            startLabel: String(g.start_time).slice(0, 5),
            endLabel: String(g.end_time).slice(0, 5),
            scheduleType: g.schedule_type || "all",
            durationMin: end - start,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.start - b.start);

      const busyMin = blocks.reduce((sum, b) => sum + b.durationMin, 0);
      const freeMin = Math.max(0, TOTAL_MIN - busyMin);

      return { teacher, blocks, busyMin, freeMin };
    });
  }, [teachers, groups, courseMap, dayType]);

  const filtered = useMemo(() => {
    if (selectedTeacher === "all") return schedule;
    return schedule.filter(
      (s) => String(s.teacher.id) === String(selectedTeacher)
    );
  }, [schedule, selectedTeacher]);

  const todayName = new Date().toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const showTooltip = (e, block, teacherName) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      ...block,
      teacherName,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  if (!branchId) {
    return (
      <div className="ts-page">
        <div className="ts-empty">
          <FiLayers size={48} />
          <h3>Filial tanlanmagan</h3>
          <p>Jadvalni ko‘rish uchun filialni tanlang</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ts-page">
      {/* HEADER */}
      <header className="ts-header">
        <div className="ts-title-area">
          <h1 className="ts-title">
            {activeBranch?.name} • Ustozlar jadvali
          </h1>
          <p className="ts-desc">
            <FiCalendar size={14} /> Bugun: <strong>{todayName}</strong>
            <span className="ts-sep">·</span>
            Ish vaqti {toLabel(WORK_START * 60)} – {toLabel(WORK_END * 60)}
          </p>
        </div>

        <div className="ts-controls">
          <div className="ts-select-wrap">
            <FiFilter size={15} />
            <select
              value={dayType}
              onChange={(e) => setDayType(e.target.value)}
            >
              {DAY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ts-select-wrap">
            <FiUser size={15} />
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="all">Barcha ustozlar</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="ts-refresh-btn"
            onClick={fetchData}
            title="Yangilash"
            type="button"
          >
            <FiRefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* LEGEND */}
      <div className="ts-legend">
        <div className="ts-leg-item">
          <span className="ts-leg-box free" /> Bo‘sh vaqt
        </div>
        <div className="ts-leg-item">
          <span className="ts-leg-box busy" /> Dars (band)
        </div>
        <div className="ts-leg-hint">
          {dayType === "odd"
            ? "Faqat toq kunlar (Du, Cho, Ju)"
            : dayType === "even"
            ? "Faqat juft kunlar (Se, Pa, Sha)"
            : "Barcha kunlar ko‘rsatilmoqda"}
        </div>
      </div>

      {/* GANTT CARD */}
      <div className="ts-card">
        {/* Vaqt belgilari: 09:00 09:30 10:00 10:30 ... */}
        <div className="ts-grid-header">
          <div className="ts-col-teacher">Ustoz</div>
          <div className="ts-col-timeline">
            <div className="ts-time-ruler">
              {timeMarks.map((tm) => (
                <div
                  key={tm.mins}
                  className={`ts-time-tick ${tm.isHour ? "hour" : "half"}`}
                  style={{
                    left: `${((tm.mins - WORK_START * 60) / TOTAL_MIN) * 100}%`,
                  }}
                >
                  <span className="ts-time-label">{tm.label}</span>
                  <span className="ts-time-line" />
                </div>
              ))}
            </div>
          </div>
          <div className="ts-col-stats">Yuklama</div>
        </div>

        <div className="ts-grid-body">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="ts-row skeleton">
                <div className="ts-col-teacher">
                  <div className="skel circle" />
                  <div className="skel line" />
                </div>
                <div className="ts-col-timeline">
                  <div className="ts-track skel-track" />
                </div>
                <div className="ts-col-stats">
                  <div className="skel bar" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="ts-empty-inside">
              <FiUser size={40} style={{ opacity: 0.35 }} />
              <p>Ustozlar topilmadi</p>
            </div>
          ) : (
            filtered.map(({ teacher, blocks, busyMin, freeMin }) => {
              const busyPct = Math.round((busyMin / TOTAL_MIN) * 100);

              return (
                <div key={teacher.id} className="ts-row">
                  <div className="ts-col-teacher">
                    <div className="ts-avatar">
                      {teacher.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="ts-teacher-meta">
                      <span className="ts-name">{teacher.name}</span>
                      <span className="ts-count">
                        {blocks.length} guruh
                      </span>
                    </div>
                  </div>

                  <div className="ts-col-timeline">
                    <div className="ts-track">
                      {/* Vertikal chiziqlar (har 30 daqiqa) */}
                      {timeMarks.map((tm) => (
                        <div
                          key={tm.mins}
                          className={`ts-vline ${tm.isHour ? "hour" : "half"}`}
                          style={{
                            left: `${
                              ((tm.mins - WORK_START * 60) / TOTAL_MIN) * 100
                            }%`,
                          }}
                        />
                      ))}

                      {/* Dars bloklari */}
                      {blocks.map((b) => (
                        <div
                          key={b.id}
                          className="ts-block"
                          style={blockStyle(b.start, b.end)}
                          onMouseEnter={(e) =>
                            showTooltip(e, b, teacher.name)
                          }
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <span className="ts-block-name">{b.name}</span>
                          <span className="ts-block-time">
                            {b.startLabel}–{b.endLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ts-col-stats">
                    <div className="ts-progress">
                      <div
                        className="ts-progress-fill"
                        style={{ width: `${busyPct}%` }}
                      />
                    </div>
                    <div className="ts-stat-labels">
                      <span className="busy" title="Band soatlar">
                        {Math.round(busyMin / 60)}s
                      </span>
                      <span className="free" title="Bo‘sh soatlar">
                        {Math.round(freeMin / 60)}s
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* TOOLTIP */}
      {tooltip && (
        <div
          className="ts-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="ts-tip-title">{tooltip.name}</div>
          <div className="ts-tip-row">
            <FiUser size={13} /> {tooltip.teacherName}
          </div>
          <div className="ts-tip-row">
            <FiBookOpen size={13} /> {tooltip.course}
          </div>
          <div className="ts-tip-row">
            <FiClock size={13} /> {tooltip.startLabel} – {tooltip.endLabel}
            <span className="ts-tip-dur">
              ({(tooltip.durationMin / 60).toFixed(1)} soat)
            </span>
          </div>
          <div className="ts-tip-badge">
            {tooltip.scheduleType === "odd"
              ? "Toq kunlar"
              : tooltip.scheduleType === "even"
              ? "Juft kunlar"
              : "Har kuni"}
          </div>
        </div>
      )}
    </div>
  );
}