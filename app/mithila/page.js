// app/mithila/page.js — server component, fetches from DB
export const dynamic = 'force-dynamic';
import { getDb, ensureInit } from '@/lib/db';
import PublicNav from '@/app/components/PublicNav';
import PublicFooter from '@/app/components/PublicFooter';

export const metadata = {
  title: 'Mithila — Maithil Association of America',
  description: 'Discover the history, language, art, and traditions of the Maithil people and the ancient Mithila region.',
};

const SECTION_LABELS = {
  intro:     { en: 'Geographic Footprint', eyebrow: 'भौगोलिक विस्तार' },
  geography: { en: 'Geographic Footprint', eyebrow: 'भौगोलिक विस्तार' },
  language:  { en: 'Language & Script',    eyebrow: 'भाषा एवं लिपि' },
  culture:   { en: 'Cultural Pillars',     eyebrow: 'संस्कृति एवं परंपरा' },
  diaspora:  { en: 'Global Diaspora',      eyebrow: 'वैश्विक समुदाय' },
};

export default async function MithilaPage() {
  let rows = [];
  try {
    await ensureInit();
    const sql = getDb();
    rows = await sql`SELECT * FROM mithila_content WHERE is_active = TRUE ORDER BY section, sort_order ASC`;
  } catch (e) {
    console.error('MithilaPage fetch:', e.message);
  }

  const bySection = section => rows.filter(r => r.section === section);
  const intro     = bySection('intro');
  const geography = bySection('geography');
  const language  = bySection('language');
  const culture   = bySection('culture');
  const diaspora  = bySection('diaspora');

  return (
    <>
      <PublicNav active="/mithila" />

      <section className="hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">मिथिला — एक परिचय</span>
          <h1>The People of <em>Mithila</em></h1>
          <p className="hero-subtitle" style={{ color: 'rgba(255,255,255,.8)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '1.05rem', marginTop: '.5rem', maxWidth: 600 }}>
            An ancient civilization, a living culture, and a global community.
          </p>
        </div>
      </section>

      <div className="shell">

        {/* Intro */}
        {intro.length > 0 && (
          <div style={{ maxWidth: 860, margin: '0 auto 2.5rem' }}>
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderTop: '3px solid var(--navy)', padding: '1.75rem 2rem', boxShadow: 'var(--shadow)' }}>
              {intro.map((item, i) => (
                <div key={item.id}>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title || ''} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 8, marginBottom: '1rem' }} />
                  )}
                  <p style={{ fontSize: '.9rem', lineHeight: 1.75, color: 'var(--ink)', margin: i < intro.length - 1 ? '0 0 .75rem' : 0 }}>
                    {item.content}
                  </p>
                  {item.content_maithili && (
                    <p style={{ fontSize: '.85rem', lineHeight: 1.7, color: 'var(--ink-soft)', fontStyle: 'italic', marginTop: '.5rem' }}>{item.content_maithili}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Geographic Footprint — single merged container */}
        {geography.length > 0 && (
          <>
            <div className="section-header">
              <div>
                <div className="section-eyebrow">भौगोलिक विस्तार</div>
                <h2 className="section-title">Geographic <span>Footprint</span></h2>
              </div>
            </div>

            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: '2.5rem' }}>

              {/* Map image — from admin image_url or uploaded static fallback */}
              {(() => {
                const mapUrl = geography.find(g => g.image_url)?.image_url || '/images/gallery/mithila/1779775427880-mithilamap.png';
                return (
                  <div style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--border)' }}>
                    <img
                      src={mapUrl}
                      alt="Mithila Region Map"
                      style={{ width: '100%', maxHeight: 380, objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                );
              })()}

              {/* Text + country cards */}
              <div style={{ padding: '1.5rem 1.75rem' }}>
                <p style={{ fontSize: '.875rem', lineHeight: 1.75, color: 'var(--ink-soft)', margin: '0 0 1.25rem' }}>
                  The historic Mithila region is bounded by the <strong>Himalayas to the north</strong> and the <strong>Ganges River to the south</strong>. Today, this land is shared by two nations:
                </p>

                {/* Country sub-cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {geography.map((item, i) => (
                    <div key={item.id} style={{ background: 'var(--paper)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', borderLeft: `4px solid ${i === 0 ? 'var(--saffron)' : 'var(--gold)'}`, padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.5rem' }}>
                        <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{item.icon || '🗺️'}</span>
                        {item.title && <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--navy)', fontSize: '.95rem' }}>{item.title}</div>}
                      </div>
                      {item.title_maithili && <div style={{ color: 'var(--gold)', fontSize: '.75rem', marginBottom: '.35rem' }}>{item.title_maithili}</div>}
                      <p className="text-sm text-muted" style={{ lineHeight: 1.7, margin: 0 }}>{item.content}</p>
                      {item.content_maithili && <p style={{ fontSize: '.78rem', color: 'var(--ink-dim)', fontStyle: 'italic', marginTop: '.4rem', marginBottom: 0 }}>{item.content_maithili}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Language & Script */}
        {language.length > 0 && (
          <>
            <div className="section-header">
              <div>
                <div className="section-eyebrow">भाषा एवं लिपि</div>
                <h2 className="section-title">Language &amp; <span>Script</span></h2>
              </div>
            </div>
            <p style={{ fontSize: '.875rem', lineHeight: 1.7, color: 'var(--ink-soft)', maxWidth: 720, marginBottom: '1.25rem' }}>
              The defining feature of Maithil identity is <strong>Maithili</strong> — one of the oldest and richest Indo-Aryan languages.
            </p>
            <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
              {language.map(item => (
                <div key={item.id} className="card">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title || ''} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, marginBottom: '.75rem' }} />
                  ) : (
                    <div style={{ fontSize: '1.6rem', marginBottom: '.5rem' }}>{item.icon || '📜'}</div>
                  )}
                  {item.title && <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--navy)', fontSize: '.9rem', marginBottom: '.4rem' }}>{item.title}</div>}
                  {item.title_maithili && <div style={{ color: 'var(--gold)', fontSize: '.78rem', marginBottom: '.35rem' }}>{item.title_maithili}</div>}
                  <p className="text-sm text-muted" style={{ lineHeight: 1.7, margin: 0 }}>{item.content}</p>
                  {item.content_maithili && <p style={{ fontSize: '.8rem', color: 'var(--ink-dim)', fontStyle: 'italic', marginTop: '.5rem', marginBottom: 0 }}>{item.content_maithili}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Cultural Pillars */}
        {culture.length > 0 && (
          <>
            <div className="section-header">
              <div>
                <div className="section-eyebrow">संस्कृति एवं परंपरा</div>
                <h2 className="section-title">Cultural <span>Pillars</span></h2>
              </div>
            </div>
            <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
              {culture.map(item => (
                <div key={item.id} className="card">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title || ''} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6, marginBottom: '.75rem' }} />
                  ) : (
                    <div style={{ fontSize: '1.6rem', marginBottom: '.5rem' }}>{item.icon || '🎭'}</div>
                  )}
                  {item.title && <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--navy)', marginBottom: '.4rem', fontSize: '.9rem' }}>{item.title}</div>}
                  {item.title_maithili && <div style={{ color: 'var(--gold)', fontSize: '.78rem', marginBottom: '.35rem' }}>{item.title_maithili}</div>}
                  <p className="text-sm text-muted" style={{ lineHeight: 1.7, margin: 0 }}>{item.content}</p>
                  {item.content_maithili && <p style={{ fontSize: '.8rem', color: 'var(--ink-dim)', fontStyle: 'italic', marginTop: '.5rem', marginBottom: 0 }}>{item.content_maithili}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Global Diaspora */}
        {diaspora.map(item => (
          <div key={item.id} style={{ maxWidth: 860, margin: '0 auto 2rem' }}>
            <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '1.75rem 2rem', borderLeft: '4px solid var(--saffron)' }}>
              {item.image_url && (
                <img src={item.image_url} alt={item.title || ''} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8, marginBottom: '1rem' }} />
              )}
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '2.5rem', lineHeight: 1, flexShrink: 0 }}>{item.icon || '🌍'}</div>
                <div>
                  {item.title && (
                    <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--gold)', fontSize: '1rem', marginBottom: '.5rem' }}>{item.title}</div>
                  )}
                  <p style={{ fontSize: '.875rem', lineHeight: 1.75, color: 'rgba(255,255,255,.85)', margin: 0 }}>{item.content}</p>
                  {item.content_maithili && (
                    <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.6)', fontStyle: 'italic', marginTop: '.5rem', marginBottom: 0 }}>{item.content_maithili}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '1.75rem', background: 'var(--navy)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
          <div style={{ color: 'var(--gold)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '1rem', marginBottom: '1rem' }}>
            "Together, let's stand tall as proud Maithils."
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" className="btn btn-primary">Join MAA Today</a>
            <a href="/about" className="btn" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.25)' }}>About MAA</a>
          </div>
        </div>

      </div>
      <PublicFooter />
    </>
  );
}
