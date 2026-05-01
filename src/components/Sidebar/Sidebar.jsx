import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,   // dashboard
  Users,             // students
  UserCog,           // teachers (professional)
  BookOpen,          // courses
  Layers,            // groups
  UserPlus,          // add students
  Wallet,            // payments
  CalendarCheck,     // attendance
  LogOut,
} from "lucide-react";

import { supabase } from "../../services/supabaseClient";
import "./Sidebar.css";
import logo from "../../assets/logo2.png";

export default function Sidebar({
  collapsed,
  mobileOpen,
  activeBranch,
  setMobileOpen,
}) {
  const navigate = useNavigate();

  // ================= PROFESSIONAL MENU =================
  const menu = [
    { name: "Dashboard", icon: LayoutDashboard, path: "" },

    { name: "Students", icon: Users, path: "students" },

    // 👇 better than GraduationCap
    { name: "Teachers", icon: UserCog, path: "teachers" },

    { name: "Courses", icon: BookOpen, path: "courses" },

    // 👇 better structure representation
    { name: "Groups", icon: Layers, path: "groups" },

    { name: "Add Students", icon: UserPlus, path: "addstudents" },

    // 👇 finance icon instead of CreditCard
    { name: "Payments", icon: Wallet, path: "payments" },

    // 👇 calendar-based attendance (real ERP feel)
    { name: "Attendance", icon: CalendarCheck, path: "attendance" },
  ];

  const basePath = activeBranch
    ? `/dashboard/${activeBranch.id}`
    : "/dashboard";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
      setMobileOpen(false);
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  const closeMobileMenu = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside
      className={`erpSidebar 
      ${collapsed ? "isCollapsed" : ""} 
      ${mobileOpen ? "isMobileOpen" : ""}`}
    >
      {/* ================= HEADER ================= */}
      <div className="erpSidebar__header">
        <div className="erpSidebar__logoBox">
          <img src={logo} alt="Logo" className="erpSidebar__logoImg" />

          {!collapsed && (
            <div className="erpSidebar__logoText">
              <h2>Edu ERP</h2>
              <span>Education ERP System</span>
            </div>
          )}
        </div>
      </div>

      {/* ================= NAV ================= */}
      <nav className="erpSidebar__nav">
        {menu.map((item, idx) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={idx}
              to={`${basePath}/${item.path}`}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `erpSidebar__link ${isActive ? "isActive" : ""}`
              }
            >
              <Icon className="erpSidebar__icon" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* ================= FOOTER ================= */}
      <div className="erpSidebar__footer">
        <button className="erpSidebar__logout" onClick={handleLogout}>
          <LogOut className="erpSidebar__icon" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}