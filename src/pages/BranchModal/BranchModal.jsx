import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import "./BranchModal.css";

export default function BranchModal({ open, onDone }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= CREATE BRANCH =================
  const createBranch = async () => {
    if (!name.trim()) {
      setError("Branch name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // get current user
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) throw new Error("User not found");

      // insert branch
      const { data, error } = await supabase
        .from("branches")
        .insert([
          {
            name,
            owner_uid: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // success callback
      onDone(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ================= ESCAPE =================
  if (!open) return null;

  return (
    <div className="bmOverlay">
      <div className="bmCard">

        {/* HEADER */}
        <div className="bmHeader">
          <h2>Create your first branch</h2>
          <p>
            You need a branch to continue using Edu ERP system
          </p>
        </div>

        {/* INPUT */}
        <input
          type="text"
          placeholder="e.g. Chilonzor Branch"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bmInput"
        />

        {/* ERROR */}
        {error && <div className="bmError">{error}</div>}

        {/* BUTTON */}
        <button
          className="bmButton"
          onClick={createBranch}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Branch"}
        </button>

        {/* FOOTER INFO */}
        <div className="bmFooterText">
          This will be your main organization workspace
        </div>

      </div>
    </div>
  );
}