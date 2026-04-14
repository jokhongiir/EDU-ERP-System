import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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
    <div className="dashboard-home">
      <h1>Dashboard - {activeBranch?.name || "Loading..."}</h1>

      <div className="stats">
        {["students", "teachers", "courses", "groups"].map((key) => (
          <div className="card" key={key}>
            <p>{key.charAt(0).toUpperCase() + key.slice(1)}</p>
            <h2>{loading ? "..." : stats[key]}</h2>
          </div>
        ))}
      </div>

      <div className="chart">
        <h3>Course Analytics</h3>
        {loading ? (
          <div className="skeleton-chart"></div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseProgress}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="students" fill="#376fff" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}