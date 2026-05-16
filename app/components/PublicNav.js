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
            <a href="/join" className="pub-nav-cta" style={{ marginLeft: '.25rem' }}>Join / Renew</a>
          </div>

          {/* Mobile right side: Join button + hamburger */}
          <div className="pub-nav-mobile-right">
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
            <a href="/join" className="btn btn-primary" style={{ margin: '.75rem 1.25rem', display: 'block', textAlign: 'center' }}>Join / Renew</a>
          </div>
        </div>
      )}
    </>
  );
}
