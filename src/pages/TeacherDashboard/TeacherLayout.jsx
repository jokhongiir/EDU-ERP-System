import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import logo2 from "../../assets/logo2.png";
import {
  FiLayers,
  FiUsers,
  FiCheckSquare,
  FiLogOut,
  FiUser,
  FiMenu,
  FiX,
} from "react-icons/fi";
import "./TeacherLayout.css";

export default function TeacherLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        const { data, error } = await supabase
          .from("teachers")
          .select("*")
          .eq("auth_id", session.user.id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("O'qituvchi topilmadi");

        setTeacher(data);
      } catch (err) {
        console.error(err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const pageTitle = () => {
    if (location.pathname.includes("groups")) return "Mening Guruhlarim";
    if (location.pathname.includes("students")) return "Mening O'quvchilarim";
    if (location.pathname.includes("attendance")) return "Davomat qilish";
    return "O'qituvchi paneli";
  };

  const teacherFullName = teacher
    ? `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() ||
      teacher.name ||
      "O'qituvchi"
    : "O'qituvchi";

  if (loading) {
    return (
      <div className="t-loader">
        <span className="loader"></span>
      </div>
    );
  }

  return (
    <div className="teacher-layout-container">
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`teacher-sidebar ${mobileOpen ? "is-mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo-box">
            <img
              src={logo2}
              alt="Education ERP System"
              className="sidebar-logo-img"
            />
            <div className="sidebar-logo-text">
              <h2>Education ERP System</h2>
              <span>O'qituvchi paneli</span>
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Yopish"
          >
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/teacher/groups"
            className={`nav-item ${
              location.pathname.includes("groups") ? "active" : ""
            }`}
          >
            <FiLayers className="nav-icon" />
            <span>Mening Guruhlarim</span>
          </Link>

          <Link
            to="/teacher/students"
            className={`nav-item ${
              location.pathname.includes("students") ? "active" : ""
            }`}
          >
            <FiUsers className="nav-icon" />
            <span>Mening O'quvchilarim</span>
          </Link>

          <Link
            to="/teacher/attendance"
            className={`nav-item ${
              location.pathname.includes("attendance") ? "active" : ""
            }`}
          >
            <FiCheckSquare className="nav-icon" />
            <span>Davomat qilish</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FiLogOut />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      <div className="teacher-main-area">
        <header className="teacher-navbar">
          <div className="navbar-left">
            <button
              className="navbar-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Menyu"
            >
              <FiMenu />
            </button>
            <h1 className="navbar-title">{pageTitle()}</h1>
          </div>

          <div className="navbar-right">
            <div className="navbar-profile">
              <div className="navbar-avatar">
                <FiUser />
              </div>
              <div className="navbar-profile-info">
                <span className="navbar-name">{teacherFullName}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="teacher-main-content">
          <Outlet context={{ teacher }} />
        </main>
      </div>
    </div>
  );
}