import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useState } from "react";

// import Landing from "./components/Landing/Landing";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

import Dashboard from "./pages/Dashboard/Dashboard";

import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const [centerName, setCenterName] = useState("");

  return (
    <Router>

      <Routes>

        {/* ================= LANDING PAGE ================= */}
        <Route
          path="/"
          element={<Login/>}
        />

        {/* ================= AUTH ================= */}
        {/* <Route
          path="/login"
          element={
            <Login
              setCenterName={setCenterName}
            />
          }
        /> */}

        <Route
          path="/registerforeducationerpsystem"
          element={<Register />}
        />

        {/* ================= DASHBOARD ================= */}
        <Route
          path="/dashboard/:id/*"
          element={
            <Dashboard
              centerName={centerName}
              setCenterName={setCenterName}
            />
          }
        />

        {/* ================= FALLBACK ================= */}
        <Route
          path="*"
          element={<Navigate to="/" />}
        />

      </Routes>

      <Analytics />

    </Router>
  );
}