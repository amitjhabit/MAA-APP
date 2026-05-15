'use client';
// app/admin/page.js — MAA Admin Dashboard with live DB stats
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [secret,  setSecret]  = useState('');
  const [authed,  setAuthed]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [stats,   setStats]   = useState({
    members: 0, events: 0, news: 0, donations: 0,
    volunteers: 0, committee: 0, gallery: 0, inquiries: 0,
    total_donations: 0, new_inquiries: 0,
  });

  const fetchStats = async (s) => {
    try {
      const headers = { 'x-admin-secret': s };
      const [mRes, eRes, nRes, dRes, vRes, cRes, gRes, iRes] = await Promise.all([
        fetch('/api/members?limit=1',   { headers }).then(r => r.json()),
        fetch('/api/events?limit=1',    { headers }).then(r => r.json()),
        fetch('/api/news?limit=1',      { headers }).then(r => r.json()),
        fetch('/api/donations?limit=1', { headers }).then(r => r.json()),
        fetch('/api/volunteers',        { headers }).then(r => r.json()),
        fetch('/api/committee',         { headers }).then(r => r.json()),
        fetch('/api/gallery',           { headers }).then(r => r.json()),
        fetch('/api/inquiries?limit=1', { headers }).then(r => r.json()),
      ]);
      setStats({
        members:         mRes.stats?.total        || 0,
        events:          eRes.stats?.total        || 0,
        news:            nRes.stats?.total        || 0,
        donations:       dRes.stats?.total        || 0,
        volunteers:      vRes.stats?.total        || 0,
        committee:       cRes.stats?.total        || 0,
        gallery:         gRes.stats?.total        || 0,
        inquiries:       iRes.stats?.total        || 0,
        total_donations: dRes.stats?.total_amount || 0,
        new_inquiries:   iRes.stats?.new          || 0,
      });
    } catch {}
  };

  const handleLogin = async e => {
    e.preventDefault();
    if (!secret.trim()) return;
    setLoading(true); setAuthErr('');
    try {
      const res = await fetch('/api/members?limit=1', { headers: { 'x-admin-secret': secret } });
      if (res.ok) { setAuthed(true); await fetchStats(secret); }
      else setAuthErr('Invalid password. Check ADMIN_SECRET in .env.local');
    } catch { setAuthErr('Network error'); }
    setLoading(false);
  };

  if (!authed) return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', margin: '0 auto .75rem', border: '3px solid var(--gold)', display: 'block' }} />
        </div>
        <h2>MAA Admin</h2>
        <p>Maithil Association of America — CRM Dashboard</p>
        {authErr && <div style={{ background: 'var(--crimson-light)', borderRadius: 'var(--radius)', padding: '.7rem', marginBottom: '1rem', color: 'var(--crimson)', fontSize: '.82rem' }}>{authErr}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Admin Password</label>
            <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="ADMIN_SECRET" autoFocus />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <><span className="spinner" />Verifying…</> : 'Enter Admin Dashboard →'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a href="/" style={{ color: 'var(--saffron)', fontSize: '.85rem' }}>← Public Website</a>
        </div>
      </div>
    </div>
  );

  const modules = [
    { icon: '👥', title: 'Members',    sub: 'सदस्य',        href: '/admin/members',    stat: stats.members,    statLabel: 'total',     color: 'var(--saffron)' },
    { icon: '📅', title: 'Events',     sub: 'कार्यक्रम',    href: '/admin/events',     stat: stats.events,     statLabel: 'total',     color: '#185FA5' },
    { icon: '💰', title: 'Donations',  sub: 'दान',          href: '/admin/donations',  stat: `$${stats.total_donations.toLocaleString()}`, statLabel: 'received', color: 'var(--forest)' },
    { icon: '📰', title: 'News',       sub: 'समाचार',       href: '/admin/news',       stat: stats.news,       statLabel: 'posts',     color: 'var(--gold)' },
    { icon: '🙋', title: 'Volunteers', sub: 'स्वयंसेवक',    href: '/admin/volunteers', stat: stats.volunteers, statLabel: 'total',     color: 'var(--crimson)' },
    { icon: '🏛️', title: 'Committee', sub: 'समिति',        href: '/admin/committee',  stat: stats.committee,  statLabel: 'members',   color: 'var(--navy)' },
    { icon: '🖼️', title: 'Gallery',   sub: 'गैलरी',        href: '/admin/gallery',    stat: stats.gallery,    statLabel: 'photos',    color: '#7B1FA2' },
    { icon: '📝', title: 'About Us',  sub: 'हमारे बारे में', href: '/admin/about',    stat: 'Edit',           statLabel: 'content',   color: 'var(--saffron)' },
    { icon: '✉️', title: 'Inquiries', sub: 'पूछताछ',       href: '/admin/inquiries',  stat: stats.new_inquiries > 0 ? `${stats.new_inquiries} new` : stats.inquiries, statLabel: 'inquiries', color: '#0097A7' },
    { icon: '📊', title: 'Finance',   sub: 'वित्त',         href: '/admin/finance',    stat: 'Manage',         statLabel: 'budget & receipts', color: 'var(--forest)' },
    { icon: '📈', title: 'Analytics', sub: 'विश्लेषण',      href: '/admin/analytics',  stat: 'Reports',        statLabel: 'insights & trends', color: '#7B1FA2' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--navy)', borderBottom: '3px solid var(--saffron)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
          <img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)', flexShrink: 0 }} />
          <div>
            <div style={{ color: '#fff', fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700 }}>MAA Admin Dashboard</div>
            <div style={{ color: 'var(--gold)', fontSize: '.75rem' }}>मैथिल एसोसिएशन ऑफ अमेरिका</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <a href="/" className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,.8)', borderColor: 'rgba(255,255,255,.2)' }}>🌐 Public Site</a>
          <a href="/api/health" target="_blank" className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,.8)', borderColor: 'rgba(255,255,255,.2)' }}>⚡ Health</a>
          <button className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,.8)', borderColor: 'rgba(255,255,255,.2)' }} onClick={() => { setAuthed(false); setSecret(''); }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', color: 'var(--navy)', marginBottom: '.25rem' }}>Welcome to MAA Admin</h1>
          <p style={{ color: 'var(--ink-dim)', fontSize: '.9rem' }}>All data is live from your Neon PostgreSQL database.</p>
        </div>

        {/* Quick stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem', background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--border)' }}>
          {[
            { label: 'Total Members',  value: stats.members,                          color: 'var(--saffron)' },
            { label: 'Active Events',  value: stats.events,                           color: 'var(--gold)' },
            { label: 'Donations',      value: `$${stats.total_donations.toLocaleString()}`, color: 'var(--forest)' },
            { label: 'New Inquiries',  value: stats.new_inquiries,                    color: stats.new_inquiries > 0 ? 'var(--crimson)' : 'rgba(255,255,255,.4)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: '.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Module cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem' }}>
          {modules.map(m => (
            <a href={m.href} key={m.title} className="card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '.5rem', borderTop: `3px solid ${m.color}`, transition: 'var(--trans)' }}>
              <div style={{ fontSize: '2rem' }}>{m.icon}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--navy)' }}>{m.title}</div>
              <div style={{ fontSize: '.82rem', color: 'var(--gold)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{m.sub}</div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: '.4rem' }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 700, color: m.color }}>{m.stat}</span>
                <span style={{ fontSize: '.72rem', color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{m.statLabel}</span>
              </div>
            </a>
          ))}
        </div>

        {/* New inquiries alert */}
        {stats.new_inquiries > 0 && (
          <div style={{ marginTop: '2rem', background: 'var(--crimson-light)', border: '1px solid rgba(155,29,32,.25)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔔</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--crimson)' }}>You have {stats.new_inquiries} new {stats.new_inquiries === 1 ? 'inquiry' : 'inquiries'}!</div>
                <div style={{ fontSize: '.83rem', color: 'var(--ink-soft)' }}>New messages from the public contact form.</div>
              </div>
            </div>
            <a href="/admin/inquiries" className="btn btn-primary btn-sm">View Inquiries →</a>
          </div>
        )}
      </div>
    </div>
  );
}
