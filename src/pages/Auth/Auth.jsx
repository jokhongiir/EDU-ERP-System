import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import BranchModal from "../BranchModal/BranchModal";
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

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  // ================= MAIN AUTH LOGIC =================
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { email, password, centerName } = form;

      if (!email || !password) {
        throw new Error("Please fill in both email and password.");
      }

      // 1. REGISTER LOGIC
      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { centerName },
          },
        });

        if (signUpError) throw signUpError;
        if (!data.user) throw new Error("An error occurred during registration.");

        setUserId(data.user.id);
        setShowBranchModal(true);
      } 
      
      // 2. LOGIN LOGIC
      else {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        const user = authData.user;

        // 🔥 CHECK BRANCH (Professional logic to prevent accidental modal triggers)
        const { data: branches, error: branchError } = await supabase
          .from("branches")
          .select("id")
          .eq("owner_uid", user.id);

        if (branchError) throw branchError;

        // If no branches are found, force branch creation
        if (!branches || branches.length === 0) {
          setUserId(user.id);
          setShowBranchModal(true);
        } else {
          // If a branch exists, redirect to the first available dashboard
          navigate(`/dashboard/${branches[0].id}`);
        }
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ================= AFTER BRANCH CREATION =================
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
        <div className="authLeft">
          <h1 className="authLogo">Edu ERP</h1>
          <p className="authText">Smart Education Management System</p>
        </div>

        <div className="authRight">
          <h2 className="authTitle">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleAuth} className="authForm">
            {isRegister && (
              <input
                name="centerName"
                placeholder="Learning Center Name"
                value={form.centerName}
                onChange={handleChange}
                className="authInput"
                required
              />
            )}

            <input
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="authInput"
              type="email"
              required
            />

            <input
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="authInput"
              type="password"
              required
            />

            {error && <div className="authError">{error}</div>}

            <button 
              type="submit" 
              className="authButton" 
              disabled={loading}
            >
              {loading ? (
                <span className="loader">Processing...</span>
              ) : isRegister ? (
                "Sign Up"
              ) : (
                "Login"
              )}
            </button>
          </form>

          <p
            className="authSwitch"
            onClick={() => {
              setIsRegister(!isRegister);
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