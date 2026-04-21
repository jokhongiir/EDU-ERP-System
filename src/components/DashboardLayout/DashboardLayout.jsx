import { useState, useEffect } from "react";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import "./DashboardLayout.css";

export default function DashboardLayout({
  children,
  branches,
  activeBranch,
  setActiveBranch,
  centerName,
  logout,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 1024) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="erp-layout">

      {/* SIDEBAR */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        activeBranch={activeBranch}
        setMobileOpen={setMobileSidebarOpen}
        logout={logout}
      />

      {/* OVERLAY (mobile) */}
      {mobileSidebarOpen && (
        <div
          className="erp-layout__overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* MAIN AREA */}
      <div
        className={`erp-layout__main ${
          sidebarCollapsed ? "is-collapsed" : ""
        }`}
      >

        {/* NAVBAR */}
        <Navbar
          activeBranch={activeBranch}
          branches={branches}
          setActiveBranch={setActiveBranch}
          centerName={centerName}
          toggleSidebar={handleToggleSidebar}
        />

        {/* CONTENT */}
        <main className="erp-layout__content">
          {children}
        </main>

      </div>
    </div>
  );
}