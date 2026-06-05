import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";

import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
} from "react-icons/fi";

import "./UpdatePassword.css";

export default function UpdatePassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccess(
        "Your password has been updated successfully. Redirecting to login...",
      );

      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/");
      }, 2500);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="updateWrapper">
      <div className="updateCard">
        <div className="updateHeader">
          <div className="updateIcon">
            <FiShield />
          </div>

          <h1>Create New Password</h1>

          <p>
            Your new password must be different from previously used passwords.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="updateForm">
          <div className="inputGroup">
            <FiLock className="inputIcon" />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              className="eyeBtn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="inputGroup">
            <FiLock className="inputIcon" />

            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              type="button"
              className="eyeBtn"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {success && (
            <div className="successBox">
              <FiCheckCircle />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="errorBox">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="updateButton" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
