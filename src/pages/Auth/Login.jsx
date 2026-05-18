import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import BranchModal from "../BranchModal/BranchModal";
import logo2 from "../../assets/logo2.png";
import "../Auth/Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [userId, setUserId] = useState(null);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { email, password } = form;

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
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
        navigate(`/dashboard/${branches[0].id}`);
      }
    } catch (err) {
      setError(err.message);
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
            <img src={logo2} className="authImage" />
            <h1 className="authLogo">Education ERP</h1>
            <p className="authText">Welcome back</p>
          </div>
        </div>

        <div className="authRight">
          <h2 className="authTitle">Login</h2>

          <form className="authForm" onSubmit={handleLogin}>
            <input
              name="email"
              placeholder="Email"
              className="authInput"
              value={form.email}
              onChange={handleChange}
              type="email"
            />

            <input
              name="password"
              placeholder="Password"
              className="authInput"
              value={form.password}
              onChange={handleChange}
              type="password"
            />

            {error && <div className="authError">{error}</div>}

            <button className="authButton" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* <p className="authSwitch">
            Don’t have account?{" "}
            <Link to="/register">Sign up</Link>
          </p> */}
        </div>
      </div>
    </div>
  );
}