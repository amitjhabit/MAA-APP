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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
              <a href="https://www.facebook.com/profile.php?id=61559439638204&mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', color: 'rgba(255,255,255,.85)', fontSize: '.875rem', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#1877F2'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.85)'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                Facebook
              </a>
              <a href="https://www.instagram.com/mithila_maa?igsh=NTc4MTIwNjQ2YQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', color: 'rgba(255,255,255,.85)', fontSize: '.875rem', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#dc2743'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.85)'}>
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="ig-footer" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path fill="url(#ig-footer)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                Instagram
              </a>
              <a href="https://www.youtube.com/@MAAAdmin-s8y" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', color: 'rgba(255,255,255,.85)', fontSize: '.875rem', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#FF0000'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.85)'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                YouTube
              </a>
            </div>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem' }}>
        © {new Date().getFullYear()} Maithil Association of America
      </div>
    </footer>
  );
}
