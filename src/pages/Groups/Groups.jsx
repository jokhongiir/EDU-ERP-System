import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  FiPlus,
  FiX,
  FiUsers,
  FiBookOpen,
  FiUser,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import "./Groups.css";

export default function Groups({ activeBranch }) {
  const branchId = activeBranch?.id;

  // ================= STATE =================
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [form, setForm] = useState({
    name: "",
    teacher_id: "",
    course_id: "",
    start_date: "",
    start_time: "",
    end_time: "",
  });

  // ================= FETCH =================
  useEffect(() => {
    if (!branchId) return;
    fetchData();
  }, [branchId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [g, t, c, s] = await Promise.all([
        supabase.from("groups").select("*").eq("branch_id", branchId),
        supabase.from("teachers").select("*").eq("branch_id", branchId),
        supabase.from("courses").select("*").eq("branch_id", branchId),
        supabase.from("students").select("*").eq("branch_id", branchId),
      ]);

      if (g.error || t.error || c.error || s.error) {
        throw g.error || t.error || c.error || s.error;
      }

      setGroups(g.data || []);
      setTeachers(t.data || []);
      setCourses(c.data || []);
      setStudents(s.data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= CREATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        ...form,
        branch_id: branchId,
      };

      const { error } = await supabase.from("groups").insert([payload]);

      if (error) throw error;

      setForm({
        name: "",
        teacher_id: "",
        course_id: "",
        start_date: "",
        start_time: "",
        end_time: "",
      });

      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= HELPERS =================
  const getTeacher = (id) =>
    teachers.find((t) => t.id === id)?.name || "—";

  const getCourse = (id) =>
    courses.find((c) => c.id === id)?.name || "—";

  const getStudentsCount = (groupId) =>
    students.filter((s) => s.group_id === groupId).length;

  // ================= UI =================
  return (
    <div className="groups">

      {/* HEADER */}
      <div className="groups__header">
        <h1>Groups</h1>

        <button onClick={() => setModalOpen(true)}>
          <FiPlus /> Create Group
        </button>
      </div>

      {/* LOADING */}
      {loading && <p className="loading">Loading...</p>}

      {/* GRID */}
      <div className="groups__grid">
        {groups.map((g) => (
          <div
            key={g.id}
            className="groups__card"
            onClick={() => setSelectedGroup(g)}
          >
            <h3>{g.name}</h3>

            <p><FiUser /> {getTeacher(g.teacher_id)}</p>
            <p><FiBookOpen /> {getCourse(g.course_id)}</p>
            <p><FiUsers /> {getStudentsCount(g.id)} students</p>
            <p><FiCalendar /> {g.start_date}</p>
          </div>
        ))}
      </div>

      {/* ================= CREATE MODAL ================= */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">

            <div className="modal-header">
              <h2>Create Group</h2>
              <FiX onClick={() => setModalOpen(false)} />
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>

              <input
                name="name"
                placeholder="Group name"
                value={form.name}
                onChange={handleChange}
              />

              <select name="teacher_id" onChange={handleChange}>
                <option value="">Select Teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select name="course_id" onChange={handleChange}>
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />

              <input
                type="time"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
              />

              <input
                type="time"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
              />

              <button type="submit">Create</button>
              <button type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ================= DETAILS MODAL ================= */}
      {selectedGroup && (
        <div className="modal-overlay">
          <div className="modal-box">

            <div className="modal-header">
              <h2>{selectedGroup.name}</h2>
              <FiX onClick={() => setSelectedGroup(null)} />
            </div>

            <div className="details">

              <p><FiUser /> Teacher: {getTeacher(selectedGroup.teacher_id)}</p>
              <p><FiBookOpen /> Course: {getCourse(selectedGroup.course_id)}</p>
              <p><FiCalendar /> Date: {selectedGroup.start_date}</p>
              <p>
                <FiClock /> Time: {selectedGroup.start_time} - {selectedGroup.end_time}
              </p>

              <p>
                <FiUsers /> Students: {getStudentsCount(selectedGroup.id)}
              </p>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}