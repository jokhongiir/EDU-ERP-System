import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { Link } from "react-router-dom";
import "./Auth.css";

import { FiMail, FiArrowRight } from "react-icons/fi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setMessage("Password reset link sent to your email!");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrapper">
      <div className="authCard">
        <div className="authLeft">
          <div className="authLeftContent">
            <h1 className="authLogo">Reset Password</h1>
            <p className="authText">
              Enter your email and we’ll send you a reset link
            </p>
          </div>
        </div>

        <div className="authRight">
          <h2 className="authTitle">Forgot Password</h2>

          <form className="authForm" onSubmit={handleReset}>
            {/* EMAIL */}
            <div className="inputGroup">
              <FiMail className="inputIcon" />

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="authInput"
              />
            </div>

            {/* MESSAGE */}
            {message && <div className="authSuccess">{message}</div>}
            {error && <div className="authError">{error}</div>}

            {/* BUTTON */}
            <button className="authButton" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
              <FiArrowRight />
            </button>
          </form>

          <p className="authSwitch">
            Back to <Link to="/">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}