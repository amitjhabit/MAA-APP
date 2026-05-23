// app/page.js — server component; renders homepage from Admin Home content
export const dynamic = 'force-dynamic';
import { getDb, ensureInit } from '@/lib/db';
import PublicNav from '@/app/components/PublicNav';
import PublicFooter from '@/app/components/PublicFooter';
import InquiryWidget from '@/app/components/InquiryWidget';

export default async function HomePage() {
  let content = {};
  try {
    await ensureInit();
    const sql = getDb();
    const rows = await sql`SELECT section, key, value FROM homepage_content WHERE is_active = TRUE`;
    for (const row of rows) content[`${row.section}.${row.key}`] = row.value;
  } catch (e) {
    console.error('HomePage data fetch:', e.message);
  }

  const get = (section, key, fallback) => content[`${section}.${key}`] || fallback;

  const eyebrow       = get('hero', 'eyebrow',        'Est. 2004 · Connecting Communities');
  const title         = get('hero', 'title',           'Celebrating Maithili Culture & Heritage');
  const titleMaithili = get('hero', 'title_maithili',  'मैथिली संस्कृति आ विरासतक उत्सव');
  const subtitle      = get('hero', 'subtitle',        'Uniting the Maithili-speaking community across America — preserving our language, traditions, and cultural identity for future generations.');

  // Split subtitle into intro paragraph + bullet cards
  const parts   = subtitle.split(/\s*\*\s+/).map(s => s.trim()).filter(Boolean);
  const hasBullets = parts.length > 1;
  const introText  = hasBullets ? parts[0] : subtitle;
  const bullets    = hasBullets ? parts.slice(1) : [];

  return (
    <>
      <PublicNav active="/" />

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <div className="hero-maithili">{titleMaithili}</div>
        </div>
      </section>

      <div className="shell" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Intro text card */}
        {introText && (
          <div style={{ maxWidth: 840, margin: '0 auto 1.5rem' }}>
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderTop: '1px solid rgba(10,92,107,.6)', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow)' }}>
              <p style={{ fontSize: '.78rem', lineHeight: 1.55, color: 'var(--ink)', margin: 0 }}>{introText}</p>
            </div>
          </div>
        )}

        {/* Bullet points as cards — matches About Us style */}
        {bullets.length > 0 && (
          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            {bullets.map((b, i) => (
              <div key={i} className="card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '.78rem', lineHeight: 1.55, fontStyle: 'italic', color: 'var(--ink-soft)' }}>{b}</div>
              </div>
            ))}
          </div>
        )}

        {/* CTA strip */}
        <div style={{ textAlign: 'center', padding: '1.25rem', background: 'var(--navy)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
          <div style={{ color: 'var(--gold)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '.82rem', marginBottom: '.85rem' }}>
            "Together, let's stand tall as proud Maithils."
          </div>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" className="btn" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', borderColor: 'rgba(255,255,255,.4)', fontWeight: 600 }}>Join MAA Today</a>
            <a href="/about" className="btn" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.25)' }}>Learn More →</a>
          </div>
        </div>
      </div>

      <PublicFooter />
      <InquiryWidget />
    </>
  );
}
