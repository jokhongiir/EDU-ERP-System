import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

import { FiLock, FiArrowRight } from "react-icons/fi";

export default function UpdatePassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Password required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrapper">
      <div className="authCard">
        <div className="authRight">
          <h2 className="authTitle">Set New Password</h2>

          <form className="authForm" onSubmit={handleUpdate}>
            <div className="inputGroup">
              <FiLock className="inputIcon" />

              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="authInput"
              />
            </div>

            {error && <div className="authError">{error}</div>}

            <button className="authButton" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
              <FiArrowRight />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}