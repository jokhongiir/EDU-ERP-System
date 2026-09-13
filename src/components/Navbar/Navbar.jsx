import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronDown, Menu, Plus, Edit, Trash2, X } from "lucide-react";
import { supabase } from "../../services/supabaseClient";
import "./Navbar.css";

export default function Navbar({
  activeBranch,
  branches = [],
  setActiveBranch,
  centerName,
  toggleSidebar,
  refreshBranches,
}) {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [form, setForm] = useState({ name: "" });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const dropdownRef = useRef(null);

  // Userni yuklash
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    loadUser();
  }, []);

  // Tashqariga bosilganda dropdown yopish
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape tugmasi bilan modallarni yopish
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setModalOpen(false);
        setDeleteModalOpen(false);
        setDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingBranch(null);
    setForm({ name: "" });
    setError("");
    setModalOpen(true);
    setDropdownOpen(false);
  }, []);

  const handleEdit = useCallback((e, branch) => {
    e.stopPropagation();
    setEditingBranch(branch);
    setForm({ name: branch.name });
    setError("");
    setModalOpen(true);
    setDropdownOpen(false);
  }, []);

  const handleDeleteClick = useCallback((e, branch) => {
    e.stopPropagation();
    setSelectedBranch(branch);
    setDeleteModalOpen(true);
    setDropdownOpen(false);
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Branch name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingBranch) {
        const { error } = await supabase
          .from("branches")
          .update({ name: form.name.trim() })
          .eq("id", editingBranch.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("branches").insert([
          {
            name: form.name.trim(),
            owner_uid: user?.id,
          },
        ]);

        if (error) throw error;
      }

      setModalOpen(false);
      setEditingBranch(null);
      setForm({ name: "" });
      await refreshBranches?.();
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBranch) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", selectedBranch.id);

      if (error) throw error;

      setDeleteModalOpen(false);
      setSelectedBranch(null);
      await refreshBranches?.();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.message || "Failed to delete branch");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <header className="erpNavbar">
        {/* LEFT */}
        <div className="erpNavbar__left">
          <button
            className="erpNavbar__menuBtn"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} strokeWidth={2} />
          </button>

          <h1 className="erpNavbar__title">
            {centerName || "EDU ERP"}
          </h1>
        </div>

        {/* RIGHT */}
        <div className="erpNavbar__right">
          {/* Branch Dropdown */}
          <div className="erpNavbar__dropdown" ref={dropdownRef}>
            <button
              className="erpNavbar__dropdownBtn"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <span className="erpNavbar__branchLabel">
                {activeBranch?.name || "Select Branch"}
              </span>
              <ChevronDown
                size={16}
                className={`erpNavbar__chevron ${dropdownOpen ? "isOpen" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="erpNavbar__dropdownMenu" role="menu">
                <button
                  className="erpNavbar__addBtn"
                  onClick={openCreateModal}
                  role="menuitem"
                >
                  <Plus size={16} strokeWidth={2.2} />
                  <span>Add New Branch</span>
                </button>

                <div className="erpNavbar__divider" />

                <div className="erpNavbar__branchList">
                  {branches.length === 0 ? (
                    <div className="erpNavbar__empty">No branches yet</div>
                  ) : (
                    branches.map((b) => (
                      <div
                        key={b.id}
                        className={`erpNavbar__branchItem ${
                          activeBranch?.id === b.id ? "isActive" : ""
                        }`}
                        onClick={() => {
                          setActiveBranch(b);
                          setDropdownOpen(false);
                        }}
                        role="menuitem"
                      >
                        <span className="erpNavbar__branchName">{b.name}</span>

                        <div className="erpNavbar__actions">
                          <button
                            className="erpNavbar__actionBtn edit"
                            onClick={(e) => handleEdit(e, b)}
                            title="Edit"
                            aria-label="Edit branch"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="erpNavbar__actionBtn delete"
                            onClick={(e) => handleDeleteClick(e, b)}
                            title="Delete"
                            aria-label="Delete branch"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div className="erpNavbar__user">
            <div className="erpNavbar__avatar" title={user?.email}>
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="erpNavbar__email">{user?.email}</span>
          </div>
        </div>
      </header>

      {/* ====== CREATE / EDIT MODAL ====== */}
      {modalOpen && (
        <div className="erpModal__overlay" onClick={() => !saving && setModalOpen(false)}>
          <div
            className="erpModal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="erpModal__header">
              <h3>{editingBranch ? "Edit Branch" : "Create New Branch"}</h3>
              <button
                className="erpModal__close"
                onClick={() => !saving && setModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="erpModal__body">
              <label className="erpModal__label">Branch name</label>
              <input
                className="erpModal__input"
                value={form.name}
                onChange={(e) => {
                  setForm({ name: e.target.value });
                  setError("");
                }}
                placeholder="e.g. Main Campus, Tashkent Branch"
                autoFocus
                disabled={saving}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              {error && <p className="erpModal__error">{error}</p>}
            </div>

            <div className="erpModal__footer">
              <button
                className="erpBtn erpBtn--ghost"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="erpBtn erpBtn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : editingBranch ? "Save Changes" : "Create Branch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE CONFIRMATION ====== */}
      {deleteModalOpen && (
        <div className="erpModal__overlay" onClick={() => !deleting && setDeleteModalOpen(false)}>
          <div
            className="erpModal erpModal--danger"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="erpModal__header">
              <h3>Delete Branch?</h3>
              <button
                className="erpModal__close"
                onClick={() => !deleting && setDeleteModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="erpModal__body">
              <p>
                Are you sure you want to delete{" "}
                <strong>{selectedBranch?.name}</strong>?
                <br />
                This action cannot be undone.
              </p>
            </div>

            <div className="erpModal__footer">
              <button
                className="erpBtn erpBtn--ghost"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedBranch(null);
                }}
                disabled={deleting}
              >
                Keep Branch
              </button>
              <button
                className="erpBtn erpBtn--danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}