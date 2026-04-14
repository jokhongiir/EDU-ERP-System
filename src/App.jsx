import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Auth from "./pages/Auth/Auth";
import CreateBranch from "./pages/CreateBranch/CreateBranch";
import Dashboard from "./pages/Dashboard/Dashboard";
import StudentsPage from "./pages/Students/Students";

export default function App() {
  const [centerName, setCenterName] = useState(""); // global center name

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth setCenterName={setCenterName} />} />
        <Route path="/create-branch" element={<CreateBranch />} />

        {/* Dashboard with optional branch id */}
        <Route path="/dashboard/:id/*" element={<Dashboard centerName={centerName} setCenterName={setCenterName} />} />

        {/* Redirect unknown paths */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}