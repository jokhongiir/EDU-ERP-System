import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import BranchModal from "../BranchModal/BranchModal";
import logo2 from "../../assets/logo2.png";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
} from "react-icons/fi";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;

        if (!session?.user) {
          setCheckingSession(false);
          return;
        }

        const uid = session.user.id;

        const { data: teacherCheck } = await supabase
          .from("teachers")
          .select("id")
          .eq("auth_id", uid)
          .maybeSingle();

        if (teacherCheck) {
          navigate("/teacher/groups", { replace: true });
          return;
        }

        const { data: branches } = await supabase
          .from("branches")
          .select("id")
          .eq("owner_uid", uid);

        if (!branches || branches.length === 0) {
          setUserId(uid);
          setShowBranchModal(true);
          setCheckingSession(false);
        } else {
          navigate(`/dashboard/${branches[0].id}`, { replace: true });
        }
      } catch (err) {
        console.error("Session check error:", err.message);
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (authError) throw authError;

      const user = data?.user;
      if (!user) throw new Error("Login failed: User data not found");

      const { data: teacherCheck } = await supabase
        .from("teachers")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (teacherCheck) {
        navigate("/teacher/groups", { replace: true });
        return;
      }

      const { data: branches } = await supabase
        .from("branches")
        .select("id")
        .eq("owner_uid", user.id);

      if (!branches || branches.length === 0) {
        setUserId(user.id);
        setShowBranchModal(true);
      } else {
        navigate(`/dashboard/${branches[0].id}`, { replace: true });
      }
    } catch (err) {
      if (err.message?.includes("Invalid login credentials")) {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="auth-page">
        <div className="auth-session-loader">
          <span className="auth-spinner"></span>
          <p>Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <BranchModal
        open={showBranchModal}
        userId={userId}
        onDone={(branch) =>
          navigate(`/dashboard/${branch.id}`, { replace: true })
        }
      />

      <div className="auth-box">
        {/* Brand panel — centered */}
        <div className="auth-brand">
          <img
            src={logo2}
            alt="Education ERP System"
            className="auth-logo-img"
          />
          <h1>Education ERP System</h1>
          <p>
            Smart education management for academies, schools and learning
            centers.
          </p>
        </div>

        {/* Form */}
        <div className="auth-form-side">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <div className="auth-input-wrap">
                <FiMail className="auth-field-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <FiLock className="auth-field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="auth-spinner auth-spinner--sm"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}