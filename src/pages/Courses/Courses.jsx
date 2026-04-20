import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiPlus,
  FiBookOpen,
  FiUsers,
  FiLayers,
  FiTrash2,
  FiX
} from "react-icons/fi";
import "./Courses.css";

export default function Courses({ activeBranch }) {
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [createModal, setCreateModal] = useState(false);

  const [courseName, setCourseName] = useState("");

  // ================= FETCH =================
  useEffect(() => {
    if (!activeBranch?.id) return;
    fetchData();
  }, [activeBranch]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [c, g, t] = await Promise.all([
        supabase.from("courses").select("*").eq("branch_id", activeBranch.id),
        supabase.from("groups").select("*").eq("branch_id", activeBranch.id),
        supabase.from("teachers").select("*").eq("branch_id", activeBranch.id),
      ]);

      if (c.error) throw c.error;
      if (g.error) throw g.error;
      if (t.error) throw t.error;

      setCourses(c.data || []);
      setGroups(g.data || []);
      setTeachers(t.data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= CREATE =================
  const handleCreate = async () => {
    if (!courseName.trim()) return;

    try {
      setLoading(true);

      const { error } = await supabase.from("courses").insert([
        {
          name: courseName,
          branch_id: activeBranch.id,
        },
      ]);

      if (error) throw error;

      setCourseName("");
      setCreateModal(false);
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!confirm("Delete this course?")) return;

    await supabase.from("courses").delete().eq("id", id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  // ================= HELPERS =================

  const getGroupsCount = (courseId) =>
    groups.filter((g) => g.course_id === courseId).length;

  const getTeachersCount = (courseId) =>
    teachers.filter((t) => t.course_id === courseId).length;

  const getTeachersByCourse = (courseId) =>
    teachers.filter((t) => t.course_id === courseId);

  // ================= UI =================
  return (
    <div className="courses">

      {/* HEADER */}
      <div className="courses__header">
        <h1>Courses</h1>

        <button onClick={() => setCreateModal(true)}>
          <FiPlus /> Add Course
        </button>
      </div>

      {/* LOADING */}
      {loading && <p>Loading...</p>}

      {/* GRID */}
      <div className="courses__grid">
        {courses.map((c) => (
          <div key={c.id} className="courses__card">

            <div onClick={() => setSelectedCourse(c)}>

              <div className="card__icon">
                <FiBookOpen />
              </div>

              <h3>{c.name}</h3>

              <div className="card__stats">
                <span><FiLayers /> {getGroupsCount(c.id)} groups</span>
                <span><FiUsers /> {getTeachersCount(c.id)} teachers</span>
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
      {createModal && (
        <div className="modal">
          <div className="modal__content">

            <div className="modal__header">
              <h2>Create Course</h2>
              <FiX onClick={() => setCreateModal(false)} />
            </div>

            <input
              placeholder="Course name..."
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />

            <button onClick={handleCreate} className="submit">
              Create Course
            </button>

          </div>
        </div>
      )}

      {/* ================= DETAILS MODAL ================= */}
      {selectedCourse && (
        <div className="modal">
          <div className="modal__content">

            <div className="modal__header">
              <h2>{selectedCourse.name}</h2>
              <FiX onClick={() => setSelectedCourse(null)} />
            </div>

            <div className="course-details">

              <p>
                <strong>Groups:</strong> {getGroupsCount(selectedCourse.id)}
              </p>

              <p>
                <strong>Teachers:</strong> {getTeachersCount(selectedCourse.id)}
              </p>

              <h3>Teacher List:</h3>

              <ul>
                {getTeachersByCourse(selectedCourse.id).map((t) => (
                  <li key={t.id}>{t.name}</li>
                ))}
              </ul>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}