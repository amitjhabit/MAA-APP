// app/page.js — server component; renders homepage from Admin Home content
export const dynamic = 'force-dynamic';
import { getDb, ensureInit } from '@/lib/db';
import PublicNav from '@/app/components/PublicNav';
import PublicFooter from '@/app/components/PublicFooter';
import InquiryWidget from '@/app/components/InquiryWidget';

function SubtitleText({ text }) {
  if (!text) return null;
  const parts = text.split(/\s*\*\s+/).map(s => s.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return (
      <p style={{ fontSize: '1.05rem', lineHeight: 2, color: 'var(--ink)' }}>{text}</p>
    );
  }
  const [intro, ...bullets] = parts;
  return (
    <div>
      {intro && <p style={{ fontSize: '1.05rem', lineHeight: 2, color: 'var(--ink)', marginBottom: '1.25rem' }}>{intro}</p>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ display: 'flex', gap: '.85rem', alignItems: 'flex-start', fontSize: '1rem', lineHeight: 1.75, color: 'var(--ink)' }}>
            <span style={{ color: 'var(--saffron)', fontWeight: 700, flexShrink: 0, fontSize: '1.1rem', marginTop: '.1rem' }}>•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

  return (
    <>
      <PublicNav active="/" />

      {/* Hero — same compact style as About Us */}
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <div className="hero-maithili">{titleMaithili}</div>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.25rem' }}>
            <a href="/join" className="btn btn-primary btn-lg">Become a Member</a>
            <a href="/events" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>View Events</a>
            <a href="/contact" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.85)', borderColor: 'rgba(255,255,255,.2)' }}>✉️ Contact Us</a>
          </div>
        </div>
      </section>

      {/* Content — same shell + white card pattern as About Us */}
      <div className="shell">
        <div style={{ maxWidth: 840, margin: '0 auto 3.5rem' }}>
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderTop: '4px solid var(--saffron)', padding: '2.5rem 2.75rem', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 4, height: 32, background: 'var(--saffron)', borderRadius: 2, flexShrink: 0 }} />
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', color: 'var(--navy)', fontWeight: 600, margin: 0 }}>About Our Organization</h2>
            </div>
            <SubtitleText text={subtitle} />
          </div>
        </div>

        {/* CTA strip — same as About Us bottom section */}
        <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--navy)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
          <div style={{ color: 'var(--gold)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '1.1rem', marginBottom: '1.25rem' }}>
            "Together, let's stand tall as proud Maithils."
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" className="btn btn-primary btn-lg">Join MAA Today</a>
            <a href="/about" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.25)' }}>Learn More →</a>
          </div>
        </div>
      </div>

      <PublicFooter />
      <InquiryWidget />
    </>
  );
}
