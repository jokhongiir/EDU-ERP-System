import { useState, useEffect } from "react";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import "./DashboardLayout.css";

export default function DashboardLayout({ children, branches, activeBranch, setActiveBranch, centerName, logout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth <= 1024) setMobileOpen(prev => !prev);
    else setSidebarCollapsed(prev => !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        activeBranch={activeBranch}
        branches={branches}
        setActiveBranch={setActiveBranch}
        logout={logout}
        setMobileOpen={setMobileOpen}
      />
      {mobileOpen && <div className="overlay" onClick={() => setMobileOpen(false)}></div>}

      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Navbar
          activeBranch={activeBranch}
          branches={branches}
          setActiveBranch={setActiveBranch}
          centerName={centerName}
          toggleSidebar={toggleSidebar}
        />
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
}