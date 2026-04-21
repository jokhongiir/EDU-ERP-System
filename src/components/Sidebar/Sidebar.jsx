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
    { name: "Add Students", icon: BookOpen, path: "addstudents" },
    { name: "Payments", icon: CreditCard, path: "payments" },
  ];

  const basePath = activeBranch ? `/dashboard/${activeBranch.id}` : "";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
      setMobileOpen(false);
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <aside
      className={`erpSidebar ${collapsed ? "isCollapsed" : ""} ${
        mobileOpen ? "isMobileOpen" : ""
      }`}
    >
      {/* HEADER */}
      <div className="erpSidebar__header">
        <div className="erpSidebar__logo">
          <span className="erpSidebar__dot" />
          {!collapsed && <h2>Edu ERP</h2>}
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="erpSidebar__nav">
        {menu.map((item, idx) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={idx}
              to={`${basePath}/${item.path}`}
              className={({ isActive }) =>
                isActive
                  ? "erpSidebar__link isActive"
                  : "erpSidebar__link"
              }
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="erpSidebar__icon" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="erpSidebar__footer">
        <button className="erpSidebar__logout" onClick={handleLogout}>
          <LogOut className="erpSidebar__icon" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}