import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
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

  const [modalMode, setModalMode] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [courseName, setCourseName] = useState("");

  const branchId = activeBranch?.id;

  // =========================================
  // FETCH DATA
  // =========================================

  const fetchData = useCallback(async () => {
    if (!branchId) return;

    setLoading(true);

    try {
      const [coursesRes, groupsRes, teachersRes] = await Promise.all([
        supabase
          .from("courses")
          .select("*")
          .eq("branch_id", branchId),

        supabase
          .from("groups")
          .select("*")
          .eq("branch_id", branchId),

        supabase
          .from("teachers")
          .select("*")
          .eq("branch_id", branchId),
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

  // =========================================
  // SCROLL LOCK
  // =========================================

  useEffect(() => {
    if (modalMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalMode]);

  // =========================================
  // HELPERS
  // =========================================

  const getStats = (courseId) => {
    const courseGroups = groups.filter((g) => g.course_id === courseId);
    const courseTeachers = teachers.filter((t) => t.course_id === courseId);

    return {
      groupsCount: courseGroups.length,
      teachersCount: courseTeachers.length,
      teacherList: courseTeachers,
    };
  };

  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => a.name.localeCompare(b.name));
  }, [courses]);

  // =========================================
  // ACTIONS
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!courseName.trim()) return;

    setActionLoading(true);

    try {
      if (modalMode === "create") {
        await supabase.from("courses").insert({
          name: courseName,
          branch_id: branchId,
        });
      }

      if (modalMode === "edit") {
        await supabase
          .from("courses")
          .update({ name: courseName })
          .eq("id", selectedCourse.id);
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
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmDelete) return;

    try {
      await supabase.from("courses").delete().eq("id", id);
      setCourses((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  // =========================================
  // MODAL RENDER
  // =========================================

  const renderModal = () => {
    if (!modalMode) return null;

    return createPortal(
      <div className="cr-modal-overlay" onClick={() => setModalMode(null)}>
        <div className="cr-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="cr-modal-header">
            <h3>
              {modalMode === "create" && "Create New Course"}
              {modalMode === "edit" && "Edit Course"}
              {modalMode === "details" && "Course Details"}
            </h3>
            <button className="cr-close-modal" onClick={() => setModalMode(null)}>
              <FiX />
            </button>
          </div>

          {modalMode === "details" ? (
            <div className="cr-details-view">
              <div className="cr-detail-card">
                <span>Total Groups</span>
                <strong>
                  {getStats(selectedCourse.id).groupsCount} active groups
                </strong>
              </div>

              <div className="cr-detail-card">
                <span>Teachers</span>
                <div className="cr-tags-wrapper">
                  {getStats(selectedCourse.id).teacherList.length > 0 ? (
                    getStats(selectedCourse.id).teacherList.map((teacher) => (
                      <div key={teacher.id} className="cr-tag">
                        {teacher.name}
                      </div>
                    ))
                  ) : (
                    <p className="cr-no-data">No teachers assigned yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form className="cr-modal-form" onSubmit={handleSubmit}>
              <div className="cr-input-group">
                <label>Course Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Frontend Development"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="cr-submit-btn"
              >
                {actionLoading
                  ? "Saving..."
                  : modalMode === "create"
                  ? "Create Course"
                  : "Update Course"}
              </button>
            </form>
          )}
        </div>
      </div>,
      document.body
    );
  };

  // =========================================
  // MAIN JSX
  // =========================================

  return (
    <div className="cr-module-root">
      {/* HEADER */}
      <div className="cr-header-section">
        <div className="title-area">
          <h1 className="page-main-title">
            {activeBranch?.name || "Branch"} • Courses
          </h1>
          <p className="page-description">
            Manage educational directions and professional courses
          </p>
        </div>

        <button
          className="cr-create-btn"
          onClick={() => {
            setModalMode("create");
            setCourseName("");
          }}
        >
          <FiPlus />
          New Course
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="cr-grid-layout">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="cr-course-card cr-skeleton-card">
              <div className="cr-skeleton-top-line skeleton shimmer"></div>
              <div className="cr-card-body">
                <div className="cr-skeleton-icon skeleton shimmer"></div>
                <div className="cr-skeleton-title skeleton shimmer"></div>
                <div className="cr-skeleton-text skeleton shimmer"></div>
                <div className="cr-skeleton-text short skeleton shimmer"></div>
                <div className="cr-card-stats">
                  <div className="cr-skeleton-stat skeleton shimmer"></div>
                  <div className="cr-skeleton-stat short skeleton shimmer"></div>
                </div>
              </div>
              <div className="cr-card-actions">
                <div className="cr-skeleton-btn skeleton shimmer"></div>
                <div className="cr-skeleton-btn skeleton shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedCourses.length === 0 ? (
        <div className="cr-empty-state">
          <div className="cr-empty-icon-wrapper">
            <FiBookOpen />
          </div>
          <h3>No Courses Found</h3>
          <p>No courses have been added to this branch yet.</p>
        </div>
      ) : (
        <div className="cr-grid-layout">
          {sortedCourses.map((course) => {
            const stats = getStats(course.id);
            return (
              <div key={course.id} className="cr-course-card">
                <div className="cr-card-top-line"></div>
                <div
                  className="cr-card-body"
                  onClick={() => {
                    setSelectedCourse(course);
                    setModalMode("details");
                  }}
                >
                  <div className="cr-card-icon">
                    <FiBookOpen />
                  </div>
                  <h3 className="cr-course-name">{course.name}</h3>
                  <div className="cr-card-stats">
                    <span>
                      <FiLayers />
                      {stats.groupsCount} Groups
                    </span>
                    <span>
                      <FiUsers />
                      {stats.teachersCount} Teachers
                    </span>
                  </div>
                </div>

                <div className="cr-card-actions">
                  <button
                    className="cr-action-btn"
                    onClick={() => {
                      setSelectedCourse(course);
                      setCourseName(course.name);
                      setModalMode("edit");
                    }}
                  >
                    <FiEdit3 />
                  </button>
                  <button
                    className="cr-action-btn cr-del-btn"
                    onClick={() => handleDelete(course.id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {renderModal()}
    </div>
  );
}