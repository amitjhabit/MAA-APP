'use client';
// app/about/page.js â€” About Us
import { useState, useEffect } from 'react';

function Nav() {
  return (
    <nav className="pub-nav">
      <div className="pub-nav-inner">
        <a href="/" className="pub-nav-brand">
          <div className="emblem">MAA</div>
          <div className="org-name">Maithil Association of America<span>à¤®à¥ˆà¤¥à¤¿à¤² à¤à¤¸à¥‹à¤¸à¤¿à¤à¤¶à¤¨ à¤‘à¤« à¤…à¤®à¥‡à¤°à¤¿à¤•à¤¾</span></div>
        </a>
        <div className="pub-nav-links">
          {[['/', 'Home'], ['/events', 'Events'], ['/news', 'News'], ['/gallery', 'Gallery'], ['/about', 'About Us'], ['/contact', 'Contact']].map(([h, l]) => (
            <a key={h} href={h} className={`pub-nav-link${h === '/about' ? ' active' : ''}`}>{l}</a>
          ))}
          <a href="/join" className="pub-nav-cta" style={{ marginLeft: '.5rem' }}>Join / Renew</a>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="pub-footer">
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '.5rem' }}>à¤®à¥ˆà¤¥à¤¿à¤² à¤à¤¸à¥‹à¤¸à¤¿à¤à¤¶à¤¨</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.7 }}>Preserving and promoting Maithili language, culture, and heritage across America since 2000.</div>
        </div>
        <div>
          <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.75rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Quick Links</div>
          {[['Events', '/events'], ['News', '/news'], ['Gallery', '/gallery'], ['Donate', '/donate'], ['Contact', '/contact']].map(([l, h]) => (
            <div key={l} style={{ marginBottom: '.35rem' }}><a href={h} style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem' }}>{l}</a></div>
          ))}
        </div>
        <div>
          <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.75rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Contact</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.8 }}>info@maa-america.org<br />Edison, NJ (Headquarters)</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem' }}>
        Â© {new Date().getFullYear()} Maithil Association of America Â· <a href="/admin" style={{ color: 'var(--gold)' }}>Admin</a>
      </div>
    </footer>
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

      {/* â”€â”€ Hero â”€â”€ */}
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">à¤¹à¤®à¤¾à¤°à¥‡ à¤¬à¤¾à¤°à¥‡ à¤®à¥‡à¤‚</span>
          <h1>About <em>Us</em></h1>
          
        </div>
      </section>

      <div className="shell">

        {/* â”€â”€ About Text â”€â”€ */}
        <div style={{ maxWidth: 840, margin: '0 auto 3.5rem' }}>



          {/* Main about card */}
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderTop: '4px solid var(--saffron)', padding: '2.5rem 2.75rem', boxShadow: 'var(--shadow-lg)' }}>
            <p style={{ fontSize: '1.05rem', lineHeight: 2, color: 'var(--ink)', marginBottom: '1.5rem' }}>
              MAA is a non-profit organization passionately dedicated to representing Maithil and Mithila culture on a global platform. In addition to our cultural initiatives, we are committed to enhancing the cultural, educational and fitness aspects within our community.
            </p>

            <p style={{ fontSize: '1.05rem', lineHeight: 2, color: 'var(--ink)', marginBottom: '1.5rem' }}>
              Through our educational programs{' '}
              <span style={{ fontWeight: 700, color: 'var(--saffron)', fontFamily: 'var(--serif)' }}>"Gurukul"</span>,
              {' '}we aim to empower Maithil youth with access to quality education and skill development opportunities, nurturing the leaders of tomorrow for our community.
            </p>

            <p style={{ fontSize: '1.05rem', lineHeight: 2, color: 'var(--ink)', marginBottom: '1.5rem' }}>
              At MAA, we uphold the principles of selfless service and transparency, ensuring that every initiative is driven by the collective spirit of our members. The motive of the organization is to unite the Maithil diaspora to keep our heritage alive.
            </p>

            {/* Highlighted closing quote */}
            <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius)', padding: '1.5rem 2rem', marginTop: '1.5rem', borderLeft: '4px solid var(--saffron)' }}>
              <div style={{ color: 'var(--gold)', fontSize: '1.5rem', marginBottom: '.5rem', lineHeight: 1 }}>"</div>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(255,255,255,.92)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
                We invite you to join us in preserving and celebrating our vibrant Maithil identity. Together, let's stand tall as proud Maithils and make a meaningful difference in promoting our heritage for generations to come.
              </p>
              <div style={{ color: 'var(--gold)', fontSize: '1.5rem', textAlign: 'right', lineHeight: 1, marginTop: '.5rem' }}>"</div>
            </div>
          </div>
        </div>

        {/* â”€â”€ Core Values â”€â”€ */}
        <div className="section-header">
          <div>
            <div className="section-eyebrow">à¤¹à¤®à¤¾à¤°à¥‡ à¤®à¥‚à¤²à¥à¤¯</div>
            <h2 className="section-title">Our Core <span>Values</span></h2>
          </div>
        </div>
        <div className="grid-3" style={{ marginBottom: '3.5rem' }}>
          {[
            { icon: 'ðŸŒ', title: 'Cultural Representation', desc: 'Representing Maithil and Mithila culture passionately on a global platform.' },
            { icon: 'ðŸŽ“', title: 'Gurukul Education',       desc: 'Empowering Maithil youth through quality education and skill development programs.' },
            { icon: 'ðŸ¤', title: 'Selfless Service',        desc: 'Every initiative driven by the collective spirit and selfless dedication of our members.' },
            { icon: 'ðŸ”', title: 'Transparency',            desc: 'Upholding transparency in all our activities, finances, and community initiatives.' },
            { icon: 'ðŸ’ª', title: 'Health & Fitness',        desc: 'Committed to enhancing cultural, educational, and fitness aspects within our community.' },
            { icon: 'ðŸŒ', title: 'Unity of Diaspora',       desc: 'Uniting the Maithil diaspora across America to keep our heritage alive and thriving.' },
          ].map(item => (
            <div key={item.title} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '.75rem' }}>{item.icon}</div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)', marginBottom: '.5rem', fontSize: '1rem' }}>{item.title}</div>
              <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* â”€â”€ What We Do â”€â”€ */}
        <div className="section-header">
          <div>
            <div className="section-eyebrow">à¤¹à¤®à¤¾à¤°à¤¾ à¤•à¤¾à¤®</div>
            <h2 className="section-title">What We <span>Do</span></h2>
          </div>
        </div>
        <div className="grid-3" style={{ marginBottom: '3.5rem' }}>
          {[
            { icon: 'ðŸŽ­', title: 'Cultural Events',     desc: 'Organizing festivals, Chhath Puja, Maithili New Year, and cultural programs throughout the year.' },
            { icon: 'ðŸ“š', title: 'Gurukul Programs',    desc: 'Educational programs for Maithil youth covering language, arts, academics, and leadership skills.' },
            { icon: 'ðŸ¤', title: 'Community Support',   desc: 'Helping newly arrived Maithili families settle in America with guidance and community connections.' },
            { icon: 'ðŸŽµ', title: 'Arts & Music',        desc: 'Promoting Maithili music, dance, and performing arts through workshops and performances.' },
            { icon: 'ðŸ’ª', title: 'Fitness & Wellness',  desc: 'Enhancing the health and fitness aspects of our community through organized programs.' },
            { icon: 'ðŸŒ', title: 'Global Outreach',     desc: 'Connecting Maithili communities worldwide and representing our culture on the global stage.' },
          ].map(item => (
            <div key={item.title} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '.75rem' }}>{item.icon}</div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)', marginBottom: '.5rem' }}>{item.title}</div>
              <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* â”€â”€ Executive Committee (live from DB) â”€â”€ */}
        {committee.length > 0 && (
          <>
            <div className="section-header">
              <div>
                <div className="section-eyebrow">à¤¨à¥‡à¤¤à¥ƒà¤¤à¥à¤µ</div>
                <h2 className="section-title">Executive <span>Committee</span></h2>
              </div>
            </div>
            <div className="grid-2" style={{ marginBottom: '3.5rem' }}>
              {committee.map(m => (
                <div key={m.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--saffron-light)', border: '2px solid var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--saffron)', flexShrink: 0, overflow: 'hidden' }}>
                    {m.photo_url ? <img src={m.photo_url} alt={m.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : m.name[0]}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)' }}>{m.name}</div>
                    <div style={{ color: 'var(--saffron)', fontSize: '.875rem', fontWeight: 600 }}>{m.role}</div>
                    {m.email && <div className="text-xs text-muted">{m.email}</div>}
                    {(m.term_start || m.term_end) && (
                      <div className="text-xs text-muted">
                        Term: {m.term_start ? new Date(m.term_start).getFullYear() : '?'} â€“ {m.term_end ? new Date(m.term_end).getFullYear() : 'Present'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* â”€â”€ Membership Tiers â”€â”€ */}
        <div className="section-header">
          <div>
            <div className="section-eyebrow">à¤¸à¤¦à¤¸à¥à¤¯à¤¤à¤¾</div>
            <h2 className="section-title">Membership <span>Tiers</span></h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {[
            { type: 'Student',             annual: '$25',   lifetime: '$200',  color: 'var(--forest)',  desc: 'Full-time students' },
            { type: 'Individual',          annual: '$50',   lifetime: '$500',  color: 'var(--saffron)', desc: 'Individual adults' },
            { type: 'Honorary',            annual: 'Free',  lifetime: 'Free',  color: 'var(--gold)',    desc: 'By invitation only' },
            { type: 'Corporate / Sponsor', annual: '$500+', lifetime: 'N/A',   color: '#0D47A1',        desc: 'Business sponsors' },
          ].map(t => (
            <div key={t.type} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${t.color}` }}>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--navy)', marginBottom: '.35rem' }}>{t.type}</div>
              <div className="text-sm text-muted" style={{ marginBottom: '.75rem' }}>{t.desc}</div>
              <div style={{ color: t.color, fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 700 }}>{t.annual}</div>
              <div className="text-xs text-muted">Annual</div>
              <div style={{ color: t.color, fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 600, marginTop: '.35rem' }}>{t.lifetime}</div>
              <div className="text-xs text-muted">Lifetime</div>
            </div>
          ))}
        </div>

        {/* â”€â”€ Bottom CTA â”€â”€ */}
        <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--navy)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
          <div style={{ color: 'var(--gold)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '1.1rem', marginBottom: '1.25rem' }}>
            "Together, let's stand tall as proud Maithils."
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" className="btn btn-primary btn-lg">Join MAA Today</a>
            <a href="/contact" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.25)' }}>Contact Us</a>
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}

