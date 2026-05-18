import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

import Dashboard from "./pages/Dashboard/Dashboard";

import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const [centerName, setCenterName] = useState("");

  return (
    <Router>
      <Routes>

        {/* AUTH */}
        <Route path="/" element={<Login setCenterName={setCenterName} />} />
        <Route path="/registerforeducationerpsystem" element={<Register />} />

        {/* DASHBOARD (PROTECTED AREA) */}
        <Route
          path="/dashboard/:id/*"
          element={
            <Dashboard
              centerName={centerName}
              setCenterName={setCenterName}
            />
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>

      <Analytics />
    </Router>
  );
}