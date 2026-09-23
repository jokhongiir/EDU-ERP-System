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

const DAY_OPTIONS = [
  { value: "all", label: "Barcha kunlar" },
  { value: "odd", label: "Toq kunlar (Du, Cho, Ju)" },
  { value: "even", label: "Juft kunlar (Se, Pa, Sha)" },
];

function toMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
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

  const slots = useMemo(() => {
    const arr = [];
    for (let m = WORK_START * 60; m < WORK_END * 60; m += SLOT_MIN) {
      arr.push(m);
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

      const blocks = teacherGroups.map((g) => ({
        id: g.id,
        name: g.name,
        course: courseMap.get(g.course_id) || "—",
        start: toMinutes(g.start_time),
        end: toMinutes(g.end_time),
        startLabel: g.start_time?.slice(0, 5),
        endLabel: g.end_time?.slice(0, 5),
        scheduleType: g.schedule_type || "all",
      }));

      const slotStatus = slots.map((start) => {
        const end = start + SLOT_MIN;
        const block = blocks.find((b) => b.start < end && b.end > start);
        return { start, end, busy: !!block, block: block || null };
      });

      const busyMin = slotStatus.filter((s) => s.busy).length * SLOT_MIN;
      const freeMin = (WORK_END - WORK_START) * 60 - busyMin;

      return { teacher, blocks, slotStatus, busyMin, freeMin };
    });
  }, [teachers, groups, courseMap, slots, dayType]);

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
            Ish vaqti 09:00 – 20:00
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
          >
            <FiRefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* LEGEND */}
      <div className="ts-legend">
        <div className="ts-leg-item">
          <span className="ts-leg-box free" /> Bo‘sh
        </div>
        <div className="ts-leg-item">
          <span className="ts-leg-box busy" /> Dars (band)
        </div>
        <div className="ts-leg-hint">
          {dayType === "odd"
            ? "Faqat toq kunlar ko‘rsatilmoqda"
            : dayType === "even"
            ? "Faqat juft kunlar ko‘rsatilmoqda"
            : "Barcha kunlar ko‘rsatilmoqda"}
        </div>
      </div>

      {/* CARD */}
      <div className="ts-card">
        <div className="ts-grid-header">
          <div className="ts-col-teacher">Ustoz</div>
          <div className="ts-col-timeline">
            {slots.map((m) => (
              <div key={m} className="ts-hour">
                {m % 60 === 0 ? toLabel(m) : ""}
              </div>
            ))}
          </div>
          <div className="ts-col-stats">Yuklama</div>
        </div>

        <div className="ts-grid-body">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ts-row skeleton">
                <div className="ts-col-teacher">
                  <div className="skel circle" />
                  <div className="skel line" />
                </div>
                <div className="ts-col-timeline">
                  {slots.map((m) => (
                    <div key={m} className="ts-cell skel" />
                  ))}
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
            filtered.map(
              ({ teacher, slotStatus, blocks, busyMin, freeMin }) => {
                const totalMin = (WORK_END - WORK_START) * 60;
                const busyPct = Math.round((busyMin / totalMin) * 100);

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
                      {slotStatus.map((s, idx) => {
                        const isStart =
                          s.busy &&
                          (idx === 0 ||
                            !slotStatus[idx - 1].busy ||
                            slotStatus[idx - 1].block?.id !== s.block?.id);

                        return (
                          <div
                            key={s.start}
                            className={`ts-cell ${s.busy ? "busy" : "free"} ${
                              isStart ? "start" : ""
                            }`}
                            onMouseEnter={(e) => {
                              if (!s.block) return;
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                ...s.block,
                                teacherName: teacher.name,
                                x: rect.left + rect.width / 2,
                                y: rect.top - 8,
                              });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          />
                        );
                      })}
                    </div>

                    <div className="ts-col-stats">
                      <div className="ts-progress">
                        <div
                          className="ts-progress-fill"
                          style={{ width: `${busyPct}%` }}
                        />
                      </div>
                      <div className="ts-stat-labels">
                        <span className="busy">
                          {Math.round(busyMin / 60)}s
                        </span>
                        <span className="free">
                          {Math.round(freeMin / 60)}s
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            )
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