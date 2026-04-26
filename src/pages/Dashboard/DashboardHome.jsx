import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiLayers,
  FiRefreshCw,
} from "react-icons/fi";

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
  const branchId = activeBranch?.id;

  // ================= STATE =================
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    groups: 0,
  });

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ================= FETCH DATA =================
  const fetchDashboard = useCallback(async () => {
    if (!branchId) return;

    try {
      setLoading(true);
      setError(null);

      const [students, teachers, courses, groups] = await Promise.all([
        supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branchId),

        supabase
          .from("teachers")
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branchId),

        supabase
          .from("courses")
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branchId),

        supabase
          .from("groups")
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branchId),
      ]);

      setStats({
        students: students.count || 0,
        teachers: teachers.count || 0,
        courses: courses.count || 0,
        groups: groups.count || 0,
      });

      // ================= CHART =================
      const { data: courseList, error } = await supabase
        .from("courses")
        .select("id, name")
        .eq("branch_id", branchId);

      if (error) throw error;

      const result = await Promise.all(
        (courseList || []).map(async (c) => {
          const { count } = await supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("course_id", c.id);

          return {
            name: c.name,
            students: count || 0,
          };
        })
      );

      setChartData(result);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while loading dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ================= REFRESH =================
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  // ================= CARDS =================
  const cards = [
    {
      label: "Students",
      value: stats.students,
      icon: <FiUsers />,
      color: "#3b82f6",
    },
    {
      label: "Teachers",
      value: stats.teachers,
      icon: <FiUserCheck />,
      color: "#10b981",
    },
    {
      label: "Courses",
      value: stats.courses,
      icon: <FiBookOpen />,
      color: "#f59e0b",
    },
    {
      label: "Groups",
      value: stats.groups,
      icon: <FiLayers />,
      color: "#ef4444",
    },
  ];

  // ================= UI =================
  return (
    <div className="dash">

      {/* HEADER */}
      <div className="dash__header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>{activeBranch?.name || "No branch selected"}</p>
        </div>

        <button
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FiRefreshCw className={refreshing ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && <div className="dash__error">{error}</div>}

      {/* ================= STATS ================= */}
      <div className="dash__grid">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="dash__card skeleton" />
            ))
          : cards.map((c) => (
              <div key={c.label} className="dash__card">
                <div
                  className="dash__icon"
                  style={{ background: c.color }}
                >
                  {c.icon}
                </div>

                <div>
                  <span className="dash__label">{c.label}</span>
                  <h2 className="dash__value">{c.value}</h2>
                </div>
              </div>
            ))}
      </div>

      {/* ================= CHART ================= */}
      <div className="dash__chart">
        <div className="dash__chart-header">
          <h3>Course Analytics</h3>
          <span>Students per course</span>
        </div>

        {loading ? (
          <div className="dash__skeleton" />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="students"
                fill="#3b82f6"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}