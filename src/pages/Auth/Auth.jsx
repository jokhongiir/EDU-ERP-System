import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Auth({ setCenterName }) {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    centerName: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const checkBranchAndRedirect = async (userId) => {
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .eq("owner_uid", userId);

    if (error) throw error;

    if (!data || data.length === 0) {
      navigate("/create-branch");
    } else {
      navigate(`/dashboard/${userId}`);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      // 🔐 BASIC VALIDATION
      if (!form.email || !form.password) {
        throw new Error("Email va password kiritilishi shart");
      }

      if (isRegister && !form.centerName) {
        throw new Error("Center name kiritilishi shart");
      }

      if (isRegister) {
        // ========================
        // REGISTER
        // ========================
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
              data: {
                centerName: form.centerName,
              },
            },
          });

        if (signUpError) throw signUpError;

        const user = signUpData?.user;

        if (!user) {
          throw new Error("User yaratilmadi");
        }

        // Save in users table
        const { error: insertError } = await supabase.from("users").insert([
          {
            full_name: form.centerName,
            email: form.email,
            owner_uid: user.id,
            role: "admin",
          },
        ]);

        if (insertError) throw insertError;

        // Navbar uchun
        if (setCenterName) setCenterName(form.centerName);

        // AUTO LOGIN (NO CONFIRM FLOW)
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          });

        if (loginError) throw loginError;

        await checkBranchAndRedirect(loginData.user.id);
      } else {
        // ========================
        // LOGIN
        // ========================
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          });

        if (loginError) throw loginError;

        await checkBranchAndRedirect(loginData.user.id);
      }
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <h2>{isRegister ? "Register" : "Login"}</h2>

        {isRegister && (
          <input
            name="centerName"
            placeholder="Center Name"
            value={form.centerName}
            onChange={handleChange}
          />
        )}

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        {error && <p className="error">{error}</p>}

        <button onClick={handleAuth} disabled={loading}>
          {loading ? "Loading..." : isRegister ? "Register" : "Login"}
        </button>

        <p
          onClick={() => setIsRegister(!isRegister)}
          className="toggle-auth"
        >
          {isRegister ? "Loginga o'tish" : "Registerga o'tish"}
        </p>
      </div>
    </div>
  );
}