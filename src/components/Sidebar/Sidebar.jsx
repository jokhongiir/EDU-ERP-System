import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap, BookOpen, CreditCard, LogOut } from "lucide-react";
import "./Sidebar.css";

export default function Sidebar({ collapsed, mobileOpen, activeBranch, logout, setMobileOpen }) {
  const menu = [
    { name: "Dashboard", icon: LayoutDashboard, path: "" },
    { name: "Students", icon: Users, path: "students" }, 
    { name: "Teachers", icon: GraduationCap, path: "teachers" },
    { name: "Courses", icon: BookOpen, path: "courses" },
    { name: "Groups", icon: BookOpen, path: "groups" },
    { name: "Add Students", icon: BookOpen, path: "addstudents" },
    { name: "Payments", icon: CreditCard, path: "payments" },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-active" : ""}`}>
      <div className="sidebar-header">
        <h2 className="logo">{collapsed ? "ERP" : "EDU ERP"}</h2>
      </div>

      <nav className="menu">
        {menu.map((item, idx) => {
          const Icon = item.icon;
          const path = activeBranch ? `/dashboard/${activeBranch.id}/${item.path}` : "#";

          return (
            <NavLink
              key={idx}
              to={path}
              className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="menu-icon" />
              <span className="menu-text">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="logout" onClick={logout}>
          <LogOut className="menu-icon" />
          <span className="menu-text">Logout</span>
        </button>
      </div>
    </aside>
  );
}