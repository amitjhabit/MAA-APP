// app/page.js — About Us is the landing page
export const dynamic = 'force-dynamic';
import { getDb, ensureInit } from '@/lib/db';
import PublicNav from '@/app/components/PublicNav';
import PublicFooter from '@/app/components/PublicFooter';
import CommitteeSection from '@/app/components/CommitteeSection';

export default async function HomePage() {
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
    console.error('HomePage data fetch:', e.message);
  }

  const heroBanner  = contentRows.filter(r => r.type === 'hero_banner');
  const paragraphs  = contentRows.filter(r => r.type === 'paragraph');
  const quote       = contentRows.find(r => r.type === 'quote') || null;
  const coreValues  = contentRows.filter(r => r.type === 'core_value');
  const activities  = contentRows.filter(r => r.type === 'activity');
  const goals       = contentRows.filter(r => r.type === 'goals');
  const bannerItems = heroBanner.length > 0 ? heroBanner : paragraphs;

  return (
    <>
      <PublicNav active="/" />

      <section className="hero">
        <div className="hero-inner" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
          {/* Left: text */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <span className="hero-eyebrow">हमारे बारे में</span>
            <h1>About <em>Us</em></h1>
            {bannerItems.length > 0 && (
              <div style={{ marginTop: '.5rem' }}>
                {bannerItems.map((p, i) => (
                  <p key={p.id} className="hero-sub" style={{ maxWidth: '100%', marginBottom: i < bannerItems.length - 1 ? '.5rem' : 0 }}>
                    {p.content}
                  </p>
                ))}
              </div>
            )}
          </div>
          {/* Right: framed Mithila art */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              border: '5px solid var(--gold)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 4px 20px rgba(0,0,0,.35), 0 0 0 2px rgba(201,150,12,.4)',
              overflow: 'hidden',
              width: 300,
            }}>
              <img
                src="/images/gallery/mithila_nature_painting.png"
                alt="Mithila Nature Painting"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="shell">
        {(paragraphs.length > 0 || quote) && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderTop: '1px solid rgba(10,92,107,.6)', padding: '2rem 2.5rem', boxShadow: 'var(--shadow)' }}>
              {paragraphs.map((p, i) => (
                <p key={p.id} style={{ fontSize: '1rem', lineHeight: 1.75, color: 'var(--ink)', marginBottom: i < paragraphs.length - 1 ? '1rem' : 0 }}>
                  {p.content}
                </p>
              ))}
              {quote && (
                <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius)', padding: '1.25rem 1.75rem', marginTop: '1.25rem', borderLeft: '3px solid var(--saffron)' }}>
                  <div style={{ color: 'var(--gold)', fontSize: '1.4rem', marginBottom: '.25rem', lineHeight: 1 }}>"</div>
                  <p style={{ fontSize: '1rem', lineHeight: 1.75, color: 'rgba(255,255,255,.92)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{quote.content}</p>
                  {quote.title && <div style={{ color: 'var(--gold)', fontSize: '.85rem', marginTop: '.5rem', fontWeight: 600 }}>— {quote.title}</div>}
                  <div style={{ color: 'var(--gold)', fontSize: '1.4rem', textAlign: 'right', lineHeight: 1, marginTop: '.25rem' }}>"</div>
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
            <div className="grid-3" style={{ marginBottom: '2rem' }}>
              {coreValues.map(item => (
                <div key={item.id} className="card" style={{ textAlign: 'left' }}>
                  {item.icon && <div style={{ fontSize: '2rem', marginBottom: '.6rem' }}>{item.icon}</div>}
                  {item.title && <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)', marginBottom: '.5rem', fontSize: '1.05rem' }}>{item.title}</div>}
                  <div style={{ fontSize: '1rem', lineHeight: 1.75, fontStyle: 'italic', color: 'var(--ink-soft)' }}>{item.content}</div>
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
            <div className="grid-3" style={{ marginBottom: '2rem' }}>
              {activities.map(item => (
                <div key={item.id} className="card" style={{ textAlign: 'left' }}>
                  {item.icon && <div style={{ fontSize: '1.6rem', marginBottom: '.5rem' }}>{item.icon}</div>}
                  {item.title && <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)', marginBottom: '.35rem', fontSize: '.875rem' }}>{item.title}</div>}
                  <div className="text-sm text-muted" style={{ lineHeight: 1.7, fontStyle: 'italic' }}>{item.content}</div>
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
            <div className="grid-3" style={{ marginBottom: '2rem' }}>
              {goals.map(item => (
                <div key={item.id} className="card" style={{ textAlign: 'left' }}>
                  {item.icon && <div style={{ fontSize: '1.6rem', marginBottom: '.5rem' }}>{item.icon}</div>}
                  {item.title && <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)', marginBottom: '.35rem', fontSize: '.875rem' }}>{item.title}</div>}
                  <div className="text-sm text-muted" style={{ lineHeight: 1.7, fontStyle: 'italic' }}>{item.content}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <CommitteeSection initialMembers={committeeRows} />

        <div className="section-header">
          <div><div className="section-eyebrow">सदस्यता</div><h2 className="section-title">Membership <span>Plan</span></h2></div>
        </div>
        <div style={{ maxWidth: 480, margin: '0 auto 2rem', background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.75rem', borderTop: '1px solid rgba(10,92,107,.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.2rem' }}>Membership Plan</div>
            <div style={{ color: '#fff', fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700 }}>Annual Membership</div>
            <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '.78rem', marginTop: '.2rem' }}>Full access to all MAA events, programs &amp; community benefits</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--gold)', fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>$21</div>
            <div style={{ color: 'rgba(255,255,255,.55)', fontSize: '.72rem' }}>per year</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--navy)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
          <div style={{ color: 'var(--gold)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '.95rem', marginBottom: '1rem' }}>
            "Together, let's stand tall as proud Maithils."
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" className="btn btn-primary">Join MAA Today</a>
            <a href="/contact" className="btn" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.25)' }}>Contact Us</a>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
