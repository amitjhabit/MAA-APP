'use client';
// app/components/PublicNav.js — Responsive nav used by all public pages
import { useState, useEffect } from 'react';

const LINKS = [
  ['/', 'Home'],
  ['/events', 'Events'],
  ['/news', 'News'],
  ['/gallery', 'Gallery'],
  ['/about', 'About Us'],
  ['/contact', 'Contact'],
];

export default function PublicNav({ active, onInquiry }) {
  const [open, setOpen] = useState(false);

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
          <a href="/" className="pub-nav-brand">
            <img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(201,150,12,.5)', boxShadow: '0 2px 8px rgba(0,0,0,.3)' }} />
            <div className="org-name">
              Maithil Association of America
            </div>
          </a>

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
          </div>

          {/* Mobile right side: Join button + hamburger */}
          <div className="pub-nav-mobile-right">
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

      {/* Social bar — below nav, after the orange line */}
      <div style={{ background: 'rgba(6,10,24,.92)', borderBottom: '1px solid rgba(255,255,255,.08)', padding: '.3rem 1.25rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <a
          href="https://www.facebook.com/profile.php?id=61559439638204&mibextid=wwXIfr"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="MAA on Facebook"
          style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: '#1877F2', textDecoration: 'none', fontSize: '.78rem', fontWeight: 600 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
          </svg>
          Facebook
        </a>
        <span style={{ color: 'var(--border)', fontSize: '1rem' }}>|</span>
        <a
          href="https://www.instagram.com/mithila_maa?igsh=NTc4MTIwNjQ2YQ%3D%3D&utm_source=qr"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="MAA on Instagram"
          style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: '#E1306C', textDecoration: 'none', fontSize: '.78rem', fontWeight: 600 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="url(#ig-grad)">
            <defs>
              <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f09433"/>
                <stop offset="25%" stopColor="#e6683c"/>
                <stop offset="50%" stopColor="#dc2743"/>
                <stop offset="75%" stopColor="#cc2366"/>
                <stop offset="100%" stopColor="#bc1888"/>
              </linearGradient>
            </defs>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          Instagram
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
