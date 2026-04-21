import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./DashboardHome.css";

export default function DashboardHome({ activeBranch }) {
  const [stats, setStats] = useState({});
  const [courseProgress, setCourseProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!activeBranch) return;
    setLoading(true);

    const [students, teachers, courses, groups] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }).eq("branch_id", activeBranch.id),
      supabase.from("teachers").select("*", { count: "exact", head: true }).eq("branch_id", activeBranch.id),
      supabase.from("courses").select("*", { count: "exact", head: true }).eq("branch_id", activeBranch.id),
      supabase.from("groups").select("*", { count: "exact", head: true }).eq("branch_id", activeBranch.id),
    ]);

    setStats({
      students: students.count || 0,
      teachers: teachers.count || 0,
      courses: courses.count || 0,
      groups: groups.count || 0,
    });

    const { data: courseList } = await supabase
      .from("courses")
      .select("id, name")
      .eq("branch_id", activeBranch.id);

    const progress = await Promise.all(
      (courseList || []).map(async (c) => {
        const { count } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("course_id", c.id);

        return { name: c.name, students: count || 0 };
      })
    );

    setCourseProgress(progress);
    setLoading(false);
  }, [activeBranch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="dash">

      {/* HEADER */}
      <div className="dash__header">
        <h1>Dashboard Overview</h1>
        <p>{activeBranch?.name || "Select a branch"}</p>
      </div>

      {/* STATS */}
      <div className="dash__grid">
        {["students", "teachers", "courses", "groups"].map((key) => (
          <div className="dash__card" key={key}>
            <span className="dash__label">
              {key.toUpperCase()}
            </span>
            <h2 className="dash__value">
              {loading ? "..." : stats[key]}
            </h2>
          </div>
        ))}
      </div>

      {/* CHART */}
      <div className="dash__chart">
        <div className="dash__chart-header">
          <h3>Course Analytics</h3>
          <span>Students per course</span>
        </div>

        {loading ? (
          <div className="dash__skeleton" />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={courseProgress}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="students" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}