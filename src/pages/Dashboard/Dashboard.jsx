import { useEffect, useState } from "react";
import { useParams, useNavigate, Routes, Route } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout/DashboardLayout";

import Students from "../Students/Students";
import AddStudentPage from "../AddStudents/AddStudents";

import TeachersPage from "../Teachers/Teachers";
import DashboardHome from "./DashboardHome";
import CoursesPage from "../Courses/Courses";
import GroupsPage from "../Groups/Groups";

import { supabase } from "../../services/supabaseClient";
import "./Dashboard.css";

export default function Dashboard({ centerName, setCenterName }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);

  // ================= INIT =================
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
          element={<DashboardHome activeBranch={activeBranch} />}
        />

        <Route
          path="students"
          element={<Students activeBranch={activeBranch} />}
        />

        <Route
          path="addstudents"
          element={<AddStudentPage activeBranch={activeBranch} />}
        />

        <Route
          path="teachers"
          element={<TeachersPage activeBranch={activeBranch} />}
        />

        <Route
          path="courses"
          element={<CoursesPage activeBranch={activeBranch} />}
        />

        <Route
          path="groups"
          element={<GroupsPage activeBranch={activeBranch} />}
        />

        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </DashboardLayout>
  );
}