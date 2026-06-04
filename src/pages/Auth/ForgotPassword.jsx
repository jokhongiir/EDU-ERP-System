import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
} from "react-icons/fi";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:5173/update-password",
      });

      if (error) {
        console.log(error);
        throw error;
      }

      setMessage("Email sent successfully");
    } catch (err) {
      console.log("FULL ERROR:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgotWrapper">
      <div className="forgotCard">
        <div className="forgotHeader">
          <div className="forgotIcon">
            <FiMail />
          </div>

          <h1>Forgot Password?</h1>

          <p>
            Enter your email address and we'll send you a secure link to reset
            your password.
          </p>
        </div>

        <form onSubmit={handleReset} className="forgotForm">
          <div className="inputGroup">
            <FiMail className="inputIcon" />

            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {message && (
            <div className="successBox">
              <FiCheckCircle />
              <div>
                <strong>Email Sent Successfully</strong>
                <p>{message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="errorBox">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="resetButton" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <Link to="/" className="backLink">
          <FiArrowLeft />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
