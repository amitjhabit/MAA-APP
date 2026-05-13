'use client';
// app/components/HomeClient.js — interactive homepage shell
import { useState, useEffect } from 'react';
import PublicNav from '@/app/components/PublicNav';

// Handles Date objects (from RSC props), ISO strings, and bare YYYY-MM-DD strings
function localDate(val) {
  if (!val) return new Date(NaN);
  if (val instanceof Date) return new Date(val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate());
  const m = String(val).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return new Date(NaN);
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

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

function Footer() {
  return (
    <footer className="pub-footer">
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div><div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '.5rem' }}>मैथिल एसोसिएशन</div><div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.7 }}>Preserving and promoting Maithili language, culture, and heritage across America since 2024.</div></div>
        <div><div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.75rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Quick Links</div>{[['Events','/events'],['News','/news'],['Gallery','/gallery'],['Donate','/donate'],['Contact','/contact']].map(([l,h])=><div key={l} style={{marginBottom:'.35rem'}}><a href={h} style={{color:'rgba(255,255,255,.7)',fontSize:'.875rem'}}>{l}</a></div>)}</div>
        <div><div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.75rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Contact</div><div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.8 }}>contributemaa@maithilusa.org</div></div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem' }}>
        © {new Date().getFullYear()} Maithil Association of America · <a href="/admin" style={{ color: 'var(--gold)', marginLeft: '.5rem' }}>Admin</a>
      </div>
    </footer>
  );
}

const CAT_BADGE = { cultural:{bg:'var(--saffron-light)',color:'var(--saffron-dark)'}, religious:{bg:'var(--crimson-light)',color:'var(--crimson)'}, social:{bg:'var(--forest-light)',color:'var(--forest)'}, educational:{bg:'#E3F2FD',color:'#0D47A1'}, fundraiser:{bg:'var(--gold-light)',color:'var(--gold)'}, other:{bg:'var(--paper-3)',color:'var(--ink-soft)'} };
const STA_BADGE = { upcoming:{bg:'#E3F2FD',color:'#0D47A1'}, ongoing:{bg:'var(--forest-light)',color:'var(--forest)'}, completed:{bg:'var(--paper-3)',color:'var(--ink-soft)'} };

export default function HomeClient({ events: initialEvents, news: initialNews, stats: initialStats }) {
  const [events,      setEvents]      = useState(initialEvents  || []);
  const [news,        setNews]        = useState(initialNews    || []);
  const [showInquiry, setShowInquiry] = useState(false);

  // Always refetch from API on mount — bypasses Next.js router cache
  useEffect(() => {
    fetch('/api/public/events?limit=6', { cache: 'no-store' })
      .then(r => r.json()).then(d => { if (d.success && d.data?.length) setEvents(d.data); }).catch(() => {});
    fetch('/api/public/news?limit=3', { cache: 'no-store' })
      .then(r => r.json()).then(d => { if (d.success && d.data?.length) setNews(d.data); }).catch(() => {});
  }, []);

  return (
    <>
      <PublicNav active="/" onInquiry={() => setShowInquiry(true)} />

      {/* Hero */}
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">Est. 2004 · Connecting Communities</span>
          <h1>Celebrating <em>Maithili</em><br />Culture &amp; Heritage</h1>
          <span className="hero-maithili">मैथिली संस्कृति आ विरासतक उत्सव</span>
          <p className="hero-sub">Uniting the Maithili-speaking community across America — preserving our language, traditions, and cultural identity for future generations.</p>
          <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" className="btn btn-primary" style={{ fontSize: '.72rem', padding: '.3rem .85rem' }}>Become a Member</a>
            <a href="/events" className="btn" style={{ fontSize: '.72rem', padding: '.3rem .85rem', background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>View Events</a>
            <button onClick={() => setShowInquiry(true)} className="btn" style={{ fontSize: '.72rem', padding: '.3rem .85rem', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.9)', borderColor: 'rgba(255,255,255,.25)' }}>✉️ Inquiry</button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)' }}>
          {[
            { num: `${stats.members}+`, label: 'Members',          sub: 'सदस्य' },
            { num: `${stats.events}+`,  label: 'Events Organized', sub: 'कार्यक्रम' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '.75rem' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--saffron)', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontWeight: 600, color: 'var(--navy)', marginTop: '.2rem', fontSize: '.82rem' }}>{s.label}</div>
              <div style={{ fontSize: '.7rem', color: 'var(--gold)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Events */}
      <section className="shell">
        <div className="section-header">
          <div><div className="section-eyebrow">आगामी कार्यक्रम</div><h2 className="section-title">Our <span>Events</span></h2></div>
          <a href="/events" className="btn btn-ghost btn-sm">View All →</a>
        </div>
        {events.length === 0 ? (
          <div className="empty-state"><div className="icon">📅</div><p style={{ marginBottom: '.75rem' }}>No events yet.</p><a href="/admin/events" className="btn btn-primary btn-sm">Add Events in Admin →</a></div>
        ) : (
          <div className="grid-2">
            {events.map(ev => {
              const d   = localDate(ev.event_date);
              const cat = CAT_BADGE[ev.category] || CAT_BADGE.other;
              const sta = STA_BADGE[ev.status]   || STA_BADGE.upcoming;
              return (
                <div key={ev.id} className="card card-saffron card-static" style={{ opacity: ev.status === 'completed' ? .82 : 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {ev.cover_image && (
                    <img src={ev.cover_image} alt={ev.title} style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 260 }}
                      onError={e => { e.currentTarget.style.display='none'; }} />
                  )}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem' }}>
                    <div style={{ background: ev.status === 'completed' ? 'var(--ink-soft)' : 'var(--saffron)', color: '#fff', borderRadius: 'var(--radius)', padding: '.5rem .75rem', textAlign: 'center', minWidth: 54, flexShrink: 0 }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{d.getDate()}</div>
                      <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.07em', opacity: .9 }}>{d.toLocaleString('default',{month:'short'})}</div>
                      <div style={{ fontSize: '.65rem', opacity: .8 }}>{d.getFullYear()}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.35rem' }}>
                        <span className="badge" style={{ background: cat.bg, color: cat.color }}>{ev.category}</span>
                        <span className="badge" style={{ background: sta.bg, color: sta.color }}>{ev.status}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: '1.05rem', color: 'var(--navy)', lineHeight: 1.3, marginBottom: '.2rem' }}>{ev.title}</div>
                      {ev.title_maithili && <div className="maithili" style={{ fontSize: '.85rem', marginBottom: '.3rem' }}>{ev.title_maithili}</div>}
                      <div className="text-sm text-muted">{ev.event_time && `🕐 ${ev.event_time} · `}{ev.is_online ? '💻 Online' : `📍 ${[ev.location,ev.city,ev.state].filter(Boolean).join(', ')}`}</div>
                      {ev.description && <div className="text-sm text-muted" style={{ marginTop: '.2rem', whiteSpace: 'pre-wrap' }}>{ev.description}</div>}
                      {ev.status === 'upcoming' && (
                        <div style={{ marginTop: '.65rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                          {ev.meeting_link && <a href={ev.meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Join Online →</a>}
                          <a href={`/contact?event=${ev.id}`} className="btn btn-primary btn-sm">RSVP / Register →</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="cultural-divider">✦ ✦ ✦</div>

      {/* News */}
      <section className="shell" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <div><div className="section-eyebrow">समाचार आ घोषणा</div><h2 className="section-title">News &amp; <span>Announcements</span></h2></div>
          <a href="/news" className="btn btn-ghost btn-sm">View All →</a>
        </div>
        {news.length === 0 ? (
          <div className="empty-state"><div className="icon">📰</div><p style={{ marginBottom: '.75rem' }}>No news yet.</p><a href="/admin/news" className="btn btn-primary btn-sm">Add News in Admin →</a></div>
        ) : (
          <div className="grid-3">
            {news.map(n => {
              const catColors = { general:{bg:'var(--paper-3)',color:'var(--ink-soft)'}, cultural:{bg:'var(--saffron-light)',color:'var(--saffron-dark)'}, event:{bg:'#E3F2FD',color:'#0D47A1'}, announcement:{bg:'var(--gold-light)',color:'var(--gold)'}, newsletter:{bg:'var(--forest-light)',color:'var(--forest)'} };
              const cat = catColors[n.category] || catColors.general;
              return (
                <div key={n.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  <span className="badge" style={{ background: cat.bg, color: cat.color, alignSelf: 'flex-start' }}>{n.category}</span>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: '1.05rem', color: 'var(--navy)', lineHeight: 1.3 }}>{n.title}</div>
                  {n.title_maithili && <div className="maithili" style={{ fontSize: '.82rem' }}>{n.title_maithili}</div>}
                  <div className="text-sm text-muted" style={{ lineHeight: 1.6, flex: 1 }}>{(n.excerpt||n.content||'').slice(0,130)}{(n.excerpt||n.content||'').length>130?'…':''}</div>
                  <div className="text-xs text-muted" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '.5rem' }}>
                    <span>{n.author||'MAA Team'}</span>
                    <span>{n.published_at?localDate(n.published_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Inquiry CTA strip */}
      <section style={{ background: 'var(--paper-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.25rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '.35rem' }}>✉️ Have a Question?</h3>
          <p className="text-muted" style={{ marginBottom: '.85rem', fontSize: '.82rem' }}>We'd love to hear from you — whether it's about membership, events, or just to say hello.</p>
          <button onClick={() => setShowInquiry(true)} className="btn btn-primary btn-sm">Send an Inquiry →</button>
        </div>
      </section>

      {/* Join CTA */}
      <section style={{ background: 'var(--navy)', padding: '2rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="section-eyebrow" style={{ color: 'var(--gold)' }}>सदस्य बनें</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', color: '#fff', margin: '.4rem 0' }}>Join the MAA Family Today</h2>
          <p style={{ color: 'rgba(255,255,255,.7)', marginBottom: '1.25rem', fontSize: '.82rem' }}>Annual Membership · <strong style={{ color: 'var(--gold)' }}>$21/year</strong></p>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" className="btn btn-primary">Join Now</a>
            <a href="/donate" className="btn btn-gold">Donate</a>
          </div>
        </div>
      </section>

      {/* Floating inquiry button */}
      <button
        onClick={() => setShowInquiry(true)}
        style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: 56, height: 56, borderRadius: '50%', background: 'var(--saffron)', color: '#fff', border: '3px solid var(--gold)', fontSize: '1.4rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(232,114,12,.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--trans)' }}
        title="Send us an inquiry"
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
      >✉️</button>

      <Footer />

      {showInquiry && <InquiryModal onClose={() => setShowInquiry(false)} />}
    </>
  );
}
