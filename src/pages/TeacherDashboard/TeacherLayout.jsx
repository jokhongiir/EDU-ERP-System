import { useState, useEffect, useRef } from "react";
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
  FiChevronDown,
  FiMapPin,
} from "react-icons/fi";
import "./TeacherLayout.css";

export default function TeacherLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [teachers, setTeachers] = useState([]);
  const [activeTeacher, setActiveTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          navigate("/login");
          return;
        }

        const uid = session.user.id;
        const userEmail = (session.user.email || "").trim().toLowerCase();

        const { data: byAuth, error: authErr } = await supabase
          .from("teachers")
          .select("*")
          .eq("auth_id", uid);

        if (authErr) throw authErr;

        let byEmail = [];
        if (userEmail) {
          const { data: emailRows, error: emailErr } = await supabase
            .from("teachers")
            .select("*")
            .ilike("email", userEmail);

          if (!emailErr && emailRows) {
            byEmail = emailRows;
          }
        }

        const map = new Map();
        [...(byAuth || []), ...byEmail].forEach((t) => {
          if (t?.id) map.set(t.id, t);
        });

        let teacherRows = Array.from(map.values());

        if (teacherRows.length === 0) {
          throw new Error("O'qituvchi topilmadi");
        }

        const needLink = teacherRows.filter(
          (t) => !t.auth_id && t.email && t.email.toLowerCase() === userEmail
        );

        if (needLink.length > 0) {
          await Promise.all(
            needLink.map((t) =>
              supabase
                .from("teachers")
                .update({ auth_id: uid })
                .eq("id", t.id)
            )
          );
          teacherRows = teacherRows.map((t) =>
            needLink.some((n) => n.id === t.id) ? { ...t, auth_id: uid } : t
          );
        }

        const branchIds = [
          ...new Set(teacherRows.map((t) => t.branch_id).filter(Boolean)),
        ];

        let branchMap = {};
        if (branchIds.length > 0) {
          const { data: branchesData } = await supabase
            .from("branches")
            .select("id, name")
            .in("id", branchIds);

          if (branchesData) {
            branchMap = Object.fromEntries(
              branchesData.map((b) => [String(b.id), b.name])
            );
          }
        }

        const enriched = teacherRows.map((t) => ({
          ...t,
          branch_name:
            branchMap[String(t.branch_id)] || `Branch #${t.branch_id}`,
        }));

        setTeachers(enriched);

        const savedId = localStorage.getItem("teacher_active_id");
        const found =
          enriched.find((t) => String(t.id) === String(savedId)) ||
          enriched[0];

        setActiveTeacher(found);
      } catch (err) {
        console.error("Teacher fetch error:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setBranchDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("teacher_active_id");
    navigate("/login");
  };

  const selectBranch = (teacher) => {
    setActiveTeacher(teacher);
    localStorage.setItem("teacher_active_id", String(teacher.id));
    setBranchDropdownOpen(false);
  };

  const pageTitle = () => {
    if (location.pathname.includes("groups")) return "Mening Guruhlarim";
    if (location.pathname.includes("students")) return "Mening O'quvchilarim";
    if (location.pathname.includes("attendance")) return "Davomat qilish";
    if (location.pathname.includes("profile")) return "Mening profilim";
    return "O'qituvchi paneli";
  };

  const teacherFullName = activeTeacher
    ? `${activeTeacher.first_name || ""} ${activeTeacher.last_name || ""}`.trim() ||
      activeTeacher.name ||
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

          <Link
            to="/teacher/profile"
            className={`nav-item ${
              location.pathname.includes("profile") ? "active" : ""
            }`}
          >
            <FiUser className="nav-icon" />
            <span>Mening profilim</span>
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
            {teachers.length > 1 && (
              <div className="branch-selector" ref={dropdownRef}>
                <button
                  className="branch-selector-btn"
                  onClick={() => setBranchDropdownOpen((p) => !p)}
                  type="button"
                >
                  <FiMapPin size={15} />
                  <span className="branch-selector-label">
                    {activeTeacher?.branch_name || "Branch tanlang"}
                  </span>
                  <FiChevronDown
                    size={16}
                    className={`branch-chevron ${
                      branchDropdownOpen ? "open" : ""
                    }`}
                  />
                </button>

                {branchDropdownOpen && (
                  <div className="branch-dropdown">
                    <div className="branch-dropdown-title">Filialni tanlang</div>
                    {teachers.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`branch-option ${
                          activeTeacher?.id === t.id ? "active" : ""
                        }`}
                        onClick={() => selectBranch(t)}
                      >
                        <FiMapPin size={14} />
                        <span>{t.branch_name}</span>
                        {activeTeacher?.id === t.id && (
                          <span className="branch-check">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {teachers.length === 1 && activeTeacher && (
              <div className="branch-single-badge">
                <FiMapPin size={14} />
                <span>{activeTeacher.branch_name}</span>
              </div>
            )}

            {/* Profilga o'tish */}
            <Link to="/teacher/profile" className="navbar-profile">
              <div className="navbar-avatar">
                <FiUser />
              </div>
              <div className="navbar-profile-info">
                <span className="navbar-name">{teacherFullName}</span>
              </div>
            </Link>
          </div>
        </header>

        <main className="teacher-main-content">
          <Outlet
            context={{
              teacher: activeTeacher,
              allTeachers: teachers,
            }}
          />
        </main>
      </div>
    </div>
  );
}