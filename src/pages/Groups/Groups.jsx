import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import "./Groups.css";

export default function Groups({ activeBranch }) {
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    teacherId: "",
    courseId: "",
    startDate: "",
    startTime: "",
    endTime: "",
  });

  // ================= FETCH =================
  useEffect(() => {
    if (!activeBranch?.id) return;
    fetchData();
  }, [activeBranch]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [gRes, tRes, cRes, sRes] = await Promise.all([
        supabase.from("groups").select("*").eq("branch_id", activeBranch.id),
        supabase.from("teachers").select("*").eq("branch_id", activeBranch.id),
        supabase.from("courses").select("*").eq("branch_id", activeBranch.id),
        supabase.from("students").select("*").eq("branch_id", activeBranch.id),
      ]);

      setGroups(gRes.data || []);
      setTeachers(tRes.data || []);
      setCourses(cRes.data || []);
      setStudents(sRes.data || []);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= CHANGE =================
  const handleChange = (e) => {
    setFormData((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  // ================= CREATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      teacher_id: formData.teacherId || null,
      course_id: formData.courseId || null,
      start_date: formData.startDate || null,
      start_time: formData.startTime || null,
      end_time: formData.endTime || null,
      branch_id: activeBranch.id,
    };

    await supabase.from("groups").insert([payload]);

    setModalOpen(false);
    setFormData({
      name: "",
      teacherId: "",
      courseId: "",
      startDate: "",
      startTime: "",
      endTime: "",
    });

    fetchData();
  };

  // ================= HELPERS =================
  const getTeacher = (id) =>
    teachers.find((t) => t.id === id)?.name || "-";

  const getCourse = (id) =>
    courses.find((c) => c.id === id)?.name || "-";

  const getGroupStudents = (groupId) =>
    students.filter((s) => s.group_id === groupId);

  return (
    <div className="groups">

      {/* HEADER */}
      <div className="groups__header">
        <h1>Groups - {activeBranch?.name}</h1>

        <button onClick={() => setModalOpen(true)}>
          + Create Group
        </button>
      </div>

      {/* GRID */}
      <div className="groups__grid">
        {groups.map((g) => (
          <div
            key={g.id}
            className="groups__card"
            onClick={() => setSelectedGroup(g)}
          >
            <h3>{g.name}</h3>

            <p>👨‍🏫 {getTeacher(g.teacher_id)}</p>
            <p>📚 {getCourse(g.course_id)}</p>
            <p>👨‍🎓 {getGroupStudents(g.id).length} students</p>
            <p>📅 {g.start_date}</p>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h2>Create Group</h2>

            <form onSubmit={handleSubmit} className="modal-form">

              <input
                name="name"
                placeholder="Group name"
                onChange={handleChange}
              />

              <select name="teacherId" onChange={handleChange}>
                <option value="">Teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <select name="courseId" onChange={handleChange}>
                <option value="">Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <input
                type="date"
                name="startDate"
                onChange={handleChange}
              />

              <input
                type="time"
                name="startTime"
                onChange={handleChange}
              />

              <input
                type="time"
                name="endTime"
                onChange={handleChange}
              />

              <button type="submit">Save</button>
              <button type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </button>

            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedGroup && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h2>{selectedGroup.name}</h2>

            <p>👨‍🏫 Teacher: {getTeacher(selectedGroup.teacher_id)}</p>
            <p>📚 Course: {getCourse(selectedGroup.course_id)}</p>
            <p>📅 Date: {selectedGroup.start_date}</p>
            <p>⏰ Time: {selectedGroup.start_time} - {selectedGroup.end_time}</p>

            <h3>Students ({getGroupStudents(selectedGroup.id).length})</h3>

            <ul>
              {getGroupStudents(selectedGroup.id).map((s) => (
                <li key={s.id}>
                  {s.first_name} {s.last_name}
                </li>
              ))}
            </ul>

            <button onClick={() => setSelectedGroup(null)}>
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}