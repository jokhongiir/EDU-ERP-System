import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom"; // For Portal
import { supabase } from "../../services/supabaseClient";
import {
  FiPlus,
  FiBookOpen,
  FiUsers,
  FiLayers,
  FiTrash2,
  FiX,
  FiEdit3,
} from "react-icons/fi";
import "./Courses.css";

export default function Courses({ activeBranch }) {
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'details'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseName, setCourseName] = useState("");

  const branchId = activeBranch?.id;

  // ================= DATA FETCHING =================
  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [coursesRes, groupsRes, teachersRes] = await Promise.all([
        supabase.from("courses").select("*").eq("branch_id", branchId),
        supabase.from("groups").select("*").eq("branch_id", branchId),
        supabase.from("teachers").select("*").eq("branch_id", branchId),
      ]);

      setCourses(coursesRes.data || []);
      setGroups(groupsRes.data || []);
      setTeachers(teachersRes.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= MODAL SCROLL CONTROL =================
  useEffect(() => {
    if (modalMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [modalMode]);

  // ================= ACTIONS =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseName.trim() || actionLoading) return;

    setActionLoading(true);
    try {
      if (modalMode === "create") {
        await supabase.from("courses").insert({ name: courseName, branch_id: branchId });
      } else if (modalMode === "edit") {
        await supabase.from("courses").update({ name: courseName }).eq("id", selectedCourse.id);
      }
      setCourseName("");
      setModalMode(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await supabase.from("courses").delete().eq("id", id);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert("An error occurred while deleting.");
    }
  };

  // ================= HELPERS =================
  const getStats = (courseId) => {
    const courseTeachers = teachers.filter(t => t.course_id === courseId);
    const courseGroups = groups.filter(g => g.course_id === courseId);
    return {
      groupsCount: courseGroups.length,
      teachersCount: courseTeachers.length,
      teacherList: courseTeachers
    };
  };

  const sortedCourses = useMemo(() => 
    [...courses].sort((a, b) => a.name.localeCompare(b.name)), 
  [courses]);

  // ================= RENDER MODAL PORTAL =================
  const renderModal = () => {
    if (!modalMode) return null;

    return createPortal(
      <div className="cr-modal-overlay" onClick={() => setModalMode(null)}>
        <div className="cr-modal-content" onClick={e => e.stopPropagation()}>
          <div className="cr-modal-header">
            <h3>
              {modalMode === 'create' && "Add New Course"}
              {modalMode === 'edit' && "Edit Course"}
              {modalMode === 'details' && "Course Details"}
            </h3>
            <button className="cr-close-modal" onClick={() => setModalMode(null)}><FiX /></button>
          </div>

          {modalMode === 'details' ? (
            <div className="cr-details-view">
              <div className="cr-detail-row">
                <label>Total Groups:</label>
                <span> {getStats(selectedCourse.id).groupsCount} active groups</span>
              </div>
              <div className="cr-detail-row">
                <label>Teachers:</label>
                {/* <div className="cr-teacher-tags"> */}
                  {getStats(selectedCourse.id).teacherList.length > 0 ? (
                    getStats(selectedCourse.id).teacherList.map(t => <span key={t.id} className="cr-tag"> {t.name}</span>)
                  ) : <span className="cr-no-data"> No teachers assigned yet.</span>}
                {/* </div> */}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="cr-modal-form">
              <div className="cr-input-group">
                <label>Course Name</label>
                <input 
                  autoFocus
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  placeholder="e.g. Full-Stack Development"
                  required
                />
              </div>
              <button type="submit" disabled={actionLoading} className="cr-submit-btn">
                {actionLoading ? "Saving..." : (modalMode === 'create' ? "Create Course" : "Update Changes")}
              </button>
            </form>
          )}
        </div>
      </div>,
      document.body // INSERTS MODAL INTO BODY
    );
  };

  return (
    <div className="cr-module-root">
      {/* HEADER */}
      <div className="cr-header-section">
         <div className="title-area">
          <h1 className="page-main-title">
            {activeBranch?.name || "Branch"} • Courses
          </h1>

          <p className="page-description">Manage educational directions and courses</p>
        </div>
        <button className="cr-create-btn" onClick={() => { setModalMode("create"); setCourseName(""); }}>
          <FiPlus /> New Course
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="cr-skeleton-grid">
          {[1, 2, 3].map(i => <div key={i} className="cr-skeleton-card" />)}
        </div>
      ) : sortedCourses.length === 0 ? (
        <div className="cr-empty-state">
          <div className="cr-empty-icon-wrapper"><FiBookOpen /></div>
          <h3>No Courses Found</h3>
          <p>No courses have been added to this branch yet.</p>
        </div>
      ) : (
        <div className="cr-grid-layout">
          {sortedCourses.map((course) => {
            const stats = getStats(course.id);
            return (
              <div key={course.id} className="cr-course-card">
                <div className="cr-card-body" onClick={() => { setSelectedCourse(course); setModalMode("details"); }}>
                  <div className="cr-card-icon"><FiBookOpen /></div>
                  <h3 className="cr-course-name">{course.name}</h3>
                  <div className="cr-card-stats">
                    <span><FiLayers /> {stats.groupsCount} Groups</span>
                    <span><FiUsers /> {stats.teachersCount} Teachers</span>
                  </div>
                </div>
                <div className="cr-card-actions">
                  <button onClick={() => { setSelectedCourse(course); setCourseName(course.name); setModalMode("edit"); }}>
                    <FiEdit3 />
                  </button>
                  <button className="cr-del-btn" onClick={() => handleDelete(course.id)}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL MANAGER PORTAL CALL */}
      {renderModal()}
    </div>
  );
}