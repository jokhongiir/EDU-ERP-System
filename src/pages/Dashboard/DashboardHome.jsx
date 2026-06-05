import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../../services/supabaseClient";

import {
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiLayers,
  FiRefreshCw,
  FiTrendingUp,
  FiBarChart2,
  FiHome,
  FiCalendar,
} from "react-icons/fi";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import "./DashboardHome.css";

export default function DashboardHome({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    groups: 0,
    chartData: [],
    latestTeachers: [],
    latestCourses: [],
  });

  const fetchDashboardData = useCallback(async () => {
    if (!branchId) return;

    try {
      setLoading(true);

      const [studentsRes, teachersRes, coursesRes, groupsRes] =
        await Promise.all([
          supabase
            .from("students")
            .select("*", { count: "exact" })
            .eq("branch_id", branchId),
          supabase
            .from("teachers")
            .select("*", { count: "exact" })
            .eq("branch_id", branchId)
            .order("created_at", { ascending: false }),
          supabase
            .from("courses")
            .select("*", { count: "exact" })
            .eq("branch_id", branchId)
            .order("created_at", { ascending: false }),
          supabase
            .from("groups")
            .select("*", { count: "exact" })
            .eq("branch_id", branchId),
        ]);

      const students = studentsRes.data || [];
      const teachers = teachersRes.data || [];
      const courses = coursesRes.data || [];

      const chartData = courses.map((course) => ({
        name: course.name,
        students: students.filter((s) => s.course_id === course.id).length,
      }));

      setDashboardData({
        students: studentsRes.count || 0,
        teachers: teachersRes.count || 0,
        courses: coursesRes.count || 0,
        groups: groupsRes.count || 0,
        chartData,
        latestTeachers: teachers.slice(0, 5),
        latestCourses: courses.slice(0, 5),
      });
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  const handleRefresh = async () => {
    if (refreshing || loading) return;
    setRefreshing(true);
    await fetchDashboardData();
  };
  const cards = useMemo(
    () => [
      {
        title: "Total Students",
        value: dashboardData.students,
        icon: <FiUsers />,
        color: "#3b82f6",
      },
      {
        title: "Active Teachers",
        value: dashboardData.teachers,
        icon: <FiUserCheck />,
        color: "#10b981",
      },
      {
        title: "Available Courses",
        value: dashboardData.courses,
        icon: <FiBookOpen />,
        color: "#f59e0b",
      },
      {
        title: "Active Groups",
        value: dashboardData.groups,
        icon: <FiLayers />,
        color: "#ef4444",
      },
    ],
    [dashboardData],
  );

  if (!branchId) {
    return (
      <div className="dashboard-empty-wrapper">
        <div className="dashboard-empty">
          <div className="empty-icon-box">
            <FiBarChart2 className="empty-icon" />
          </div>
          <h2>No Branch Selected</h2>
          <p>
            Please choose a specific branch from the system to load real-time
            analytics data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      <div className="dashboard-header">
        <div className="header-title-box">
          <h1>{activeBranch?.name} • Dashboard</h1>
          <p>Real-time analytics and branch performance overview</p>
        </div>

        <button
          className={`refresh-icon-btn ${refreshing ? "refreshing" : ""}`}
          onClick={handleRefresh}
          disabled={refreshing || loading}
          title="Refresh Dashboard Data"
        >
          <FiRefreshCw />
        </button>
      </div>

      <div className="dashboard-stats-grid">
        {cards.map((card, i) => (
          <div
            key={i}
            className="dashboard-stat-card"
            style={{ borderTop: `4px solid ${card.color}` }}
          >
            <div className="dashboard-stat-top">
              <div
                className="dashboard-stat-icon-wrapper"
                style={{
                  background: `${card.color}12`,
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
              <div className="dashboard-trend-badge">
                <FiTrendingUp />
                <span>Live</span>
              </div>
            </div>

            <div className="dashboard-stat-content">
              <h4>{card.title}</h4>
              {loading ? (
                <div className="shimmer sk-stat-value"></div>
              ) : (
                <h2>{card.value.toLocaleString()}</h2>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-chart-card">
        <div className="dashboard-chart-header">
          <div>
            <h3>Students Distribution</h3>
            <p>Visual representation of student enrollment per course</p>
          </div>
        </div>

        <div className="dashboard-chart-wrapper">
          {loading ? (
            <div className="chart-skeleton-container">
              <div className="shimmer sk-chart-line"></div>
              <div className="shimmer sk-chart-bar"></div>
            </div>
          ) : dashboardData.chartData.length === 0 ? (
            <div className="dashboard-empty-text-mid">
              No statistics available for this branch's courses.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={dashboardData.chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="studentGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    padding: "10px 14px",
                  }}
                  itemStyle={{
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                  labelStyle={{
                    color: "#94a3b8",
                    fontSize: "11px",
                    fontWeight: "700",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="students"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#studentGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="dashboard-list-card">
          <div className="dashboard-list-header">
            <div className="list-header-icon teachers-sec">
              <FiUserCheck />
            </div>
            <div>
              <h3>Latest Recruited Teachers</h3>
              <p>Recently onboarded instructors</p>
            </div>
          </div>

          <div className="dashboard-list-body">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="dashboard-list-item-skeleton">
                  <div className="shimmer sk-list-avatar"></div>
                  <div className="sk-list-text-block">
                    <div className="shimmer sk-list-title"></div>
                    <div className="shimmer sk-list-subtitle"></div>
                  </div>
                </div>
              ))
            ) : dashboardData.latestTeachers.length === 0 ? (
              <div className="dashboard-list-empty-box">
                <p className="dashboard-empty-text">
                  No teachers registered yet
                </p>
              </div>
            ) : (
              dashboardData.latestTeachers.map((teacher) => (
                <div key={teacher.id} className="dashboard-list-item">
                  <div className="dashboard-list-avatar teacher-av">
                    <FiUserCheck />
                  </div>
                  <div className="list-item-meta">
                    <h4>{teacher.name}</h4>
                    <p>Professional Faculty Member</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-list-card">
          <div className="dashboard-list-header">
            <div className="list-header-icon courses-sec">
              <FiBookOpen />
            </div>
            <div>
              <h3>Newly Launched Courses</h3>
              <p>Latest academic programs added</p>
            </div>
          </div>

          <div className="dashboard-list-body">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="dashboard-list-item-skeleton">
                  <div className="shimmer sk-list-avatar"></div>
                  <div className="sk-list-text-block">
                    <div className="shimmer sk-list-title"></div>
                    <div className="shimmer sk-list-subtitle"></div>
                  </div>
                </div>
              ))
            ) : dashboardData.latestCourses.length === 0 ? (
              <div className="dashboard-list-empty-box">
                <p className="dashboard-empty-text">No courses created yet</p>
              </div>
            ) : (
              dashboardData.latestCourses.map((course) => (
                <div key={course.id} className="dashboard-list-item">
                  <div className="dashboard-list-avatar course-av">
                    <FiBookOpen />
                  </div>
                  <div className="list-item-meta">
                    <h4>{course.name}</h4>
                    <p>
                      <FiHome className="meta-icon" /> {activeBranch?.name}{" "}
                      Branch
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
