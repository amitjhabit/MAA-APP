'use client';
// app/about/page.js — About Us
import { useState, useEffect } from 'react';
import PublicNav from '@/app/components/PublicNav';

function Footer() {
  return (
    <footer className="pub-footer">
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '.5rem' }}>मैथिल एसोसिएशन</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.7 }}>Preserving and promoting Maithili language, culture, and heritage across America.</div>
        </div>
        <div>
          <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.75rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Quick Links</div>
          {[['Events', '/events'], ['News', '/news'], ['Gallery', '/gallery'], ['Donate', '/donate'], ['Contact', '/contact']].map(([l, h]) => (
            <div key={l} style={{ marginBottom: '.35rem' }}><a href={h} style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem' }}>{l}</a></div>
          ))}
        </div>
        <div>
          <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.75rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Contact</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.8 }}>contributemaa@maithilusa.org<br />San Ramon, California</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem' }}>
        © {new Date().getFullYear()} Maithil Association of America · <a href="/admin" style={{ color: 'var(--gold)' }}>Admin</a>
      </div>
    </footer>
  );
}

// ── Hardcoded fallbacks shown when DB has no content yet ──
const DEFAULT_PARAGRAPHS = [
  { id: 'd1', content: 'MAA is a non-profit organization passionately dedicated to representing Maithil and Mithila culture on a global platform. In addition to our cultural initiatives, we are committed to enhancing the cultural, educational and fitness aspects within our community.' },
  { id: 'd2', content: 'Through our educational programs "Gurukul", we aim to empower Maithil youth with access to quality education and skill development opportunities, nurturing the leaders of tomorrow for our community.' },
  { id: 'd3', content: 'At MAA, we uphold the principles of selfless service and transparency, ensuring that every initiative is driven by the collective spirit of our members. The motive of the organization is to unite the Maithil diaspora to keep our heritage alive.' },
];
const DEFAULT_QUOTE = { content: "We invite you to join us in preserving and celebrating our vibrant Maithil identity. Together, let's stand tall as proud Maithils and make a meaningful difference in promoting our heritage for generations to come." };
const DEFAULT_VALUES = [
  { id: 'v1', icon: '🌍', title: 'Cultural Representation', content: 'Representing Maithil and Mithila culture passionately on a global platform.' },
  { id: 'v2', icon: '🎓', title: 'Gurukul Education',       content: 'Empowering Maithil youth through quality education and skill development programs.' },
  { id: 'v3', icon: '🤝', title: 'Selfless Service',        content: 'Every initiative driven by the collective spirit and selfless dedication of our members.' },
  { id: 'v4', icon: '🔍', title: 'Transparency',            content: 'Upholding transparency in all our activities, finances, and community initiatives.' },
  { id: 'v5', icon: '💪', title: 'Health & Fitness',        content: 'Committed to enhancing cultural, educational, and fitness aspects within our community.' },
  { id: 'v6', icon: '🌐', title: 'Unity of Diaspora',       content: 'Uniting the Maithil diaspora across America to keep our heritage alive and thriving.' },
];
const DEFAULT_ACTIVITIES = [
  { id: 'a1', icon: '🎭', title: 'Cultural Events',    content: 'Organizing festivals, Chhath Puja, Maithili New Year, and cultural programs throughout the year.' },
  { id: 'a2', icon: '📚', title: 'Gurukul Programs',   content: 'Educational programs for Maithil youth covering language, arts, academics, and leadership skills.' },
  { id: 'a3', icon: '🤝', title: 'Community Support',  content: 'Helping newly arrived Maithili families settle in America with guidance and community connections.' },
  { id: 'a4', icon: '🎵', title: 'Arts & Music',       content: 'Promoting Maithili music, dance, and performing arts through workshops and performances.' },
  { id: 'a5', icon: '💪', title: 'Fitness & Wellness', content: 'Enhancing the health and fitness aspects of our community through organized programs.' },
  { id: 'a6', icon: '🌐', title: 'Global Outreach',    content: 'Connecting Maithili communities worldwide and representing our culture on the global stage.' },
];

export default function AboutPage() {
  const [content, setContent]   = useState(null); // null = loading
  const [committee, setCommittee] = useState([]);
  const currentCommittee = committee.filter(m => m.is_current);
  const pastCommittee    = committee.filter(m => !m.is_current);

  useEffect(() => {
    // Fetch about content and committee in parallel
    Promise.all([
      fetch('/api/public/about').then(r => r.json()).catch(() => null),
      fetch('/api/public/committee').then(r => r.json()).catch(() => null),
    ]).then(([aboutRes, committeeRes]) => {
      if (aboutRes?.success) setContent(aboutRes.data);
      else setContent({}); // show defaults
      if (committeeRes?.success) setCommittee(committeeRes.data || []);
    });
  }, []);

  // Use DB data if available, otherwise fall back to hardcoded defaults
  const paragraphs  = content?.paragraphs?.length  ? content.paragraphs  : DEFAULT_PARAGRAPHS;
  const quote       = content?.quote               ? content.quote       : DEFAULT_QUOTE;
  const coreValues  = content?.core_values?.length  ? content.core_values  : DEFAULT_VALUES;
  const activities  = content?.activities?.length   ? content.activities   : DEFAULT_ACTIVITIES;
  const fromDb      = content !== null && (content?.paragraphs?.length || content?.core_values?.length);

  return (
    <>
      <PublicNav active="/about" />

      {/* Hero */}
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">हमारे बारे में</span>
          <h1>About <em>Us</em></h1>
        </div>
      </section>

      <div className="shell">

        {/* Loading skeleton */}
        {content === null && (
          <div className="loading-state"><span className="spinner" />Loading…</div>
        )}

        {content !== null && (
          <>
            {/* About Paragraphs + Quote */}
            <div style={{ maxWidth: 840, margin: '0 auto 3.5rem' }}>
              <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderTop: '4px solid var(--saffron)', padding: '2.5rem 2.75rem', boxShadow: 'var(--shadow-lg)' }}>
                {paragraphs.map((p, i) => (
                  <p key={p.id || i} style={{ fontSize: '1.05rem', lineHeight: 2, color: 'var(--ink)', marginBottom: i < paragraphs.length - 1 ? '1.5rem' : 0 }}>
                    {p.content}
                  </p>
                ))}

                {/* Closing quote */}
                {quote && (
                  <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius)', padding: '1.5rem 2rem', marginTop: '1.5rem', borderLeft: '4px solid var(--saffron)' }}>
                    <div style={{ color: 'var(--gold)', fontSize: '1.5rem', marginBottom: '.5rem', lineHeight: 1 }}>"</div>
                    <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(255,255,255,.92)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
                      {quote.content}
                    </p>
                    {quote.title && <div style={{ color: 'var(--gold)', fontSize: '.8rem', marginTop: '.75rem', fontWeight: 600 }}>— {quote.title}</div>}
                    <div style={{ color: 'var(--gold)', fontSize: '1.5rem', textAlign: 'right', lineHeight: 1, marginTop: '.5rem' }}>"</div>
                  </div>
                )}
              </div>
            </div>

            {/* Core Values */}
            {coreValues.length > 0 && (
              <>
                <div className="section-header">
                  <div><div className="section-eyebrow">हमारे मूल्य</div><h2 className="section-title">Our Core <span>Values</span></h2></div>
                </div>
                <div className="grid-3" style={{ marginBottom: '3.5rem' }}>
                  {coreValues.map((item, i) => (
                    <div key={item.id || i} className="card" style={{ textAlign: 'center' }}>
                      {item.icon && <div style={{ fontSize: '2.2rem', marginBottom: '.75rem' }}>{item.icon}</div>}
                      {item.title && <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)', marginBottom: '.5rem', fontSize: '1rem' }}>{item.title}</div>}
                      <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{item.content}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* What We Do */}
            {activities.length > 0 && (
              <>
                <div className="section-header">
                  <div><div className="section-eyebrow">हमारा काम</div><h2 className="section-title">What We <span>Do</span></h2></div>
                </div>
                <div className="grid-3" style={{ marginBottom: '3.5rem' }}>
                  {activities.map((item, i) => (
                    <div key={item.id || i} className="card" style={{ textAlign: 'center' }}>
                      {item.icon && <div style={{ fontSize: '2.2rem', marginBottom: '.75rem' }}>{item.icon}</div>}
                      {item.title && <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)', marginBottom: '.5rem' }}>{item.title}</div>}
                      <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{item.content}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Executive Committee — current members */}
            {currentCommittee.length > 0 && (
              <>
                <div className="section-header">
                  <div><div className="section-eyebrow">नेतृत्व</div><h2 className="section-title">Executive <span>Committee</span></h2></div>
                </div>
                <div className="grid-2" style={{ marginBottom: '3.5rem' }}>
                  {currentCommittee.map(m => (
                    <div key={m.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--saffron-light)', border: '2px solid var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--saffron)', flexShrink: 0, overflow: 'hidden' }}>
                        {m.photo_url ? <img src={m.photo_url} alt={m.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : m.name[0]}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)' }}>{m.name}</div>
                        <div style={{ color: 'var(--saffron)', fontSize: '.875rem', fontWeight: 600 }}>{m.role}</div>
                        {m.email && m.email.trim() !== '' && <div className="text-xs text-muted">{m.email}</div>}
                        {(m.term_start || m.term_end) && (
                          <div className="text-xs text-muted">Term: {m.term_start ? new Date(m.term_start).getFullYear() : '?'} – {m.term_end ? new Date(m.term_end).getFullYear() : 'Present'}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Past Committee Members */}
            {pastCommittee.length > 0 && (
              <>
                <div className="section-header">
                  <div><div className="section-eyebrow">पूर्व नेतृत्व</div><h2 className="section-title">Past <span>Committee Members</span></h2></div>
                </div>
                <div className="grid-2" style={{ marginBottom: '3.5rem' }}>
                  {pastCommittee.map(m => (
                    <div key={m.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', opacity: 0.85 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--paper-3)', border: '2px solid var(--border-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink-soft)', flexShrink: 0, overflow: 'hidden' }}>
                        {m.photo_url ? <img src={m.photo_url} alt={m.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : m.name[0]}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)' }}>{m.name}</div>
                        <div style={{ color: 'var(--ink-soft)', fontSize: '.875rem', fontWeight: 600 }}>{m.role}</div>
                        {m.email && m.email.trim() !== '' && <div className="text-xs text-muted">{m.email}</div>}
                        {(m.term_start || m.term_end) && (
                          <div className="text-xs text-muted">Term: {m.term_start ? new Date(m.term_start).getFullYear() : '?'} – {m.term_end ? new Date(m.term_end).getFullYear() : '?'}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Membership Tiers */}
            <div className="section-header">
              <div><div className="section-eyebrow">सदस्यता</div><h2 className="section-title">Membership <span>Plan</span></h2></div>
            </div>
            <div style={{ maxWidth: 480, margin: '0 auto 3rem', background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '2rem 2.5rem', borderTop: '4px solid var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.25rem' }}>Membership Plan</div>
                <div style={{ color: '#fff', fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700 }}>Annual Membership</div>
                <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '.875rem', marginTop: '.25rem' }}>Full access to all MAA events, programs &amp; community benefits</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--gold)', fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>$21</div>
                <div style={{ color: 'rgba(255,255,255,.55)', fontSize: '.8rem' }}>per year</div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--navy)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
              <div style={{ color: 'var(--gold)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '1.1rem', marginBottom: '1.25rem' }}>
                "Together, let's stand tall as proud Maithils."
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/join" className="btn btn-primary btn-lg">Join MAA Today</a>
                <a href="/contact" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.25)' }}>Contact Us</a>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
