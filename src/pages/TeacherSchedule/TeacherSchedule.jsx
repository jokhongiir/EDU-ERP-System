import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiClock,
  FiUser,
  FiBookOpen,
  FiUsers,
  FiRefreshCw,
  FiFilter,
} from "react-icons/fi";
import "./TeacherSchedule.css";

const WORK_START = 9;   // 09:00
const WORK_END = 20;    // 20:00
const SLOT_MINUTES = 30; // 30 daqiqalik slotlar

function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isTodayMatchingSchedule(scheduleType) {
  if (!scheduleType || scheduleType === "all") return true;
  const day = new Date().getDay(); // 0=Sun ... 6=Sat
  // Odd: Mon(1), Wed(3), Fri(5)
  // Even: Tue(2), Thu(4), Sat(6)
  if (scheduleType === "odd") return [1, 3, 5].includes(day);
  if (scheduleType === "even") return [2, 4, 6].includes(day);
  return true;
}

export default function TeacherSchedule({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [hoveredBlock, setHoveredBlock] = useState(null);

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [tRes, gRes, cRes] = await Promise.all([
        supabase
          .from("teachers")
          .select("id, name, course_id")
          .eq("branch_id", branchId)
          .order("name"),
        supabase
          .from("groups")
          .select("id, name, teacher_id, course_id, start_time, end_time, schedule_type")
          .eq("branch_id", branchId),
        supabase.from("courses").select("id, name").eq("branch_id", branchId),
      ]);

      setTeachers(tRes.data || []);
      setGroups(gRes.data || []);
      setCourses(cRes.data || []);
    } catch (err) {
      console.error("Schedule load error:", err);
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

  // Timeline slotlari (09:00, 09:30, 10:00 ... 19:30)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let m = WORK_START * 60; m < WORK_END * 60; m += SLOT_MINUTES) {
      slots.push(m);
    }
    return slots;
  }, []);

  // Har bir ustoz uchun band vaqtlar
  const scheduleData = useMemo(() => {
    const result = teachers.map((teacher) => {
      const teacherGroups = groups.filter(
        (g) =>
          String(g.teacher_id) === String(teacher.id) &&
          g.start_time &&
          g.end_time &&
          isTodayMatchingSchedule(g.schedule_type)
      );

      const busyBlocks = teacherGroups.map((g) => {
        const start = timeToMinutes(g.start_time);
        const end = timeToMinutes(g.end_time);
        return {
          id: g.id,
          name: g.name,
          course: courseMap.get(g.course_id) || "—",
          start,
          end,
          startLabel: g.start_time?.slice(0, 5),
          endLabel: g.end_time?.slice(0, 5),
        };
      });

      // Har bir slot uchun status
      const slots = timeSlots.map((slotStart) => {
        const slotEnd = slotStart + SLOT_MINUTES;
        const block = busyBlocks.find(
          (b) => b.start < slotEnd && b.end > slotStart
        );
        return {
          start: slotStart,
          end: slotEnd,
          isBusy: !!block,
          block: block || null,
        };
      });

      return {
        teacher,
        busyBlocks,
        slots,
        freeMinutes: slots.filter((s) => !s.isBusy).length * SLOT_MINUTES,
        busyMinutes: slots.filter((s) => s.isBusy).length * SLOT_MINUTES,
      };
    });

    return result;
  }, [teachers, groups, courseMap, timeSlots]);

  const filteredData = useMemo(() => {
    if (selectedTeacher === "all") return scheduleData;
    return scheduleData.filter(
      (d) => String(d.teacher.id) === String(selectedTeacher)
    );
  }, [scheduleData, selectedTeacher]);

  const totalTeachers = teachers.length;
  const todayLabel = new Date().toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (!branchId) {
    return (
      <div className="ts-empty">
        <FiClock size={40} />
        <p>Filial tanlanmagan</p>
      </div>
    );
  }

  return (
    <div className="ts-root">
      {/* Header */}
      <header className="ts-header">
        <div className="ts-title-area">
          <h1 className="ts-title">
            {activeBranch?.name} • Ustozlar jadvali
          </h1>
          <p className="ts-desc">
            Bugun: <strong>{todayLabel}</strong> · Ish vaqti 09:00 – 20:00
          </p>
        </div>

        <div className="ts-header-actions">
          <div className="ts-filter">
            <FiFilter />
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="all">Barcha ustozlar ({totalTeachers})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button className="ts-refresh" onClick={fetchData} title="Yangilash">
            <FiRefreshCw />
          </button>
        </div>
      </header>

      {/* Legend */}
      <div className="ts-legend">
        <div className="ts-legend-item">
          <span className="ts-dot free" /> Bo‘sh
        </div>
        <div className="ts-legend-item">
          <span className="ts-dot busy" /> Dars (band)
        </div>
        <div className="ts-legend-item">
          <span className="ts-dot partial" /> Qisman band
        </div>
      </div>

      {/* Timeline header (soatlar) */}
      <div className="ts-timeline-header">
        <div className="ts-teacher-col">Ustoz</div>
        <div className="ts-slots-header">
          {timeSlots.map((mins, i) => {
            const showLabel = mins % 60 === 0; // faqat to‘liq soat
            return (
              <div key={mins} className="ts-slot-label">
                {showLabel ? minutesToLabel(mins) : ""}
              </div>
            );
          })}
        </div>
        <div className="ts-stats-col">Statistika</div>
      </div>

      {/* Body */}
      <div className="ts-body">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="ts-row ts-skeleton">
              <div className="ts-teacher-col">
                <div className="ts-skel-avatar" />
                <div className="ts-skel-name" />
              </div>
              <div className="ts-slots-row">
                {timeSlots.map((m) => (
                  <div key={m} className="ts-slot skel" />
                ))}
              </div>
              <div className="ts-stats-col">
                <div className="ts-skel-bar" />
              </div>
            </div>
          ))
        ) : filteredData.length === 0 ? (
          <div className="ts-empty-row">
            <FiUser size={36} />
            <p>Ustozlar topilmadi</p>
          </div>
        ) : (
          filteredData.map(({ teacher, slots, busyBlocks, freeMinutes, busyMinutes }) => (
            <div key={teacher.id} className="ts-row">
              {/* Ustoz ismi */}
              <div className="ts-teacher-col">
                <div className="ts-avatar">
                  <FiUser />
                </div>
                <div className="ts-teacher-info">
                  <span className="ts-name">{teacher.name}</span>
                  <span className="ts-groups-count">
                    {busyBlocks.length} guruh
                  </span>
                </div>
              </div>

              {/* Slotlar */}
              <div className="ts-slots-row">
                {slots.map((slot, idx) => {
                  const isFirstOfBlock =
                    slot.isBusy &&
                    (idx === 0 || !slots[idx - 1].isBusy || slots[idx - 1].block?.id !== slot.block?.id);

                  return (
                    <div
                      key={slot.start}
                      className={`ts-slot ${
                        slot.isBusy ? "busy" : "free"
                      } ${isFirstOfBlock ? "block-start" : ""}`}
                      onMouseEnter={() =>
                        slot.block && setHoveredBlock({ ...slot.block, teacher: teacher.name })
                      }
                      onMouseLeave={() => setHoveredBlock(null)}
                      title={
                        slot.isBusy
                          ? `${slot.block.name} (${slot.block.startLabel}–${slot.block.endLabel})`
                          : "Bo‘sh"
                      }
                    />
                  );
                })}
              </div>

              {/* Statistika */}
              <div className="ts-stats-col">
                <div className="ts-progress">
                  <div
                    className="ts-progress-busy"
                    style={{
                      width: `${(busyMinutes / ((WORK_END - WORK_START) * 60)) * 100}%`,
                    }}
                  />
                </div>
                <div className="ts-stats-text">
                  <span className="busy-t">{Math.round(busyMinutes / 60)}s band</span>
                  <span className="free-t">{Math.round(freeMinutes / 60)}s bo‘sh</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Hover tooltip */}
      {hoveredBlock && (
        <div className="ts-tooltip">
          <div className="ts-tooltip-title">{hoveredBlock.name}</div>
          <div className="ts-tooltip-row">
            <FiUser /> {hoveredBlock.teacher}
          </div>
          <div className="ts-tooltip-row">
            <FiBookOpen /> {hoveredBlock.course}
          </div>
          <div className="ts-tooltip-row">
            <FiClock /> {hoveredBlock.startLabel} – {hoveredBlock.endLabel}
          </div>
        </div>
      )}
    </div>
  );
}