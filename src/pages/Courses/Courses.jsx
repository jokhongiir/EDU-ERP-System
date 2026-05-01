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
    <div className="cr-module-root">

      {/* HEADER */}
      <div className="cr-top-navigation">
        <div className="cr-identity-box">
          <h2 className="cr-main-heading">{activeBranch?.name || "Branch"} • Kurslar</h2>
          <p className="cr-sub-text">Barcha o'quv yo'nalishlarini boshqarish</p>
        </div>

        <button className="cr-add-action-btn" onClick={() => setCreateOpen(true)}>
          <FiPlus /> Kurs qo'shish
        </button>
      </div>

      {/* LOADING */}
      {loading && <div className="cr-loader-backdrop">Yuklanmoqda...</div>}

      {/* EMPTY STATE */}
      {!loading && sortedCourses.length === 0 && (
        <div className="cr-no-results-box">
          <FiBookOpen className="cr-empty-icon" />
          <p className="cr-empty-message">Kurslar hali mavjud emas</p>
        </div>
      )}

      {/* GRID */}
      <div className="cr-cards-layout">
        {sortedCourses.map((c) => (
          <div key={c.id} className="cr-subject-card">

            <div className="cr-card-interactive-area" onClick={() => setSelectedCourse(c)}>
              <div className="cr-subject-avatar">
                <FiBookOpen />
              </div>

              <h3 className="cr-subject-title">{c.name}</h3>

              <div className="cr-metrics-row">
                <span className="cr-metric-tag">
                  <FiLayers /> {getGroupsCount(c.id)} guruh
                </span>
                <span className="cr-metric-tag">
                  <FiUsers /> {getTeachersCount(c.id)} ustoz
                </span>
              </div>
            </div>

            <button
              className="cr-remove-btn"
              onClick={() => handleDelete(c.id)}
            >
              <FiTrash2 />
            </button>

          </div>
        ))}
      </div>

      {/* ================= CREATE MODAL ================= */}
      {createOpen && (
        <div className="cr-modal-portal">
          <div className="cr-modal-surface">

            <div className="cr-modal-header">
              <h3 className="cr-modal-headline">Yangi kurs yaratish</h3>
              <FiX className="cr-modal-dismiss" onClick={() => setCreateOpen(false)} />
            </div>

            <form className="cr-modal-form" onSubmit={handleCreate}>
              <input
                className="cr-modal-input-field"
                placeholder="Kurs nomi..."
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />

              <button type="submit" className="cr-modal-confirm-btn">
                Saqlash
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ================= DETAILS MODAL ================= */}
      {selectedCourse && (
        <div className="cr-modal-portal">
          <div className="cr-modal-surface">

            <div className="cr-modal-header">
              <h3 className="cr-modal-headline">{selectedCourse.name}</h3>
              <FiX className="cr-modal-dismiss" onClick={() => setSelectedCourse(null)} />
            </div>

            <div className="cr-details-body">

              <p className="cr-info-row">
                <span className="cr-info-label">Guruhlar soni:</span> {getGroupsCount(selectedCourse.id)}
              </p>

              <p className="cr-info-row">
                <span className="cr-info-label">O'qituvchilar soni:</span> {getTeachersCount(selectedCourse.id)}
              </p>

              <h4 className="cr-list-header">O'qituvchilar ro'yxati</h4>

              {getTeachersByCourse(selectedCourse.id).length === 0 ? (
                <p className="cr-empty-list-text">O'qituvchilar biriktirilmagan</p>
              ) : (
                <ul className="cr-staff-listing">
                  {getTeachersByCourse(selectedCourse.id).map((t) => (
                    <li key={t.id} className="cr-staff-unit">{t.name}</li>
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