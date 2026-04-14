import { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

export default function Auth({ setCenterName }) { // 👈 Navbar uchun prop qo‘shildi
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(true);
  const [form, setForm] = useState({ centerName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const checkBranchAndRedirect = async (user) => {
    const { data: branches } = await supabase
      .from('branches')
      .select('*')
      .eq('owner_uid', user.id);

    if (!branches || branches.length === 0) {
      navigate('/create-branch');
    } else {
      navigate(`/dashboard/${user.id}`);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        // ✅ Sign Up with centerName metadata
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { centerName: form.centerName } }
        });
        if (signUpError) throw signUpError;

        // ✅ Add to users table
        await supabase.from('users').insert([
          {
            full_name: form.centerName,
            email: form.email,
            owner_uid: signUpData.user.id,
            role: 'admin'
          }
        ]);

        // 👇 Navbar uchun centerName yuboriladi
        if (setCenterName) setCenterName(form.centerName);

        // ✅ Login immediately
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });
        if (loginError) throw loginError;

        await checkBranchAndRedirect(loginData.user);
      } else {
        // Login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });
        if (loginError) throw loginError;

        await checkBranchAndRedirect(loginData.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isRegister ? 'Register' : 'Login'}</h2>
        {isRegister && (
          <input
            name="centerName"
            placeholder="Center Name"
            value={form.centerName}
            onChange={handleChange}
          />
        )}
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />
        {error && <p className="error">{error}</p>}
        <button onClick={handleAuth}>
          {loading ? 'Loading...' : isRegister ? 'Register' : 'Login'}
        </button>
        <p onClick={() => setIsRegister(!isRegister)} className="toggle-auth">
          {isRegister ? 'Login' : 'Register'}
        </p>
      </div>
    </div>
  );
}