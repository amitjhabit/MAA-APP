'use client';
// app/donate/page.js
import { useState } from 'react';
import PublicNav from '@/app/components/PublicNav';
import PublicFooter from '@/app/components/PublicFooter';

const AMOUNTS = [25, 50, 100, 250, 500, 1000];

export default function DonatePage() {
  const [amount, setAmount]   = useState('');
  const [custom, setCustom]   = useState('');
  const [method, setMethod]   = useState('zelle');
  const [form, setForm]       = useState({ name: '', email: '', phone: '', purpose: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErr, setServerErr] = useState('');

  const finalAmount = amount || custom;
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!finalAmount || parseFloat(finalAmount) <= 0) { setServerErr('Please enter a donation amount.'); return; }
    if (!form.name.trim() || !form.email.trim()) { setServerErr('Name and email are required.'); return; }
    setServerErr(''); setLoading(true);
    try {
      const res  = await fetch('/api/public/donate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: parseFloat(finalAmount), payment_method: method, status: 'pending' }) });
      const data = await res.json();
      if (data.success) setSubmitted(true);
      else setServerErr(data.message || 'Something went wrong.');
    } catch { setServerErr('Network error. Please try again.'); }
    setLoading(false);
  };

  return (
    <>
      <PublicNav active="/donate" />
      <section className="hero" style={{ padding: '3.5rem 2rem 3rem' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">दान करें</span>
          <h1>Support <em>MAA</em></h1>
          <p className="hero-sub">Your donation helps us preserve Maithili culture, organize events, and support our community.</p>
        </div>
      </section>

      <div className="shell-sm">
        {submitted ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', borderTop: '3px solid var(--forest)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🙏</div>
            <h2 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '.75rem' }}>Thank You!</h2>
            <p className="text-muted" style={{ marginBottom: '.5rem' }}>Your donation of <strong style={{ color: 'var(--saffron)' }}>${finalAmount}</strong> has been recorded.</p>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>
              {method === 'zelle' && <>Please send <strong>${finalAmount}</strong> via Zelle to <strong style={{ color: 'var(--saffron)' }}>{process.env.NEXT_PUBLIC_ZELLE_EMAIL || 'contributemaa@maithilusa.org'}</strong></>}
              {method === 'check' && <>Please mail a check for <strong>${finalAmount}</strong> payable to Maithil Association of America.</>}
            </p>
            <a href="/" className="btn btn-ghost">Back to Home</a>
          </div>
        ) : (
          <div className="card">
            <h3 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '1.5rem' }}>Make a Donation</h3>
            {serverErr && <div style={{ background: 'var(--crimson-light)', borderRadius: 'var(--radius)', padding: '.75rem', marginBottom: '1rem', color: 'var(--crimson)', fontSize: '.83rem' }}>{serverErr}</div>}

            {/* Amount */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '.6rem' }}>Donation Amount</label>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
                {AMOUNTS.map(a => (
                  <button key={a} type="button" onClick={() => { setAmount(String(a)); setCustom(''); }}
                    className={`filter-btn${amount === String(a) && !custom ? ' active' : ''}`}>${a}</button>
                ))}
              </div>
              <input type="number" value={custom} onChange={e => { setCustom(e.target.value); setAmount(''); }} placeholder="Enter custom amount ($)" min="1" />
            </div>

            {/* Payment method */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '.6rem' }}>Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                {[['zelle', '💸 Zelle', 'Instant bank transfer'], ['check', '📝 Check', 'Mail a check to MAA']].map(([v, l, sub]) => (
                  <div key={v} onClick={() => setMethod(v)}
                    style={{ border: `2px solid ${method === v ? 'var(--saffron)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '.85rem', cursor: 'pointer', background: method === v ? 'var(--saffron-light)' : 'var(--white)', transition: 'var(--trans)' }}>
                    <div style={{ fontWeight: 600 }}>{l}</div>
                    <div className="text-xs text-muted">{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Zelle info */}
            {method === 'zelle' && (
              <div style={{ background: 'var(--gold-light)', border: '1px solid rgba(201,150,12,.3)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '.35rem' }}>💸 Zelle Instructions</div>
                <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>After submitting, send your donation via Zelle to:</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--saffron)', marginTop: '.35rem' }}>
                  {process.env.NEXT_PUBLIC_ZELLE_EMAIL || 'contributemaa@maithilusa.org'}
                </div>
                {process.env.NEXT_PUBLIC_ZELLE_PHONE && (
                  <div style={{ color: 'var(--saffron)', fontWeight: 600 }}>{process.env.NEXT_PUBLIC_ZELLE_PHONE}</div>
                )}
                <div className="text-xs text-muted" style={{ marginTop: '.35rem' }}>Include your name and "MAA Donation" in the note.</div>
              </div>
            )}

            {/* Donor info */}
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group"><label>Full Name <span className="req">*</span></label><input value={form.name} onChange={set('name')} /></div>
                <div className="form-group"><label>Email <span className="req">*</span></label><input type="email" value={form.email} onChange={set('email')} /></div>
                <div className="form-group"><label>Phone</label><input type="tel" value={form.phone} onChange={set('phone')} /></div>
                <div className="form-group"><label>Purpose / Campaign</label>
                  <select value={form.purpose} onChange={set('purpose')}>
                    <option value="">General Fund</option>
                    <option value="events">Events & Festivals</option>
                    <option value="education">Education & Language</option>
                    <option value="cultural">Cultural Programs</option>
                    <option value="youth">Youth Programs</option>
                  </select>
                </div>
                <div className="form-group span-2"><label>Message (optional)</label><textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Any message for MAA…" /></div>
              </div>
              {finalAmount && <div style={{ background: 'var(--saffron-light)', border: '1px solid rgba(232,114,12,.2)', borderRadius: 'var(--radius)', padding: '.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-sm">Donation amount</span>
                <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--saffron)', fontSize: '1.1rem' }}>${finalAmount}</span>
              </div>}
              <button type="submit" className="btn btn-gold w-full" disabled={loading}>
                {loading ? <><span className="spinner" />Processing…</> : `Donate $${finalAmount || '...'} →`}
              </button>
            </form>
          </div>
        )}
      </div>

      <PublicFooter />
    </>
  );
}
