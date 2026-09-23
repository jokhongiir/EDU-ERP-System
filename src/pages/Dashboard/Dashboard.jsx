import { useEffect, useState } from "react";
import { useParams, useNavigate, Routes, Route } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout/DashboardLayout";

import Students from "../Students/Students";
import FreeStudents from "../FreeStudents/FreeStudents";
import AddStudentPage from "../AddStudents/AddStudents";

import TeachersPage from "../Teachers/Teachers";
import DashboardHome from "./DashboardHome";
import CoursesPage from "../Courses/Courses";
import GroupsPage from "../Groups/Groups";
import PaymentsPage from "../Payments/Payments";
import AttendancePage from "../Attendance/Attendance";
import Profile from "../Profile/Profile";
import TeacherSchedule from "../TeacherSchedule/TeacherSchedule";
import ForgotPassword from "../Auth/ForgotPassword";
import UpdatePassword from "../Auth/UpdatePassword";
import Leads from "../Leads/Leads";
import LeadsDashboard from "../LeadsDashboard/LeadsDashboard";
import Archive from "../Archive/Archive";
import Store from "../Store/Store";
import { supabase } from "../../services/supabaseClient";

export default function Dashboard({ centerName, setCenterName }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        navigate("/");
        return;
      }

      const { data: branchData, error: branchError } = await supabase
        .from("branches")
        .select("*")
        .eq("owner_uid", data.user.id);

      if (branchError) {
        console.error(branchError.message);
        return;
      }

      const allBranches = branchData || [];
      setBranches(allBranches);

      const currentBranch =
        allBranches.find((b) => b.id === id) || allBranches[0] || null;

      setActiveBranch(currentBranch);

      if (!id && currentBranch) {
        navigate(`/dashboard/${currentBranch.id}`, { replace: true });
      }

      setCenterName(
        data.user?.user_metadata?.centerName || "Education ERP System"
      );
    };

    init();
  }, [id, navigate, setCenterName]);

  return (
    <DashboardLayout
      branches={branches}
      activeBranch={activeBranch}
      setActiveBranch={(b) => navigate(`/dashboard/${b.id}`)}
      centerName={centerName}
    >
      <Routes>
        <Route
          index
          element={
            <DashboardHome
              key={activeBranch?.id}
              activeBranch={activeBranch}
            />
          }
        />

        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="update-password" element={<UpdatePassword />} />

        <Route
          path="students"
          element={
            <Students key={activeBranch?.id} activeBranch={activeBranch} />
          }
        />

        <Route
          path="freestudents"
          element={
            <FreeStudents
              key={activeBranch?.id}
              activeBranch={activeBranch}
            />
          }
        />

        <Route
          path="addstudents"
          element={
            <AddStudentPage
              key={activeBranch?.id}
              activeBranch={activeBranch}
            />
          }
        />

        <Route
          path="teachers"
          element={
            <TeachersPage
              key={activeBranch?.id}
              activeBranch={activeBranch}
            />
          }
        />

        <Route
          path="courses"
          element={
            <CoursesPage
              key={activeBranch?.id}
              activeBranch={activeBranch}
            />
          }
        />

        <Route
          path="groups"
          element={
            <GroupsPage key={activeBranch?.id} activeBranch={activeBranch} />
          }
        />

        {/* ===== LEADS ===== */}
        <Route
          path="leads"
          element={
            <LeadsDashboard
              key={activeBranch?.id}
              activeBranch={activeBranch}
            />
          }
        />
        <Route
          path="leads/manage"
          element={
            <Leads key={activeBranch?.id} activeBranch={activeBranch} />
          }
        />

        <Route
          path="archive"
          element={
            <Archive key={activeBranch?.id} activeBranch={activeBranch} />
          }
        />

        <Route
          path="payments"
          element={
            <PaymentsPage
              key={activeBranch?.id}
              activeBranch={activeBranch}
            />
          }
        />

        <Route
          path="attendance"
          element={
            <AttendancePage
              key={activeBranch?.id}
              activeBranch={activeBranch}
            />
          }
        />

        <Route
          path="profile"
          element={
            <Profile key={activeBranch?.id} activeBranch={activeBranch} />
          }
        />
        <Route
          path="schedule"
          element={
            <TeacherSchedule key={activeBranch?.id} activeBranch={activeBranch} />
          }
        />

        <Route
          path="store"
          element={
            <Store key={activeBranch?.id} activeBranch={activeBranch} />
          }
        />

        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </DashboardLayout>
  );
}