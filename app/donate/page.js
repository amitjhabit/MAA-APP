'use client';
// app/donate/page.js
import PublicNav from '@/app/components/PublicNav';
import PublicFooter from '@/app/components/PublicFooter';

const ZELLE_EMAIL = process.env.NEXT_PUBLIC_ZELLE_EMAIL || 'maithilformithila@gmail.com';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(ZELLE_EMAIL)}&margin=10&color=000000&bgcolor=ffffff&format=png&ecc=M`;

export default function DonatePage() {
  return (
    <>
      <PublicNav active="/donate" />
      <section className="hero" style={{ padding: '3.5rem 2rem 3rem' }}>
        <div className="hero-inner">
          <span className="hero-eyebrow">दान करें</span>
          <h1>Support <em>MAA</em></h1>
          <p className="hero-sub">Your donation helps us preserve Maithili culture, organize events, and support our community.</p>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.82rem', marginTop: '.5rem' }}>MAA is a 501(c)(3) non-profit organization · EIN: 99-1915636</p>
        </div>
      </section>

      <div className="shell-sm" style={{ paddingBottom: '3rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>

          <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', textAlign: 'center', marginBottom: '0.5rem' }}>
            You can donate via Zelle: <strong style={{ color: 'var(--navy)' }}>{ZELLE_EMAIL}</strong> or scan the QR Code below in your banking app.
          </p>

          {/* Zelle QR card */}
          <div style={{
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '1.75rem 2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            width: 300,
          }}>
            <p style={{ color: '#6d4aff', fontSize: '.85rem', fontWeight: 500, margin: 0 }}>Send Money with Zelle®</p>
            <p style={{ color: '#aaa', fontSize: '.78rem', margin: 0 }}>Scan in your banking app to pay.</p>

            <div style={{ width: '100%', height: 1, background: '#f0f0f0', margin: '0.25rem 0' }} />

            <p style={{ fontWeight: 700, fontSize: '.95rem', color: '#222', margin: 0, textAlign: 'center', lineHeight: 1.3 }}>
              Maithil Association Of America
            </p>
            <p style={{ color: '#666', fontSize: '.8rem', margin: 0 }}>{ZELLE_EMAIL}</p>

            <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginTop: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={QR_URL} alt="Zelle QR Code" width={200} height={200} />
            </div>

            <div style={{ width: '100%', height: 1, background: '#f0f0f0', margin: '0.25rem 0' }} />

            <p style={{ color: '#6d4aff', fontWeight: 800, fontSize: '1.4rem', fontStyle: 'italic', margin: 0, letterSpacing: '-0.5px' }}>
              Zelle<sup style={{ fontSize: '.55rem', fontWeight: 600 }}>®</sup>
            </p>
          </div>

        </div>
      </div>

      <PublicFooter />
    </>
  );
}
