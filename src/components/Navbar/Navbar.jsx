import { useEffect, useState, useRef } from "react";
import { Search, ChevronDown, Menu, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "../../services/supabaseClient";
import "./Navbar.css";

export default function Navbar({
  activeBranch,
  branches,
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
  const dropdownRef = useRef();

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    loadUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingBranch) {
        await supabase
          .from("branches")
          .update({ name: form.name })
          .eq("id", editingBranch.id);
      } else {
        await supabase.from("branches").insert([
          {
            name: form.name,
            owner_uid: user?.id,
          },
        ]);
      }
      setModalOpen(false);
      setEditingBranch(null);
      setForm({ name: "" });
      await refreshBranches?.();
      window.location.reload();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleEdit = (e, branch) => {
    e.stopPropagation();
    setEditingBranch(branch);
    setForm({ name: branch.name });
    setModalOpen(true);
    setDropdownOpen(false);
  };

  const handleDeleteClick = (e, branch) => {
    e.stopPropagation();
    setSelectedBranch(branch);
    setDeleteModalOpen(true);
    setDropdownOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBranch) return;
    try {
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", selectedBranch.id);

      if (error) throw error;

      setDeleteModalOpen(false);
      setSelectedBranch(null);
      await refreshBranches?.();
      window.location.reload();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <header className="erp-navbar">
      <div className="erp-navbar__left">
        <button className="erp-navbar__menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <h1 className="erp-navbar__title">{centerName || "EDU ERP"}</h1>
      </div>
      <div className="erp-navbar__right">
        <div className="erp-navbar__dropdown" ref={dropdownRef}>
          <button
            className="erp-navbar__dropdown-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {activeBranch?.name || "Select Branch"}
            <ChevronDown size={14} />
          </button>
          {dropdownOpen && (
            <div className="erp-navbar__dropdown-menu">
              <div
                className="erp-navbar__dropdown-add"
                onClick={() => {
                  setModalOpen(true);
                  setEditingBranch(null);
                  setForm({ name: "" });
                  setDropdownOpen(false);
                }}
              >
                <Plus size={15} />
                Add New Branch
              </div>
              <div className="erp-navbar__divider" />
              {branches.map((b) => (
                <div
                  key={b.id}
                  className={`erp-navbar__branch-item ${activeBranch?.id === b.id ? "is-active" : ""}`}
                  onClick={() => {
                    setActiveBranch(b);
                    setDropdownOpen(false);
                  }}
                >
                  <span className="erp-navbar__branch-name">{b.name}</span>
                  <div className="erp-navbar__actions">
                    <button
                      className="erp-navbar__action-btn edit"
                      onClick={(e) => handleEdit(e, b)}
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      className="erp-navbar__action-btn delete"
                      onClick={(e) => handleDeleteClick(e, b)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="erp-navbar__user">
          <div className="erp-navbar__avatar">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <span className="erp-navbar__email">{user?.email}</span>
        </div>
      </div>

      {modalOpen && (
        <div className="erp-modal__overlay">
          <div className="erp-modal">
            <h3>{editingBranch ? "Edit Branch" : "Create New Branch"}</h3>
            <input
              value={form.name}
              onChange={(e) => setForm({ name: e.target.value })}
              placeholder="Enter branch name"
              autoFocus
            />
            <div className="erp-modal__actions">
              <button className="btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSave}>
                {editingBranch ? "Save Changes" : "Create Branch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="erp-modal__overlay">
          <div className="erp-modal erp-modal--danger">
            <h3>Are you absolutely sure?</h3>
            <p>
              Are you sure you want to delete <b>{selectedBranch?.name}</b>? 
              This action cannot be undone and all associated data will be removed.
            </p>
            <div className="erp-modal__actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedBranch(null);
                }}
              >
                Keep Branch
              </button>
              <button className="btn-danger" onClick={handleDeleteConfirm}>
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}