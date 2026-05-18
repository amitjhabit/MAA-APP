'use client';
// app/join/page.js
import { useState } from 'react';
import PublicNav from '@/app/components/PublicNav';
import PublicFooter from '@/app/components/PublicFooter';

const ZELLE_EMAIL = process.env.NEXT_PUBLIC_ZELLE_EMAIL || 'maithilformithila@gmail.com';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ZELLE_EMAIL)}&margin=10&color=000000&bgcolor=ffffff&format=png&ecc=M`;

const ANNUAL_FEE = 21;

export default function JoinPage() {
  const [form, setForm]       = useState({ first_name: '', last_name: '', email: '', phone: '', city: '', state: '', membership_type: 'individual', membership_plan: 'annual', maithili_name: '', village_district: '', occupation: '', notes: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErr, setServerErr] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setErrors({}); setServerErr(''); setLoading(true);
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Required';
    if (!form.last_name.trim())  errs.last_name  = 'Required';
    if (!form.email.trim())      errs.email      = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (Object.keys(errs).length) { setErrors(errs); setLoading(false); return; }

    try {
      const res  = await fetch('/api/public/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, membership_status: 'pending', amount_paid: 0, notes: `Online application. ${form.notes}` }) });
      const data = await res.json();
      if (data.success) setSubmitted(true);
      else if (data.errors) setErrors(data.errors);
      else setServerErr(data.message || 'Something went wrong.');
    } catch { setServerErr('Network error. Please try again.'); }
    setLoading(false);
  };

  return (
    <>
      <PublicNav active="/join" />
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">सदस्य बनें</span>
          <h1>Join <em>MAA</em></h1>
          <p className="hero-sub">Become part of the Maithili community in America. Submit your application below.</p>
        </div>
      </section>

      <div className="shell-sm">
        {submitted ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', borderTop: '3px solid var(--forest)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '.75rem' }}>Application Received!</h2>
            <p className="text-muted" style={{ marginBottom: '.5rem' }}>Thank you, <strong>{form.first_name} {form.last_name}</strong>!</p>
            <p className="text-muted" style={{ marginBottom: '.5rem' }}>Your membership application has been submitted. Our team will contact you at <strong>{form.email}</strong> with payment instructions.</p>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>Membership Fee: <strong style={{ color: 'var(--saffron)' }}>${ANNUAL_FEE}/year</strong> — payable via Zelle or check.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/donate" className="btn btn-gold">Make a Donation</a>
              <a href="/" className="btn btn-ghost">Back to Home</a>
            </div>
          </div>
        ) : (
          <>
            {/* Membership Plan Banner */}
            <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '1.75rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderTop: '4px solid var(--saffron)' }}>
              <div>
                <div style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.25rem' }}>Membership Plan</div>
                <div style={{ color: '#fff', fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700 }}>Annual Membership</div>
                <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '.875rem', marginTop: '.25rem' }}>Full access to all MAA events, programs &amp; community benefits</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--gold)', fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>${ANNUAL_FEE}</div>
                <div style={{ color: 'rgba(255,255,255,.55)', fontSize: '.8rem' }}>per year</div>
              </div>
            </div>

            {/* Form */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '1.5rem' }}>Your Information</h3>
              {serverErr && <div style={{ background: 'var(--crimson-light)', borderRadius: 'var(--radius)', padding: '.75rem', marginBottom: '1rem', color: 'var(--crimson)', fontSize: '.83rem' }}>{serverErr}</div>}
              <form onSubmit={submit}>
                <div className="form-grid">
                  <div className="form-group"><label>First Name <span className="req">*</span></label><input value={form.first_name} onChange={set('first_name')} />{errors.first_name && <span className="field-error">{errors.first_name}</span>}</div>
                  <div className="form-group"><label>Last Name <span className="req">*</span></label><input value={form.last_name} onChange={set('last_name')} />{errors.last_name && <span className="field-error">{errors.last_name}</span>}</div>
                  <div className="form-group"><label>Maithili Name (मैथिली नाम)</label><input value={form.maithili_name} onChange={set('maithili_name')} placeholder="राजेश झा" /></div>
                  <div className="form-group"><label>Email <span className="req">*</span></label><input type="email" value={form.email} onChange={set('email')} />{errors.email && <span className="field-error">{errors.email}</span>}</div>
                  <div className="form-group"><label>Phone</label><input type="tel" value={form.phone} onChange={set('phone')} /></div>
                  <div className="form-group"><label>Occupation</label><input value={form.occupation} onChange={set('occupation')} /></div>
                  <div className="form-group"><label>City</label><input value={form.city} onChange={set('city')} /></div>
                  <div className="form-group"><label>State</label><input value={form.state} onChange={set('state')} /></div>
                  <div className="form-group span-2"><label>Village / District (गाम / जिला)</label><input value={form.village_district} onChange={set('village_district')} placeholder="Darbhanga, Bihar" /></div>
                  <div className="form-group span-2"><label>Additional Notes</label><textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Anything you'd like us to know?" /></div>
                </div>

                <div style={{ background: 'var(--saffron-light)', border: '1px solid rgba(232,114,12,.25)', borderRadius: 'var(--radius)', padding: '.85rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-sm" style={{ color: 'var(--ink)' }}>Annual Membership Fee</span>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--saffron)' }}>${ANNUAL_FEE}/year</span>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? <><span className="spinner" />Submitting…</> : 'Submit Application →'}
                </button>
              </form>
            </div>

            {/* Zelle QR card */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1rem', paddingBottom: '2rem' }}>
              <p style={{ color: 'var(--ink-soft)', fontSize: '.9rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                Pay your membership fee via Zelle — scan the QR code in your banking app.
              </p>
              <div style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '1.5rem 2rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                width: 280,
              }}>
                <p style={{ color: '#6d4aff', fontSize: '.85rem', fontWeight: 500, margin: 0 }}>Send Money with Zelle®</p>
                <p style={{ color: '#aaa', fontSize: '.78rem', margin: 0 }}>Scan in your banking app to pay.</p>
                <div style={{ width: '100%', height: 1, background: '#f0f0f0', margin: '0.2rem 0' }} />
                <p style={{ fontWeight: 700, fontSize: '.9rem', color: '#222', margin: 0, textAlign: 'center' }}>Maithil Association Of America</p>
                <p style={{ color: '#666', fontSize: '.78rem', margin: 0 }}>{ZELLE_EMAIL}</p>
                <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 6, marginTop: 4 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={QR_URL} alt="Zelle QR Code" width={180} height={180} />
                </div>
                <div style={{ width: '100%', height: 1, background: '#f0f0f0', margin: '0.2rem 0' }} />
                <p style={{ color: '#6d4aff', fontWeight: 800, fontSize: '1.3rem', fontStyle: 'italic', margin: 0 }}>
                  Zelle<sup style={{ fontSize: '.55rem', fontWeight: 600 }}>®</sup>
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <PublicFooter />
    </>
  );
}
