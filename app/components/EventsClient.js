'use client';
// app/components/EventsClient.js — handles filter UI for the events page
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

function Footer() {
  return (
    <footer className="pub-footer">
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.75rem', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1rem' }}>
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
  const d = localDate(event.event_date);
  const cat = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other;
  const sta = STATUS_COLORS[event.status] || STATUS_COLORS.upcoming;
  const isPast = event.status === 'completed' || event.status === 'cancelled';

  // Determine the best link for this event
  const eventLink = event.meeting_link || (event.status === 'upcoming' ? `/contact?event=${event.id}` : null);

  const cardStyle = {
    opacity: isPast ? .75 : 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'inherit',
    cursor: eventLink ? 'pointer' : 'default',
    transition: 'var(--trans)',
  };

  const inner = (
    <>
      {/* Cover image — natural size, no fixed height */}
      {event.cover_image && (
        <img
          src={event.cover_image}
          alt={event.title}
          style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 320 }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {/* Date badge + status chips */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div className="event-card-date" style={{ background: isPast ? 'var(--ink-soft)' : 'var(--saffron)' }}>
            <div className="day">{d.getDate()}</div>
            <div className="mon">{d.toLocaleString('default', { month: 'short' })}</div>
            <div style={{ fontSize: '.6rem', opacity: .85 }}>{d.getFullYear()}</div>
          </div>
          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className="badge" style={{ background: cat.bg, color: cat.color }}>{event.category}</span>
            <span className="badge" style={{ background: sta.bg, color: sta.color }}>{event.status}</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.95rem', color: 'var(--navy)', lineHeight: 1.3, marginBottom: '.15rem' }}>{event.title}</div>
          {event.title_maithili && <div className="maithili" style={{ fontSize: '.78rem' }}>{event.title_maithili}</div>}
        </div>

        {/* Full description — no truncation */}
        {event.description && (
          <p className="text-sm text-muted" style={{ lineHeight: 1.6, fontSize: '.78rem', whiteSpace: 'pre-wrap' }}>{event.description}</p>
        )}

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
          {event.event_time && <div className="text-sm text-muted" style={{ fontSize: '.78rem' }}>🕐 {event.event_time}{event.end_date ? ` — ${localDate(event.end_date).toLocaleDateString()}` : ''}</div>}
          {event.is_online
            ? <div className="text-sm text-muted" style={{ fontSize: '.78rem' }}>💻 Online{event.meeting_link ? <> · <span style={{ color: 'var(--saffron)' }}>Click to join →</span></> : ''}</div>
            : <div className="text-sm text-muted" style={{ fontSize: '.78rem' }}>📍 {[event.location, event.city, event.state].filter(Boolean).join(', ')}</div>
          }
          {event.organizer && <div className="text-sm text-muted" style={{ fontSize: '.78rem' }}>👤 {event.organizer}</div>}
          {event.registration_fee > 0 && <div className="text-sm" style={{ color: 'var(--forest)', fontSize: '.78rem' }}>💰 ${parseFloat(event.registration_fee).toFixed(2)}</div>}
          {event.max_attendees && <div className="text-sm text-muted" style={{ fontSize: '.78rem' }}>👥 Max {event.max_attendees}</div>}
        </div>

        {/* CTA */}
        {eventLink && (
          <div style={{ marginTop: '.5rem' }}>
            <span className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
              {event.meeting_link ? 'Join Online →' : 'Register / RSVP →'}
            </span>
          </div>
        )}
        {event.contact_email && (
          <div className="text-xs text-muted" style={{ fontSize: '.72rem' }}>
            Questions? <a href={`mailto:${event.contact_email}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--saffron)' }}>{event.contact_email}</a>
          </div>
        )}
      </div>
    </>
  );

  // Wrap in <a> if there's a link; otherwise plain div
  return eventLink
    ? <a href={eventLink} target={event.meeting_link ? '_blank' : '_self'} rel="noreferrer" className="card" style={cardStyle}>{inner}</a>
    : <div className="card" style={cardStyle}>{inner}</div>;
}

export default function EventsClient({ initialEvents }) {
  const [events,    setEvents]    = useState(initialEvents || []);
  const [filter,    setFilter]    = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  // Always refetch from API on mount — bypasses Next.js router cache
  useEffect(() => {
    fetch('/api/public/events?all=true&limit=100', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.length) setEvents(d.data); })
      .catch(() => {});
  }, []);

  const filtered  = events.filter(e => (filter === 'all' || e.status === filter) && (catFilter === 'all' || e.category === catFilter));
  const upcoming  = events.filter(e => e.status === 'upcoming').length;
  const completed = events.filter(e => e.status === 'completed').length;

  return (
    <>
      <PublicNav active="/events" />

      {/* Hero */}
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">कार्यक्रम</span>
          <h1>MAA <em>Events</em></h1>
          <p className="hero-sub">Celebrating culture, community, and heritage through events across America.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[{ num: upcoming, label: 'Upcoming' }, { num: events.length, label: 'Total' }, { num: completed, label: 'Completed' }].map(s => (
              <div key={s.label} style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)' }}>{s.num}</div>
                <div style={{ fontSize: '.72rem', opacity: .8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="shell">
        {/* Filters */}
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {[['all', 'All'], ['upcoming', 'Upcoming'], ['ongoing', 'Ongoing'], ['completed', 'Past']].map(([v, l]) => (
              <button key={v} className={`filter-btn${filter === v ? ' active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 'auto', fontSize: '.78rem', padding: '.3rem .65rem' }}>
            <option value="all">All Categories</option>
            <option value="cultural">Cultural</option>
            <option value="religious">Religious</option>
            <option value="social">Social</option>
            <option value="educational">Educational</option>
            <option value="fundraiser">Fundraiser</option>
          </select>
        </div>

        {filtered.length === 0 ? (
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
