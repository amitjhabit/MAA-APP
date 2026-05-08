'use client';
// app/about/page.js
import { useState, useEffect } from 'react';

function Nav() {
  return (
    <nav className="pub-nav">
      <div className="pub-nav-inner">
        <a href="/" className="pub-nav-brand">
          <div className="emblem">MAA</div>
          <div className="org-name">Maithil Association of America<span>मैथिल एसोसिएशन ऑफ अमेरिका</span></div>
        </a>
        <div className="pub-nav-links">
          {[['/', 'Home'], ['/events', 'Events'], ['/news', 'News'], ['/gallery', 'Gallery'], ['/about', 'About'], ['/contact', 'Contact']].map(([h, l]) => (
            <a key={h} href={h} className={`pub-nav-link${h === '/about' ? ' active' : ''}`}>{l}</a>
          ))}
          <a href="/join" className="pub-nav-cta" style={{ marginLeft: '.5rem' }}>Join / Renew</a>
        </div>
      </div>
    </nav>
  );
}

export default function AboutPage() {
  const [committee, setCommittee] = useState([]);

  useEffect(() => {
    fetch('/api/public/committee')
      .then(r => r.json())
      .then(d => { if (d.success) setCommittee(d.data); });
  }, []);

  return (
    <>
      <Nav />
      <section className="hero" style={{ padding: '3.5rem 2rem 3rem' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">हमारे बारे में</span>
          <h1>About <em>MAA</em></h1>
          <p className="hero-sub">Maithil Association of America — preserving culture, language, and heritage since 2000.</p>
        </div>
      </section>

      <div className="shell">
        {/* Mission */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
          <div className="card card-saffron">
            <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🎯</div>
            <h3 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '.75rem' }}>Our Mission</h3>
            <p className="text-sm" style={{ lineHeight: 1.8, color: 'var(--ink-soft)' }}>
              To preserve and promote Maithili language, culture, and heritage among the Maithili-speaking diaspora in America, while fostering a strong sense of community and cultural identity.
            </p>
          </div>
          <div className="card card-gold">
            <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>👁️</div>
            <h3 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '.75rem' }}>Our Vision</h3>
            <p className="text-sm" style={{ lineHeight: 1.8, color: 'var(--ink-soft)' }}>
              A thriving Maithili community in America that proudly maintains its cultural roots while contributing positively to the broader American society. A world where Maithili language and traditions flourish for generations to come.
            </p>
          </div>
        </div>

        {/* What we do */}
        <div className="section-header">
          <div><div className="section-eyebrow">हमारा काम</div><h2 className="section-title">What We <span>Do</span></h2></div>
        </div>
        <div className="grid-3" style={{ marginBottom: '3rem' }}>
          {[
            { icon: '🎭', title: 'Cultural Events',    desc: 'Organizing festivals, Chhath Puja, Maithili New Year, and cultural programs throughout the year.' },
            { icon: '📚', title: 'Language Promotion', desc: 'Workshops and classes to teach Maithili language and script to children and adults.' },
            { icon: '🤝', title: 'Community Support',  desc: 'Helping newly arrived Maithili families settle in America with guidance and community connections.' },
            { icon: '🎵', title: 'Arts & Music',       desc: 'Promoting Maithili music, dance, and performing arts through workshops and performances.' },
            { icon: '📰', title: 'Publications',       desc: 'Publishing newsletters, cultural articles, and resources about Maithili heritage.' },
            { icon: '🌐', title: 'Networking',         desc: 'Connecting Maithili professionals, students, and families across all 50 US states.' },
          ].map(item => (
            <div key={item.title} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '.75rem' }}>{item.icon}</div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)', marginBottom: '.5rem' }}>{item.title}</div>
              <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Executive Committee */}
        {committee.length > 0 && (
          <>
            <div className="section-header">
              <div><div className="section-eyebrow">नेतृत्व</div><h2 className="section-title">Executive <span>Committee</span></h2></div>
            </div>
            <div className="grid-2" style={{ marginBottom: '3rem' }}>
              {committee.map(m => (
                <div key={m.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--saffron-light)', border: '2px solid var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--saffron)', flexShrink: 0 }}>
                    {m.photo_url ? <img src={m.photo_url} alt={m.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : m.name[0]}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)' }}>{m.name}</div>
                    <div style={{ color: 'var(--saffron)', fontSize: '.85rem', fontWeight: 600 }}>{m.role}</div>
                    {m.email && <div className="text-xs text-muted">{m.email}</div>}
                    {m.term_start && <div className="text-xs text-muted">Term: {new Date(m.term_start).getFullYear()} – {m.term_end ? new Date(m.term_end).getFullYear() : 'Present'}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Membership tiers */}
        <div className="section-header">
          <div><div className="section-eyebrow">सदस्यता</div><h2 className="section-title">Membership <span>Tiers</span></h2></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {[
            { type: 'Student',           annual: '$25',  lifetime: '$200', color: 'var(--forest)',  desc: 'Full-time students' },
            { type: 'Individual',        annual: '$50',  lifetime: '$500', color: 'var(--saffron)', desc: 'Individual adults' },
            { type: 'Honorary',          annual: 'Free', lifetime: 'Free', color: 'var(--gold)',    desc: 'By invitation only' },
            { type: 'Corporate/Sponsor', annual: '$500+',lifetime: 'N/A', color: '#0D47A1',         desc: 'Business sponsors' },
          ].map(t => (
            <div key={t.type} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${t.color}` }}>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--navy)', marginBottom: '.35rem' }}>{t.type}</div>
              <div className="text-sm text-muted" style={{ marginBottom: '.75rem' }}>{t.desc}</div>
              <div style={{ color: t.color, fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700 }}>{t.annual}</div>
              <div className="text-xs text-muted">Annual</div>
              <div style={{ color: t.color, fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 600, marginTop: '.35rem' }}>{t.lifetime}</div>
              <div className="text-xs text-muted">Lifetime</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <a href="/join" className="btn btn-primary btn-lg">Join MAA Today</a>
        </div>
      </div>

      <footer className="pub-footer">
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem' }}>
          © {new Date().getFullYear()} Maithil Association of America · <a href="/admin" style={{ color: 'var(--gold)' }}>Admin</a>
        </div>
      </footer>
    </>
  );
}
