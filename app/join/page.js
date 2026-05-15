'use client';
// app/join/page.js
import { useState } from 'react';
import PublicNav from '@/app/components/PublicNav';
import PublicFooter from '@/app/components/PublicFooter';

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

                <p className="text-xs text-muted" style={{ marginBottom: '1rem' }}>Payment via Zelle or check — instructions will be sent to your email after approval.</p>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? <><span className="spinner" />Submitting…</> : 'Submit Application →'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <PublicFooter />
    </>
  );
}
