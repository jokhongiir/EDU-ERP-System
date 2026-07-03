import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../services/supabaseClient";
import "./Groups.css";
import {
  FiPlus, FiX, FiUsers, FiBookOpen, FiUser, FiCalendar,
  FiClock, FiEdit2, FiTrash2, FiSearch, FiAlertTriangle,
  FiUserPlus, FiCheck, FiUserMinus
} from "react-icons/fi";

const INITIAL_FORM_VALUES = {
  name: "",
  teacher_id: "",
  course_id: "",
  start_date: "",
  start_time: "",
  end_time: "",
  schedule_type: "all",
};

export default function Groups({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [modalOpen, setModalOpen] = useState(false); 
  const [selectedGroup, setSelectedGroup] = useState(null); 
  const [deleteId, setDeleteId] = useState(null);
  const [removeStudentData, setRemoveStudentData] = useState(null);
  const [quickAddStudentGroup, setQuickAddStudentGroup] = useState(null); 

  const [quickAddSearch, setQuickAddSearch] = useState(""); 
  const [quickSelectedStudents, setQuickSelectedStudents] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [editId, setEditId] = useState(null);
  const [removingStudentId, setRemovingStudentId] = useState(null); 
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [g, t, c, s] = await Promise.all([
        supabase.from("groups").select("*").eq("branch_id", branchId).order("created_at", { ascending: false }),
        supabase.from("teachers").select("*").eq("branch_id", branchId),
        supabase.from("courses").select("*").eq("branch_id", branchId),
        supabase.from("students").select("*").eq("branch_id", branchId),
      ]);
      setGroups(g.data || []);
      setTeachers(t.data || []);
      setCourses(c.data || []);
      setStudents(s.data || []);
    } catch (error) {
      alert("Ma'lumotlarni yuklashda xatolik yuz berdi: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const isModalVisible = modalOpen || selectedGroup || deleteId || quickAddStudentGroup || removeStudentData;
    document.body.style.overflow = isModalVisible ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [modalOpen, selectedGroup, deleteId, quickAddStudentGroup, removeStudentData]);

  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);
  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c.name])), [courses]);
  
  const getTeacher = (id) => teacherMap.get(id) || "Unassigned";
  const getCourse = (id) => courseMap.get(id) || "No course";
  const getStudentsCount = (groupId) => students.filter((s) => s.group_id === groupId).length;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => {
    setFormValues(INITIAL_FORM_VALUES);
    setEditId(null);
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValues.name.trim()) return;
    setSaving(true);

    const payload = {
      ...formValues,
      teacher_id: formValues.teacher_id || null,
      course_id: formValues.course_id || null,
      start_date: formValues.start_date || null,
      start_time: formValues.start_time || null,
      end_time: formValues.end_time || null,
      branch_id: branchId,
    };

    try {
      const query = editId 
        ? supabase.from("groups").update(payload).eq("id", editId)
        : supabase.from("groups").insert([payload]);

      const { error } = await query;
      if (error) throw error;

      resetForm();
      fetchData();
    } catch (err) {
      alert("Guruhni saqlashda xatolik: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAddStudentsSubmit = async (e) => {
    e.preventDefault();
    if (!quickSelectedStudents.length || !quickAddStudentGroup) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("students")
        .update({ group_id: quickAddStudentGroup.id })
        .in("id", quickSelectedStudents);

      if (error) throw error;

      setQuickAddStudentGroup(null);
      setQuickSelectedStudents([]);
      setQuickAddSearch("");
      fetchData();
    } catch (err) {
      alert("O'quvchilarni qo'shishda xatolik: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await supabase.from("students").update({ group_id: null }).eq("group_id", deleteId);
      const { error } = await supabase.from("groups").delete().eq("id", deleteId);
      if (error) throw error;
      setGroups((prev) => prev.filter((g) => g.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert("Guruhni o'chirishda xatolik: " + err.message);
    }
  };

  const confirmRemoveStudent = async () => {
    if (!removeStudentData) return;
    const studentId = removeStudentData.id;
    setRemovingStudentId(studentId);
    try {
      const { error } = await supabase.from("students").update({ group_id: null }).eq("id", studentId);
      if (error) throw error;
      setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, group_id: null } : s)));
      setRemoveStudentData(null); 
    } catch (err) {
      alert("O'quvchini guruhdan chiqarishda xatolik: " + err.message);
    } finally {
      setRemovingStudentId(null);
    }
  };

  const handleEdit = (g) => {
    setFormValues({
      name: g.name || "",
      teacher_id: g.teacher_id || "",
      course_id: g.course_id || "",
      start_date: g.start_date || "",
      start_time: g.start_time || "",
      end_time: g.end_time || "",
      schedule_type: g.schedule_type || "all",
    });
    setEditId(g.id);
    setModalOpen(true);
  };

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
      const matchCourse = !filterCourse || String(g.course_id) === String(filterCourse);
      const matchTeacher = !filterTeacher || String(g.teacher_id) === String(filterTeacher);
      return matchSearch && matchCourse && matchTeacher;
    });
  }, [groups, search, filterCourse, filterTeacher]);

  const quickAddFilteredStudents = useMemo(() => {
    if (!quickAddStudentGroup) return [];
    const availableStudents = students.filter((s) => s.group_id !== quickAddStudentGroup.id);
    if (!quickAddSearch.trim()) return availableStudents;
    return availableStudents.filter((s) => {
      const fullName = `${s.name || ""} ${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
      return fullName.includes(quickAddSearch.toLowerCase());
    });
  }, [students, quickAddSearch, quickAddStudentGroup]);

  const renderModals = () => {
    return createPortal(
      <>
        {modalOpen && (
          <GroupFormModal 
            editId={editId} formValues={formValues} courses={courses} teachers={teachers} 
            saving={saving} onClose={resetForm} onChange={handleChange} onSubmit={handleSubmit} 
          />
        )}

        {quickAddStudentGroup && (
          <QuickAddStudentModal 
            targetGroup={quickAddStudentGroup} searchVal={quickAddSearch} filteredStudents={quickAddFilteredStudents}
            selectedStudents={quickSelectedStudents} saving={saving}
            onSearchChange={setQuickAddSearch} onSelectStudent={setQuickSelectedStudents}
            onSubmit={handleQuickAddStudentsSubmit} onClose={() => { setQuickAddStudentGroup(null); setQuickSelectedStudents([]); setQuickAddSearch(""); }}
          />
        )}

        {selectedGroup && (
          <GroupDetailModal 
            group={selectedGroup} students={students} removingId={removingStudentId}
            getCourse={getCourse} getTeacher={getTeacher} getStudentsCount={getStudentsCount}
            onRemoveStudentTrigger={(student) => setRemoveStudentData(student)} onClose={() => setSelectedGroup(null)}
          />
        )}

        {deleteId && (
          <ConfirmDeleteModal onCancel={() => setDeleteId(null)} onConfirm={confirmDelete} />
        )}

        {removeStudentData && (
          <ConfirmRemoveStudentModal 
            studentName={removeStudentData.name} 
            onCancel={() => setRemoveStudentData(null)} 
            onConfirm={confirmRemoveStudent} 
          />
        )}
      </>,
      document.body
    );
  };

  return (
    <div className="groups-container">
      <div className="groups-top-bar">
        <div className="title-area">
          <h1 className="page-main-title">{activeBranch?.name || "Branch"} • Groups</h1>
          <p className="page-description">Manage class schedules, teachers, and groups</p>
        </div>
        <button className="add-group-btn" onClick={() => setModalOpen(true)}>
          <FiPlus /> New Group
        </button>
      </div>

      <div className="groups-filter-wrapper">
        <div className="search-input-box">
          <FiSearch className="search-icon" />
          <input className="filter-field-input" placeholder="Search group name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter-select-dropdown" value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="filter-select-dropdown" value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
          <option value="">All teachers</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {loading ? (
        <GroupSkeletonGrid />
      ) : filteredGroups.length === 0 ? (
        <div className="empty-state">No groups found.</div>
      ) : (
        <div className="groups-main-grid">
          {filteredGroups.map((g) => (
            <GroupCard 
              key={g.id} group={g} getTeacher={getTeacher} getCourse={getCourse} 
              getStudentsCount={getStudentsCount} onEdit={handleEdit} 
              onDelete={setDeleteId} onOpenDetails={setSelectedGroup} onQuickAdd={setQuickAddStudentGroup} 
            />
          ))}
        </div>
      )}
      {renderModals()}
    </div>
  );
}

// ==========================================
// 📦 ISOLATED SUB-COMPONENTS
// ==========================================

function GroupCard({ group, getTeacher, getCourse, getStudentsCount, onEdit, onDelete, onOpenDetails, onQuickAdd }) {
  return (
    <div className="group-item-card" onClick={() => onOpenDetails(group)} style={{ cursor: "pointer" }}>
      <div className="group-card-info">
        <h3 className="group-card-name">{group.name}</h3>
        <div className="card-details-stack">
          <p><FiUser /> {getTeacher(group.teacher_id)}</p>
          <p><FiBookOpen /> {getCourse(group.course_id)}</p>
          <p><FiUsers /> {getStudentsCount(group.id)} Students</p>
        </div>
      </div>
      
      <div className="group-card-actions" onClick={(e) => e.stopPropagation()}>
        <div className="action-btn-row">
          <button className="action-btn edit-action" onClick={() => onEdit(group)} title="Edit Group"><FiEdit2 /></button>
          <button className="action-btn delete-action" onClick={() => onDelete(group.id)} title="Delete Group"><FiTrash2 /></button>
        </div>
        <button className="quick-add-student-trigger-btn" onClick={() => onQuickAdd(group)}>
          <FiUserPlus size={14} /> Add Student
        </button>
      </div>
    </div>
  );
}

function GroupFormModal({ editId, formValues, courses, teachers, saving, onClose, onChange, onSubmit }) {
  return (
    <div className="app-modal-overlay" onClick={onClose}>
      <div className="app-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="app-modal-header">
          <h3 className="modal-title">{editId ? "Edit Group" : "Create New Group"}</h3>
          <button className="modal-close-btn" onClick={onClose}><FiX /></button>
        </div>
        <form className="group-entry-form" onSubmit={onSubmit}>
          <div className="form-group-item">
            <label className="form-label">Group Name</label>
            <input className="form-control-input" name="name" placeholder="e.g. General English Morning" value={formValues.name} onChange={onChange} required />
          </div>
          <div className="form-row-grid">
            <div className="form-group-item">
              <label className="form-label">Course</label>
              <select className="form-control-select" name="course_id" onChange={onChange} value={formValues.course_id}>
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group-item">
              <label className="form-label">Teacher</label>
              <select className="form-control-select" name="teacher_id" onChange={onChange} value={formValues.teacher_id}>
                <option value="">Select teacher</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row-grid">
            <div className="form-group-item">
              <label className="form-label">Start Date</label>
              <input className="form-control-input" type="date" name="start_date" value={formValues.start_date} onChange={onChange} />
            </div>
            <div className="form-group-item">
              <label className="form-label">Schedule Type</label>
              <select className="form-control-select" name="schedule_type" value={formValues.schedule_type} onChange={onChange}>
                <option value="all">Every day</option>
                <option value="odd">Odd days (Mon, Wed, Fri)</option>
                <option value="even">Even days (Tue, Thu, Sat)</option>
              </select>
            </div>
          </div>
          <div className="form-row-grid">
            <div className="form-group-item">
              <label className="form-label">Start Time</label>
              <input className="form-control-input" type="time" name="start_time" value={formValues.start_time} onChange={onChange} />
            </div>
            <div className="form-group-item">
              <label className="form-label">End Time</label>
              <input className="form-control-input" type="time" name="end_time" value={formValues.end_time} onChange={onChange} />
            </div>
          </div>
          <button className="form-submit-button" disabled={saving} style={{ marginTop: "12px" }}>
            {saving ? "Saving..." : editId ? "Save Changes" : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
}

function QuickAddStudentModal({ targetGroup, searchVal, filteredStudents, selectedStudents, saving, onSearchChange, onSelectStudent, onSubmit, onClose }) {
  const toggleStudent = (id) => {
    if (selectedStudents.includes(id)) {
      onSelectStudent(selectedStudents.filter(sid => sid !== id));
    } else {
      onSelectStudent([...selectedStudents, id]);
    }
  };

  return (
    <div className="app-modal-overlay" onClick={onClose}>
      <div className="app-modal-box d-quick-add" onClick={(e) => e.stopPropagation()}>
        <div className="app-modal-header b-bottom">
          <div>
            <h3 className="modal-title d-flex-center"><FiUserPlus /> Add Students</h3>
            <p className="modal-subtitle">Target Group: <strong>{targetGroup.name}</strong></p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: "16px" }}>
          <div className="form-group-item">
            <div className="student-search-box-container">
              <FiSearch className="inner-search-icon" />
              <input type="text" className="form-control-input pl-32" placeholder="Type name to filter unassigned students..." value={searchVal} onChange={(e) => onSearchChange(e.target.value)} autoFocus />
            </div>

            <div className="quick-add-students-list-wrapper">
              {filteredStudents.length === 0 ? (
                <p className="no-data-msg">No available students found</p>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedStudents.includes(s.id);
                  const isTransfer = s.group_id && s.group_id !== targetGroup.id;
                  return (
                    <div key={s.id} onClick={() => toggleStudent(s.id)} className={`student-selectable-row ${isSelected ? "selected" : ""}`}>
                      <div>
                        <span className="student-row-name">{s.name || `${s.first_name || ""} ${s.last_name || ""}`}</span>
                        {isTransfer && <span className="transfer-badge">Transfers group</span>}
                      </div>
                      <div className={`custom-checkbox-circle ${isSelected ? "checked" : ""}`}>
                        {isSelected && <FiCheck />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="modal-footer-action-row">
            <button type="button" className="btn-no m-0" onClick={onClose}>Cancel</button>
            <button type="submit" className="form-submit-button m-0 w-auto-pad" disabled={saving || selectedStudents.length === 0}>
              {saving ? "Adding..." : `Add Selected (${selectedStudents.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GroupDetailModal({ group, students, removingId, getCourse, getTeacher, getStudentsCount, onRemoveStudentTrigger, onClose }) {
  const currentGroupStudents = useMemo(() => students.filter((s) => s.group_id === group.id), [students, group.id]);

  return (
    <div className="app-modal-overlay" onClick={onClose}>
      <div className="app-modal-box detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="app-modal-header">
          <h3 className="modal-title">Group Details</h3>
          <button className="modal-close-btn" onClick={onClose}><FiX /></button>
        </div>
        <div className="group-full-details">
          <div className="info-badge">
            <h2 className="info-title">{group.name}</h2>
            <span className="course-tag">{getCourse(group.course_id)}</span>
          </div>
          <div className="info-list">
            <p className="detail-row"><FiUser /> <strong>Teacher:</strong> {getTeacher(group.teacher_id)}</p>
            <p className="detail-row"><FiCalendar /> <strong>Start Date:</strong> {group.start_date || "Unknown"}</p>
            <p className="detail-row"><FiClock /> <strong>Time:</strong> {group.start_time || "??:??"} - {group.end_time || "??:??"}</p>
            <p className="detail-row"><FiUsers /> <strong>Total Students:</strong> {getStudentsCount(group.id)} active</p>
          </div>
          
          <div className="students-list-section">
            <h4><FiUsers /> Students Roster</h4>
            {currentGroupStudents.length === 0 ? (
              <p className="empty-roster-text">No students registered in this group yet.</p>
            ) : (
              <ul className="roster-list-element">
                {currentGroupStudents.map((student, index) => {
                  const studentName = student.name || `${student.first_name || ""} ${student.last_name || ""}`;
                  return (
                    <li key={student.id} className="roster-item">
                      <div className="roster-item-left">
                        <span className="roster-index">{String(index + 1).padStart(2, "0")}</span>
                        <span>{studentName}</span>
                      </div>
                      {/* ALERT O'RNIGA STATENI O'ZGARTIRIB MODALNI OCHADI */}
                      <button onClick={() => onRemoveStudentTrigger({ id: student.id, name: studentName })} disabled={removingId === student.id} className="remove-student-btn">
                        <FiTrash2 size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ onCancel, onConfirm }) {
  return (
    <div className="app-modal-overlay" onClick={onCancel}>
      <div className="app-modal-box confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon-wrapper"><FiAlertTriangle /></div>
        <h3>Delete Group</h3>
        <p>Are you sure you want to delete this group? This action cannot be undone.</p>
        <div className="confirm-footer-btns">
          <button className="btn-no" onClick={onCancel}>Cancel</button>
          <button className="btn-yes" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// 🆕 YANGI QO'SHILGAN O'QUVCHINI GURUHIDAN CHIQARISH MODALI Komponenti
function ConfirmRemoveStudentModal({ studentName, onCancel, onConfirm }) {
  return (
    <div className="app-modal-overlay" onClick={onCancel} style={{ zIndex: 1100 }}>
      <div className="app-modal-box confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon-wrapper" style={{ backgroundColor: "#fff1f0", color: "#ff4d4f" }}>
          <FiUserMinus />
        </div>
        <h3>Remove Student</h3>
        <p>Are you sure you want to remove <strong>{studentName}</strong> from this group?</p>
        <div className="confirm-footer-btns">
          <button className="btn-no" onClick={onCancel}>Cancel</button>
          <button className="btn-yes" style={{ backgroundColor: "#ff4d4f" }} onClick={onConfirm}>Remove</button>
        </div>
      </div>
    </div>
  );
}

function GroupSkeletonGrid() {
  return (
    <div className="groups-main-grid">
      {[...Array(6)].map((_, index) => (
        <div className="group-item-card skeleton-card" key={index}>
          <div className="group-card-info">
            <div className="skeleton skeleton-title"></div>
            <div className="card-details-stack">
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}