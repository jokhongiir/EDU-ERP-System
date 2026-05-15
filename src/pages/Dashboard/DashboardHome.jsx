import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";

import {
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiLayers,
  FiRefreshCw,
  FiTrendingUp,
} from "react-icons/fi";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import "./DashboardHome.css";

export default function DashboardHome({ activeBranch }) {
  const ownerId = activeBranch?.owner_uid; // 🔥 IMPORTANT FIX

  const [data, setData] = useState({
    stats: { students: 0, teachers: 0, courses: 0, groups: 0 },
    chartData: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ================= GLOBAL FETCH (ALL BRANCHES) =================
  const fetchDashboardData = useCallback(async () => {
    if (!ownerId) return;

    try {
      setLoading(true);

      // 🔥 1. GET ALL BRANCH IDS FOR THIS USER
      const { data: branches } = await supabase
        .from("branches")
        .select("id")
        .eq("owner_uid", ownerId);

      const branchIds = (branches || []).map((b) => b.id);

      if (branchIds.length === 0) return;

      // ================= GLOBAL COUNTS =================
      const [studentsRes, teachersRes, coursesRes, groupsRes] =
        await Promise.all([
          supabase
            .from("students")
            .select("id", { count: "exact", head: true })
            .in("branch_id", branchIds),

          supabase
            .from("teachers")
            .select("id", { count: "exact", head: true })
            .in("branch_id", branchIds),

          supabase
            .from("courses")
            .select("id", { count: "exact", head: true })
            .in("branch_id", branchIds),

          supabase
            .from("groups")
            .select("id", { count: "exact", head: true })
            .in("branch_id", branchIds),
        ]);

      // ================= COURSE CHART =================
      const { data: courses } = await supabase
        .from("courses")
        .select("id, name")
        .in("branch_id", branchIds);

      const { data: students } = await supabase
        .from("students")
        .select("course_id")
        .in("branch_id", branchIds);

      const chart = (courses || []).map((course) => ({
        name: course.name,
        count:
          students?.filter((s) => s.course_id === course.id).length || 0,
      }));

      setData({
        stats: {
          students: studentsRes.count || 0,
          teachers: teachersRes.count || 0,
          courses: coursesRes.count || 0,
          groups: groupsRes.count || 0,
        },
        chartData: chart,
      });
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const cards = [
    { label: "Students", val: data.stats.students, icon: <FiUsers />, color: "#3b82f6" },
    { label: "Teachers", val: data.stats.teachers, icon: <FiUserCheck />, color: "#10b981" },
    { label: "Courses", val: data.stats.courses, icon: <FiBookOpen />, color: "#f59e0b" },
    { label: "Groups", val: data.stats.groups, icon: <FiLayers />, color: "#ef4444" },
  ];

  return (
    <div className="dash-wrapper">

      <div className="dash-header">
        <div>
          <h1>Analytics Overview</h1>
          <p>All Branches Summary</p>
        </div>

        <button
          className={`refresh-action ${refreshing ? "spinning" : ""}`}
          onClick={() => {
            setRefreshing(true);
            fetchDashboardData();
          }}
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="stats-container">
        {cards.map((c, i) => (
          <div key={i} className="stat-card" style={{ borderColor: c.color }}>
            <div className="icon">{c.icon}</div>
            <div>
              <h4>{c.label}</h4>
              <h2>{loading ? "..." : c.val}</h2>
            </div>
            <FiTrendingUp className="trend" />
          </div>
        ))}
      </div>

      {/* CHART */}
      <div className="chart-section">
        <h3>Course Activity (All Branches)</h3>

        <div className="chart-box">
          {loading ? (
            <div className="loading-skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}