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
            <img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            <div className="org-name">
              Maithil Association of America
              <span>मैथिल एसोसिएशन ऑफ अमेरिका</span>
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
            <a href="/join" className="pub-nav-cta" style={{ marginLeft: '.25rem' }}>Join / Renew</a>
          </div>

          {/* Mobile right side: Join button + hamburger */}
          <div className="pub-nav-mobile-right">
            <a href="/donate" className="pub-nav-cta" style={{ fontSize: '.75rem', padding: '.35rem .75rem', marginRight: '.25rem' }}>Donate</a>
            <a href="/join" className="pub-nav-cta" style={{ fontSize: '.75rem', padding: '.35rem .75rem' }}>Join / Renew</a>
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
      <div style={{ background: '#f8f4ef', borderBottom: '1px solid var(--border)', padding: '.3rem 1.25rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
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
          Follow us on Facebook
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
            <a href="/donate" className="btn btn-gold" style={{ margin: '.75rem 1.25rem 0', display: 'block', textAlign: 'center' }}>Donate</a>
            <a href="/join" className="btn btn-primary" style={{ margin: '.5rem 1.25rem .75rem', display: 'block', textAlign: 'center' }}>Join / Renew</a>
          </div>
        </div>
      )}
    </>
  );
}
