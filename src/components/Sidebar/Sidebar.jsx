import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  LogOut,
} from "lucide-react";
import { supabase } from "../../services/supabaseClient";
import "./Sidebar.css";
import logo from '../../assets/logo.png'

export default function Sidebar({
  collapsed,
  mobileOpen,
  activeBranch,
  setMobileOpen,
}) {
  const navigate = useNavigate();

  const menu = [
    { name: "Dashboard", icon: LayoutDashboard, path: "" },
    { name: "Students", icon: Users, path: "students" },
    { name: "Teachers", icon: GraduationCap, path: "teachers" },
    { name: "Courses", icon: BookOpen, path: "courses" },
    { name: "Groups", icon: BookOpen, path: "groups" },
    { name: "Add Students", icon: Users, path: "addstudents" },
    { name: "Payments", icon: CreditCard, path: "payments" },
    { name: "Attendance", icon: CreditCard, path: "attendance" },
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
      {/* ================= HEADER ================= */}
      <div className="erpSidebar__header">
        <div className="erpSidebar__logoBox">
          {/* LOGO IMAGE */}
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
