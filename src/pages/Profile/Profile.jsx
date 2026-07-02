import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiMail,
  FiHome,
  FiUsers,
  FiBookOpen,
  FiLayers,
  FiAward,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiActivity,
  FiMapPin,
  FiCheckCircle,
  FiCalendar,
  FiTarget,
  FiCreditCard,
  FiAlertCircle,
  FiPieChart,
} from "react-icons/fi";
import "./Profile.css";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    centerName: "",
    email: "",
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalGroups: 0,
    totalBranches: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalProfit: 0,
    paidStudents: 0,
    unpaidStudents: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlyProfit: 0,
    branches: [],
    recentPayments: [],
  });

  const formatMoney = (num = 0) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return {
      month: now.getMonth(),
      year: now.getFullYear(),
    };
  };

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const { data: branches } = await supabase
        .from("branches")
        .select("*")
        .eq("owner_uid", user.id);
      const branchIds = branches?.map((b) => b.id) || [];

      const [studentsRes, teachersRes, coursesRes, groupsRes] =
        await Promise.all([
          supabase.from("students").select("*").in("branch_id", branchIds),
          supabase.from("teachers").select("*").in("branch_id", branchIds),
          supabase.from("courses").select("*").in("branch_id", branchIds),
          supabase.from("groups").select("*").in("branch_id", branchIds),
        ]);

      const students = studentsRes.data || [];
      const teachers = teachersRes.data || [];
      const paidStudents = students.filter((s) => s.paid);
      const unpaidStudents = students.filter((s) => !s.paid);

      const totalIncome =
        paidStudents.reduce((sum, s) => sum + (s.monthly_fee || 0), 0) || 0;
      const totalExpense =
        students.reduce((sum, s) => {
          const fee = Number(s.monthly_fee) || 0;
          const percent = Number(s.teacher_percent) || 0;
          return sum + (fee * percent) / 100;
        }, 0) || 0;
      const totalProfit = totalIncome - totalExpense;

      const { month, year } = getCurrentMonth();
      const monthlyStudents = students.filter((s) => {
        if (!s.payment_date) return false;
        const date = new Date(s.payment_date);
        return date.getMonth() === month && date.getFullYear() === year;
      });

      const monthlyIncome = monthlyStudents.reduce(
        (sum, s) => sum + (s.monthly_fee || 0),
        0,
      );
      const monthlyExpense = monthlyStudents.reduce((sum, s) => {
        const fee = Number(s.monthly_fee) || 0;
        const percent = Number(s.teacher_percent) || 0;
        return sum + (fee * percent) / 100;
      }, 0);
      const monthlyProfit = monthlyIncome - monthlyExpense;

      const branchStats =
        branches?.map((branch) => {
          const branchStudents = students.filter(
            (s) => s.branch_id === branch.id,
          );
          const branchTeachers = teachers.filter(
            (t) => t.branch_id === branch.id,
          );
          const branchIncome = branchStudents
            .filter((s) => s.paid)
            .reduce((sum, s) => sum + (s.monthly_fee || 0), 0);
          return {
            ...branch,
            students: branchStudents.length,
            teachers: branchTeachers.length,
            income: branchIncome,
          };
        }) || [];

      const recentPayments = students
        .filter((s) => s.paid)
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
        .slice(0, 5);

      setProfileData({
        centerName: user.user_metadata?.centerName || "Education ERP",
        email: user.email || "",
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalCourses: coursesRes.data?.length || 0,
        totalGroups: groupsRes.data?.length || 0,
        totalBranches: branches?.length || 0,
        totalIncome,
        totalExpense,
        totalProfit,
        monthlyIncome,
        monthlyExpense,
        monthlyProfit,
        paidStudents: paidStudents.length,
        unpaidStudents: unpaidStudents.length,
        branches: branchStats,
        recentPayments,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const profitStatus = useMemo(() => {
    return profileData.totalProfit >= 0 ? "profit" : "loss";
  }, [profileData.totalProfit]);

  // 💀 SKELETON LOADING TEMPLATE
  if (loading) {
    return (
      <div className="erp-profile-page skeleton-active">
        <div className="erp-profile-top">
          <div className="profile-main-left">
            <div className="erp-avatar pr-skeleton shimmer"></div>
            <div className="skeleton-text-group">
              <div className="pr-skeleton shimmer s-title"></div>
              <div className="pr-skeleton shimmer s-subtitle"></div>
            </div>
          </div>
        </div>
        <div className="erp-global-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="erp-stat-box pr-skeleton shimmer"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="erp-profile-page">
      {/* 👤 TOP HEADER SECTION */}
      <div className="erp-profile-top">
        <div className="profile-main-left">
          <div className="erp-avatar">{profileData.centerName?.charAt(0)}</div>
          <div className="profile-header-info">
            <h1>{profileData.centerName}</h1>
            <p className="subheading">Advanced Financial ERP Dashboard</p>
            <div className="erp-contact-row">
              <div className="contact-pill">
                <FiMail />
                <span>{profileData.email}</span>
              </div>
              <div className="contact-pill">
                <FiMapPin />
                <span>Tashkent, Uzbekistan</span>
              </div>
            </div>
          </div>
        </div>

        {/* 💰 GLOBAL NET PROFIT CARD */}
        <div className={`erp-profit-box ${profitStatus}`}>
          <div className="profit-icon">
            {profitStatus === "profit" ? <FiTrendingUp /> : <FiTrendingDown />}
          </div>
          <div className="profit-value-stack">
            <h2>{formatMoney(profileData.totalProfit)} UZS</h2>
            <p>Net Total Profit</p>
          </div>
        </div>
      </div>

      {/* 📊 CORE STATS COUNTER GRID */}
      <div className="erp-global-grid">
        <div className="erp-stat-box">
          <div className="stat-icon-box">
            <FiUsers />
          </div>
          <div className="stat-meta">
            <h2>{profileData.totalStudents}</h2>
            <p>Total Students</p>
          </div>
        </div>
        <div className="erp-stat-box">
          <div className="stat-icon-box">
            <FiAward />
          </div>
          <div className="stat-meta">
            <h2>{profileData.totalTeachers}</h2>
            <p>Total Teachers</p>
          </div>
        </div>
        <div className="erp-stat-box">
          <div className="stat-icon-box">
            <FiBookOpen />
          </div>
          <div className="stat-meta">
            <h2>{profileData.totalCourses}</h2>
            <p>Total Courses</p>
          </div>
        </div>
        <div className="erp-stat-box">
          <div className="stat-icon-box">
            <FiLayers />
          </div>
          <div className="stat-meta">
            <h2>{profileData.totalGroups}</h2>
            <p>Total Groups</p>
          </div>
        </div>
        <div className="erp-stat-box income">
          <div className="stat-icon-box">
            <FiTrendingUp />
          </div>
          <div className="stat-meta">
            <h2>{formatMoney(profileData.totalIncome)}</h2>
            <p>Total Income</p>
          </div>
        </div>
        <div className="erp-stat-box expense">
          <div className="stat-icon-box">
            <FiTrendingDown />
          </div>
          <div className="stat-meta">
            <h2>{formatMoney(profileData.totalExpense)}</h2>
            <p>Total Expense</p>
          </div>
        </div>
      </div>

      {/* 📈 CURRENT MONTH FINANCIAL ANALYTICS */}
      <div className="section-block-title">
        <FiPieChart /> <h2>Monthly Analytics (Current Period)</h2>
      </div>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-top">
            <FiCalendar />
            <span>Monthly Revenue</span>
          </div>
          <h2>
            {formatMoney(profileData.monthlyIncome)}{" "}
            <span className="currency">UZS</span>
          </h2>
        </div>
        <div className="analytics-card expense-variant">
          <div className="analytics-top">
            <FiCreditCard />
            <span>Teacher Expense</span>
          </div>
          <h2>
            {formatMoney(profileData.monthlyExpense)}{" "}
            <span className="currency">UZS</span>
          </h2>
        </div>
        <div className="analytics-card success-variant">
          <div className="analytics-top">
            <FiTarget />
            <span>Pure Profit</span>
          </div>
          <h2>
            {formatMoney(profileData.monthlyProfit)}{" "}
            <span className="currency">UZS</span>
          </h2>
        </div>
      </div>

      {/* 💳 STUDENT PAYMENT RATIO STRIP */}
      <div className="payment-status-grid">
        <div className="payment-box paid">
          <div className="p-icon">
            <FiCheckCircle />
          </div>
          <div className="p-meta">
            <h2>{profileData.paidStudents}</h2>
            <p>Paid Students</p>
          </div>
        </div>
        <div className="payment-box unpaid">
          <div className="p-icon">
            <FiAlertCircle />
          </div>
          <div className="p-meta">
            <h2>{profileData.unpaidStudents}</h2>
            <p>Unpaid Students</p>
          </div>
        </div>
      </div>

      {/* 🏢 BRANCHES PERFORMANCE OVERVIEW */}
      <div className="erp-section-box">
        <div className="section-title">
          <div className="title-left">
            <FiHome />
            <h2>Branch Financial Overview</h2>
          </div>
        </div>
        {profileData.branches.length === 0 ? (
          <p className="no-data-msg">No branches available for this account.</p>
        ) : (
          <div className="branches-grid">
            {profileData.branches.map((branch) => (
              <div key={branch.id} className="branch-card">
                <div className="branch-top">
                  <h3>{branch.name}</h3>
                  <span className="active-badge">Active</span>
                </div>
                <div className="branch-info-stack">
                  <div className="branch-stat-line">
                    <FiUsers />
                    <span>{branch.students} Students</span>
                  </div>
                  <div className="branch-stat-line">
                    <FiAward />
                    <span>{branch.teachers} Teachers</span>
                  </div>
                  <div className="branch-stat-line income-text">
                    <FiDollarSign />
                    <strong>{formatMoney(branch.income)} UZS</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ⏱️ RECENT INCOMING TRANSACTIONS */}
      <div className="erp-section-box">
        <div className="section-title">
          <div className="title-left">
            <FiActivity />
            <h2>Recent Payments</h2>
          </div>
        </div>
        {profileData.recentPayments.length === 0 ? (
          <p className="no-data-msg">No recent successful payments found.</p>
        ) : (
          <div className="recent-payments-list">
            {profileData.recentPayments.map((student, idx) => (
              <div key={idx} className="payment-row">
                <div className="payment-user">
                  <div className="mini-avatar">
                    {student.first_name?.charAt(0) || "S"}
                  </div>
                  <div className="user-details">
                    <h4>
                      {student.first_name} {student.last_name}
                    </h4>
                    <p>Payment successfully processed</p>
                  </div>
                </div>
                <div className="payment-right">
                  <strong>+{formatMoney(student.monthly_fee)} UZS</strong>
                  <span>{student.payment_date || "N/A"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
