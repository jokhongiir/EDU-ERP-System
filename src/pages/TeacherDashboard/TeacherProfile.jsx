import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiUsers,
  FiLayers,
  FiDollarSign,
  FiMapPin,
  FiCalendar,
  FiLoader,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import "./TeacherProfile.css";

export default function TeacherProfile() {
  const ctx = useOutletContext() || {};
  const teacher = ctx.teacher || null;
  const allTeachers = Array.isArray(ctx.allTeachers) ? ctx.allTeachers : [];

  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [loading, setLoading] = useState(true);

  // Barcha teacher yozuvlari (multi-branch)
  const teacherList = useMemo(() => {
    if (allTeachers.length > 0) return allTeachers;
    return teacher ? [teacher] : [];
  }, [allTeachers, teacher]);

  const teacherIds = useMemo(
    () => teacherList.map((t) => t.id).filter(Boolean),
    [teacherList]
  );

  const branchByTeacherId = useMemo(() => {
    const map = {};
    teacherList.forEach((t) => {
      map[String(t.id)] = t.branch_name || `Branch #${t.branch_id}`;
    });
    return map;
  }, [teacherList]);

  useEffect(() => {
    if (!teacherIds.length) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        console.log("Profile teacherIds:", teacherIds);

        // Har bir teacher_id bo‘yicha alohida so‘rov (RLS .in muammosidan qochish)
        const results = await Promise.all(
          teacherIds.map((tid) =>
            supabase
              .from("groups")
              .select(
                "id, name, schedule_type, lesson_time, course_id, teacher_id, branch_id, courses(name)"
              )
              .eq("teacher_id", tid)
              .order("name")
          )
        );

        let groupsData = [];
        results.forEach((res, i) => {
          if (res.error) {
            console.warn(
              `Groups error for teacher ${teacherIds[i]}:`,
              res.error.message
            );
          } else if (res.data) {
            groupsData.push(...res.data);
          }
        });

        // Join ishlamagan bo‘lsa — fallback
        if (groupsData.length === 0) {
          const fallbacks = await Promise.all(
            teacherIds.map((tid) =>
              supabase
                .from("groups")
                .select(
                  "id, name, schedule_type, lesson_time, course_id, teacher_id, branch_id"
                )
                .eq("teacher_id", tid)
                .order("name")
            )
          );
          fallbacks.forEach((res) => {
            if (!res.error && res.data) groupsData.push(...res.data);
          });
        }

        // Unique by id
        const uniqueMap = new Map();
        groupsData.forEach((g) => {
          if (g?.id) uniqueMap.set(g.id, g);
        });
        groupsData = Array.from(uniqueMap.values()).map((g) => ({
          ...g,
          branch_name:
            branchByTeacherId[String(g.teacher_id)] ||
            `Branch #${g.branch_id || "?"}`,
        }));

        console.log("Profile groups found:", groupsData.length, groupsData);

        // Students — har bir teacher_id
        let studentsData = [];
        const sResults = await Promise.all(
          teacherIds.map((tid) =>
            supabase
              .from("students")
              .select(
                "id, monthly_fee, teacher_percent, paid, is_archived, group_id, teacher_id"
              )
              .eq("teacher_id", tid)
              .eq("is_archived", false)
          )
        );
        sResults.forEach((res) => {
          if (!res.error && res.data) studentsData.push(...res.data);
        });

        // Agar students bo‘sh — group_id orqali
        if (studentsData.length === 0 && groupsData.length > 0) {
          const groupIds = groupsData.map((g) => g.id);
          const byGroup = await supabase
            .from("students")
            .select(
              "id, monthly_fee, teacher_percent, paid, is_archived, group_id, teacher_id"
            )
            .in("group_id", groupIds)
            .eq("is_archived", false);
          if (!byGroup.error) studentsData = byGroup.data || [];
        }

        if (cancelled) return;

        setGroups(groupsData);
        setStudents(studentsData);

        if (teacher?.course_id) {
          const { data: course } = await supabase
            .from("courses")
            .select("name")
            .eq("id", teacher.course_id)
            .maybeSingle();
          if (!cancelled) {
            setCourseName(
              course?.name || groupsData[0]?.courses?.name || ""
            );
          }
        } else {
          setCourseName(groupsData[0]?.courses?.name || "");
        }
      } catch (err) {
        console.error("Profile error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [teacherIds.join("|"), teacher?.id, teacher?.course_id]);

  const stats = useMemo(() => {
    let income = 0;
    let active = 0;
    students.forEach((s) => {
      if (s.paid) {
        active += 1;
        income +=
          ((Number(s.monthly_fee) || 0) * (Number(s.teacher_percent) || 0)) /
          100;
      }
    });
    return {
      groups: groups.length,
      students: students.length,
      active,
      income,
    };
  }, [groups, students]);

  const groupsByBranch = useMemo(() => {
    const map = {};
    groups.forEach((g) => {
      const key = g.branch_name || "Boshqa";
      if (!map[key]) map[key] = [];
      map[key].push(g);
    });
    return map;
  }, [groups]);

  const fullName =
    `${teacher?.first_name || ""} ${teacher?.last_name || ""}`.trim() ||
    teacher?.name ||
    "O'qituvchi";

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  if (!teacher) {
    return (
      <div className="tp-state">
        <FiUser size={32} />
        <p>O'qituvchi ma'lumotlari topilmadi</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tp-state">
        <FiLoader className="tp-spin" />
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="tp-page">
      <div className="tp-header">
        <div className="tp-header-left">
          <div className="tp-avatar">{initials || <FiUser />}</div>
          <div className="tp-header-info">
            <h1 className="tp-name">{fullName}</h1>
            <p className="tp-sub">
              {courseName || "O'qituvchi"}
              {teacher.branch_name ? ` · ${teacher.branch_name}` : ""}
            </p>
          </div>
        </div>
        <div className={`tp-status ${teacher.salary_paid ? "ok" : "wait"}`}>
          {teacher.salary_paid ? (
            <>
              <FiCheckCircle size={15} /> To'langan
            </>
          ) : (
            <>
              <FiClock size={15} /> Kutilmoqda
            </>
          )}
        </div>
      </div>

      <div className="tp-stats">
        <div className="tp-stat">
          <div className="tp-stat-icon">
            <FiUsers />
          </div>
          <div>
            <b>{stats.students}</b>
            <span>O'quvchi</span>
          </div>
        </div>
        <div className="tp-stat">
          <div className="tp-stat-icon">
            <FiCheckCircle />
          </div>
          <div>
            <b>{stats.active}</b>
            <span>Faol</span>
          </div>
        </div>
        <div className="tp-stat">
          <div className="tp-stat-icon">
            <FiDollarSign />
          </div>
          <div>
            <b>{stats.income.toLocaleString()}</b>
            <span>UZS</span>
          </div>
        </div>
      </div>

      <div className="tp-cols">
        <div className="tp-box">
          <h2>Ma'lumotlar</h2>
          <div className="tp-rows">
            <div className="tp-row">
              <span>
                <FiUser /> Ism
              </span>
              <b>{fullName}</b>
            </div>
            <div className="tp-row">
              <span>
                <FiMail /> Email
              </span>
              <b>{teacher.email || "—"}</b>
            </div>
            <div className="tp-row">
              <span>
                <FiPhone /> Telefon
              </span>
              <b>{teacher.phone || "—"}</b>
            </div>
            <div className="tp-row">
              <span>
                <FiBookOpen /> Fan
              </span>
              <b>{courseName || "—"}</b>
            </div>
            <div className="tp-row">
              <span>
                <FiMapPin /> Faol filial
              </span>
              <b>{teacher.branch_name || "—"}</b>
            </div>
            <div className="tp-row">
              <span>
                <FiCalendar /> Oxirgi to'lov
              </span>
              <b>{teacher.last_payment || "—"}</b>
            </div>
            <div className="tp-row">
              <span>
                <FiCalendar /> Keyingi to'lov
              </span>
              <b>{teacher.next_payment || "—"}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}