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
  FiGift,
  FiDollarSign,
  FiArchive,
  FiHome,
} from "react-icons/fi";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./DashboardHome.css";

export default function DashboardHome({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    paidStudents: 0,
    freeStudents: 0,
    archivedStudents: 0,
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

      const [
        allStudentsRes,
        paidStudentsRes,
        freeStudentsRes,
        archivedRes,
        teachersRes,
        coursesRes,
        groupsRes,
      ] = await Promise.all([
        supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branchId)
          .eq("is_archived", false),
        supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branchId)
          .eq("is_archived", false)
          .eq("is_free", false),
        supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branchId)
          .eq("is_archived", false)
          .eq("is_free", true),
        supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branchId)
          .eq("is_archived", true),
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
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branchId),
      ]);

      const { data: studentsData } = await supabase
        .from("students")
        .select("id, course_id, is_free")
        .eq("branch_id", branchId)
        .eq("is_archived", false);

      const teachers = teachersRes.data || [];
      const courses = coursesRes.data || [];
      const students = studentsData || [];

      const chartData = courses.map((course) => {
        const courseStudents = students.filter((s) => s.course_id === course.id);
        return {
          name: course.name?.length > 12 ? course.name.slice(0, 12) + "…" : course.name,
          fullName: course.name,
          students: courseStudents.length,
          paid: courseStudents.filter((s) => !s.is_free).length,
          free: courseStudents.filter((s) => s.is_free).length,
        };
      });

      setDashboardData({
        totalStudents: allStudentsRes.count || 0,
        paidStudents: paidStudentsRes.count || 0,
        freeStudents: freeStudentsRes.count || 0,
        archivedStudents: archivedRes.count || 0,
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

  const mainCards = useMemo(
    () => [
      {
        title: "Total Students",
        value: dashboardData.totalStudents,
        icon: <FiUsers size={22} />,
        color: "#3b82f6",
        subtitle: "All active students",
      },
      {
        title: "Paid Students",
        value: dashboardData.paidStudents,
        icon: <FiDollarSign size={22} />,
        color: "#10b981",
        subtitle: "Paying students",
      },
      {
        title: "Free Students",
        value: dashboardData.freeStudents,
        icon: <FiGift size={22} />,
        color: "#8b5cf6",
        subtitle: "Free / Trial",
      },
      {
        title: "Active Teachers",
        value: dashboardData.teachers,
        icon: <FiUserCheck size={22} />,
        color: "#f59e0b",
        subtitle: "Teaching staff",
      },
    ],
    [dashboardData]
  );

  const secondaryCards = useMemo(
    () => [
      {
        title: "Courses",
        value: dashboardData.courses,
        icon: <FiBookOpen size={20} />,
        color: "#06b6d4",
      },
      {
        title: "Groups",
        value: dashboardData.groups,
        icon: <FiLayers size={20} />,
        color: "#ef4444",
      },
      {
        title: "Archived",
        value: dashboardData.archivedStudents,
        icon: <FiArchive size={20} />,
        color: "#64748b",
      },
    ],
    [dashboardData]
  );

  const pieData = useMemo(() => {
    const paid = dashboardData.paidStudents;
    const free = dashboardData.freeStudents;
    if (paid === 0 && free === 0) return [];
    return [
      { name: "Paid", value: paid, color: "#10b981" },
      { name: "Free", value: free, color: "#8b5cf6" },
    ];
  }, [dashboardData.paidStudents, dashboardData.freeStudents]);

  if (!branchId) {
    return (
      <div className="dh-empty-wrapper">
        <div className="dh-empty">
          <div className="dh-empty__icon">
            <FiBarChart2 size={32} />
          </div>
          <h2>No Branch Selected</h2>
          <p>
            Please choose a branch from the top navigation to view real-time
            analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dh">
      {/* Header */}
      <div className="dh-header">
        <div className="dh-header__text">
          <h1>{activeBranch?.name} · Dashboard</h1>
          <p>Real-time analytics & branch performance</p>
        </div>

        <button
          className={`dh-refresh ${refreshing ? "is-refreshing" : ""}`}
          onClick={handleRefresh}
          disabled={refreshing || loading}
          title="Refresh data"
          aria-label="Refresh dashboard"
        >
          <FiRefreshCw size={18} />
        </button>
      </div>

      {/* Main Stats */}
      <div className="dh-stats">
        {mainCards.map((card) => (
          <div
            key={card.title}
            className="dh-stat"
            style={{ "--accent": card.color }}
          >
            <div className="dh-stat__top">
              <div className="dh-stat__icon">{card.icon}</div>
              <div className="dh-stat__badge">
                <FiTrendingUp size={12} />
                <span>Live</span>
              </div>
            </div>

            <div className="dh-stat__body">
              <h4>{card.title}</h4>
              {loading ? (
                <div className="dh-shimmer dh-shimmer--value" />
              ) : (
                <h2>{card.value.toLocaleString()}</h2>
              )}
              <p>{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="dh-secondary">
        {secondaryCards.map((card) => (
          <div key={card.title} className="dh-secondary__card">
            <div
              className="dh-secondary__icon"
              style={{ background: `${card.color}15`, color: card.color }}
            >
              {card.icon}
            </div>
            <div>
              <h4>{card.title}</h4>
              {loading ? (
                <div className="dh-shimmer dh-shimmer--sm" />
              ) : (
                <h3>{card.value.toLocaleString()}</h3>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="dh-charts">
        {/* Area Chart */}
        <div className="dh-card dh-chart">
          <div className="dh-card__header">
            <div>
              <h3>Students by Course</h3>
              <p>Enrollment distribution</p>
            </div>
          </div>

          <div className="dh-chart__body">
            {loading ? (
              <div className="dh-shimmer dh-shimmer--chart" />
            ) : dashboardData.chartData.length === 0 ? (
              <div className="dh-empty-text">No course data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={dashboardData.chartData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="studentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
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
                      background: "#0f172a",
                      borderRadius: 12,
                      border: "none",
                      padding: "10px 14px",
                    }}
                    itemStyle={{ color: "#fff", fontSize: 13, fontWeight: 600 }}
                    labelStyle={{
                      color: "#94a3b8",
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 4,
                      textTransform: "uppercase",
                    }}
                    formatter={(value, name, props) => [
                      value,
                      props.payload.fullName || name,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#studentGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="dh-card dh-pie">
          <div className="dh-card__header">
            <div>
              <h3>Paid vs Free</h3>
              <p>Student type breakdown</p>
            </div>
          </div>

          <div className="dh-pie__body">
            {loading ? (
              <div className="dh-shimmer dh-shimmer--pie" />
            ) : pieData.length === 0 ? (
              <div className="dh-empty-text">No data available</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        borderRadius: 10,
                        border: "none",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="dh-pie__legend">
                  {pieData.map((item) => (
                    <div key={item.name} className="dh-pie__item">
                      <span
                        className="dh-pie__dot"
                        style={{ background: item.color }}
                      />
                      <span className="dh-pie__label">{item.name}</span>
                      <span className="dh-pie__value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Lists */}
      <div className="dh-lists">
        {/* Teachers */}
        <div className="dh-card dh-list">
          <div className="dh-list__header">
            <div className="dh-list__icon teachers">
              <FiUserCheck size={18} />
            </div>
            <div>
              <h3>Latest Teachers</h3>
              <p>Recently added</p>
            </div>
          </div>

          <div className="dh-list__body">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="dh-list__skeleton">
                  <div className="dh-shimmer dh-shimmer--avatar" />
                  <div className="dh-list__skeleton-text">
                    <div className="dh-shimmer dh-shimmer--title" />
                    <div className="dh-shimmer dh-shimmer--sub" />
                  </div>
                </div>
              ))
            ) : dashboardData.latestTeachers.length === 0 ? (
              <div className="dh-empty-text">No teachers yet</div>
            ) : (
              dashboardData.latestTeachers.map((t) => (
                <div key={t.id} className="dh-list__item">
                  <div className="dh-list__avatar teacher">
                    <FiUserCheck size={18} />
                  </div>
                  <div>
                    <h4>{t.name}</h4>
                    <p>Faculty Member</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Courses */}
        <div className="dh-card dh-list">
          <div className="dh-list__header">
            <div className="dh-list__icon courses">
              <FiBookOpen size={18} />
            </div>
            <div>
              <h3>Latest Courses</h3>
              <p>Recently created</p>
            </div>
          </div>

          <div className="dh-list__body">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="dh-list__skeleton">
                  <div className="dh-shimmer dh-shimmer--avatar" />
                  <div className="dh-list__skeleton-text">
                    <div className="dh-shimmer dh-shimmer--title" />
                    <div className="dh-shimmer dh-shimmer--sub" />
                  </div>
                </div>
              ))
            ) : dashboardData.latestCourses.length === 0 ? (
              <div className="dh-empty-text">No courses yet</div>
            ) : (
              dashboardData.latestCourses.map((c) => (
                <div key={c.id} className="dh-list__item">
                  <div className="dh-list__avatar course">
                    <FiBookOpen size={18} />
                  </div>
                  <div>
                    <h4>{c.name}</h4>
                    <p>
                      <FiHome size={12} /> {activeBranch?.name}
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