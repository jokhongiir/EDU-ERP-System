import { useEffect, useState, useRef } from "react";
import {
  Search,
  ChevronDown,
  Menu,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
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

  // ================= USER =================
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    loadUser();
  }, []);

  // ================= CLOSE DROPDOWN =================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ================= SAVE (CREATE / UPDATE) =================
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

      // 🔥 auto refresh UI
      await refreshBranches?.();

      // OPTIONAL: full reload (if you really want hard refresh)
      window.location.reload();

    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // ================= EDIT =================
  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setForm({ name: branch.name });
    setModalOpen(true);
    setDropdownOpen(false);
  };

  // ================= DELETE CLICK =================
  const handleDeleteClick = (branch) => {
    setSelectedBranch(branch);
    setDeleteModalOpen(true);
    setDropdownOpen(false);
  };

  // ================= CONFIRM DELETE =================
  const handleDeleteConfirm = async () => {
    if (!selectedBranch) return;

    try {
      await supabase
        .from("branches")
        .delete()
        .eq("id", selectedBranch.id);

      setDeleteModalOpen(false);
      setSelectedBranch(null);

      // 🔥 auto refresh UI
      await refreshBranches?.();

      // OPTIONAL HARD REFRESH
      window.location.reload();

    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <header className="erp-navbar">

      {/* ================= LEFT ================= */}
      <div className="erp-navbar__left">
        <button className="erp-navbar__menu-btn" onClick={toggleSidebar}>
          <Menu size={22} />
        </button>

        <h1 className="erp-navbar__title">
          {centerName || "EDU ERP"}
        </h1>

        <div className="erp-navbar__search">
          <Search size={18} />
          <input placeholder="Search..." />
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="erp-navbar__right">

        {/* BRANCH DROPDOWN */}
        <div className="erp-navbar__dropdown" ref={dropdownRef}>

          <button
            className="erp-navbar__dropdown-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {activeBranch?.name || "Select Branch"}
            <ChevronDown size={16} />
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
                <Plus size={16} />
                New Branch
              </div>

              <div className="erp-navbar__divider" />

              {branches.map((b) => (
                <div key={b.id} className="erp-navbar__branch-item">

                  <span
                    onClick={() => {
                      setActiveBranch(b);
                      setDropdownOpen(false);
                    }}
                  >
                    {b.name}
                  </span>

                  <div className="erp-navbar__actions">
                    <Edit size={14} onClick={() => handleEdit(b)} />

                    <Trash2
                      size={14}
                      onClick={() => handleDeleteClick(b)}
                    />
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* USER */}
        <div className="erp-navbar__user">
          <div className="erp-navbar__avatar">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <span>{user?.email}</span>
        </div>
      </div>

      {/* ================= CREATE / EDIT MODAL ================= */}
      {modalOpen && (
        <div className="erp-modal__overlay">
          <div className="erp-modal">

            <h3>
              {editingBranch ? "Edit Branch" : "Create Branch"}
            </h3>

            <input
              value={form.name}
              onChange={(e) => setForm({ name: e.target.value })}
              placeholder="Enter branch name"
            />

            <div className="erp-modal__actions">
              <button onClick={() => setModalOpen(false)}>
                Cancel
              </button>

              <button onClick={handleSave}>
                {editingBranch ? "Update" : "Create"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= DELETE MODAL ================= */}
      {deleteModalOpen && (
        <div className="erp-modal__overlay">
          <div className="erp-modal erp-modal--danger">

            <h3>Confirm Deletion</h3>

            <p>
              Are you sure you want to delete{" "}
              <b>{selectedBranch?.name}</b>? This action cannot be undone.
            </p>

            <div className="erp-modal__actions">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedBranch(null);
                }}
              >
                Cancel
              </button>

              <button
                className="danger"
                onClick={handleDeleteConfirm}
              >
                Yes, Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}