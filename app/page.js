'use client';
// app/page.js — MAA Public Homepage (dynamic from Neon PostgreSQL)
import { useState, useEffect } from 'react';

/* ══════════════════════════════════════
   NAV
══════════════════════════════════════ */
function Nav() {
  return (
    <nav className="pub-nav">
      <div className="pub-nav-inner">
        <a href="/" className="pub-nav-brand">
          <div className="emblem">MAA</div>
          <div className="org-name">
            Maithil Association of America
            <span>मैथिल एसोसिएशन ऑफ अमेरिका</span>
          </div>
        </a>
        <div className="pub-nav-links">
          {[
            ['/', 'Home'],
            ['/events', 'Events'],
            ['/news', 'News'],
            ['/gallery', 'Gallery'],
            ['/about', 'About'],
            ['/contact', 'Contact'],
          ].map(([h, l]) => (
            <a key={h} href={h} className="pub-nav-link">{l}</a>
          ))}
          <a href="/join" className="pub-nav-cta" style={{ marginLeft: '.5rem' }}>Join / Renew</a>
        </div>
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════
   FOOTER
══════════════════════════════════════ */
function Footer() {
  return (
    <footer className="pub-footer">
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '.5rem' }}>मैथिल एसोसिएशन</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.7 }}>
            Preserving and promoting Maithili language, culture, and heritage across America since 2000.
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.75rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Quick Links</div>
          {[['Events', '/events'], ['News', '/news'], ['Gallery', '/gallery'], ['Donate', '/donate'], ['Contact', '/contact']].map(([l, h]) => (
            <div key={l} style={{ marginBottom: '.35rem' }}>
              <a href={h} style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem' }}>{l}</a>
            </div>
          ))}
        </div>
        <div>
          <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '.75rem', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Contact</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.875rem', lineHeight: 1.8 }}>
            info@maa-america.org<br />Edison, NJ (Headquarters)
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem' }}>
        © {new Date().getFullYear()} Maithil Association of America ·
        <a href="/admin" style={{ color: 'var(--gold)', marginLeft: '.5rem' }}>Admin</a>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════
   EVENT CARD
══════════════════════════════════════ */
const CAT_BADGE = {
  cultural:    { bg: 'var(--saffron-light)', color: 'var(--saffron-dark)' },
  religious:   { bg: 'var(--crimson-light)', color: 'var(--crimson)' },
  social:      { bg: 'var(--forest-light)',  color: 'var(--forest)' },
  educational: { bg: '#E3F2FD',              color: '#0D47A1' },
  fundraiser:  { bg: 'var(--gold-light)',    color: 'var(--gold)' },
  other:       { bg: 'var(--paper-3)',       color: 'var(--ink-soft)' },
};
const STATUS_BADGE = {
  upcoming:  { bg: '#E3F2FD',              color: '#0D47A1' },
  ongoing:   { bg: 'var(--forest-light)',  color: 'var(--forest)' },
  completed: { bg: 'var(--paper-3)',       color: 'var(--ink-soft)' },
};

function EventCard({ event }) {
  const d   = new Date(event.event_date);
  const cat = CAT_BADGE[event.category] || CAT_BADGE.other;
  const sta = STATUS_BADGE[event.status] || STATUS_BADGE.upcoming;
  const isPast = event.status === 'completed';

  return (
    <div className="card card-saffron" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', opacity: isPast ? .82 : 1 }}>
      {/* Date badge */}
      <div style={{
        background: isPast ? 'var(--ink-soft)' : 'var(--saffron)',
        color: '#fff', borderRadius: 'var(--radius)',
        padding: '.5rem .75rem', textAlign: 'center',
        minWidth: 54, flexShrink: 0,
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{d.getDate()}</div>
        <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.07em', opacity: .9 }}>
          {d.toLocaleString('default', { month: 'short' })}
        </div>
        <div style={{ fontSize: '.65rem', opacity: .8 }}>{d.getFullYear()}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
          <span className="badge" style={{ background: cat.bg, color: cat.color }}>
            {event.category}
          </span>
          <span className="badge" style={{ background: sta.bg, color: sta.color }}>
            {event.status}
          </span>
        </div>

        <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: '1.05rem', color: 'var(--navy)', lineHeight: 1.3, marginBottom: '.2rem' }}>
          {event.title}
        </div>

        {event.title_maithili && (
          <div className="maithili" style={{ fontSize: '.85rem', marginBottom: '.35rem' }}>
            {event.title_maithili}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
          {event.event_time && (
            <div className="text-sm text-muted">🕐 {event.event_time}</div>
          )}
          <div className="text-sm text-muted">
            {event.is_online
              ? '💻 Online Event'
              : `📍 ${[event.location, event.city, event.state].filter(Boolean).join(', ') || 'TBD'}`
            }
          </div>
          {event.description && (
            <div className="text-sm text-muted" style={{ marginTop: '.2rem', lineHeight: 1.6 }}>
              {event.description.slice(0, 100)}{event.description.length > 100 ? '…' : ''}
            </div>
          )}
        </div>

        {event.status === 'upcoming' && (
          <a href="/contact" className="btn btn-primary btn-sm" style={{ marginTop: '.75rem', display: 'inline-flex' }}>
            RSVP →
          </a>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   NEWS CARD
══════════════════════════════════════ */
function NewsCard({ post }) {
  const catColors = {
    general:      { bg: 'var(--paper-3)',       color: 'var(--ink-soft)' },
    cultural:     { bg: 'var(--saffron-light)', color: 'var(--saffron-dark)' },
    event:        { bg: '#E3F2FD',              color: '#0D47A1' },
    announcement: { bg: 'var(--gold-light)',    color: 'var(--gold)' },
    newsletter:   { bg: 'var(--forest-light)',  color: 'var(--forest)' },
  };
  const cat = catColors[post.category] || catColors.general;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      <span className="badge" style={{ background: cat.bg, color: cat.color, alignSelf: 'flex-start' }}>
        {post.category}
      </span>
      <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: '1.05rem', color: 'var(--navy)', lineHeight: 1.3 }}>
        {post.title}
      </div>
      {post.title_maithili && (
        <div className="maithili" style={{ fontSize: '.82rem' }}>{post.title_maithili}</div>
      )}
      <div className="text-sm text-muted" style={{ lineHeight: 1.6, flex: 1 }}>
        {(post.excerpt || post.content || '').slice(0, 130)}
        {(post.excerpt || post.content || '').length > 130 ? '…' : ''}
      </div>
      <div className="text-xs text-muted" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.25rem', borderTop: '1px solid var(--border)', paddingTop: '.5rem' }}>
        <span>{post.author || 'MAA Team'}</span>
        <span>{post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN HOME PAGE
══════════════════════════════════════ */
export default function HomePage() {
  const [events,  setEvents]  = useState([]);
  const [news,    setNews]    = useState([]);
  const [stats,   setStats]   = useState({ members: 0, events: 0, news: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/events?limit=6').then(r => r.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/public/news?limit=3').then(r => r.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/public/stats').then(r => r.json()).catch(() => ({ success: false, data: { members: 0, events: 0, news: 0 } })),
    ]).then(([evRes, newsRes, statsRes]) => {
      if (evRes.success)    setEvents(evRes.data   || []);
      if (newsRes.success)  setNews(newsRes.data   || []);
      if (statsRes.success) setStats(statsRes.data || { members: 0, events: 0, news: 0 });
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">Est. 2000 · Connecting Communities</span>
          <h1>Celebrating <em>Maithili</em><br />Culture &amp; Heritage</h1>
          <span className="hero-maithili">मैथिली संस्कृति आ विरासतक उत्सव</span>
          <p className="hero-sub">
            Uniting the Maithili-speaking community across America — preserving our language, traditions, and cultural identity for future generations.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" className="btn btn-primary btn-lg">Become a Member</a>
            <a href="/events" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>
              View All Events
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { num: loading ? '…' : `${stats.members}+`, label: 'Members',          sub: 'सदस्य' },
            { num: loading ? '…' : `${stats.events}+`,  label: 'Events Organized', sub: 'कार्यक्रम' },
            { num: '25+',                                label: 'Years of Service', sub: 'सेवा के वर्ष' },
            { num: '15+',                                label: 'US States',        sub: 'राज्य' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--saffron)', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontWeight: 600, color: 'var(--navy)', marginTop: '.35rem' }}>{s.label}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--gold)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Events ── */}
      <section className="shell">
        <div className="section-header">
          <div>
            <div className="section-eyebrow">आगामी कार्यक्रम</div>
            <h2 className="section-title">Our <span>Events</span></h2>
          </div>
          <a href="/events" className="btn btn-ghost btn-sm">View All →</a>
        </div>

        {loading ? (
          <div className="loading-state">
            <span className="spinner" />Loading events from database…
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📅</div>
            <p style={{ marginBottom: '.75rem' }}>No events yet.</p>
            <a href="/admin/events" className="btn btn-primary btn-sm">Add Events in Admin →</a>
          </div>
        ) : (
          <div className="grid-2">
            {events.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </section>

      <div className="cultural-divider">✦ ✦ ✦</div>

      {/* ── News ── */}
      <section className="shell" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <div>
            <div className="section-eyebrow">समाचार आ घोषणा</div>
            <h2 className="section-title">News &amp; <span>Announcements</span></h2>
          </div>
          <a href="/news" className="btn btn-ghost btn-sm">View All →</a>
        </div>

        {loading ? (
          <div className="loading-state">
            <span className="spinner" />Loading news…
          </div>
        ) : news.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📰</div>
            <p style={{ marginBottom: '.75rem' }}>No news posts yet.</p>
            <a href="/admin/news" className="btn btn-primary btn-sm">Add News in Admin →</a>
          </div>
        ) : (
          <div className="grid-3">
            {news.map(n => <NewsCard key={n.id} post={n} />)}
          </div>
        )}
      </section>

      {/* ── Join CTA ── */}
      <section style={{ background: 'var(--navy)', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="section-eyebrow" style={{ color: 'var(--gold)' }}>सदस्य बनें</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', color: '#fff', margin: '.75rem 0' }}>
            Join the MAA Family Today
          </h2>
          <p style={{ color: 'rgba(255,255,255,.7)', marginBottom: '2rem' }}>
            Annual from $25 (students) · $50 (individuals) · Lifetime membership available
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" className="btn btn-primary btn-lg">Join Now</a>
            <a href="/donate" className="btn btn-gold btn-lg">Donate</a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
