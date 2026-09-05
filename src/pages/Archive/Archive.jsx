import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../services/supabaseClient";
import {
  FiSearch,
  FiRotateCcw,
  FiTrash2,
  FiArchive,
  FiAlertTriangle,
} from "react-icons/fi";
import "./Archive.css";

export default function Archive({ activeBranch }) {
  const branchId = activeBranch?.id;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm modal: { type: "restore" | "delete" | "error", id?, name?, message? }
  const [confirmModal, setConfirmModal] = useState(null);

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*, courses(name), teachers(name), groups(name)")
        .eq("branch_id", branchId)
        .eq("is_archived", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    document.body.style.overflow = confirmModal ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [confirmModal]);

  const openRestoreConfirm = (student) => {
    setConfirmModal({
      type: "restore",
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
    });
  };

  const openDeleteConfirm = (student) => {
    setConfirmModal({
      type: "delete",
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal || confirmModal.type === "error") return;
    setActionLoading(true);

    try {
      if (confirmModal.type === "restore") {
        const { error } = await supabase
          .from("students")
          .update({ is_archived: false })
          .eq("id", confirmModal.id);
        if (error) throw error;
        setStudents((prev) => prev.filter((s) => s.id !== confirmModal.id));
      }

      if (confirmModal.type === "delete") {
        const { error } = await supabase
          .from("students")
          .delete()
          .eq("id", confirmModal.id);
        if (error) throw error;
        setStudents((prev) => prev.filter((s) => s.id !== confirmModal.id));
      }

      setConfirmModal(null);
    } catch (err) {
      setConfirmModal({
        type: "error",
        message: err.message || "Something went wrong",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
      return name.includes(search.toLowerCase());
    });
  }, [students, search]);

  const renderConfirmModal = () => {
    if (!confirmModal) return null;

    const isError = confirmModal.type === "error";
    const isRestore = confirmModal.type === "restore";
    const isDelete = confirmModal.type === "delete";

    return createPortal(
      <div
        className="ar-modal-overlay"
        onClick={() => !actionLoading && setConfirmModal(null)}
      >
        <div
          className="ar-confirm-box"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`ar-confirm-icon ${
              isError ? "error" : isDelete ? "danger" : "restore"
            }`}
          >
            <FiAlertTriangle />
          </div>

          <h3>
            {isError
              ? "Error"
              : isRestore
                ? "Restore Student"
                : "Delete Student"}
          </h3>

          <p>
            {isError ? (
              confirmModal.message
            ) : isRestore ? (
              <>
                Are you sure you want to restore{" "}
                <strong>{confirmModal.name}</strong>? They will be moved back to
                the active Students list.
              </>
            ) : (
              <>
                Are you sure you want to permanently delete{" "}
                <strong>{confirmModal.name}</strong>? This action cannot be
                undone.
              </>
            )}
          </p>

          <div className="ar-confirm-btns">
            {isError ? (
              <button
                className="ar-btn primary"
                onClick={() => setConfirmModal(null)}
              >
                OK
              </button>
            ) : (
              <>
                <button
                  className="ar-btn cancel"
                  onClick={() => setConfirmModal(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className={`ar-btn ${isDelete ? "danger" : "restore"}`}
                  onClick={handleConfirmAction}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? isRestore
                      ? "Restoring..."
                      : "Deleting..."
                    : isRestore
                      ? "Restore"
                      : "Delete"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>,
      document.body,
    );
  };

  return (
    <div className="ar-root">
      <div className="ar-header-section">
        <div className="ar-title-area">
          <h1 className="ar-page-title">
            {activeBranch?.name || "Management"} • Archive
          </h1>
          <p className="ar-page-desc">
            Students who paused their studies. Restore them anytime.
          </p>
        </div>
      </div>

      <div className="ar-search-wrapper">
        <div className="ar-search">
          <FiSearch />
          <input
            placeholder="Search archived students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="ar-table-wrapper">
        <table className="ar-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>Contact Phone</th>
              <th>Course</th>
              <th>Teacher</th>
              <th>Group</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <div className="ar-skeleton ar-skel-id" />
                  </td>
                  <td>
                    <div className="ar-skeleton ar-skel-name" />
                  </td>
                  <td>
                    <div className="ar-skeleton ar-skel-phone" />
                  </td>
                  <td>
                    <div className="ar-skeleton ar-skel-badge" />
                  </td>
                  <td>
                    <div className="ar-skeleton ar-skel-badge" />
                  </td>
                  <td>
                    <div className="ar-skeleton ar-skel-badge" />
                  </td>
                  <td>
                    <div className="ar-skel-actions">
                      <div className="ar-skeleton ar-skel-btn" />
                      <div className="ar-skeleton ar-skel-btn" />
                    </div>
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="ar-empty">
                    <FiArchive size={44} />
                    <h3>No archived students</h3>
                    <p>Archived students will appear here</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td className="ar-name">
                    {s.first_name} {s.last_name}
                  </td>
                  <td>{s.phone || "—"}</td>
                  <td>
                    <span className="ar-badge">
                      {s.courses?.name || "N/A"}
                    </span>
                  </td>
                  <td>{s.teachers?.name || "—"}</td>
                  <td>{s.groups?.name || "—"}</td>
                  <td>
                    <div className="ar-actions">
                      <button
                        className="ar-action-btn restore"
                        onClick={() => openRestoreConfirm(s)}
                        title="Restore to Students"
                      >
                        <FiRotateCcw />
                      </button>
                      <button
                        className="ar-action-btn delete"
                        onClick={() => openDeleteConfirm(s)}
                        title="Delete Permanently"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {renderConfirmModal()}
    </div>
  );
}