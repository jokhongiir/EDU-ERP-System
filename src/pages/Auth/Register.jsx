import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import BranchModal from "../BranchModal/BranchModal";
import logo2 from "../../assets/logo2.png";
import "../Auth/Auth.css";

import { FiMail, FiLock, FiHome, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    centerName: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [userId, setUserId] = useState(null);

  const handleChange = (e) => {
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  const validate = () => {
    if (!form.centerName.trim()) return "Center name is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.password.trim()) return "Password is required";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            centerName: form.centerName.trim(),
          },
        },
      });

      if (error) throw error;

      const user = data?.user;

      if (!user) throw new Error("Registration failed");

      setUserId(user.id);
      setShowBranchModal(true);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrapper">
      <BranchModal
        open={showBranchModal}
        userId={userId}
        onDone={(b) => navigate(`/dashboard/${b.id}`)}
      />

      <div className="authCard">
        <div className="authLeft">
          <div className="authLeftContent">
            <img src={logo2} className="authImage" alt="logo" />

            <h1 className="authLogo">Education ERP</h1>

            <p className="authText">
              Create your institution account and start managing students,
              teachers and branches in one system.
            </p>
          </div>
        </div>

        <div className="authRight">
          <div className="authHeader">
            <h2 className="authTitle">Create Account 🚀</h2>
            <p className="authSubtitle">Start your journey with ERP system</p>
          </div>

          <form className="authForm" onSubmit={handleRegister}>
            <div className="inputGroup">
              <FiHome className="inputIcon" />
              <input
                name="centerName"
                className="authInput"
                placeholder="Center / School Name"
                value={form.centerName}
                onChange={handleChange}
              />
            </div>

            <div className="inputGroup">
              <FiMail className="inputIcon" />
              <input
                name="email"
                type="email"
                className="authInput"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="inputGroup">
              <FiLock className="inputIcon" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                className="authInput"
                placeholder="Password (min 6 chars)"
                value={form.password}
                onChange={handleChange}
              />

              <button
                type="button"
                className="eyeButton"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {error && <div className="authError">{error}</div>}

            <button type="submit" className="authButton" disabled={loading}>
              {loading ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="authFooter">
            <p>
              Already have an account?{" "}
              <Link to="/" className="authLink">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}