'use client';
import { useState } from 'react';

function InquiryModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', inquiry_type: 'general', subject: 'General Inquiry', message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) { setError('Name, email, and message are required.'); return; }
    setError(''); setLoading(true);
    try {
      const res  = await fetch('/api/public/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) setDone(true);
      else setError(data.message || 'Something went wrong.');
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ fontFamily: 'var(--serif)', color: 'var(--navy)', marginBottom: '.5rem' }}>Message Sent!</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Thank you, <strong>{form.name}</strong>! We'll reply to <strong>{form.email}</strong> soon.</p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h3 className="modal-title">✉️ Send us a Message</h3>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
            </div>
            <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>Have a question? We'd love to hear from you. Send us a message and we'll respond within 24 hours.</p>
            {error && <div style={{ background: 'var(--crimson-light)', borderRadius: 'var(--radius)', padding: '.7rem', marginBottom: '1rem', color: 'var(--crimson)', fontSize: '.83rem' }}>{error}</div>}
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group"><label>Your Name <span className="req">*</span></label><input value={form.name} onChange={set('name')} placeholder="Full name" /></div>
                <div className="form-group"><label>Email <span className="req">*</span></label><input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" /></div>
                <div className="form-group"><label>Phone</label><input type="tel" value={form.phone} onChange={set('phone')} placeholder="555-0100" /></div>
                <div className="form-group"><label>Inquiry Type</label>
                  <select value={form.inquiry_type} onChange={set('inquiry_type')}>
                    <option value="general">General Inquiry</option>
                    <option value="membership">Membership</option>
                    <option value="event">Events</option>
                    <option value="donation">Donation</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group span-2"><label>Subject</label><input value={form.subject} onChange={set('subject')} /></div>
                <div className="form-group span-2"><label>Message <span className="req">*</span></label><textarea value={form.message} onChange={set('message')} rows={4} placeholder="How can we help you?" /></div>
              </div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <><span className="spinner" />Sending…</> : 'Send Message →'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function InquiryWidget() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: 56, height: 56, borderRadius: '50%', background: 'var(--saffron)', color: '#fff', border: '3px solid var(--gold)', fontSize: '1.4rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(232,114,12,.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--trans)' }}
        title="Send us an inquiry"
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >✉️</button>
      {open && <InquiryModal onClose={() => setOpen(false)} />}
    </>
  );
}
