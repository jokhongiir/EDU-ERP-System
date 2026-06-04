import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import BranchModal from "../BranchModal/BranchModal";
import logo2 from "../../assets/logo2.png";
import "./Auth.css";

import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiArrowRight,
} from "react-icons/fi";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const [showBranchModal, setShowBranchModal] = useState(false);

  const [userId, setUserId] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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

      // ❗ REMEMBER ME HERE (REAL WAY)
      if (!rememberMe) {
        // session-only (tab yopilsa logout bo‘lishiga yaqin)
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      const { data: branches } = await supabase
        .from("branches")
        .select("id")
        .eq("owner_uid", user.id);

      if (!branches || branches.length === 0) {
        setUserId(user.id);
        setShowBranchModal(true);
      } else {
        navigate(`/dashboard/${branches[0].id}`);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();

    console.log("RESET CLICKED");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/update-password",
    });

    console.log(error);
  };

  return (
    <div className="authWrapper">
      <BranchModal
        open={showBranchModal}
        userId={userId}
        onDone={(branch) => navigate(`/dashboard/${branch.id}`)}
      />

      <div className="authCard">
        {/* LEFT PANEL */}

        <div className="authLeft">
          <div className="authLeftContent">
            <img src={logo2} alt="Education ERP" className="authImage" />

            <h1 className="authLogo">Education ERP</h1>

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

        {/* RIGHT PANEL */}

        <div className="authRight">
          <div className="authHeader">
            <h2 className="authTitle">Welcome Back 👋</h2>

            <p className="authSubtitle">Sign in to access your ERP dashboard</p>
          </div>

          <form className="authForm" onSubmit={handleLogin}>
            {/* EMAIL */}

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
              />
            </div>

            {/* PASSWORD */}

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
              />

              <button
                type="button"
                className="eyeButton"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {/* OPTIONS */}

            <div className="authOptions">
              <label className="rememberMe">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />

                <span>Remember me</span>
              </label>

              <Link to="/forgot-password" className="forgotPassword">
                Forgot password?
              </Link>
            </div>

            {/* ERROR */}

            {error && <div className="authError">{error}</div>}

            {/* BUTTON */}

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
