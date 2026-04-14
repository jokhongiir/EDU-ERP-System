import { useEffect, useState } from "react";
import { useParams, useNavigate, Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout/DashboardLayout";
import StudentsPage from "../Students/Students";
import TeachersPage from '../Teachers/Teachers'
import DashboardHome from "./DashboardHome";
import CoursesPage from '../Courses/Courses'
import GroupsPage from '../Groups/Groups'
import { supabase } from "../../services/supabaseClient";
import "./Dashboard.css";

export default function Dashboard({ centerName: globalCenterName, setCenterName: setGlobalCenterName }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return navigate("/");

      // Branchlar
      const { data: branchData } = await supabase
        .from("branches")
        .select("*")
        .eq("owner_uid", data.user.id);

      const allBranches = branchData || [];
      setBranches(allBranches);

      const branchFromUrl = allBranches.find(b => b.id === id);
      const defaultBranch = branchFromUrl || allBranches[0] || null;
      setActiveBranch(defaultBranch);

      if (!id && defaultBranch) navigate(`/dashboard/${defaultBranch.id}`, { replace: true });

      setGlobalCenterName(data.user.user_metadata?.centerName || "Education ERP System");
    };

    init();
  }, [id, navigate, setGlobalCenterName]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <DashboardLayout
      branches={branches}
      activeBranch={activeBranch}
      setActiveBranch={(b) => navigate(`/dashboard/${b.id}`)}
      centerName={globalCenterName}
      logout={logout}
    >
      <Routes>
        <Route index element={<DashboardHome activeBranch={activeBranch} />} />
        <Route path="students" element={<StudentsPage activeBranch={activeBranch} />} />
        <Route path="teachers" element={<TeachersPage activeBranch={activeBranch} />} />
        <Route path="courses" element={<CoursesPage activeBranch={activeBranch} />} />
        <Route path="groups" element={<GroupsPage activeBranch={activeBranch} />} />
        {/* <Route path="courses" element={<div>Courses Page</div>} /> */}
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </DashboardLayout>
  );
}