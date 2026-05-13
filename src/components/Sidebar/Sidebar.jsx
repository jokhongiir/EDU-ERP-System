import { NavLink, useNavigate } from "react-router-dom";
import { memo, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  Layers,
  UserPlus,
  Wallet,
  CalendarCheck,
  User,
  LogOut,
} from "lucide-react";

import { supabase } from "../../services/supabaseClient";
import "./Sidebar.css";
import logo from "../../assets/logo2.png";

function Sidebar({ collapsed, mobileOpen, activeBranch, setMobileOpen }) {
  const navigate = useNavigate();

  // ================= BASE PATH =================
  const basePath = useMemo(() => {
    return activeBranch
      ? `/dashboard/${activeBranch.id}`
      : "/dashboard";
  }, [activeBranch]);

  // ================= MENU CONFIG (SCALABLE) =================
  const menu = useMemo(
    () => [
      { label: "Dashboard", icon: LayoutDashboard, path: "" },
      { label: "Students", icon: Users, path: "students" },
      { label: "Teachers", icon: UserCog, path: "teachers" },
      { label: "Courses", icon: BookOpen, path: "courses" },
      { label: "Groups", icon: Layers, path: "groups" },
      { label: "Add Students", icon: UserPlus, path: "addstudents" },
      { label: "Payments", icon: Wallet, path: "payments" },
      { label: "Attendance", icon: CalendarCheck, path: "attendance" },
      { label: "Profile", icon: User, path: "profile" },
    ],
    []
  );

  // ================= LOGOUT =================
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
      setMobileOpen?.(false);
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  }, [navigate, setMobileOpen]);

  const closeMobileMenu = useCallback(() => {
    setMobileOpen?.(false);
  }, [setMobileOpen]);

  return (
    <aside
      className={`erpSidebar 
      ${collapsed ? "isCollapsed" : ""} 
      ${mobileOpen ? "isMobileOpen" : ""}`}
    >
      {/* ================= HEADER ================= */}
      <div className="erpSidebar__header">
        <div className="erpSidebar__logoBox">
          <img src={logo} alt="Edu ERP" className="erpSidebar__logoImg" />

          {!collapsed && (
            <div className="erpSidebar__logoText">
              <h2>Edu ERP</h2>
              <span>Education Management</span>
            </div>
          )}
        </div>
      </div>

      {/* ================= NAV ================= */}
      <nav className="erpSidebar__nav">
        {menu.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={`${basePath}/${path}`}
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `erpSidebar__link ${isActive ? "isActive" : ""}`
            }
          >
            <Icon className="erpSidebar__icon" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
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

export default memo(Sidebar);