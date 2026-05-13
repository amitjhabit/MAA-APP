// app/about/page.js — Server Component (reads DB directly, no client-side fetch)
import PublicNav from '@/app/components/PublicNav';
import { getDb, ensureInit } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.8 }}>contributemaa@maithilusa.org</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem' }}>
        © {new Date().getFullYear()} Maithil Association of America · <a href="/admin" style={{ color: 'var(--gold)' }}>Admin</a>
      </div>
    </footer>
  );
}

export default async function AboutPage() {
  await ensureInit();
  const sql = getDb();

  // Fetch about content and committee in parallel from the DB directly
  const [contentRows, committeeRows] = await Promise.all([
    sql`SELECT * FROM about_content WHERE is_active = TRUE ORDER BY type, sort_order ASC, created_at ASC`,
    sql`
      SELECT id, name, role, committee, bio, photo_url, sort_order,
             term_start, term_end, is_current,
             NULLIF(TRIM(COALESCE(email, '')), '') AS email,
             NULLIF(TRIM(COALESCE(phone, '')), '') AS phone
      FROM committee_members
      ORDER BY is_current DESC, sort_order ASC, created_at ASC
    `,
  ]);

  const paragraphs      = contentRows.filter(r => r.type === 'paragraph');
  const quote           = contentRows.find(r => r.type === 'quote') || null;
  const coreValues      = contentRows.filter(r => r.type === 'core_value');
  const activities      = contentRows.filter(r => r.type === 'activity');
  const currentCommittee = committeeRows.filter(m => m.is_current);
  const pastCommittee    = committeeRows.filter(m => !m.is_current);

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

        {/* About Paragraphs + Quote */}
        {(paragraphs.length > 0 || quote) && (
          <div style={{ maxWidth: 840, margin: '0 auto 3.5rem' }}>
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderTop: '4px solid var(--saffron)', padding: '2.5rem 2.75rem', boxShadow: 'var(--shadow-lg)' }}>
              {paragraphs.map((p, i) => (
                <p key={p.id} style={{ fontSize: '1.05rem', lineHeight: 2, color: 'var(--ink)', marginBottom: i < paragraphs.length - 1 ? '1.5rem' : 0 }}>
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
        )}

        {/* Core Values */}
        {coreValues.length > 0 && (
          <>
            <div className="section-header">
              <div><div className="section-eyebrow">हमारे मूल्य</div><h2 className="section-title">Our Core <span>Values</span></h2></div>
            </div>
            <div className="grid-3" style={{ marginBottom: '3.5rem' }}>
              {coreValues.map((item) => (
                <div key={item.id} className="card" style={{ textAlign: 'center' }}>
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
              {activities.map((item) => (
                <div key={item.id} className="card" style={{ textAlign: 'center' }}>
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
                    {m.email && <div className="text-xs text-muted">{m.email}</div>}
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
                    {m.email && <div className="text-xs text-muted">{m.email}</div>}
                    {(m.term_start || m.term_end) && (
                      <div className="text-xs text-muted">Term: {m.term_start ? new Date(m.term_start).getFullYear() : '?'} – {m.term_end ? new Date(m.term_end).getFullYear() : '?'}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Membership Plan */}
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

      </div>
      <Footer />
    </>
  );
}
