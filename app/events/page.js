'use client';
// app/events/page.js
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
          {[['/', 'Home'], ['/events', 'Events'], ['/news', 'News'], ['/gallery', 'Gallery'], ['/about', 'About Us'], ['/contact', 'Contact']].map(([h, l]) => (
            <a key={h} href={h} className={`pub-nav-link${h === '/events' ? ' active' : ''}`}>{l}</a>
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
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem' }}>
        © {new Date().getFullYear()} Maithil Association of America ·
        <a href="/admin" style={{ color: 'var(--gold)', marginLeft: '.5rem' }}>Admin</a>
      </div>
    </footer>
  );
}

const CATEGORY_COLORS = {
  cultural:    { bg: 'var(--saffron-light)', color: 'var(--saffron-dark)' },
  religious:   { bg: 'var(--crimson-light)', color: 'var(--crimson)' },
  social:      { bg: '#E8F5E9',              color: '#1B5E20' },
  educational: { bg: '#E3F2FD',              color: '#0D47A1' },
  fundraiser:  { bg: 'var(--gold-light)',    color: 'var(--gold)' },
  other:       { bg: 'var(--paper-3)',       color: 'var(--ink-soft)' },
};

const STATUS_COLORS = {
  upcoming:  { bg: '#E3F2FD', color: '#0D47A1' },
  ongoing:   { bg: 'var(--forest-light)', color: 'var(--forest)' },
  completed: { bg: 'var(--paper-3)', color: 'var(--ink-soft)' },
  cancelled: { bg: 'var(--crimson-light)', color: 'var(--crimson)' },
};

function EventCard({ event }) {
  const d = new Date(event.event_date);
  const cat = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other;
  const sta = STATUS_COLORS[event.status] || STATUS_COLORS.upcoming;
  const isPast = event.status === 'completed' || event.status === 'cancelled';
  return (
    <div className="card" style={{ opacity: isPast ? .75 : 1, display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
      {/* Date badge + category */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div className="event-card-date" style={{ background: isPast ? 'var(--ink-soft)' : 'var(--saffron)' }}>
          <div className="day">{d.getDate()}</div>
          <div className="mon">{d.toLocaleString('default', { month: 'short' })}</div>
          <div style={{ fontSize: '.65rem', opacity: .85 }}>{d.getFullYear()}</div>
        </div>
        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="badge" style={{ background: cat.bg, color: cat.color }}>{event.category}</span>
          <span className="badge" style={{ background: sta.bg, color: sta.color }}>{event.status}</span>
        </div>
      </div>

      {/* Title */}
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy)', lineHeight: 1.3, marginBottom: '.25rem' }}>{event.title}</div>
        {event.title_maithili && <div className="maithili" style={{ fontSize: '.875rem' }}>{event.title_maithili}</div>}
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{event.description.slice(0, 150)}{event.description.length > 150 ? '…' : ''}</p>
      )}

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
        {event.event_time && <div className="text-sm text-muted">🕐 {event.event_time}{event.end_date ? ` — ${new Date(event.end_date).toLocaleDateString()}` : ''}</div>}
        {event.is_online
          ? <div className="text-sm text-muted">💻 Online{event.meeting_link ? <a href={event.meeting_link} target="_blank" rel="noreferrer" style={{ color: 'var(--saffron)', marginLeft: '.35rem' }}>Join Link →</a> : ''}</div>
          : <div className="text-sm text-muted">📍 {[event.location, event.city, event.state].filter(Boolean).join(', ')}</div>
        }
        {event.organizer && <div className="text-sm text-muted">👤 {event.organizer}</div>}
        {event.registration_fee > 0 && <div className="text-sm" style={{ color: 'var(--forest)' }}>💰 Registration: ${parseFloat(event.registration_fee).toFixed(2)}</div>}
        {event.max_attendees && <div className="text-sm text-muted">👥 Max {event.max_attendees} attendees</div>}
      </div>

      {/* CTA */}
      {event.status === 'upcoming' && (
        <div style={{ marginTop: 'auto', paddingTop: '.5rem' }}>
          <a href={`/contact?event=${event.id}`} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Register / RSVP →</a>
        </div>
      )}
      {event.contact_email && (
        <div className="text-xs text-muted">Questions? <a href={`mailto:${event.contact_email}`} style={{ color: 'var(--saffron)' }}>{event.contact_email}</a></div>
      )}
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  useEffect(() => {
    fetch('/api/public/events?limit=50')
      .then(r => r.json())
      .then(d => { if (d.success) setEvents(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => {
    const statusOk = filter === 'all' || e.status === filter;
    const catOk    = catFilter === 'all' || e.category === catFilter;
    return statusOk && catOk;
  });

  const upcoming  = events.filter(e => e.status === 'upcoming').length;
  const completed = events.filter(e => e.status === 'completed').length;

  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="hero" style={{ padding: '3.5rem 2rem 3rem' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">कार्यक्रम</span>
          <h1>MAA <em>Events</em></h1>
          <p className="hero-sub">Celebrating culture, community, and heritage through events across America.</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--gold)' }}>{upcoming}</div>
              <div style={{ fontSize: '.82rem', opacity: .8 }}>Upcoming</div>
            </div>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--gold)' }}>{events.length}</div>
              <div style={{ fontSize: '.82rem', opacity: .8 }}>Total Events</div>
            </div>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--gold)' }}>{completed}</div>
              <div style={{ fontSize: '.82rem', opacity: .8 }}>Completed</div>
            </div>
          </div>
        </div>
      </section>

      <div className="shell">
        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {[['all', 'All Events'], ['upcoming', 'Upcoming'], ['ongoing', 'Ongoing'], ['completed', 'Past']].map(([v, l]) => (
              <button key={v} className={`filter-btn${filter === v ? ' active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 'auto', fontSize: '.82rem', padding: '.35rem .75rem' }}>
            <option value="all">All Categories</option>
            <option value="cultural">Cultural</option>
            <option value="religious">Religious</option>
            <option value="social">Social</option>
            <option value="educational">Educational</option>
            <option value="fundraiser">Fundraiser</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" />Loading events…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">📅</div><p>No events found.</p></div>
        ) : (
          <div className="grid-2">
            {filtered.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
