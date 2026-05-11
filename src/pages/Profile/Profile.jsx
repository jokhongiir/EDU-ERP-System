import { useEffect, useState, useCallback } from "react";
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
  FiPhone,
  FiBarChart2,
  FiCheckCircle,
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

    branches: [],
  });

  // =========================================================
  // FETCH ALL ERP DATA
  // =========================================================

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);

      // USER
      const { data: authData } = await supabase.auth.getUser();

      const user = authData?.user;

      if (!user) return;

      // BRANCHES
      const { data: branches } = await supabase
        .from("branches")
        .select("*")
        .eq("owner_uid", user.id);

      const branchIds = branches?.map((b) => b.id) || [];

      // ALL DATA
      const [
        studentsRes,
        teachersRes,
        coursesRes,
        groupsRes,
        paymentsRes,
      ] = await Promise.all([
        supabase
          .from("students")
          .select("*")
          .in("branch_id", branchIds),

        supabase
          .from("teachers")
          .select("*")
          .in("branch_id", branchIds),

        supabase
          .from("courses")
          .select("*")
          .in("branch_id", branchIds),

        supabase
          .from("groups")
          .select("*")
          .in("branch_id", branchIds),

        supabase
          .from("payments")
          .select("*")
          .in("branch_id", branchIds),
      ]);

      // TOTAL INCOME
      const totalIncome =
        paymentsRes.data?.reduce(
          (sum, p) => sum + (p.amount || 0),
          0
        ) || 0;

      // TEACHERS SALARY
      const totalExpense =
        teachersRes.data?.reduce(
          (sum, t) => sum + (t.salary || 0),
          0
        ) || 0;

      // BRANCH STATS
      const branchStats =
        branches?.map((branch) => {
          const students =
            studentsRes.data?.filter(
              (s) => s.branch_id === branch.id
            ) || [];

          const teachers =
            teachersRes.data?.filter(
              (t) => t.branch_id === branch.id
            ) || [];

          const groups =
            groupsRes.data?.filter(
              (g) => g.branch_id === branch.id
            ) || [];

          const courses =
            coursesRes.data?.filter(
              (c) => c.branch_id === branch.id
            ) || [];

          return {
            ...branch,
            students: students.length,
            teachers: teachers.length,
            groups: groups.length,
            courses: courses.length,
          };
        }) || [];

      setProfileData({
        centerName:
          user.user_metadata?.centerName ||
          "Education ERP System",

        email: user.email || "",

        totalStudents:
          studentsRes.data?.length || 0,

        totalTeachers:
          teachersRes.data?.length || 0,

        totalCourses:
          coursesRes.data?.length || 0,

        totalGroups:
          groupsRes.data?.length || 0,

        totalBranches:
          branches?.length || 0,

        totalIncome,
        totalExpense,

        branches: branchStats,
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

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="erp-profile-page">

      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <div className="erp-profile-top">

        <div className="profile-main-left">

          <div className="erp-avatar">
            {profileData.centerName?.charAt(0)}
          </div>

          <div>
            <h1>
              {profileData.centerName}
            </h1>

            <p>
              Professional Education ERP System
            </p>

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

        <div className="income-summary">

          <div className="money-card income">

            <div className="money-icon">
              <FiTrendingUp />
            </div>

            <div>
              <h2>
                $
                {profileData.totalIncome.toLocaleString()}
              </h2>

              <p>Total Income</p>
            </div>

          </div>

          <div className="money-card expense">

            <div className="money-icon">
              <FiTrendingDown />
            </div>

            <div>
              <h2>
                $
                {profileData.totalExpense.toLocaleString()}
              </h2>

              <p>Total Expense</p>
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          GLOBAL STATS
      ===================================================== */}

      <div className="erp-global-grid">

        <div className="erp-stat-box">
          <FiUsers />
          <h2>
            {loading
              ? "..."
              : profileData.totalStudents}
          </h2>
          <p>Total Students</p>
        </div>

        <div className="erp-stat-box">
          <FiAward />
          <h2>
            {loading
              ? "..."
              : profileData.totalTeachers}
          </h2>
          <p>Total Teachers</p>
        </div>

        <div className="erp-stat-box">
          <FiBookOpen />
          <h2>
            {loading
              ? "..."
              : profileData.totalCourses}
          </h2>
          <p>Total Courses</p>
        </div>

        <div className="erp-stat-box">
          <FiLayers />
          <h2>
            {loading
              ? "..."
              : profileData.totalGroups}
          </h2>
          <p>Total Groups</p>
        </div>

        <div className="erp-stat-box">
          <FiHome />
          <h2>
            {loading
              ? "..."
              : profileData.totalBranches}
          </h2>
          <p>Total Branches</p>
        </div>

        <div className="erp-stat-box">
          <FiDollarSign />
          <h2>
            $
            {profileData.totalIncome.toLocaleString()}
          </h2>
          <p>Revenue</p>
        </div>

      </div>

      {/* =====================================================
          BRANCHES
      ===================================================== */}

      <div className="erp-section-box">

        <div className="section-title">
          <h2>All Branches</h2>

          <FiHome />
        </div>

        <div className="branches-grid">

          {profileData.branches.map((branch) => (
            <div
              key={branch.id}
              className="branch-card"
            >

              <div className="branch-top">

                <h3>{branch.name}</h3>

                <span className="active-badge">
                  Active
                </span>

              </div>

              <div className="branch-stats">

                <div>
                  <FiUsers />
                  <span>
                    {branch.students} Students
                  </span>
                </div>

                <div>
                  <FiAward />
                  <span>
                    {branch.teachers} Teachers
                  </span>
                </div>

                <div>
                  <FiBookOpen />
                  <span>
                    {branch.courses} Courses
                  </span>
                </div>

                <div>
                  <FiLayers />
                  <span>
                    {branch.groups} Groups
                  </span>
                </div>

              </div>

            </div>
          ))}

        </div>

      </div>

      {/* =====================================================
          ACTIVITY
      ===================================================== */}

      <div className="erp-section-box">

        <div className="section-title">
          <h2>System Activity</h2>

          <FiActivity />
        </div>

        <div className="activity-wrapper">

          <div className="activity-item">
            <FiCheckCircle />
            <span>
              Students successfully added
            </span>
          </div>

          <div className="activity-item">
            <FiCheckCircle />
            <span>
              Courses updated
            </span>
          </div>

          <div className="activity-item">
            <FiCheckCircle />
            <span>
              Teacher salaries monitored
            </span>
          </div>

          <div className="activity-item">
            <FiCheckCircle />
            <span>
              Payments analytics synchronized
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}