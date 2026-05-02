import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import { FiUsers, FiUserCheck, FiBookOpen, FiLayers, FiRefreshCw, FiTrendingUp } from "react-icons/fi";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "./DashboardHome.css";

export default function DashboardHome({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [data, setData] = useState({
    stats: { students: 0, teachers: 0, courses: 0, groups: 0 },
    chartData: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!branchId) return;
    try {
      setLoading(true);

      // Barcha asosiy countlarni va chart uchun kerakli datalarni bir yo'la olamiz
      const [st, tc, co, gr, allSt] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("branch_id", branchId),
        supabase.from("teachers").select("id", { count: "exact", head: true }).eq("branch_id", branchId),
        supabase.from("courses").select("id, name").eq("branch_id", branchId),
        supabase.from("groups").select("id", { count: "exact", head: true }).eq("branch_id", branchId),
        supabase.from("students").select("course_id").eq("branch_id", branchId)
      ]);

      // Chart ma'lumotlarini JS yordamida hisoblaymiz (Bazaga ortiqcha yuk tushmaydi)
      const chartMap = co.data?.map(course => ({
        name: course.name,
        count: allSt.data?.filter(s => s.course_id === course.id).length || 0
      })) || [];

      setData({
        stats: {
          students: st.count || 0,
          teachers: tc.count || 0,
          courses: co.data?.length || 0,
          groups: gr.count || 0,
        },
        chartData: chartMap.sort((a, b) => b.count - a.count)
      });
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const cards = [
    { label: "Talabalar", val: data.stats.students, icon: <FiUsers />, color: "var(--blue)" },
    { label: "O'qituvchilar", val: data.stats.teachers, icon: <FiUserCheck />, color: "var(--emerald)" },
    { label: "Kurslar", val: data.stats.courses, icon: <FiBookOpen />, color: "var(--amber)" },
    { label: "Guruhlar", val: data.stats.groups, icon: <FiLayers />, color: "var(--rose)" },
  ];

  return (
    <div className="dash-wrapper">
      {/* HEADER */}
      <div className="dash-header">
        <div className="header-info">
          <h1>Tahliliy Ma'lumotlar</h1>
          <p>{activeBranch?.name || "Filial tanlanmagan"}</p>
        </div>
        <button 
          className={`refresh-action ${refreshing ? "spinning" : ""}`} 
          onClick={() => { setRefreshing(true); fetchDashboardData(); }}
        >
          <FiRefreshCw /> {refreshing ? "Yangilanmoqda..." : "Yangilash"}
        </button>
      </div>

      {/* STATS GRID */}
      <div className="stats-container">
        {cards.map((c, i) => (
          <div key={i} className="stat-glass-card" style={{"--accent": c.color}}>
            <div className="stat-content">
              <div className="stat-icon-box">{c.icon}</div>
              <div className="stat-text">
                <span className="stat-label">{c.label}</span>
                <h2 className="stat-number">{loading ? "..." : c.val}</h2>
              </div>
            </div>
            <FiTrendingUp className="stat-deco" />
          </div>
        ))}
      </div>

      {/* CHART SECTION */}
      <div className="chart-section">
        <div className="chart-info">
          <h3>O'quv Yo'nalishlari Faolligi</h3>
          <p>Kurslar bo'yicha talabalar taqsimoti</p>
        </div>

        <div className="chart-canvas">
          {loading ? <div className="chart-skeleton" /> : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data.chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--blue)" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}