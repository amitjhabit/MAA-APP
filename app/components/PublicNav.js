'use client';
// app/components/PublicNav.js — Responsive nav used by all public pages
import { useState, useEffect } from 'react';

const LINKS = [
  ['/', 'About Us'],
  ['/mithila', 'Mithila'],
  ['/events', 'Events'],
  ['/news', 'News'],
  ['/gallery', 'Gallery'],
  ['/contact', 'Contact'],
];

export default function PublicNav({ active, onInquiry }) {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState({ members: null, upcoming_events: null });

  useEffect(() => {
    fetch('/api/public/stats').then(r => r.json()).then(d => {
      if (d?.data) setStats({ members: d.data.members, upcoming_events: d.data.upcoming_events });
    }).catch(() => {});
  }, []);

  // Apply dark theme to body for all public pages
  useEffect(() => {
    document.body.setAttribute('data-theme', 'dark');
    return () => document.body.removeAttribute('data-theme');
  }, []);

  // Close menu on route change / resize
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  return (
    <>
      <nav className="pub-nav">
        <div className="pub-nav-inner">
          {/* Brand */}
          <div className="pub-nav-brand">
            <a href="/" className="pub-nav-brand-link">
              <img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" className="pub-nav-logo" />
              <div className="org-name">Maithil Association of America</div>
            </a>
            <div className="pub-nav-brand-social">
              <a href="https://www.facebook.com/profile.php?id=61559439638204&mibextid=wwXIfr" target="_blank" rel="noreferrer noopener" aria-label="Facebook" style={{ display:'flex', alignItems:'center', padding:'.25rem', borderRadius:6, opacity:.85 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/mithila_maa?igsh=NTc4MTIwNjQ2YQ%3D%3D&utm_source=qr" target="_blank" rel="noreferrer noopener" aria-label="Instagram" style={{ display:'flex', alignItems:'center', padding:'.25rem', borderRadius:6, opacity:.85 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><defs><linearGradient id="ig-brand" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path fill="url(#ig-brand)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>

          {/* Nav stats — desktop only */}
          <div className="pub-nav-stats">
            <div className="pub-nav-stat-chip">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              <span className="pub-nav-stat-chip-num">{stats.members ?? '—'}</span>
              <span className="pub-nav-stat-chip-label">Active Members</span>
            </div>
            <a href="/events?status=upcoming" className="pub-nav-stat-chip" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span className="pub-nav-stat-chip-num">{stats.upcoming_events ?? '—'}</span>
              <span className="pub-nav-stat-chip-label">Upcoming Events</span>
            </a>
          </div>

          {/* Desktop links */}
          <div className="pub-nav-links pub-nav-desktop">
            {LINKS.map(([h, l]) => (
              <a key={h} href={h} className={`pub-nav-link${active === h ? ' active' : ''}`}>{l}</a>
            ))}
            {onInquiry && (
              <button onClick={onInquiry} className="pub-nav-link" style={{ background: 'rgba(255,255,255,.12)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.9)' }}>
                Inquire
              </button>
            )}
            <a href="/donate" className={`pub-nav-link${active === '/donate' ? ' active' : ''}`}>Donate</a>
            <a href="/join" className={`pub-nav-link${active === '/join' ? ' active' : ''}`}>Join / Renew</a>
            {/* Social icons inline */}
            <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,.2)', margin: '0 .25rem', flexShrink: 0 }} />
            <a href="https://www.facebook.com/profile.php?id=61559439638204&mibextid=wwXIfr" target="_blank" rel="noreferrer noopener" aria-label="Facebook" style={{ display:'flex', alignItems:'center', padding:'.3rem', borderRadius:6, opacity:.8 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
            </a>
            <a href="https://www.instagram.com/mithila_maa?igsh=NTc4MTIwNjQ2YQ%3D%3D&utm_source=qr" target="_blank" rel="noreferrer noopener" aria-label="Instagram" style={{ display:'flex', alignItems:'center', padding:'.3rem', borderRadius:6, opacity:.8 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><defs><linearGradient id="ig2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path fill="url(#ig2)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
          </div>

          {/* Mobile right side: quick icons + hamburger */}
          <div className="pub-nav-mobile-right">
            <a href="/" aria-label="Home" className={`pub-nav-quick-icon${active === '/' ? ' active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </a>
            <a href="/mithila" aria-label="Mithila" className={`pub-nav-quick-icon${active === '/mithila' ? ' active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/></svg>
            </a>
            <a href="/donate" aria-label="Donate" className={`pub-nav-quick-icon${active === '/donate' ? ' active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            </a>
            <a href="/join" aria-label="Join / Renew" className={`pub-nav-quick-icon${active === '/join' ? ' active' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            </a>
            <button
              className="pub-nav-hamburger"
              onClick={() => setOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <span className={`ham-bar${open ? ' open' : ''}`} />
              <span className={`ham-bar${open ? ' open' : ''}`} />
              <span className={`ham-bar${open ? ' open' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile stats bar — sticky strip just below nav */}
      <div className="pub-nav-statsbar">
        <div className="pub-nav-stat-chip">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          <span className="pub-nav-stat-chip-num">{stats.members ?? '—'}</span>
          <span className="pub-nav-stat-chip-label">Active Members</span>
        </div>
        <a href="/events?status=upcoming" className="pub-nav-stat-chip" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="pub-nav-stat-chip-num">{stats.upcoming_events ?? '—'}</span>
          <span className="pub-nav-stat-chip-label">Upcoming Events</span>
        </a>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="pub-nav-drawer" onClick={() => setOpen(false)}>
          <div className="pub-nav-drawer-inner" onClick={e => e.stopPropagation()}>
            {LINKS.map(([h, l]) => (
              <a key={h} href={h} className={`pub-nav-drawer-link${active === h ? ' active' : ''}`}>{l}</a>
            ))}
            {onInquiry && (
              <button onClick={() => { onInquiry(); setOpen(false); }} className="pub-nav-drawer-link" style={{ border: 'none', cursor: 'pointer', textAlign: 'left', background: 'none' }}>
                Inquire
              </button>
            )}
            <a href="/donate" className={`pub-nav-drawer-link${active === '/donate' ? ' active' : ''}`}>Donate</a>
            <a href="/join" className={`pub-nav-drawer-link${active === '/join' ? ' active' : ''}`}>Join / Renew</a>
          </div>
        </div>
      )}
    </>
  );
}
