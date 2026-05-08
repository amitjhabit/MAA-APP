'use client';
// app/join/page.js
import { useState } from 'react';

function Nav() {
  return (
    <nav className="pub-nav">
      <div className="pub-nav-inner">
        <a href="/" className="pub-nav-brand">
          <div className="emblem">MAA</div>
          <div className="org-name">Maithil Association of America<span>मैथिल एसोसिएशन ऑफ अमेरिका</span></div>
        </a>
        <div className="pub-nav-links">
          {[['/', 'Home'], ['/events', 'Events'], ['/news', 'News'], ['/gallery', 'Gallery'], ['/about', 'About Us'], ['/contact', 'Contact']].map(([h, l]) => (
            <a key={h} href={h} className="pub-nav-link">{l}</a>
          ))}
          <a href="/join" className="pub-nav-cta" style={{ marginLeft: '.5rem', background: 'rgba(255,255,255,.2)' }}>Join / Renew</a>
        </div>
      </div>
    </nav>
  );
}

const TIERS = [
  { type: 'student',   label: 'Student',           annual: 25,   lifetime: 200,  desc: 'Full-time students with valid student ID', color: 'var(--forest)' },
  { type: 'individual',label: 'Individual',         annual: 50,   lifetime: 500,  desc: 'Individual adult members',                 color: 'var(--saffron)' },
  { type: 'honorary',  label: 'Honorary',           annual: 0,    lifetime: 0,    desc: 'By invitation from the board only',        color: 'var(--gold)' },
  { type: 'corporate', label: 'Corporate / Sponsor',annual: 500,  lifetime: null, desc: 'Businesses and organizational sponsors',   color: '#0D47A1' },
];

export default function JoinPage() {
  const [form, setForm]       = useState({ first_name: '', last_name: '', email: '', phone: '', city: '', state: '', membership_type: 'individual', membership_plan: 'annual', maithili_name: '', village_district: '', occupation: '', notes: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErr, setServerErr] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const selectedTier = TIERS.find(t => t.type === form.membership_type);
  const fee = form.membership_plan === 'lifetime' ? selectedTier?.lifetime : selectedTier?.annual;

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
      <Nav />
      <section className="hero" style={{ padding: '3.5rem 2rem 3rem' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">सदस्य बनें</span>
          <h1>Join <em>MAA</em></h1>
          <p className="hero-sub">Become part of the Maithili community in America. Choose your membership tier and submit your application.</p>
        </div>
      </section>

      <div className="shell-sm">
        {submitted ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', borderTop: '3px solid var(--forest)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '.75rem' }}>Application Received!</h2>
            <p className="text-muted" style={{ marginBottom: '.5rem' }}>Thank you, <strong>{form.first_name} {form.last_name}</strong>!</p>
            <p className="text-muted" style={{ marginBottom: '.5rem' }}>Your membership application has been submitted. Our team will contact you at <strong>{form.email}</strong> with payment instructions.</p>
            {fee > 0 && <p className="text-muted" style={{ marginBottom: '2rem' }}>Fee: <strong style={{ color: 'var(--saffron)' }}>${fee}</strong> — payable via Zelle or check.</p>}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/donate" className="btn btn-gold">Make a Donation</a>
              <a href="/" className="btn btn-ghost">Back to Home</a>
            </div>
          </div>
        ) : (
          <>
            {/* Tier selector */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '1rem' }}>1. Choose Membership Tier</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '.75rem' }}>
                {TIERS.map(t => (
                  <div key={t.type} onClick={() => setForm(p => ({ ...p, membership_type: t.type }))}
                    style={{ border: `2px solid ${form.membership_type === t.type ? t.color : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '1rem', cursor: 'pointer', background: form.membership_type === t.type ? `${t.color}11` : 'var(--white)', transition: 'var(--trans)' }}>
                    <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)', marginBottom: '.25rem' }}>{t.label}</div>
                    <div className="text-xs text-muted" style={{ marginBottom: '.5rem' }}>{t.desc}</div>
                    <div style={{ color: t.color, fontWeight: 700 }}>${t.annual}/yr</div>
                    {t.lifetime && <div className="text-xs text-muted">${t.lifetime} lifetime</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Plan */}
            {form.membership_type !== 'honorary' && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '1rem' }}>2. Choose Plan</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['annual', 'lifetime'].map(p => (
                    <div key={p} onClick={() => setForm(f => ({ ...f, membership_plan: p }))}
                      style={{ flex: 1, border: `2px solid ${form.membership_plan === p ? 'var(--saffron)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '1rem', cursor: 'pointer', background: form.membership_plan === p ? 'var(--saffron-light)' : 'var(--white)', textAlign: 'center', transition: 'var(--trans)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--navy)', textTransform: 'capitalize' }}>{p}</div>
                      <div style={{ color: 'var(--saffron)', fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700 }}>
                        {p === 'annual' ? `$${selectedTier?.annual}` : (selectedTier?.lifetime ? `$${selectedTier?.lifetime}` : 'N/A')}
                      </div>
                      {p === 'annual' && <div className="text-xs text-muted">per year</div>}
                      {p === 'lifetime' && <div className="text-xs text-muted">one-time</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '1.5rem' }}>3. Your Information</h3>
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
                {fee !== null && fee >= 0 && (
                  <div style={{ background: 'var(--saffron-light)', border: '1px solid rgba(232,114,12,.25)', borderRadius: 'var(--radius)', padding: '.85rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-sm" style={{ color: 'var(--ink)' }}>Membership fee ({form.membership_plan})</span>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--saffron)' }}>{fee === 0 ? 'Free' : `$${fee}`}</span>
                  </div>
                )}
                <p className="text-xs text-muted" style={{ marginBottom: '1rem' }}>Payment via Zelle or check — instructions will be sent to your email after approval.</p>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? <><span className="spinner" />Submitting…</> : 'Submit Application →'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <footer className="pub-footer">
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem' }}>
          © {new Date().getFullYear()} Maithil Association of America · <a href="/admin" style={{ color: 'var(--gold)' }}>Admin</a>
        </div>
      </footer>
    </>
  );
}
