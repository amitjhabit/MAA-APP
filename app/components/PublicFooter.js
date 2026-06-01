// app/components/PublicFooter.js — Shared footer used by all public pages

export default function PublicFooter() {
  return (
    <footer className="pub-footer">
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '.5rem' }}>मैथिल एसोसिएशन</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.7 }}>Preserving and promoting Maithili language, culture, and heritage across America since 2024.</div>
        </div>
        <div>
          <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.75rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Quick Links</div>
          {[['About Us', '/'], ['Mithila', '/mithila'], ['Events', '/events'], ['News', '/news'], ['Gallery', '/gallery'], ['Donate', '/donate'], ['Join / Renew', '/join'], ['Contact', '/contact']].map(([l, h]) => (
            <div key={l} style={{ marginBottom: '.35rem' }}>
              <a href={h} style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem' }}>{l}</a>
            </div>
          ))}
        </div>
        <div>
          <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.75rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Contact</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.8 }}>info@maithilusa.org</div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.6rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Follow Us</div>
            <a href="https://www.youtube.com/@MAAAdmin-s8y" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', color: 'rgba(255,255,255,.85)', fontSize: '.875rem', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#FF0000'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.85)'}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube Channel
            </a>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem' }}>
        © {new Date().getFullYear()} Maithil Association of America
      </div>
    </footer>
  );
}
