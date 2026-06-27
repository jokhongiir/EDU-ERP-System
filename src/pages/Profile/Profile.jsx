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
  FiClock,
  FiBarChart2,
  FiPieChart,
  FiCalendar,
  FiTarget,
  FiCreditCard,
  FiAlertCircle,
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
    if (profileData.totalProfit > 0) return "profit";

    return "loss";
  }, [profileData.totalProfit]);


  return (
    <div className="erp-profile-page">

      <div className="erp-profile-top">
        <div className="profile-main-left">
          <div className="erp-avatar">{profileData.centerName?.charAt(0)}</div>

          <div>
            <h1>{profileData.centerName}</h1>

            <p>Advanced Financial ERP Dashboard</p>

            <div className="erp-contact-row">
              <div className="contact-pill">
                <FiMail />
                {profileData.email}
              </div>

              <div className="contact-pill">
                <FiMapPin />
                Tashkent, Uzbekistan
              </div>
            </div>
          </div>
        </div>

        <div className="erp-profit-box">
          <div className="profit-icon">
            {profitStatus === "profit" ? <FiTrendingUp /> : <FiTrendingDown />}
          </div>

          <div>
            <h2>{formatMoney(profileData.totalProfit)} UZS</h2>

            <p>Net Total Profit</p>
          </div>
        </div>
      </div>

      <div className="erp-global-grid">
        <div className="erp-stat-box">
          <FiUsers />

          <h2>{profileData.totalStudents}</h2>

          <p>Total Students</p>
        </div>

        <div className="erp-stat-box">
          <FiAward />

          <h2>{profileData.totalTeachers}</h2>

          <p>Total Teachers</p>
        </div>

        <div className="erp-stat-box">
          <FiBookOpen />

          <h2>{profileData.totalCourses}</h2>

          <p>Total Courses</p>
        </div>

        <div className="erp-stat-box">
          <FiLayers />

          <h2>{profileData.totalGroups}</h2>

          <p>Total Groups</p>
        </div>

        <div className="erp-stat-box income">
          <FiTrendingUp />

          <h2>{formatMoney(profileData.totalIncome)}</h2>

          <p>Total Income</p>
        </div>

        <div className="erp-stat-box expense">
          <FiTrendingDown />

          <h2>{formatMoney(profileData.totalExpense)}</h2>

          <p>Total Expense</p>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-top">
            <FiCalendar />
            <span>Monthly Revenue</span>
          </div>

          <h2>{formatMoney(profileData.monthlyIncome)} UZS</h2>
        </div>

        <div className="analytics-card">
          <div className="analytics-top">
            <FiCreditCard />
            <span>Teacher Expense</span>
          </div>

          <h2>{formatMoney(profileData.monthlyExpense)} UZS</h2>
        </div>

        <div className="analytics-card success">
          <div className="analytics-top">
            <FiTarget />
            <span>Pure Profit</span>
          </div>

          <h2>{formatMoney(profileData.monthlyProfit)} UZS</h2>
        </div>
      </div>

      <div className="payment-status-grid">
        <div className="payment-box paid">
          <FiCheckCircle />

          <div>
            <h2>{profileData.paidStudents}</h2>

            <p>Paid Students</p>
          </div>
        </div>

        <div className="payment-box unpaid">
          <FiAlertCircle />

          <div>
            <h2>{profileData.unpaidStudents}</h2>

            <p>Unpaid Students</p>
          </div>
        </div>
      </div>


      <div className="erp-section-box">
        <div className="section-title">
          <h2>Branch Financial Overview</h2>

          <FiHome />
        </div>

        <div className="branches-grid">
          {profileData.branches.map((branch) => (
            <div key={branch.id} className="branch-card">
              <div className="branch-top">
                <h3>{branch.name}</h3>

                <span className="active-badge">Active</span>
              </div>

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
                <span>{formatMoney(branch.income)} UZS</span>
              </div>
            </div>
          ))}
        </div>
      </div>


      <div className="erp-section-box">
        <div className="section-title">
          <h2>Recent Payments</h2>

          <FiActivity />
        </div>

        <div className="recent-payments-list">
          {profileData.recentPayments.map((student, idx) => (
            <div key={idx} className="payment-row">
              <div className="payment-user">
                <div className="mini-avatar">
                  {student.first_name?.charAt(0)}
                </div>

                <div>
                  <h4>
                    {student.first_name} {student.last_name}
                  </h4>

                  <p>Payment completed</p>
                </div>
              </div>

              <div className="payment-right">
                <strong>{formatMoney(student.monthly_fee)} UZS</strong>

                <span>{student.payment_date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
