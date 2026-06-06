import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Enter email and password.'); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const code = err.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <div style={styles.logo}>
          <div style={styles.logoInner}>
            <span style={styles.dot}></span>
            <h1 style={styles.h1}>Fernando</h1>
          </div>
          <div style={styles.sub}>Auto Dealers · Admin</div>
        </div>
        {error && <div style={styles.err}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Work Sans', sans-serif", background: '#0a0a0a', color: '#f0f0f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  box: { width: '100%', maxWidth: 360, margin: 16, padding: '44px 38px', background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, boxShadow: '0 20px 60px rgba(0,0,0,.6)' },
  logo: { textAlign: 'center', marginBottom: 30 },
  logoInner: { display: 'inline-flex', alignItems: 'center', gap: 8 },
  dot: { display: 'inline-block', width: 9, height: 9, background: '#e53935', borderRadius: '50%', boxShadow: '0 0 10px #e53935' },
  h1: { fontFamily: "'Josefin Sans', sans-serif", fontSize: '1.2rem', letterSpacing: 3, textTransform: 'uppercase', color: '#fff' },
  sub: { fontSize: '.68rem', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 5 },
  err: { background: 'rgba(229,57,53,.12)', border: '1px solid rgba(229,57,53,.3)', borderRadius: 8, padding: '10px 14px', fontSize: '.82rem', color: '#ff6b6b', marginBottom: 16, textAlign: 'center' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: '.67rem', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 },
  input: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, color: '#f0f0f0', fontSize: '.9rem', outline: 'none', fontFamily: "'Work Sans', sans-serif", boxSizing: 'border-box' },
  btn: { width: '100%', padding: 13, background: 'linear-gradient(135deg,#e53935,#b71c1c)', border: 'none', borderRadius: 9, color: '#fff', fontSize: '.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", letterSpacing: 2 }
};
