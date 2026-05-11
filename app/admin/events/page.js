'use client';
// app/admin/events/page.js — MAA Events Management

import { useState, useEffect, useCallback, useRef } from 'react';

// Handles Date objects, ISO strings ("2026-05-31T..."), and bare "YYYY-MM-DD" strings
function localDate(val) {
  if (!val) return new Date(NaN);
  if (val instanceof Date) return new Date(val.getFullYear(), val.getMonth(), val.getDate());
  const m = String(val).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return new Date(NaN);
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}
function Toast({ toasts }) {
  return <div className="toast-wrap">{toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = localDate(d);
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const CAT_COLORS = {
  cultural:    { bg: 'var(--saffron-light)', color: 'var(--saffron-dark)' },
  religious:   { bg: 'var(--crimson-light)', color: 'var(--crimson)' },
  social:      { bg: 'var(--forest-light)',  color: 'var(--forest)' },
  educational: { bg: '#E3F2FD',              color: '#0D47A1' },
  fundraiser:  { bg: 'var(--gold-light)',    color: 'var(--gold)' },
  other:       { bg: 'var(--paper-3)',       color: 'var(--ink-soft)' },
};
const STATUS_COLORS = {
  upcoming:  { bg: '#E3F2FD',              color: '#0D47A1' },
  ongoing:   { bg: 'var(--forest-light)',  color: 'var(--forest)' },
  completed: { bg: 'var(--paper-3)',       color: 'var(--ink-soft)' },
  cancelled: { bg: 'var(--crimson-light)', color: 'var(--crimson)' },
};

/* ══════════════════════════════════════
   SIDEBAR NAV
══════════════════════════════════════ */
function Sidebar({ secret, onSignOut }) {
  const NL = ({ href, icon, label, active }) => (
    <a href={href} className={`admin-nav-link${active ? ' active' : ''}`}>
      <span className="nav-icon">{icon}</span>{label}
    </a>
  );
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="logo-text">MAA CRM</div>
        <div className="logo-sub">मैथिल एसोसिएशन</div>
      </div>
      <nav className="admin-nav">
        <div className="admin-nav-section">Main</div>
        <NL href="/admin"         icon="🏠" label="Dashboard" />
        <NL href="/admin/members" icon="👥" label="Members" />
        <NL href="/admin/events"  icon="📅" label="Events" active />
        <NL href="/admin/donations" icon="💰" label="Donations" />
        <NL href="/admin/finance"   icon="📊" label="Finance" />
        <NL href="/admin/analytics" icon="📈" label="Analytics" />
        <div className="admin-nav-section">Content</div>
        <NL href="/admin/news"    icon="📰" label="News & Posts" />
        <NL href="/admin/gallery" icon="🖼️" label="Gallery" />
        <NL href="/admin/about"   icon="📝" label="About Us" />
        <div className="admin-nav-section">Organization</div>
        <NL href="/admin/volunteers" icon="🙋" label="Volunteers" />
        <NL href="/admin/committee"  icon="🏛️" label="Committee" />
        <NL href="/admin/inquiries"  icon="✉️" label="Inquiries" />
        <div className="admin-nav-section">Settings</div>
        <NL href="/"              icon="🌐" label="Public Site" />
        <a href="/api/health" target="_blank" className="admin-nav-link"><span className="nav-icon">⚡</span>Health</a>
      </nav>
    </aside>
  );
}

/* ══════════════════════════════════════
   DETAIL SIDE PANEL
══════════════════════════════════════ */
function DetailPanel({ event, onClose, onEdit, onDelete }) {
  if (!event) return null;
  const cat = CAT_COLORS[event.category] || CAT_COLORS.other;
  const sta = STATUS_COLORS[event.status] || STATUS_COLORS.upcoming;
  const d   = localDate(event.event_date);

  const Row = ({ icon, label, value, link }) => {
    if (!value && value !== 0) return null;
    return (
      <div style={{ display: 'flex', gap: '.75rem', padding: '.5rem 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '.9rem', width: 22, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-dim)', marginBottom: '.08rem' }}>{label}</div>
          {link
            ? <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: '.875rem', color: 'var(--saffron)' }}>{value}</a>
            : <div style={{ fontSize: '.875rem', color: 'var(--ink)', lineHeight: 1.5 }}>{value}</div>
          }
        </div>
      </div>
    );
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,33,55,.3)', zIndex: 79 }} />
      <div className="detail-panel">
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink-dim)' }}>Event Detail</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Date banner */}
        <div style={{ background: 'var(--navy)', padding: '1.25rem', textAlign: 'center', borderBottom: '3px solid var(--saffron)' }}>
          <div style={{ color: 'var(--gold)', fontSize: '.75rem', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.25rem' }}>
            {d.toLocaleString('default', { month: 'long' })} {d.getFullYear()}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '3rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{d.getDate()}</div>
          <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '.75rem' }}>
            <span className="badge" style={{ background: cat.bg, color: cat.color }}>{event.category}</span>
            <span className="badge" style={{ background: sta.bg, color: sta.color }}>{event.status}</span>
            {!event.is_public && <span className="badge" style={{ background: 'var(--paper-3)', color: 'var(--ink-dim)' }}>Private</span>}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.25rem' }}>
          <div style={{ padding: '.85rem 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy)', lineHeight: 1.3 }}>{event.title}</div>
            {event.title_maithili && <div style={{ color: 'var(--gold)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '.875rem', marginTop: '.2rem' }}>{event.title_maithili}</div>}
          </div>
          {event.description && (
            <div style={{ padding: '.75rem 0', borderBottom: '1px solid var(--border)', fontSize: '.875rem', color: 'var(--ink-soft)', lineHeight: 1.7 }}>{event.description}</div>
          )}
          <Row icon="🕐" label="Time"         value={event.event_time} />
          <Row icon="📅" label="End Date"      value={event.end_date ? fmtDate(event.end_date) : null} />
          {event.is_online
            ? <Row icon="💻" label="Online Event"  value={event.meeting_link || 'Online'} link={event.meeting_link} />
            : <Row icon="📍" label="Location"      value={[event.location, event.address, event.city, event.state].filter(Boolean).join(', ')} />
          }
          <Row icon="👤" label="Organizer"     value={event.organizer} />
          <Row icon="✉️" label="Contact Email" value={event.contact_email} link={event.contact_email ? `mailto:${event.contact_email}` : null} />
          <Row icon="👥" label="Max Attendees" value={event.max_attendees} />
          <Row icon="💰" label="Reg. Fee"      value={event.registration_fee > 0 ? `$${parseFloat(event.registration_fee).toFixed(2)}` : 'Free'} />
          <Row icon="🪪" label="Event ID"      value={`#${event.id}`} />
          <Row icon="🕐" label="Created"       value={new Date(event.created_at).toLocaleString()} />
        </div>

        {/* Actions */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
          <button className="btn btn-danger btn-sm" style={{ justifyContent: 'center' }} onClick={() => { onDelete(event.id); onClose(); }}>🗑 Delete</button>
          <button className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }} onClick={() => { onEdit(event); onClose(); }}>✏️ Edit</button>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════
   EVENT FORM MODAL
══════════════════════════════════════ */
function EventModal({ event, secret, onClose, onSave }) {
  const isEdit = !!event;
  const today  = new Date().toISOString().split('T')[0];
  const blank  = {
    title: '', title_maithili: '', description: '',
    event_date: today, event_time: '', end_date: '',
    location: '', address: '', city: '', state: '',
    is_online: false, meeting_link: '',
    category: 'cultural', status: 'upcoming',
    max_attendees: '', registration_fee: '0',
    cover_image: '', organizer: '', contact_email: '',
    is_public: true,
  };
  const norm = e => ({
    ...blank, ...e,
    event_date: e.event_date?.split('T')[0] || today,
    end_date:   e.end_date?.split('T')[0]   || '',
    max_attendees:    e.max_attendees    || '',
    registration_fee: e.registration_fee || '0',
  });

  const [form, setForm]     = useState(isEdit ? norm(event) : blank);
  const [errors, setErrors] = useState({});
  const [busy, setBusy]     = useState(false);

  const set  = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setB = k => v => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setErrors({}); setBusy(true);
    try {
      const payload = {
        ...form,
        end_date:         form.end_date         || null,
        event_time:       form.event_time        || null,
        meeting_link:     form.meeting_link       || null,
        location:         form.location           || null,
        address:          form.address            || null,
        city:             form.city               || null,
        state:            form.state              || null,
        cover_image:      form.cover_image        || null,
        organizer:        form.organizer          || null,
        contact_email:    form.contact_email      || null,
        max_attendees:    form.max_attendees      || null,
        registration_fee: parseFloat(form.registration_fee) || 0,
      };
      const res  = await fetch(isEdit ? `/api/events/${event.id}` : '/api/events', {
        method:  isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { onSave(data.data, isEdit); onClose(); }
      else if (data.errors) setErrors(data.errors);
      else setErrors({ _: data.message });
    } catch { setErrors({ _: 'Network error' }); }
    setBusy(false);
  };

  const SH = t => <p style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink-dim)', margin: '.75rem 0 .5rem', fontWeight: 600 }}>{t}</p>;
  const HR = () => <hr className="divider" />;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? `Edit — ${event.title}` : '📅 Add New Event'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {errors._ && <div style={{ background: 'var(--crimson-light)', border: '1px solid rgba(155,29,32,.25)', borderRadius: 'var(--radius)', padding: '.7rem 1rem', marginBottom: '1rem', color: 'var(--crimson)', fontSize: '.83rem' }}>{errors._}</div>}

        {SH('Event Details')}
        <div className="form-grid">
          <div className="form-group span-2">
            <label>Event Title (English) <span className="req">*</span></label>
            <input value={form.title} onChange={set('title')} placeholder="Maithili New Year Celebration 2025" className={errors.title ? 'error' : ''} />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>
          <div className="form-group span-2">
            <label>Title in Maithili (मैथिली)</label>
            <input value={form.title_maithili} onChange={set('title_maithili')} placeholder="मैथिली नव वर्ष उत्सव २०२५" />
          </div>
          <div className="form-group span-2">
            <label>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={4} placeholder="Describe the event…" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={set('category')}>
              <option value="cultural">Cultural</option>
              <option value="religious">Religious</option>
              <option value="social">Social</option>
              <option value="educational">Educational</option>
              <option value="fundraiser">Fundraiser</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={set('status')}>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <HR />{SH('Date & Time')}
        <div className="form-grid">
          <div className="form-group">
            <label>Event Date <span className="req">*</span></label>
            <input type="date" value={form.event_date} onChange={set('event_date')} className={errors.event_date ? 'error' : ''} />
            {errors.event_date && <span className="field-error">{errors.event_date}</span>}
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input type="text" value={form.event_time} onChange={set('event_time')} placeholder="6:00 PM" />
          </div>
          <div className="form-group">
            <label>End Date (optional)</label>
            <input type="date" value={form.end_date} onChange={set('end_date')} />
          </div>
        </div>

        <HR />{SH('Location')}
        {/* Online toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '1rem', padding: '.75rem 1rem', background: 'var(--paper-2)', borderRadius: 'var(--radius)' }}>
          <div onClick={() => setB('is_online')(!form.is_online)} style={{ width: 44, height: 24, borderRadius: 12, background: form.is_online ? 'var(--saffron)' : 'var(--paper-3)', border: `1.5px solid ${form.is_online ? 'var(--saffron)' : 'var(--border-hi)'}`, position: 'relative', cursor: 'pointer', transition: 'var(--trans)', flexShrink: 0 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: form.is_online ? '#fff' : 'var(--ink-dim)', position: 'absolute', top: 2, left: form.is_online ? 22 : 2, transition: 'var(--trans)' }} />
          </div>
          <span style={{ fontWeight: 600 }}>Online Event (Virtual / Zoom)</span>
          <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: form.is_online ? 'var(--saffron)' : 'var(--ink-dim)' }}>{form.is_online ? '💻 Virtual' : '📍 In-person'}</span>
        </div>

        {form.is_online ? (
          <div className="form-group">
            <label>Meeting Link (Zoom / Teams)</label>
            <input type="url" value={form.meeting_link} onChange={set('meeting_link')} placeholder="https://zoom.us/j/…" />
          </div>
        ) : (
          <div className="form-grid">
            <div className="form-group span-2"><label>Venue Name</label><input value={form.location} onChange={set('location')} placeholder="Edison Community Center" /></div>
            <div className="form-group span-2"><label>Street Address</label><input value={form.address} onChange={set('address')} placeholder="123 Main St" /></div>
            <div className="form-group"><label>City</label><input value={form.city} onChange={set('city')} placeholder="Edison" /></div>
            <div className="form-group"><label>State</label><input value={form.state} onChange={set('state')} placeholder="NJ" /></div>
          </div>
        )}

        <HR />{SH('Registration & Contact')}
        <div className="form-grid">
          <div className="form-group"><label>Organizer</label><input value={form.organizer} onChange={set('organizer')} placeholder="MAA Events Committee" /></div>
          <div className="form-group"><label>Contact Email</label><input type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="contributemaa@maithilusa.org" /></div>
          <div className="form-group"><label>Max Attendees</label><input type="number" value={form.max_attendees} onChange={set('max_attendees')} placeholder="200" /></div>
          <div className="form-group"><label>Registration Fee ($)</label><input type="number" value={form.registration_fee} onChange={set('registration_fee')} placeholder="0" min="0" step="0.01" /></div>
          <div className="form-group span-2"><label>Cover Image URL</label><input type="url" value={form.cover_image} onChange={set('cover_image')} placeholder="https://…" /></div>
        </div>

        {/* Is Public toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', margin: '.5rem 0 1.5rem', padding: '.75rem 1rem', background: 'var(--paper-2)', borderRadius: 'var(--radius)' }}>
          <div onClick={() => setB('is_public')(!form.is_public)} style={{ width: 44, height: 24, borderRadius: 12, background: form.is_public ? 'var(--saffron)' : 'var(--paper-3)', border: `1.5px solid ${form.is_public ? 'var(--saffron)' : 'var(--border-hi)'}`, position: 'relative', cursor: 'pointer', transition: 'var(--trans)', flexShrink: 0 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: form.is_public ? '#fff' : 'var(--ink-dim)', position: 'absolute', top: 2, left: form.is_public ? 22 : 2, transition: 'var(--trans)' }} />
          </div>
          <span style={{ fontWeight: 600 }}>Show on Public Website</span>
          <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: form.is_public ? 'var(--forest)' : 'var(--ink-dim)' }}>{form.is_public ? '✓ Public' : '✗ Hidden'}</span>
        </div>

        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? <><span className="spinner" />Saving…</> : isEdit ? 'Save Changes' : 'Add Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function AdminEventsPage() {
  const { toasts, show } = useToast();

  // Auth
  const [secret, setSecret]     = useState('');
  const [authed, setAuthed]     = useState(false);
  const [authErr, setAuthErr]   = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Data
  const [events, setEvents]         = useState([]);
  const [stats, setStats]           = useState({ total: 0, upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading]       = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Filters
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat, setFilterCat]     = useState('all');

  // UI
  const [showAdd, setShowAdd]       = useState(false);
  const [editEvent, setEditEvent]   = useState(null);
  const [panelEvent, setPanelEvent] = useState(null);

  const fetchEvents = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page:     String(opts.page || 1),
        limit:    '20',
        search:   opts.search   !== undefined ? opts.search   : search,
        status:   opts.status   !== undefined ? opts.status   : filterStatus,
        category: opts.category !== undefined ? opts.category : filterCat,
      });
      const res  = await fetch(`/api/events?${qs}`, { headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) { setEvents(data.data); setStats(data.stats); setPagination(data.pagination); }
      else show(data.message, 'error');
    } catch { show('Network error', 'error'); }
    setLoading(false);
  }, [secret, search, filterStatus, filterCat, show]);

  useEffect(() => { if (authed) fetchEvents(); }, [authed, fetchEvents]);
  useEffect(() => {
    if (!authed) return;
    const t = setTimeout(() => fetchEvents({ search }), 380);
    return () => clearTimeout(t);
  }, [search, authed]);

  const handleLogin = async e => {
    e.preventDefault(); if (!secret.trim()) return;
    setAuthBusy(true); setAuthErr('');
    try {
      const res = await fetch('/api/events?limit=1', { headers: { 'x-admin-secret': secret } });
      if (res.ok) setAuthed(true);
      else setAuthErr('Invalid password.');
    } catch { setAuthErr('Network error.'); }
    setAuthBusy(false);
  };

  const handleDelete = async id => {
    if (!confirm('Delete this event permanently?')) return;
    try {
      const res  = await fetch(`/api/events/${id}`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) { setEvents(p => p.filter(e => e.id !== id)); show(data.message); fetchEvents(); }
      else show(data.message, 'error');
    } catch { show('Delete failed', 'error'); }
  };

  const handleSave = (saved, isEdit) => {
    if (isEdit) setEvents(p => p.map(e => e.id === saved.id ? saved : e));
    else        setEvents(p => [saved, ...p]);
    show(isEdit ? 'Event updated!' : 'Event added!');
    fetchEvents();
  };

  const quickStatus = async (event, status) => {
    try {
      const res  = await fetch(`/api/events/${event.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret }, body: JSON.stringify({ status }) });
      const data = await res.json();
      if (data.success) { setEvents(p => p.map(e => e.id === event.id ? data.data : e)); show('Status updated!'); }
    } catch { show('Failed', 'error'); }
  };

  /* ── Login ── */
  if (!authed) return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📅</div>
        <h2>Events Management</h2>
        <p>Maithil Association of America — Admin CRM</p>
        {authErr && <div style={{ background: 'var(--crimson-light)', borderRadius: 'var(--radius)', padding: '.7rem', marginBottom: '1rem', color: 'var(--crimson)', fontSize: '.82rem' }}>{authErr}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Admin Password</label>
            <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="ADMIN_SECRET" autoFocus />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={authBusy}>
            {authBusy ? <><span className="spinner" />Verifying…</> : 'Enter CRM →'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.8rem' }}>
          <a href="/" style={{ color: 'var(--saffron)' }}>← Public Site</a>
          {' · '}
          <a href="/admin/members" style={{ color: 'var(--saffron)' }}>Members</a>
        </div>
      </div>
    </div>
  );

  /* ── Dashboard ── */
  return (
    <>
      <div className="admin-layout">
        <Sidebar secret={secret} onSignOut={() => { setAuthed(false); setSecret(''); setEvents([]); }} />

        <div className="admin-main">
          {/* Top bar */}
          <div className="admin-topbar">
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--navy)', fontWeight: 600 }}>Events Management</div>
              <div className="text-sm text-muted">कार्यक्रम प्रबंधन · {stats.total} total</div>
            </div>
            <div style={{ display: 'flex', gap: '.65rem', alignItems: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Event</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAuthed(false); setSecret(''); setEvents([]); }}>Sign Out</button>
            </div>
          </div>

          <div className="admin-content">
            {/* Stats */}
            <div className="stats-grid">
              {[
                { label: 'Total',     num: stats.total,     color: 'var(--saffron)' },
                { label: 'Upcoming',  num: stats.upcoming,  color: '#185FA5' },
                { label: 'Ongoing',   num: stats.ongoing,   color: 'var(--forest)' },
                { label: 'Completed', num: stats.completed, color: 'var(--ink-dim)' },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Search + Filters */}
            <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search events…" style={{ flex: '1 1 220px', maxWidth: 320 }} />
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); fetchEvents({ status: e.target.value }); }} style={{ width: 'auto' }}>
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select value={filterCat} onChange={e => { setFilterCat(e.target.value); fetchEvents({ category: e.target.value }); }} style={{ width: 'auto' }}>
                <option value="all">All Categories</option>
                <option value="cultural">Cultural</option>
                <option value="religious">Religious</option>
                <option value="social">Social</option>
                <option value="educational">Educational</option>
                <option value="fundraiser">Fundraiser</option>
              </select>
              <button className="btn btn-ghost btn-sm" onClick={() => fetchEvents()}>↻ Refresh</button>
            </div>

            {/* Events list */}
            {loading ? (
              <div className="loading-state"><span className="spinner" />Loading events…</div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📅</div>
                <p>No events found.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setShowAdd(true)}>+ Add First Event</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '1.5rem' }}>
                  {events.map(ev => {
                    const d   = localDate(ev.event_date);
                    const cat = CAT_COLORS[ev.category]  || CAT_COLORS.other;
                    const sta = STATUS_COLORS[ev.status] || STATUS_COLORS.upcoming;
                    const isPast = ev.status === 'completed' || ev.status === 'cancelled';
                    return (
                      <div key={ev.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', opacity: isPast ? .8 : 1 }}>
                        {/* Date badge */}
                        <div style={{ background: isPast ? 'var(--ink-soft)' : 'var(--saffron)', color: '#fff', borderRadius: 'var(--radius)', padding: '.5rem .75rem', textAlign: 'center', minWidth: 52, flexShrink: 0 }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 }}>{d.getDate()}</div>
                          <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.07em', opacity: .9 }}>{d.toLocaleString('default', { month: 'short' })}</div>
                          <div style={{ fontSize: '.65rem', opacity: .8 }}>{d.getFullYear()}</div>
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                            <span className="badge" style={{ background: cat.bg, color: cat.color }}>{ev.category}</span>
                            <span className="badge" style={{ background: sta.bg, color: sta.color }}>{ev.status}</span>
                            {!ev.is_public && <span className="badge" style={{ background: 'var(--paper-3)', color: 'var(--ink-dim)' }}>Private</span>}
                          </div>
                          <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: '1rem', color: 'var(--navy)', marginBottom: '.2rem' }}>{ev.title}</div>
                          {ev.title_maithili && <div style={{ color: 'var(--gold)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '.82rem', marginBottom: '.3rem' }}>{ev.title_maithili}</div>}
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {ev.event_time && <span className="text-xs text-muted">🕐 {ev.event_time}</span>}
                            <span className="text-xs text-muted">
                              {ev.is_online ? '💻 Online' : `📍 ${[ev.location, ev.city, ev.state].filter(Boolean).join(', ')}`}
                            </span>
                            {ev.organizer && <span className="text-xs text-muted">👤 {ev.organizer}</span>}
                            {ev.registration_fee > 0 && <span className="text-xs" style={{ color: 'var(--forest)' }}>💰 ${parseFloat(ev.registration_fee).toFixed(2)}</span>}
                          </div>
                        </div>

                        {/* Quick status change */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem', alignItems: 'flex-end', flexShrink: 0 }}>
                          <div style={{ display: 'flex', gap: '.35rem' }}>
                            <button className="btn btn-ghost btn-sm" style={{ padding: '.3rem .6rem' }} onClick={() => setPanelEvent(ev)} title="View">👁</button>
                            <button className="btn btn-primary btn-sm" style={{ padding: '.3rem .6rem' }} onClick={() => setEditEvent(ev)} title="Edit">✏️</button>
                            <button className="btn btn-danger btn-sm" style={{ padding: '.3rem .6rem' }} onClick={() => handleDelete(ev.id)} title="Delete">🗑</button>
                          </div>
                          {/* Quick status */}
                          <select
                            value={ev.status}
                            onChange={e => quickStatus(ev, e.target.value)}
                            style={{ fontSize: '.72rem', padding: '.2rem .45rem', width: 'auto', border: `1px solid ${sta.color}44`, background: sta.bg, color: sta.color, borderRadius: 4 }}
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="text-sm text-muted">
                    <span>Page {pagination.page} of {pagination.pages} ({pagination.total} events)</span>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button className="btn btn-ghost btn-sm" disabled={pagination.page <= 1} onClick={() => fetchEvents({ page: pagination.page - 1 })}>← Prev</button>
                      <button className="btn btn-ghost btn-sm" disabled={pagination.page >= pagination.pages} onClick={() => fetchEvents({ page: pagination.page + 1 })}>Next →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {panelEvent && <DetailPanel event={panelEvent} onClose={() => setPanelEvent(null)} onEdit={e => { setEditEvent(e); setPanelEvent(null); }} onDelete={id => { handleDelete(id); setPanelEvent(null); }} />}
      {showAdd    && <EventModal event={null}      secret={secret} onClose={() => setShowAdd(false)}   onSave={handleSave} />}
      {editEvent  && <EventModal event={editEvent} secret={secret} onClose={() => setEditEvent(null)}  onSave={handleSave} />}
      <Toast toasts={toasts} />
    </>
  );
}
