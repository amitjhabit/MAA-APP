'use client';
// app/admin/volunteers/page.js
import { useState, useCallback, useEffect } from 'react';
import { useAdminAuth } from '@/app/admin/layout';

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}
function Toast({ toasts }) {
  return <div className="toast-wrap">{toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;
}

function Sidebar() {
  const NL = ({ href, icon, label, a }) => <a href={href} className={`admin-nav-link${a ? ' active' : ''}`}><span className="nav-icon">{icon}</span>{label}</a>;
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        <div className="logo-sub">मैथिल एसोसिएशन</div>
      </div>
      <nav className="admin-nav">
        <div className="admin-nav-section">Main</div>
        <NL href="/admin" icon="🏠" label="Dashboard" />
        <NL href="/admin/members" icon="👥" label="Members" />
        <NL href="/admin/events" icon="📅" label="Events" />
        <NL href="/admin/donations" icon="💰" label="Donations" />
        <NL href="/admin/finance" icon="📊" label="Finance" />
        <NL href="/admin/analytics" icon="📈" label="Analytics" />
        <div className="admin-nav-section">Content</div>
        <NL href="/admin/news" icon="📰" label="News" />
        <NL href="/admin/gallery" icon="🖼️" label="Gallery" />
        <NL href="/admin/homepage" icon="🏡" label="Mission" />
        <NL href="/admin/about" icon="📝" label="About Us" />
        <NL href="/admin/mithila" icon="🗺️" label="Mithila" />
        <div className="admin-nav-section">Organization</div>
        <NL href="/admin/volunteers" icon="🙋" label="Volunteers" a />
        <NL href="/admin/committee" icon="🏛️" label="Committee" />
        <NL href="/admin/inquiries" icon="✉️" label="Inquiries" />
        <div className="admin-nav-section">Settings</div>
        <NL href="/" icon="🌐" label="Public Site" />
      </nav>
    </aside>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <div style={{ color: 'var(--crimson)', fontSize: '.75rem', marginTop: '.25rem' }}>⚠ {msg}</div>;
}

function VolunteerModal({ volunteer, secret, onClose, onSave }) {
  const isEdit = !!volunteer;
  const blank = {
    first_name: '', last_name: '', address: '', email: '', phone: '',
    role: '', skills: '', availability: '', hours_total: '0',
    status: 'active', joined_date: '', notes: '',
  };
  const [form, setForm] = useState(
    isEdit
      ? {
          ...blank, ...volunteer,
          first_name: volunteer.first_name || (volunteer.name ? volunteer.name.split(' ')[0] : ''),
          last_name:  volunteer.last_name  || (volunteer.name ? volunteer.name.split(' ').slice(1).join(' ') : ''),
          joined_date: volunteer.joined_date?.split('T')[0] || '',
          hours_total: volunteer.hours_total ?? '0',
        }
      : blank
  );
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.last_name.trim())  errs.last_name  = 'Last name is required';
    if (!form.email.trim())      errs.email       = 'Email is required';
    return errs;
  };

  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch(
        isEdit ? `/api/volunteers/${volunteer.id}` : '/api/volunteers',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
          body: JSON.stringify({ ...form, hours_total: parseFloat(form.hours_total) || 0 }),
        }
      );
      const data = await res.json();
      if (data.success) { onSave(data.data, isEdit); onClose(); }
      else if (data.errors) setErrors(data.errors);
      else setErrors({ _general: data.message || 'Save failed' });
    } catch { setErrors({ _general: 'Network error. Please try again.' }); }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Volunteer' : '🙋 Add Volunteer'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {errors._general && (
          <div style={{ margin: '0 1.5rem .75rem', padding: '.6rem .9rem', background: 'var(--crimson-light)', color: 'var(--crimson)', borderRadius: 6, fontSize: '.82rem' }}>
            ⚠ {errors._general}
          </div>
        )}

        <div className="form-grid">
          {/* Contact info */}
          <div style={{ gridColumn: '1/-1', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink-dim)', fontWeight: 600, marginBottom: '-.25rem' }}>
            Contact Information
          </div>

          <div className="form-group">
            <label>First Name <span className="req">*</span></label>
            <input value={form.first_name} onChange={set('first_name')}
              style={{ borderColor: errors.first_name ? 'var(--crimson)' : '' }} />
            <FieldError msg={errors.first_name} />
          </div>
          <div className="form-group">
            <label>Last Name <span className="req">*</span></label>
            <input value={form.last_name} onChange={set('last_name')}
              style={{ borderColor: errors.last_name ? 'var(--crimson)' : '' }} />
            <FieldError msg={errors.last_name} />
          </div>
          <div className="form-group">
            <label>Email <span className="req">*</span></label>
            <input type="email" value={form.email} onChange={set('email')}
              style={{ borderColor: errors.email ? 'var(--crimson)' : '' }} />
            <FieldError msg={errors.email} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={form.phone} onChange={set('phone')} />
          </div>
          <div className="form-group span-2">
            <label>Address</label>
            <input value={form.address} onChange={set('address')} placeholder="Street, City, State, ZIP" />
          </div>

          {/* Volunteer details */}
          <div style={{ gridColumn: '1/-1', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink-dim)', fontWeight: 600, marginBottom: '-.25rem', marginTop: '.5rem' }}>
            Volunteer Details
          </div>

          <div className="form-group">
            <label>Role</label>
            <input value={form.role} onChange={set('role')} placeholder="e.g. Event Coordinator" />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="form-group span-2">
            <label>Skills</label>
            <input value={form.skills} onChange={set('skills')} placeholder="Photography, Event planning, Web design" />
          </div>
          <div className="form-group">
            <label>Availability</label>
            <input value={form.availability} onChange={set('availability')} placeholder="Weekends" />
          </div>
          <div className="form-group">
            <label>Total Hours Volunteered</label>
            <input type="number" value={form.hours_total} onChange={set('hours_total')} min="0" step="0.5" />
          </div>
          <div className="form-group">
            <label>Joined Date</label>
            <input type="date" value={form.joined_date} onChange={set('joined_date')} />
          </div>
          <div className="form-group span-2">
            <label>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', padding: '0 1.5rem 1.25rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? <><span className="spinner" />Saving…</> : isEdit ? 'Save Changes' : 'Add Volunteer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VolunteersPage() {
  const { toasts, show } = useToast();
  const { secret, logout } = useAdminAuth();
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editV, setEditV] = useState(null);

  const load = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ search: opts.search ?? search, status: opts.status ?? filterStatus });
      const res = await fetch(`/api/volunteers?${qs}`, { headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) { setVolunteers(data.data); setStats(data.stats); }
      else show(data.message, 'error');
    } catch { show('Error loading volunteers', 'error'); }
    setLoading(false);
  }, [secret, search, filterStatus, show]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setTimeout(() => load({ search }), 380); return () => clearTimeout(t); }, [search]);

  const handleDelete = async id => {
    if (!confirm('Remove this volunteer?')) return;
    try {
      const r = await fetch(`/api/volunteers/${id}`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      const d = await r.json();
      if (d.success) { setVolunteers(p => p.filter(x => x.id !== id)); show('Removed'); load(); }
      else show(d.message, 'error');
    } catch {}
  };

  const handleSave = (saved, isEdit) => {
    if (isEdit) setVolunteers(p => p.map(x => x.id === saved.id ? saved : x));
    else setVolunteers(p => [saved, ...p]);
    show(isEdit ? 'Volunteer updated!' : 'Volunteer added!');
    load();
  };

  const displayName = v => {
    if (v.first_name || v.last_name) return [v.first_name, v.last_name].filter(Boolean).join(' ');
    return v.name || '—';
  };

  const totalHours = volunteers.reduce((a, v) => a + parseFloat(v.hours_total || 0), 0);

  return (
    <>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <div className="admin-topbar">
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--navy)', fontWeight: 600 }}>Volunteers Management</div>
              <div className="text-sm text-muted">स्वयंसेवक · {stats.active} active · {totalHours.toFixed(0)} total hours</div>
            </div>
            <div style={{ display: 'flex', gap: '.65rem' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Volunteer</button>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
            </div>
          </div>

          <div className="admin-content">
            {/* Stats */}
            <div className="stats-grid">
              {[
                { label: 'Total', num: stats.total, color: 'var(--saffron)' },
                { label: 'Active', num: stats.active, color: 'var(--forest)' },
                { label: 'Inactive', num: stats.inactive, color: 'var(--gold)' },
                { label: 'Total Hours', num: totalHours.toFixed(0), color: '#185FA5' },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍  Search name, email, role, skills…"
                style={{ flex: '1 1 200px', maxWidth: 320 }}
              />
              <div className="filter-bar" style={{ marginBottom: 0 }}>
                {[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([v, l]) => (
                  <button key={v} className={`filter-btn${filterStatus === v ? ' active' : ''}`}
                    onClick={() => { setFilterStatus(v); load({ status: v }); }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="loading-state"><span className="spinner" />Loading…</div>
            ) : volunteers.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🙋</div>
                <p>No volunteers yet.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setShowAdd(true)}>
                  + Add First Volunteer
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Hours</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers.map(v => (
                      <tr key={v.id}>
                        <td className="text-xs text-muted">{v.id}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--navy)' }}>{displayName(v)}</div>
                          {v.skills && <div className="text-xs text-muted">🛠 {v.skills}</div>}
                        </td>
                        <td className="text-sm">{v.email || '—'}</td>
                        <td className="text-sm text-muted">{v.phone || '—'}</td>
                        <td className="text-sm text-muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.address || '—'}</td>
                        <td className="text-sm text-muted">{v.role || '—'}</td>
                        <td>
                          <span className="badge" style={{
                            background: v.status === 'active' ? 'var(--forest-light)' : 'var(--paper-3)',
                            color: v.status === 'active' ? 'var(--forest)' : 'var(--ink-soft)',
                          }}>{v.status}</span>
                        </td>
                        <td className="text-sm text-muted">{parseFloat(v.hours_total || 0).toFixed(0)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '.3rem' }}>
                            <button className="btn btn-primary btn-sm" style={{ padding: '.3rem .6rem' }} onClick={() => setEditV(v)} title="Edit">✏️</button>
                            <button className="btn btn-danger btn-sm" style={{ padding: '.3rem .6rem' }} onClick={() => handleDelete(v.id)} title="Remove">🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdd && <VolunteerModal volunteer={null} secret={secret} onClose={() => setShowAdd(false)} onSave={handleSave} />}
      {editV && <VolunteerModal volunteer={editV} secret={secret} onClose={() => setEditV(null)} onSave={handleSave} />}
      <Toast toasts={toasts} />
    </>
  );
}
