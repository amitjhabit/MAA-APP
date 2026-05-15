'use client';
// app/admin/layout.js — single auth gate for all admin pages
import { useState, useEffect, createContext, useContext } from 'react';

const STORAGE_KEY = 'maa_admin_secret';

const AdminAuthContext = createContext({ secret: '', logout: () => {} });
export const useAdminAuth = () => useContext(AdminAuthContext);

function LoginForm({ onLogin, err, busy }) {
  const [input, setInput] = useState('');
  const submit = async e => {
    e.preventDefault();
    if (input.trim()) await onLogin(input.trim());
  };
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', margin: '0 auto .75rem', border: '3px solid var(--gold)', display: 'block' }} />
          <h2 style={{ fontSize: '1.3rem', color: 'var(--navy)', marginBottom: '.25rem' }}>MAA Admin</h2>
          <p style={{ color: 'var(--ink-dim)', fontSize: '.875rem' }}>Maithil Association of America</p>
        </div>
        {err && <div style={{ background: 'var(--crimson-light)', borderRadius: 'var(--radius)', padding: '.7rem', marginBottom: '1rem', color: 'var(--crimson)', fontSize: '.82rem' }}>{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Admin Password</label>
            <input type="password" value={input} onChange={e => setInput(e.target.value)} placeholder="Enter password" autoFocus />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={busy || !input.trim()}>
            {busy ? <><span className="spinner" />Verifying…</> : 'Enter Admin →'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.8rem' }}>
          <a href="/" style={{ color: 'var(--saffron)' }}>← Back to Public Site</a>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      fetch('/api/members?limit=1', { headers: { 'x-admin-secret': saved } })
        .then(r => {
          if (r.ok) { setSecret(saved); setAuthed(true); }
          else sessionStorage.removeItem(STORAGE_KEY);
        })
        .catch(() => {})
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleLogin = async inputSecret => {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/members?limit=1', { headers: { 'x-admin-secret': inputSecret } });
      if (r.ok) {
        sessionStorage.setItem(STORAGE_KEY, inputSecret);
        setSecret(inputSecret);
        setAuthed(true);
      } else {
        setErr('Invalid password. Check ADMIN_SECRET in your environment.');
      }
    } catch { setErr('Network error. Please try again.'); }
    setBusy(false);
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSecret('');
    setAuthed(false);
  };

  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="loading-state"><span className="spinner" />Checking session…</div>
    </div>
  );

  if (!authed) return <LoginForm onLogin={handleLogin} err={err} busy={busy} />;

  return (
    <AdminAuthContext.Provider value={{ secret, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
