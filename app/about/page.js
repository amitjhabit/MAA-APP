// app/about/page.js — server component, always fetches fresh from DB
export const dynamic = 'force-dynamic';
import { getDb, ensureInit } from '@/lib/db';
import PublicNav from '@/app/components/PublicNav';
import PublicFooter from '@/app/components/PublicFooter';
import CommitteeSection from '@/app/components/CommitteeSection';

export default async function AboutPage() {
  let contentRows = [], committeeRows = [];
  try {
    await ensureInit();
    const sql = getDb();
    [contentRows, committeeRows] = await Promise.all([
      sql`SELECT * FROM about_content WHERE is_active = TRUE ORDER BY type, sort_order ASC, created_at ASC`,
      sql`
        SELECT id, name, role, committee, bio,
               NULLIF(TRIM(COALESCE(photo_url, '')), '') AS photo_url,
               sort_order, term_start, term_end, is_current,
               NULLIF(TRIM(COALESCE(email, '')), '') AS email,
               NULLIF(TRIM(COALESCE(phone, '')), '') AS phone
        FROM committee_members
        ORDER BY is_current DESC, sort_order ASC, created_at ASC
      `,
    ]);
  } catch (e) {
    console.error('AboutPage data fetch:', e.message);
  }

  const paragraphs       = contentRows.filter(r => r.type === 'paragraph');
  const quote            = contentRows.find(r => r.type === 'quote') || null;
  const coreValues       = contentRows.filter(r => r.type === 'core_value');
  const activities       = contentRows.filter(r => r.type === 'activity');
  const goals            = contentRows.filter(r => r.type === 'goals');

  return (
    <>
      <PublicNav active="/about" />

      <section className="hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">हमारे बारे में</span>
          <h1>About <em>Us</em></h1>
        </div>
      </section>

      <div className="shell">
        {(paragraphs.length > 0 || quote) && (
          <div style={{ maxWidth: 840, margin: '0 auto 3.5rem' }}>
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderTop: '4px solid var(--saffron)', padding: '2.5rem 2.75rem', boxShadow: 'var(--shadow-lg)' }}>
              {paragraphs.map((p, i) => (
                <p key={p.id} style={{ fontSize: '1.05rem', lineHeight: 2, color: 'var(--ink)', marginBottom: i < paragraphs.length - 1 ? '1.5rem' : 0 }}>
                  {p.content}
                </p>
              ))}
              {quote && (
                <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius)', padding: '1.5rem 2rem', marginTop: '1.5rem', borderLeft: '4px solid var(--saffron)' }}>
                  <div style={{ color: 'var(--gold)', fontSize: '1.5rem', marginBottom: '.5rem', lineHeight: 1 }}>"</div>
                  <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(255,255,255,.92)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{quote.content}</p>
                  {quote.title && <div style={{ color: 'var(--gold)', fontSize: '.8rem', marginTop: '.75rem', fontWeight: 600 }}>— {quote.title}</div>}
                  <div style={{ color: 'var(--gold)', fontSize: '1.5rem', textAlign: 'right', lineHeight: 1, marginTop: '.5rem' }}>"</div>
                </div>
              )}
            </div>
          </div>
        )}

        {coreValues.length > 0 && (
          <>
            <div className="section-header">
              <div><div className="section-eyebrow">हमारे मूल्य</div><h2 className="section-title">Our Core <span>Values</span></h2></div>
            </div>
            <div className="grid-3" style={{ marginBottom: '3.5rem' }}>
              {coreValues.map(item => (
                <div key={item.id} className="card" style={{ textAlign: 'center' }}>
                  {item.icon && <div style={{ fontSize: '2.2rem', marginBottom: '.75rem' }}>{item.icon}</div>}
                  {item.title && <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)', marginBottom: '.5rem', fontSize: '1rem' }}>{item.title}</div>}
                  <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{item.content}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activities.length > 0 && (
          <>
            <div className="section-header">
              <div><div className="section-eyebrow">हमारा काम</div><h2 className="section-title">What We <span>Do</span></h2></div>
            </div>
            <div className="grid-3" style={{ marginBottom: '3.5rem' }}>
              {activities.map(item => (
                <div key={item.id} className="card" style={{ textAlign: 'center' }}>
                  {item.icon && <div style={{ fontSize: '2.2rem', marginBottom: '.75rem' }}>{item.icon}</div>}
                  {item.title && <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)', marginBottom: '.5rem' }}>{item.title}</div>}
                  <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{item.content}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {goals.length > 0 && (
          <>
            <div className="section-header">
              <div><div className="section-eyebrow">हमारे लक्ष्य</div><h2 className="section-title">Goals & <span>Objectives</span></h2></div>
            </div>
            <div className="grid-3" style={{ marginBottom: '3.5rem' }}>
              {goals.map(item => (
                <div key={item.id} className="card" style={{ textAlign: 'center' }}>
                  {item.icon && <div style={{ fontSize: '2.2rem', marginBottom: '.75rem' }}>{item.icon}</div>}
                  {item.title && <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)', marginBottom: '.5rem', fontSize: '1rem' }}>{item.title}</div>}
                  <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{item.content}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <CommitteeSection initialMembers={committeeRows} />

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
      <PublicFooter />
    </>
  );
}
