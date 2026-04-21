import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Auth({ setCenterName }) {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    centerName: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      const { email, password, centerName } = form;

      if (!email || !password) {
        throw new Error("Please enter both email and password");
      }

      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { centerName } },
        });

        if (error) throw error;

        setCenterName(centerName);
        navigate("/");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        navigate(`/dashboard/${data.user.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">

        {/* LEFT */}
        <div className="auth__left">
          <h1 className="auth__logo">EDU ERP</h1>
          <p className="auth__subtitle">
            Manage your education center with ease
          </p>
        </div>

        {/* RIGHT */}
        <div className="auth__right">

          <h2 className="auth__title">
            {isRegister ? "Create your account" : "Welcome back"}
          </h2>

          <p className="auth__desc">
            Enter your credentials to continue
          </p>

          {isRegister && (
            <input
              className="auth__input"
              name="centerName"
              placeholder="Center Name"
              value={form.centerName}
              onChange={handleChange}
            />
          )}

          <input
            className="auth__input"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
          />

          <input
            className="auth__input"
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />

          {error && <div className="auth__error">{error}</div>}

          <button
            className="auth__button"
            onClick={handleAuth}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : isRegister
              ? "Create Account"
              : "Sign In"}
          </button>

          <p
            className="auth__switch"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister
              ? "Already have an account? Sign in"
              : "Don't have an account? Create one"}
          </p>

        </div>
      </div>
    </div>
  );
}