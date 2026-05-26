'use client';
// app/admin/page.js — MAA Admin Dashboard with live DB stats
import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/app/admin/layout';

export default function AdminDashboard() {
  const { secret, logout } = useAdminAuth();
  const [stats,   setStats]   = useState({
    members: 0, events: 0, news: 0, donations: 0,
    volunteers: 0, committee: 0, gallery: 0, inquiries: 0,
    total_donations: 0, new_inquiries: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const headers = { 'x-admin-secret': secret };
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
  }, [secret]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const modules = [
    { icon: '👥', title: 'Members',    sub: 'सदस्य',        href: '/admin/members',    stat: stats.members,    statLabel: 'total',     color: 'var(--saffron)' },
    { icon: '📅', title: 'Events',     sub: 'कार्यक्रम',    href: '/admin/events',     stat: stats.events,     statLabel: 'total',     color: '#185FA5' },
    { icon: '💰', title: 'Donations',  sub: 'दान',          href: '/admin/donations',  stat: `$${stats.total_donations.toLocaleString()}`, statLabel: 'received', color: 'var(--saffron)' },
    { icon: '📰', title: 'News',       sub: 'समाचार',       href: '/admin/news',       stat: stats.news,       statLabel: 'posts',     color: 'var(--saffron)' },
    { icon: '🙋', title: 'Volunteers', sub: 'स्वयंसेवक',    href: '/admin/volunteers', stat: stats.volunteers, statLabel: 'total',     color: 'var(--crimson)' },
    { icon: '🏛️', title: 'Committee', sub: 'समिति',        href: '/admin/committee',  stat: stats.committee,  statLabel: 'members',   color: 'var(--navy)' },
    { icon: '🖼️', title: 'Gallery',   sub: 'गैलरी',        href: '/admin/gallery',    stat: stats.gallery,    statLabel: 'photos',    color: '#7B1FA2' },
    { icon: '📝', title: 'About Us',  sub: 'हमारे बारे में', href: '/admin/about',    stat: 'Edit',           statLabel: 'content',   color: 'var(--saffron)' },
    { icon: '✉️', title: 'Inquiries', sub: 'पूछताछ',       href: '/admin/inquiries',  stat: stats.new_inquiries > 0 ? `${stats.new_inquiries} new` : stats.inquiries, statLabel: 'inquiries', color: '#0097A7' },
    { icon: '📊', title: 'Finance',   sub: 'वित्त',         href: '/admin/finance',    stat: 'Manage',         statLabel: 'budget & receipts', color: 'var(--forest)' },
    { icon: '📈', title: 'Analytics', sub: 'विश्लेषण',      href: '/admin/analytics',  stat: 'Reports',        statLabel: 'insights & trends', color: '#7B1FA2' },
    { icon: '🏡', title: 'Mission', sub: 'मुखपृष्ठ',     href: '/admin/homepage',   stat: 'Edit',           statLabel: 'hero & CTAs',       color: 'var(--navy)' },
    { icon: '🗺️', title: 'Mithila',  sub: 'मिथिला',        href: '/admin/mithila',    stat: 'Edit',           statLabel: 'page content',      color: 'var(--saffron)' },
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
          <button className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,.8)', borderColor: 'rgba(255,255,255,.2)' }} onClick={logout}>Sign Out</button>
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
            { label: 'Total Members',  value: stats.members,                               color: 'var(--saffron)',  bg: null },
            { label: 'Active Events',  value: stats.events,                                color: 'var(--gold)',     bg: null },
            { label: 'Donations',      value: `$${stats.total_donations.toLocaleString()}`, color: 'var(--saffron)',  bg: null },
            { label: 'New Inquiries',  value: stats.new_inquiries,                         color: 'var(--saffron)',  bg: null },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: s.bg || 'transparent', borderRadius: 'var(--radius)', padding: s.bg ? '.5rem' : 0 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '.72rem', color: s.bg ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: '.3rem' }}>{s.label}</div>
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
