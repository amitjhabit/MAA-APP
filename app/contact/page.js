'use client';
// app/contact/page.js
import { useState } from 'react';

function Nav() {
  return (
    <nav className="pub-nav">
      <div className="pub-nav-inner">
        <a href="/" className="pub-nav-brand">
          <div className="emblem">MAA</div>
          <div className="org-name">Maithil Association of America<span>à¤®à¥ˆà¤¥à¤¿à¤² à¤à¤¸à¥‹à¤¸à¤¿à¤à¤¶à¤¨ à¤‘à¤« à¤…à¤®à¥‡à¤°à¤¿à¤•à¤¾</span></div>
        </a>
        <div className="pub-nav-links">
          {[['/', 'Home'], ['/events', 'Events'], ['/news', 'News'], ['/gallery', 'Gallery'], ['/about', 'About Us'], ['/contact', 'Contact']].map(([h, l]) => (
            <a key={h} href={h} className={`pub-nav-link${h === '/contact' ? ' active' : ''}`}>{l}</a>
          ))}
          <a href="/join" className="pub-nav-cta" style={{ marginLeft: '.5rem' }}>Join / Renew</a>
        </div>
      </div>
    </nav>
  );
}

export default function ContactPage() {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', subject: 'General Inquiry', inquiry_type: 'general', message: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErr, setServerErr] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setErrors({}); setServerErr(''); setLoading(true);
    const errs = {};
    if (!form.name.trim())    errs.name    = 'Name is required';
    if (!form.email.trim())   errs.email   = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.message.trim()) errs.message = 'Message is required';
    if (Object.keys(errs).length) { setErrors(errs); setLoading(false); return; }

    try {
      const res  = await fetch('/api/public/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) setSubmitted(true);
      else setServerErr(data.message || 'Something went wrong. Please try again.');
    } catch { setServerErr('Network error. Please try again.'); }
    setLoading(false);
  };

  return (
    <>
      <Nav />
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">à¤¸à¤‚à¤ªà¤°à¥à¤• à¤•à¤°à¥‡à¤‚</span>
          <h1>Get in <em>Touch</em></h1>
          <p className="hero-sub">We'd love to hear from you. Send us a message and we'll get back to you within 24 hours.</p>
        </div>
      </section>

      <div className="shell-sm">
        {submitted ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', borderTop: '3px solid var(--forest)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>âœ…</div>
            <h2 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '.5rem' }}>Message Sent!</h2>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>Thanks, <strong>{form.name}</strong>! We'll reply to <strong>{form.email}</strong> soon.</p>
            <button className="btn btn-ghost" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: 'General Inquiry', inquiry_type: 'general', message: '' }); }}>Send another message</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem' }}>
            {/* Contact info */}
            <div>
              <div className="card card-saffron" style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>ðŸ“</div>
                <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '.25rem' }}>Headquarters</div>
                <div className="text-sm text-muted">San Ramon, California (CA)</div>
              </div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>âœ‰ï¸</div>
                <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '.25rem' }}>Email</div>
                <a href="mailto:contributemaa@maithilusa.org" className="text-sm" style={{ color: 'var(--saffron)' }}>contributemaa@maithilusa.org</a>
              </div>
              <div className="card">
                <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>ðŸ™‹</div>
                <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '.25rem' }}>Become a Member</div>
                <div className="text-sm text-muted" style={{ marginBottom: '.5rem' }}>Join the MAA family today.</div>
                <a href="/join" className="btn btn-primary btn-sm">Join / Renew â†’</a>
              </div>
            </div>

            {/* Form */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '1.5rem' }}>Send us a Message</h3>
              {serverErr && <div style={{ background: 'var(--crimson-light)', borderRadius: 'var(--radius)', padding: '.75rem', marginBottom: '1rem', color: 'var(--crimson)', fontSize: '.83rem' }}>{serverErr}</div>}
              <form onSubmit={submit}>
                <div className="form-grid">
                  <div className="form-group"><label>Full Name <span className="req">*</span></label><input value={form.name} onChange={set('name')} placeholder="Your name" />{errors.name && <span className="field-error">{errors.name}</span>}</div>
                  <div className="form-group"><label>Email <span className="req">*</span></label><input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />{errors.email && <span className="field-error">{errors.email}</span>}</div>
                  <div className="form-group"><label>Phone</label><input type="tel" value={form.phone} onChange={set('phone')} placeholder="555-0100" /></div>
                  <div className="form-group"><label>Inquiry Type</label>
                    <select value={form.inquiry_type} onChange={set('inquiry_type')}>
                      <option value="general">General Inquiry</option>
                      <option value="membership">Membership</option>
                      <option value="event">Event</option>
                      <option value="donation">Donation</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group span-2"><label>Subject</label><input value={form.subject} onChange={set('subject')} /></div>
                  <div className="form-group span-2"><label>Message <span className="req">*</span></label><textarea value={form.message} onChange={set('message')} rows={5} placeholder="How can we help?" />{errors.message && <span className="field-error">{errors.message}</span>}</div>
                </div>
                <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '.5rem' }} disabled={loading}>
                  {loading ? <><span className="spinner" />Sendingâ€¦</> : 'Send Message â†’'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <footer className="pub-footer">
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem' }}>
          Â© {new Date().getFullYear()} Maithil Association of America Â· <a href="/admin" style={{ color: 'var(--gold)' }}>Admin</a>
        </div>
      </footer>
    </>
  );
}

