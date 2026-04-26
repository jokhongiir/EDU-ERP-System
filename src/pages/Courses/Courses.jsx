import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiPlus,
  FiBookOpen,
  FiUsers,
  FiLayers,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import "./Courses.css";

export default function Courses({ activeBranch }) {
  // ================= STATE =================
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [courseName, setCourseName] = useState("");

  const branchId = activeBranch?.id;

  // ================= FETCH =================
  const fetchData = async () => {
    if (!branchId) return;

    setLoading(true);

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
      console.error(err);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  // ================= CREATE =================
  const handleCreate = async (e) => {
    e?.preventDefault();

    if (!courseName.trim()) return;

    try {
      setLoading(true);

      const { error } = await supabase.from("courses").insert({
        name: courseName,
        branch_id: branchId,
      });

      if (error) throw error;

      setCourseName("");
      setCreateOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    const confirmDelete = confirm("Delete this course?");
    if (!confirmDelete) return;

    try {
      await supabase.from("courses").delete().eq("id", id);

      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  // ================= HELPERS =================
  const getGroupsCount = (courseId) =>
    groups.filter((g) => g.course_id === courseId).length;

  const getTeachersCount = (courseId) =>
    teachers.filter((t) => t.course_id === courseId).length;

  const getTeachersByCourse = (courseId) =>
    teachers.filter((t) => t.course_id === courseId);

  // ================= MEMOIZED UI DATA =================
  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => a.name.localeCompare(b.name));
  }, [courses]);

  // ================= UI =================
  return (
    <div className="courses">

      {/* HEADER */}
      <div className="courses__header">
        <div>
          <h2>{activeBranch?.name || "Branch"} • Courses</h2>
          <p className="courses__sub">Manage all your courses</p>
        </div>

        <button onClick={() => setCreateOpen(true)}>
          <FiPlus /> Add Course
        </button>
      </div>

      {/* LOADING */}
      {loading && <div className="courses__loading">Loading...</div>}

      {/* EMPTY STATE */}
      {!loading && sortedCourses.length === 0 && (
        <div className="courses__empty">
          <FiBookOpen size={40} />
          <p>No courses found</p>
        </div>
      )}

      {/* GRID */}
      <div className="courses__grid">
        {sortedCourses.map((c) => (
          <div key={c.id} className="courses__card">

            <div onClick={() => setSelectedCourse(c)}>
              <div className="card__icon">
                <FiBookOpen />
              </div>

              <h3>{c.name}</h3>

              <div className="card__stats">
                <span>
                  <FiLayers /> {getGroupsCount(c.id)} groups
                </span>
                <span>
                  <FiUsers /> {getTeachersCount(c.id)} teachers
                </span>
              </div>
            </div>

            <button
              className="delete-btn"
              onClick={() => handleDelete(c.id)}
            >
              <FiTrash2 />
            </button>

          </div>
        ))}
      </div>

      {/* ================= CREATE MODAL ================= */}
      {createOpen && (
        <div className="modal">
          <div className="modal__content">

            <div className="modal__header">
              <h3>Create Course</h3>
              <FiX onClick={() => setCreateOpen(false)} />
            </div>

            <form onSubmit={handleCreate}>
              <input
                placeholder="Course name..."
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />

              <button type="submit" className="submit">
                Create Course
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ================= DETAILS MODAL ================= */}
      {selectedCourse && (
        <div className="modal">
          <div className="modal__content">

            <div className="modal__header">
              <h3>{selectedCourse.name}</h3>
              <FiX onClick={() => setSelectedCourse(null)} />
            </div>

            <div className="course-details">

              <p>
                <strong>Groups:</strong> {getGroupsCount(selectedCourse.id)}
              </p>

              <p>
                <strong>Teachers:</strong> {getTeachersCount(selectedCourse.id)}
              </p>

              <h4>Teachers List</h4>

              {getTeachersByCourse(selectedCourse.id).length === 0 ? (
                <p>No teachers assigned</p>
              ) : (
                <ul>
                  {getTeachersByCourse(selectedCourse.id).map((t) => (
                    <li key={t.id}>{t.name}</li>
                  ))}
                </ul>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}