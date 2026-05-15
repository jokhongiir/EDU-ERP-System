import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import BranchModal from "../BranchModal/BranchModal";
import logo2 from "../../assets/logo2.png";
import "../Auth/Auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    centerName: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [userId, setUserId] = useState(null);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { email, password, centerName } = form;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { centerName },
        },
      });

      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error("Register failed");

      setUserId(user.id);
      setShowBranchModal(true);
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
            <p className="authText">Create account</p>
          </div>
        </div>

        <div className="authRight">
          <h2 className="authTitle">Register</h2>

          <form className="authForm" onSubmit={handleRegister}>
            <input
              name="centerName"
              placeholder="Center Name"
              className="authInput"
              value={form.centerName}
              onChange={handleChange}
            />

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
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <p className="authSwitch">
            Already have account?{" "}
            <Link to="/">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}