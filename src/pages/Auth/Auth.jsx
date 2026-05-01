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

  // ================= AUTH =================
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { email, password, centerName } = form;

      if (!email || !password) {
        throw new Error("Email va password kiriting");
      }

      // ================= REGISTER =================
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { centerName },
          },
        });

        if (error) throw error;

        setUserId(data.user.id);
        setShowBranchModal(true);
      }

      // ================= LOGIN =================
      else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const user = data.user;

        // 🔥 CHECK BRANCH
        const { data: branch } = await supabase
          .from("branches")
          .select("*")
          .eq("owner_uid", user.id)
          .maybeSingle();

        if (!branch) {
          setUserId(user.id);
          setShowBranchModal(true);
          return;
        }

        navigate(`/dashboard/${branch.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= AFTER BRANCH =================
  const handleBranchCreated = (branch) => {
    setShowBranchModal(false);
    navigate(`/dashboard/${branch.id}`);
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
          <p className="authText">
            Smart Education Management System
          </p>
        </div>

        <div className="authRight">

          <h2 className="authTitle">
            {isRegister ? "Create account" : "Welcome back"}
          </h2>

          <form onSubmit={handleAuth} className="authForm">

            {isRegister && (
              <input
                name="centerName"
                placeholder="Center name"
                value={form.centerName}
                onChange={handleChange}
                className="authInput"
              />
            )}

            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="authInput"
              type="email"
            />

            <input
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="authInput"
              type="password"
            />

            {error && <div className="authError">{error}</div>}

            <button className="authButton" disabled={loading}>
              {loading ? "Loading..." : isRegister ? "Sign up" : "Login"}
            </button>

          </form>

          <p
            className="authSwitch"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister
              ? "Already have account? Login"
              : "Create new account"}
          </p>

        </div>
      </div>
    </div>
  );
}