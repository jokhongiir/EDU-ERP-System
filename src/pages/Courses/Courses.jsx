import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import "./Courses.css";

export default function Courses({ activeBranch }) {
const [courses, setCourses] = useState([]);
const [groups, setGroups] = useState([]);
const [teachers, setTeachers] = useState([]);

const [selectedCourse, setSelectedCourse] = useState(null);
const [modalOpen, setModalOpen] = useState(false);
const [courseName, setCourseName] = useState("");

// ================= FETCH =================
useEffect(() => {
if (!activeBranch) return;

const fetchData = async () => {
  const { data: coursesData } = await supabase
    .from("courses")
    .select("*")
    .eq("branch_id", activeBranch.id);

  const { data: groupsData } = await supabase
    .from("groups")
    .select("*")
    .eq("branch_id", activeBranch.id);

  const { data: teachersData } = await supabase
    .from("teachers")
    .select("*")
    .eq("branch_id", activeBranch.id);

  setCourses(coursesData || []);
  setGroups(groupsData || []);
  setTeachers(teachersData || []);
};

fetchData();

}, [activeBranch]);

// ================= CREATE =================
const handleCreateCourse = async () => {
if (!courseName) return;

await supabase.from("courses").insert([
  {
    name: courseName,
    branch_id: activeBranch.id,
  },
]);

setCourseName("");
setModalOpen(false);

const { data } = await supabase
  .from("courses")
  .select("*")
  .eq("branch_id", activeBranch.id);

setCourses(data || []);

};

// ================= HELPERS =================
const getGroupsCount = (courseId) =>
groups.filter((g) => g.courseId === courseId).length;

const getTeachersByCourse = (courseId) =>
teachers.filter((t) => t.courseId === courseId);

return ( <div className="courses"> <div className="courses__header"> <h1>Courses - {activeBranch?.name}</h1>
<button onClick={() => setModalOpen(true)}>+ Add Course</button> </div>

```
  {/* CREATE MODAL */}
  {modalOpen && (
    <div className="courses__modal">
      <div className="courses__modal-content">
        <h2>Create Course</h2>
        <input
          placeholder="Course name..."
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
        />
        <button onClick={handleCreateCourse}>Create</button>
      </div>
    </div>
  )}

  {/* CARDS */}
  <div className="courses__grid">
    {courses.map((c) => (
      <div
        key={c.id}
        className="courses__card"
        onClick={() => setSelectedCourse(c)}
      >
        <h3>{c.name}</h3>
        <p>Groups: {getGroupsCount(c.id)}</p>
      </div>
    ))}
  </div>

  {/* DETAILS */}
  {selectedCourse && (
    <div className="courses__modal">
      <div className="courses__modal-content">
        <span className="close" onClick={() => setSelectedCourse(null)}>
          &times;
        </span>

        <h2>{selectedCourse.name}</h2>

        <p>Groups: {getGroupsCount(selectedCourse.id)}</p>

        <h3>Teachers:</h3>
        <ul>
          {getTeachersByCourse(selectedCourse.id).map((t) => (
            <li key={t.id}>{t.name}</li>
          ))}
        </ul>
      </div>
    </div>
  )}
</div>

);
}
