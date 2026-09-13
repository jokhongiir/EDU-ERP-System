import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import UpdatePassword from "./pages/Auth/UpdatePassword";
import Dashboard from "./pages/Dashboard/Dashboard";

// Yangi qo'shiladigan O'qituvchi layout va sahifalari
import TeacherLayout from "./pages/TeacherDashboard/TeacherLayout";
import MyGroups from "./pages/TeacherDashboard/MyGroups";
import MyStudents from "./pages/TeacherDashboard/MyStudents";
import TeacherAttendance from "./pages/TeacherDashboard/TeacherAttendance";

import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const [centerName, setCenterName] = useState("");

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/registerforeducationerpsystem" element={<Register />} />

        {/* O'qituvchi Portali (Sidebar va sahifalar) */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="groups" replace />} />
          <Route path="groups" element={<MyGroups />} />
          <Route path="students" element={<MyStudents />} />
          <Route path="attendance" element={<TeacherAttendance />} />
        </Route>

        {/* Admin Dashboard */}
        <Route
          path="/dashboard/:id/*"
          element={
            <Dashboard centerName={centerName} setCenterName={setCenterName} />
          }
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Analytics />
    </Router>
  );
}