import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import BranchModal from "../BranchModal/BranchModal";
import logo2 from "../../assets/logo2.png";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
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
        console.error(err);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error("Login failed");

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
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="authWrapper">
        <div className="authSessionLoader">
          <span className="loader"></span>
          <p>Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="authWrapper">
      <BranchModal
        open={showBranchModal}
        userId={userId}
        onDone={(branch) =>
          navigate(`/dashboard/${branch.id}`, { replace: true })
        }
      />

      <div className="authCard">
        <div className="authLeft">
          <div className="authLeftContent">
            <img src={logo2} alt="Education ERP" className="authImage" />
            <h1 className="authLogo">Education ERP System</h1>
            <p className="authText">
              Smart education management system for academies, schools and
              learning centers.
            </p>

            <div className="statsBox">
              <div className="statItem">
                <h3>10K+</h3>
                <span>Students</span>
              </div>
              <div className="statItem">
                <h3>500+</h3>
                <span>Teachers</span>
              </div>
              <div className="statItem">
                <h3>120+</h3>
                <span>Branches</span>
              </div>
            </div>

            <div className="securityBadge">
              <FiShield />
              <span>Enterprise Grade Security</span>
            </div>
          </div>
        </div>

        <div className="authRight">
          <div className="authHeader">
            <h2 className="authTitle">Welcome Back</h2>
            <p className="authSubtitle">
              Sign in to access your ERP dashboard
            </p>
          </div>

          <form className="authForm" onSubmit={handleLogin}>
            <div className="inputGroup">
              <FiMail className="inputIcon" />
              <input
                type="email"
                name="email"
                className="authInput"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="inputGroup">
              <FiLock className="inputIcon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="authInput"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="eyeButton"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className="authOptions">
              <span />
              <Link to="/forgot-password" className="forgotPassword">
                Forgot password?
              </Link>
            </div>

            {error && <div className="authError">{error}</div>}

            <button type="submit" className="authButton" disabled={loading}>
              {loading ? (
                <>
                  <span className="loader"></span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="authFooter">
            <p>Protected by Education ERP Security Infrastructure</p>
          </div>
        </div>
      </div>
    </div>
  );
}