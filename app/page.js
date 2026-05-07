'use client';
import { useState, useEffect } from 'react';

function Nav() {
  return (
    <nav className="pub-nav">
      <div className="pub-nav-inner">
        <a href="/" className="pub-nav-brand">
          <div className="emblem">MAA</div>
          <div className="org-name">Maithil Association of America<span>मैथिल एसोसिएशन ऑफ अमेरिका</span></div>
        </a>
        <div className="pub-nav-links">
          {[['/', 'Home'], ['/events', 'Events'], ['/news', 'News'], ['/gallery', 'Gallery'], ['/contact', 'Contact']].map(([h,l]) => (
            <a key={h} href={h} className="pub-nav-link">{l}</a>
          ))}
          <a href="/join" className="pub-nav-cta" style={{ marginLeft: '.5rem' }}>Join / Renew</a>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="pub-footer">
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div><div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '.5rem' }}>मैथिल एसोसिएशन</div><div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.7 }}>Preserving and promoting Maithili language, culture, and heritage across America since 2000.</div></div>
        <div><div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.75rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Quick Links</div>{[['Events','#'],['News','#'],['Donate','#'],['Volunteer','#'],['Contact','#']].map(([l,h])=><div key={l} style={{marginBottom:'.35rem'}}><a href={h} style={{color:'rgba(255,255,255,.7)',fontSize:'.875rem'}}>{l}</a></div>)}</div>
        <div><div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.75rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Contact</div><div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.8 }}>info@maa-america.org<br />Edison, NJ (Headquarters)</div></div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem' }}>
        © {new Date().getFullYear()} Maithil Association of America · <a href="/admin" style={{ color: 'var(--gold)' }}>Admin</a>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [news,   setNews]   = useState([]);
  const [stats,  setStats]  = useState({ members: 0, events: 0, news: 0 });

  useEffect(() => {
    fetch('/api/public/events?limit=3').then(r=>r.json()).then(d=>{ if(d.success) setEvents(d.data); });
    fetch('/api/public/news?limit=3').then(r=>r.json()).then(d=>{ if(d.success) setNews(d.data); });
    fetch('/api/public/stats').then(r=>r.json()).then(d=>{ if(d.success) setStats(d.data); });
  }, []);

  return (
    <>
      <Nav />
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">Est. 2000 · Connecting Communities</span>
          <h1>Celebrating <em>Maithili</em><br />Culture &amp; Heritage</h1>
          <span className="hero-maithili">मैथिली संस्कृति आ विरासतक उत्सव</span>
          <p className="hero-sub">Uniting the Maithili-speaking community across America — preserving our language, traditions, and cultural identity for future generations.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" className="btn btn-primary btn-lg">Become a Member</a>
            <a href="/events" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>View Events</a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[{ num:`${stats.members}+`, label:'Members', sub:'सदस्य' }, { num:`${stats.events}+`, label:'Events', sub:'कार्यक्रम' }, { num:'25+', label:'Years of Service', sub:'सेवा के वर्ष' }, { num:'15+', label:'US States', sub:'राज्य' }].map(s=>(
            <div key={s.label} style={{ textAlign:'center', padding:'1.5rem' }}>
              <div style={{ fontFamily:'var(--serif)', fontSize:'2.5rem', fontWeight:700, color:'var(--saffron)', lineHeight:1 }}>{s.num}</div>
              <div style={{ fontWeight:600, color:'var(--navy)', marginTop:'.35rem' }}>{s.label}</div>
              <div style={{ fontSize:'.8rem', color:'var(--gold)', fontFamily:'var(--serif)', fontStyle:'italic' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Events */}
      <section className="shell">
        <div className="section-header">
          <div><div className="section-eyebrow">आगामी कार्यक्रम</div><h2 className="section-title">Upcoming <span>Events</span></h2></div>
          <a href="/events" className="btn btn-ghost btn-sm">View All →</a>
        </div>
        {events.length === 0 ? <div className="empty-state"><div className="icon">📅</div><p>No upcoming events yet.</p></div> : (
          <div className="grid-2">
            {events.map(e => {
              const d = new Date(e.event_date);
              return (
                <div key={e.id} className="card card-saffron" style={{ display:'flex', gap:'1rem' }}>
                  <div className="event-card-date" style={{ alignSelf:'flex-start' }}>
                    <div className="day">{d.getDate()}</div>
                    <div className="mon">{d.toLocaleString('default',{month:'short'})}</div>
                  </div>
                  <div>
                    <span className={`badge badge-${e.category}`} style={{ marginBottom:'.4rem' }}>{e.category}</span>
                    <div style={{ fontFamily:'var(--serif)', fontWeight:600, fontSize:'1.05rem', color:'var(--navy)', marginBottom:'.25rem' }}>{e.title}</div>
                    {e.title_maithili && <div className="maithili" style={{ fontSize:'.85rem', marginBottom:'.4rem' }}>{e.title_maithili}</div>}
                    <div className="text-sm text-muted">{e.location||'Online'}{e.city?`, ${e.city}`:''}</div>
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
        {news.length === 0 ? <div className="empty-state"><div className="icon">📰</div><p>No news yet.</p></div> : (
          <div className="grid-3">
            {news.map(n => (
              <div key={n.id} className="card">
                <span className={`badge badge-${n.category}`} style={{ marginBottom:'.6rem' }}>{n.category}</span>
                <div style={{ fontFamily:'var(--serif)', fontWeight:600, fontSize:'1.05rem', color:'var(--navy)', marginBottom:'.4rem', lineHeight:1.3 }}>{n.title}</div>
                {n.title_maithili && <div className="maithili" style={{ fontSize:'.82rem', marginBottom:'.5rem' }}>{n.title_maithili}</div>}
                <div className="text-sm text-muted">{n.excerpt?.slice(0,120)}…</div>
                <div className="text-xs text-muted" style={{ marginTop:'.75rem' }}>{n.author} · {new Date(n.published_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section style={{ background:'var(--navy)', padding:'4rem 2rem', textAlign:'center' }}>
        <div style={{ maxWidth:640, margin:'0 auto' }}>
          <div className="section-eyebrow" style={{ color:'var(--gold)' }}>सदस्य बनें</div>
          <h2 style={{ fontFamily:'var(--serif)', fontSize:'2rem', color:'#fff', margin:'.75rem 0' }}>Join the MAA Family Today</h2>
          <p style={{ color:'rgba(255,255,255,.7)', marginBottom:'2rem' }}>Annual from $25 (students) · $50 (individuals) · Lifetime available</p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <a href="/join" className="btn btn-primary btn-lg">Join Now</a>
            <a href="/donate" className="btn btn-gold btn-lg">Donate</a>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
