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
  Target,
  Archive,
  Gift,
  ShoppingCart,
  BarChart3,
} from "lucide-react";

import { supabase } from "../../services/supabaseClient";
import "./Sidebar.css";
import logo from "../../assets/logo2.png";

function Sidebar({ collapsed, mobileOpen, activeBranch, setMobileOpen }) {
  const navigate = useNavigate();

  const basePath = useMemo(() => {
    return activeBranch ? `/dashboard/${activeBranch.id}` : "/dashboard";
  }, [activeBranch]);

  const menu = useMemo(
    () => [
      { label: "Dashboard", icon: LayoutDashboard, path: "" },
      { label: "Students", icon: Users, path: "students" },
      { label: "Free Students", icon: Gift, path: "freestudents" },
      { label: "Teachers", icon: UserCog, path: "teachers" },
      { label: "Courses", icon: BookOpen, path: "courses" },
      { label: "Groups", icon: Layers, path: "groups" },
      { label: "Attendance", icon: CalendarCheck, path: "attendance" },
      { label: "Schedule", icon: CalendarCheck, path: "schedule" },
      { label: "Payments", icon: Wallet, path: "payments" },
      { label: "Store", icon: ShoppingCart, path: "store" },
      { label: "Add Students", icon: UserPlus, path: "addstudents" },

      // ===== LEADS =====
      { label: "Leads Dashboard", icon: BarChart3, path: "leads" },
      { label: "Leads Manage", icon: Target, path: "leads/manage" },

      { label: "Archive", icon: Archive, path: "archive" },
      { label: "Profile", icon: User, path: "profile" },
    ],
    []
  );

  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
          localStorage.removeItem(key);
        }
      });

      navigate("/login", { replace: true });
      setMobileOpen?.(false);
    } catch (err) {
      console.error("Logout error:", err.message);
      navigate("/login", { replace: true });
    }
  }, [navigate, setMobileOpen]);

  const closeMobileMenu = useCallback(() => {
    setMobileOpen?.(false);
  }, [setMobileOpen]);

  return (
    <>
      {mobileOpen && (
        <div
          className="erpSidebar__overlay"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={`erpSidebar 
          ${collapsed ? "isCollapsed" : ""} 
          ${mobileOpen ? "isMobileOpen" : ""}`}
        aria-label="Main navigation"
      >
        {/* Header */}
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

        {/* Navigation */}
        <nav className="erpSidebar__nav" role="navigation">
          {menu.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path || "dashboard"}
              to={path ? `${basePath}/${path}` : basePath}
              end={path === ""}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `erpSidebar__link ${isActive ? "isActive" : ""}`
              }
              title={collapsed ? label : undefined}
              aria-label={label}
            >
              <Icon className="erpSidebar__icon" strokeWidth={1.8} />
              {!collapsed && <span className="erpSidebar__label">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="erpSidebar__footer">
          <button
            className="erpSidebar__logout"
            onClick={handleLogout}
            title={collapsed ? "Sign out" : undefined}
            aria-label="Sign out"
          >
            <LogOut className="erpSidebar__icon" strokeWidth={1.8} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default memo(Sidebar);