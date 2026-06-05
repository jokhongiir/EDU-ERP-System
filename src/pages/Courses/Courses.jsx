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
  FiHome,
  FiAlertCircle,
} from "react-icons/fi";

import "./Courses.css";

export default function Courses({ activeBranch }) {
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modalMode, setModalMode] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseName, setCourseName] = useState("");

  const branchId = activeBranch?.id;

  const fetchData = useCallback(async () => {
    if (!branchId) return;

    setLoading(true);
    setError(null);

    try {
      const [coursesRes, groupsRes, teachersRes] = await Promise.all([
        supabase.from("courses").select("*").eq("branch_id", branchId),
        supabase.from("groups").select("*").eq("branch_id", branchId),
        supabase.from("teachers").select("*").eq("branch_id", branchId),
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (groupsRes.error) throw groupsRes.error;
      if (teachersRes.error) throw teachersRes.error;

      setCourses(coursesRes.data || []);
      setGroups(groupsRes.data || []);
      setTeachers(teachersRes.data || []);
    } catch (err) {
      console.error("Database Fetch Error:", err);
      setError("An error occurred while loading data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const courseStatsMap = useMemo(() => {
    const stats = {};
    courses.forEach((c) => {
      stats[c.id] = { groupsCount: 0, teachersCount: 0, teacherList: [] };
    });

    groups.forEach((g) => {
      if (stats[g.course_id]) {
        stats[g.course_id].groupsCount += 1;
      }
    });

    teachers.forEach((t) => {
      if (stats[t.course_id]) {
        stats[t.course_id].teachersCount += 1;
        stats[t.course_id].teacherList.push(t);
      }
    });

    return stats;
  }, [courses, groups, teachers]);

  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => a.name.localeCompare(b.name));
  }, [courses]);

  useEffect(() => {
    document.body.style.overflow = modalMode ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseName.trim() || !branchId) return;

    setActionLoading(true);
    try {
      if (modalMode === "create") {
        const { error: insertErr } = await supabase.from("courses").insert({
          name: courseName.trim(),
          branch_id: branchId,
          branch_name: activeBranch?.name || "Unknown",
        });
        if (insertErr) throw insertErr;
      }

      if (modalMode === "edit") {
        const { error: updateErr } = await supabase
          .from("courses")
          .update({ name: courseName.trim() })
          .eq("id", selectedCourse.id);
        if (updateErr) throw updateErr;
      }

      setCourseName("");
      setModalMode(null);
      fetchData();
    } catch (err) {
      alert(err.message || "An error occurred while processing your request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this course?");
    if (!confirmDelete) return;

    try {
      const { error: delErr } = await supabase.from("courses").delete().eq("id", id);
      if (delErr) throw delErr;

      setCourses((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete the course.");
    }
  };

  const renderModal = () => {
    if (!modalMode) return null;

    const currentStats = selectedCourse ? courseStatsMap[selectedCourse.id] : null;

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

          {modalMode === "details" && selectedCourse ? (
            <div className="cr-details-view">
              <div className="cr-detail-card">
                <span>Branch</span>
                <strong>{selectedCourse.branch_name || activeBranch?.name || "Unknown"}</strong>
              </div>

              <div className="cr-detail-card">
                <span>Total Groups</span>
                <strong>{currentStats?.groupsCount || 0} active groups</strong>
              </div>

              <div className="cr-detail-card">
                <span>Assigned Teachers</span>
                <div className="cr-tags-wrapper">
                  {currentStats?.teacherList && currentStats.teacherList.length > 0 ? (
                    currentStats.teacherList.map((teacher) => (
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

              <button type="submit" disabled={actionLoading} className="cr-submit-btn">
                {actionLoading ? "Saving..." : modalMode === "create" ? "Create Course" : "Save Changes"}
              </button>
            </form>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="cr-module-root">
      <div className="cr-header-section">
        <div className="title-area">
          <h1 className="page-main-title">
            {activeBranch ? `${activeBranch.name} • Courses` : "Course Management"}
          </h1>
          <p className="page-description">Manage and analyze academic courses across this branch</p>
        </div>

        <button
          className="cr-create-btn"
          disabled={!branchId}
          onClick={() => {
            setModalMode("create");
            setCourseName("");
          }}
        >
          <FiPlus /> New Course
        </button>
      </div>

      {error && (
        <div className="cr-error-state">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {loading && !error ? (
        <div className="cr-grid-layout">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="cr-course-card cr-skeleton-card">
              <div className="cr-skeleton-top-line skeleton shimmer"></div>
              <div className="cr-card-body">
                <div className="cr-skeleton-icon skeleton shimmer"></div>
                <div className="cr-skeleton-title skeleton shimmer"></div>
                <div className="cr-skeleton-text skeleton shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      ) : !error && sortedCourses.length === 0 ? (
        <div className="cr-empty-state">
          <div className="cr-empty-icon-wrapper">
            <FiBookOpen />
          </div>
          <h3>No Courses Found</h3>
          <p>No courses have been created for this branch yet.</p>
        </div>
      ) : (
        !error && (
          <div className="cr-grid-layout">
            {sortedCourses.map((course) => {
              const stats = courseStatsMap[course.id] || { groupsCount: 0, teachersCount: 0 };

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

                    <div className="cr-branch-pill">
                      <FiHome />
                      <span>{course.branch_name || activeBranch?.name || "Branch"}</span>
                    </div>

                    <div className="cr-card-stats">
                      <span>
                        <FiLayers /> {stats.groupsCount} {stats.groupsCount === 1 ? "Group" : "Groups"}
                      </span>
                      <span>
                        <FiUsers /> {stats.teachersCount} {stats.teachersCount === 1 ? "Teacher" : "Teachers"}
                      </span>
                    </div>
                  </div>
                  <div className="cr-card-actions">
                    <button
                      className="cr-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourse(course);
                        setCourseName(course.name);
                        setModalMode("edit");
                      }}
                    >
                      <FiEdit3 />
                    </button>

                    <button
                      className="cr-action-btn cr-del-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(course.id);
                      }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {renderModal()}
    </div>
  );
}