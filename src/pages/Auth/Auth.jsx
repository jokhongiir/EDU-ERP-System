import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import BranchModal from "../BranchModal/BranchModal";
import logo2 from "../../assets/logo2.png";
import "./Auth.css";

export default function Auth() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [userId, setUserId] = useState(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    centerName: "",
  });

  // ================= INPUT CHANGE =================
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ================= MAIN AUTH =================
  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { email, password, centerName } = form;

      if (!email || !password) {
        throw new Error("Email va parol kiritish majburiy!");
      }

      // ================= REGISTER =================
      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { centerName },
          },
        });

        if (signUpError) throw signUpError;
        if (!data?.user) throw new Error("Registration failed!");

        setUserId(data.user.id);
        setShowBranchModal(true);
      }

      // ================= LOGIN =================
      else {
        const { data: authData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) throw signInError;

        const user = authData?.user;

        if (!user) throw new Error("Login failed!");

        const { data: branches, error: branchError } = await supabase
          .from("branches")
          .select("id")
          .eq("owner_uid", user.id);

        if (branchError) throw branchError;

        if (!branches || branches.length === 0) {
          setUserId(user.id);
          setShowBranchModal(true);
        } else {
          navigate(`/dashboard/${branches[0].id}`);
        }
      }

      // reset form after success
      setForm({
        email: "",
        password: "",
        centerName: "",
      });
    } catch (err) {
      setError(err.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ================= BRANCH CREATED =================
  const handleBranchCreated = (branch) => {
    setShowBranchModal(false);

    if (branch?.id) {
      navigate(`/dashboard/${branch.id}`);
    }
  };

  return (
    <div className="authWrapper">
      <BranchModal
        open={showBranchModal}
        userId={userId}
        onDone={handleBranchCreated}
      />

      <div className="authCard">
        {/* LEFT SIDE */}
        <div className="authLeft">
          <div className="authLeftContent">
            <img src={logo2} alt="logo" className="authImage" />

            <h1 className="authLogo">Education ERP System</h1>

            <p className="authText">
              Smart Education Management System for modern learning centers.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="authRight">
          <h2 className="authTitle">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>

          {/* 🔥 FORM (ENTER WORKS 100%) */}
          <form onSubmit={handleAuth} className="authForm">
            {isRegister && (
              <input
                name="centerName"
                placeholder="Learning Center Name"
                value={form.centerName}
                onChange={handleChange}
                className="authInput"
                autoComplete="organization"
              />
            )}

            <input
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="authInput"
              type="email"
              autoComplete="email"
            />

            <input
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="authInput"
              type="password"
              autoComplete="current-password"
            />

            {error && <div className="authError">{error}</div>}

            <button
              type="submit"
              className="authButton"
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : isRegister
                ? "Sign Up"
                : "Login"}
            </button>
          </form>

          {/* SWITCH */}
          <p
            className="authSwitch"
            onClick={() => {
              setIsRegister((prev) => !prev);
              setError("");
            }}
          >
            {isRegister
              ? "Already have an account? Login"
              : "Don't have an account? Sign up"}
          </p>
        </div>
      </div>
    </div>
  );
}