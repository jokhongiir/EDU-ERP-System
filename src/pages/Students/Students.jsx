import { useState, useEffect, useRef } from "react";
import { supabase } from "../../services/supabaseClient";
import IMask from "imask";
import "./Students.css";

export default function Students({ activeBranch }) {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    studentPhone: "",
    courseId: "",
    teacherId: "",
    groupId: "",
    monthlyFee: "",
    teacherPercent: "",
    lastPayment: "",
    nextPayment: "",
    paid: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [paidFilter, setPaidFilter] = useState("all");

  const studentPhoneRef = useRef(null);

  // ================= PHONE MASK =================
  useEffect(() => {
    if (!modalOpen || !studentPhoneRef.current) return;

    const mask = IMask(studentPhoneRef.current, {
      mask: "+998 (00) 000-00-00",
      lazy: false,
    });

    return () => mask.destroy();
  }, [modalOpen]);

  // ================= FETCH =================
  useEffect(() => {
    if (!activeBranch) return;

    const fetchData = async () => {
      const [studentsRes, coursesRes, teachersRes, groupsRes] =
        await Promise.all([
          supabase.from("students").select("*").eq("branch_id", activeBranch.id),
          supabase.from("courses").select("*").eq("branch_id", activeBranch.id),
          supabase.from("teachers").select("*").eq("branch_id", activeBranch.id),
          supabase.from("groups").select("*").eq("branch_id", activeBranch.id),
        ]);

      setStudents(studentsRes.data || []);
      setCourses(coursesRes.data || []);
      setTeachers(teachersRes.data || []);
      setGroups(groupsRes.data || []);
    };

    fetchData();
  }, [activeBranch]);

  // ================= CHANGE =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeBranch) return;

    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      student_phone: formData.studentPhone,
      course_id: formData.courseId || null,
      teacher_id: formData.teacherId || null,
      group_id: formData.groupId || null,
      monthly_fee: Number(formData.monthlyFee || 0),
      teacher_percent: Number(formData.teacherPercent || 0),
      last_payment: formData.lastPayment || null,
      next_payment: formData.nextPayment || null,
      paid: formData.paid,
      branch_id: activeBranch.id,
    };

    if (editId) {
      await supabase.from("students").update(payload).eq("id", editId);
    } else {
      await supabase.from("students").insert([payload]);
    }

    setModalOpen(false);
    setEditId(null);

    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("branch_id", activeBranch.id);

    setStudents(data || []);

    setFormData({
      firstName: "",
      lastName: "",
      studentPhone: "",
      courseId: "",
      teacherId: "",
      groupId: "",
      monthlyFee: "",
      teacherPercent: "",
      lastPayment: "",
      nextPayment: "",
      paid: false,
    });
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    await supabase.from("students").delete().eq("id", id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // ================= EDIT =================
  const handleEdit = (student) => {
    setFormData({
      firstName: student.first_name,
      lastName: student.last_name,
      studentPhone: student.student_phone,
      courseId: student.course_id || "",
      teacherId: student.teacher_id || "",
      groupId: student.group_id || "",
      monthlyFee: student.monthly_fee || "",
      teacherPercent: student.teacher_percent || "",
      lastPayment: student.last_payment || "",
      nextPayment: student.next_payment || "",
      paid: student.paid,
    });

    setEditId(student.id);
    setModalOpen(true);
  };

  // ================= FILTER =================
  const filteredStudents = students
    .filter((s) => {
      if (paidFilter === "paid") return s.paid;
      if (paidFilter === "unpaid") return !s.paid;
      return true;
    })
    .filter((s) =>
      `${s.first_name} ${s.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

  return (
    <div className="students-page">
      <div className="students-header">
        <h1>Students - {activeBranch?.name}</h1>
        <button className="btn-add" onClick={() => setModalOpen(true)}>
          + Add Student
        </button>
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="modal-close" onClick={() => setModalOpen(false)}>
              ×
            </span>

            <h2>{editId ? "Edit Student" : "Add Student"}</h2>

            <form onSubmit={handleSubmit} className="student-form">
              <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
              <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />

              <input
                name="studentPhone"
                placeholder="+998 (__) ___-__-__"
                value={formData.studentPhone}
                onChange={handleChange}
                ref={studentPhoneRef}
              />

              <select name="courseId" value={formData.courseId} onChange={handleChange}>
                <option value="">Course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select name="teacherId" value={formData.teacherId} onChange={handleChange}>
                <option value="">Teacher</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              <select name="groupId" value={formData.groupId} onChange={handleChange}>
                <option value="">Group</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>

              <input name="monthlyFee" placeholder="Monthly Fee" value={formData.monthlyFee} onChange={handleChange} />
              <input name="teacherPercent" placeholder="Teacher %" value={formData.teacherPercent} onChange={handleChange} />

              <input type="date" name="lastPayment" value={formData.lastPayment} onChange={handleChange} />
              <input type="date" name="nextPayment" value={formData.nextPayment} onChange={handleChange} />

              <label>
                Paid:
                <input type="checkbox" name="paid" checked={formData.paid} onChange={handleChange} />
              </label>

              <button type="submit">
                {editId ? "Update" : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= STUDENT DETAIL MODAL ================= */}
      {viewStudent && (
        <div className="modal-overlay" onClick={() => setViewStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close" onClick={() => setViewStudent(null)}>
              ×
            </span>

            <h2>Student Full Info</h2>

            <div className="student-details">
              <p><b>Name:</b> {viewStudent.first_name} {viewStudent.last_name}</p>
              <p><b>Phone:</b> {viewStudent.student_phone}</p>
              <p><b>Course:</b> {courses.find(c => c.id === viewStudent.course_id)?.name || "-"}</p>
              <p><b>Teacher:</b> {teachers.find(t => t.id === viewStudent.teacher_id)?.name || "-"}</p>
              <p><b>Group:</b> {groups.find(g => g.id === viewStudent.group_id)?.name || "-"}</p>
              <p><b>Monthly Fee:</b> {viewStudent.monthly_fee}</p>
              <p><b>Teacher %:</b> {viewStudent.teacher_percent}</p>
              <p><b>Last Payment:</b> {viewStudent.last_payment}</p>
              <p><b>Next Payment:</b> {viewStudent.next_payment}</p>
              <p><b>Status:</b> {viewStudent.paid ? "Paid" : "Unpaid"}</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= FILTER ================= */}
      <div className="students-controls">
        <input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select onChange={(e) => setPaidFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* ================= TABLE ================= */}
      <table className="students-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Paid</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredStudents.map((s, i) => (
            <tr key={s.id} onClick={() => setViewStudent(s)}>
              <td>{i + 1}</td>
              <td>{s.first_name} {s.last_name}</td>
              <td>{s.student_phone}</td>
              <td>{s.paid ? "Yes" : "No"}</td>
              <td>
                <button onClick={(e) => { e.stopPropagation(); handleEdit(s); }}>
                  Edit
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}