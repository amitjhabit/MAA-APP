'use client';
// app/admin/mithila/page.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAdminAuth } from '@/app/admin/layout';

function useToast() {
  const [t, setT] = useState([]);
  const show = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setT(p => [...p, { id, msg, type }]);
    setTimeout(() => setT(p => p.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts: t, show };
}
function Toast({ toasts }) {
  return <div className="toast-wrap">{toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;
}

const SECTIONS = ['intro', 'geography', 'language', 'culture', 'diaspora'];
const SECTION_LABELS = { intro: 'Overview', geography: 'Geographic Footprint', language: 'Language & Script', culture: 'Cultural Pillars', diaspora: 'Global Diaspora' };
const SECTION_COLORS = { intro: 'var(--navy)', geography: 'var(--saffron)', language: 'var(--gold)', culture: 'var(--crimson)', diaspora: 'var(--forest)' };

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
        <NL href="/admin/mithila" icon="🗺️" label="Mithila" a />
        <div className="admin-nav-section">Organization</div>
        <NL href="/admin/volunteers" icon="🙋" label="Volunteers" />
        <NL href="/admin/committee" icon="🏛️" label="Committee" />
        <NL href="/admin/inquiries" icon="✉️" label="Inquiries" />
        <div className="admin-nav-section">Settings</div>
        <NL href="/" icon="🌐" label="Public Site" />
      </nav>
    </aside>
  );
}

function ContentModal({ item, secret, onClose, onSave }) {
  const isEdit = !!item;
  const blank = { section: 'culture', title: '', title_maithili: '', content: '', content_maithili: '', icon: '', image_url: '', sort_order: 0, is_active: true };
  const [form, setForm] = useState(isEdit ? { ...blank, ...item, sort_order: item.sort_order ?? 0, is_active: item.is_active ?? true } : blank);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleFileUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder_path', 'mithila');
      const r = await fetch('/api/gallery/upload', { method: 'POST', headers: { 'x-admin-secret': secret }, body: fd });
      const d = await r.json();
      if (d.success) setForm(p => ({ ...p, image_url: d.url }));
      else alert(d.message || 'Upload failed');
    } catch { alert('Upload error. On Vercel, the filesystem is read-only — use an external URL instead.'); }
    setUploading(false);
    e.target.value = '';
  };

  const submit = async () => {
    if (!form.content.trim()) { alert('Content is required.'); return; }
    setBusy(true);
    try {
      const res = await fetch(isEdit ? `/api/mithila/${item.id}` : '/api/mithila', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ ...form, sort_order: parseInt(form.sort_order) || 0 }),
      });
      const data = await res.json();
      if (data.success) { onSave(data.data, isEdit); onClose(); }
      else alert(data.message || 'Error saving');
    } catch { alert('Network error'); }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? `Edit — ${item.title || 'Content'}` : '✨ Add Content'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Section <span className="req">*</span></label>
            <select value={form.section} onChange={set('section')}>
              {SECTIONS.map(s => <option key={s} value={s}>{SECTION_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Icon (emoji)</label>
            <input value={form.icon} onChange={set('icon')} placeholder="🎨" maxLength={8} />
          </div>
          <div className="form-group">
            <label>Sort Order</label>
            <input type="number" value={form.sort_order} onChange={set('sort_order')} min={0} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '.75rem', paddingTop: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', margin: 0 }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
              Active (visible on site)
            </label>
          </div>
          <div className="form-group span-2">
            <label>Title (English)</label>
            <input value={form.title} onChange={set('title')} placeholder="e.g. Mithila Painting" />
          </div>
          <div className="form-group span-2">
            <label>Title in Maithili (मैथिली)</label>
            <input value={form.title_maithili} onChange={set('title_maithili')} placeholder="मैथिली शीर्षक" />
          </div>
          <div className="form-group span-2">
            <label>Content (English) <span className="req">*</span></label>
            <textarea value={form.content} onChange={set('content')} rows={4} placeholder="Content text…" />
          </div>
          <div className="form-group span-2">
            <label>Content in Maithili (optional)</label>
            <textarea value={form.content_maithili} onChange={set('content_maithili')} rows={3} placeholder="मैथिली में सामग्री…" />
          </div>
          <div className="form-group span-2">
            <label>Image</label>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <input value={form.image_url} onChange={set('image_url')} placeholder="/images/gallery/… or paste external URL" style={{ flex: 1 }} />
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {uploading ? <><span className="spinner" />Uploading…</> : '📁 Upload'}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            {form.image_url && (
              <div style={{ marginTop: '.5rem', display: 'flex', alignItems: 'flex-start', gap: '.75rem' }}>
                <img src={form.image_url} alt="preview" style={{ maxHeight: 120, maxWidth: 200, borderRadius: 6, border: '1px solid var(--border)', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--crimson)' }} onClick={() => setForm(p => ({ ...p, image_url: '' }))}>Remove</button>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy || uploading}>
            {busy ? <><span className="spinner" />Saving…</> : isEdit ? 'Save Changes' : 'Add Content'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MithilaAdminPage() {
  const { toasts, show } = useToast();
  const { secret, logout } = useAdminAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, intro: 0, geography: 0, language: 0, culture: 0, diaspora: 0 });
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [filterSection, setFilterSection] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ ...(filterSection !== 'all' ? { section: filterSection } : {}) });
      const res = await fetch(`/api/mithila?${qs}`, { headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) { setItems(data.data); setStats(data.stats); }
      else show(data.message, 'error');
    } catch { show('Load error', 'error'); }
    setLoading(false);
  }, [secret, filterSection, show]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async id => {
    if (!confirm('Delete this content item?')) return;
    try {
      const r = await fetch(`/api/mithila/${id}`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      const d = await r.json();
      if (d.success) { setItems(p => p.filter(x => x.id !== id)); show('Deleted'); load(); }
      else show(d.message, 'error');
    } catch { show('Error', 'error'); }
  };

  const handleToggle = async item => {
    try {
      const r = await fetch(`/api/mithila/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      const d = await r.json();
      if (d.success) { setItems(p => p.map(x => x.id === item.id ? d.data : x)); show(d.data.is_active ? 'Now visible' : 'Hidden'); }
    } catch { show('Error', 'error'); }
  };

  const handleSeed = async (force = false) => {
    if (force && !confirm('This will DELETE all existing Mithila content and restore the 9 defaults. Continue?')) return;
    setSeeding(true);
    try {
      const url = force ? '/api/mithila/seed?force=1' : '/api/mithila/seed';
      const r = await fetch(url, { method: 'POST', headers: { 'x-admin-secret': secret } });
      const d = await r.json();
      if (d.success) { show(d.message); load(); }
      else show(d.message, 'error');
    } catch { show('Seed error', 'error'); }
    setSeeding(false);
  };

  const handleSave = (saved, isEdit) => {
    if (isEdit) setItems(p => p.map(x => x.id === saved.id ? saved : x));
    else setItems(p => [...p, saved]);
    show(isEdit ? 'Updated!' : 'Added!');
    load();
  };

  const displayed = filterSection === 'all' ? items : items.filter(x => x.section === filterSection);

  return (
    <>
      <Toast toasts={toasts} />
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <div className="admin-topbar">
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--navy)', fontWeight: 600 }}>Mithila Page Content</div>
              <div className="text-sm text-muted">मिथिला पृष्ठ · {stats.total} items · <a href="/mithila" target="_blank" style={{ color: 'var(--saffron)' }}>View page ↗</a></div>
            </div>
            <div style={{ display: 'flex', gap: '.65rem' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Content</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleSeed(false)} disabled={seeding} title="Insert the 9 default items (only if table is empty)">
                {seeding ? <><span className="spinner" />Seeding…</> : '🌱 Seed Defaults'}
              </button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--crimson)' }} onClick={() => handleSeed(true)} disabled={seeding} title="Delete all and restore 9 defaults">
                ↺ Reset
              </button>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
            </div>
          </div>

          <div className="admin-content">
            {/* Stats */}
            <div className="stats-grid">
              {[
                { label: 'Total', num: stats.total, color: 'var(--navy)' },
                { label: 'Intro', num: stats.intro, color: SECTION_COLORS.intro },
                { label: 'Geography', num: stats.geography, color: SECTION_COLORS.geography },
                { label: 'Language', num: stats.language, color: SECTION_COLORS.language },
                { label: 'Culture', num: stats.culture, color: SECTION_COLORS.culture },
                { label: 'Diaspora', num: stats.diaspora, color: SECTION_COLORS.diaspora },
              ].map(s => (
                <div className="stat-card" key={s.label} style={{ cursor: 'pointer' }} onClick={() => setFilterSection(s.label.toLowerCase() === 'total' ? 'all' : s.label.toLowerCase())}>
                  <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Section filter tabs */}
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {[['all', 'All Sections'], ...SECTIONS.map(s => [s, SECTION_LABELS[s]])].map(([val, label]) => (
                <button key={val} className={`btn btn-sm ${filterSection === val ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterSection(val)}>
                  {label}
                </button>
              ))}
            </div>

            {/* Content list */}
            {loading ? (
              <div className="loading-state"><span className="spinner" />Loading…</div>
            ) : displayed.length === 0 ? (
              <div className="empty-state" style={{ flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '2.5rem' }}>📭</div>
                <div style={{ fontWeight: 600, color: 'var(--navy)' }}>No content yet</div>
                <p style={{ fontSize: '.875rem', color: 'var(--ink-dim)', margin: 0, maxWidth: 340, textAlign: 'center' }}>
                  Seed the 9 default items to populate this page, or add content manually.
                </p>
                <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => handleSeed(false)} disabled={seeding}>
                    {seeding ? <><span className="spinner" />Seeding…</> : '🌱 Seed Default Content'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setShowAdd(true)}>+ Add Manually</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                {displayed.map(item => (
                  <div key={item.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem 1.25rem', opacity: item.is_active ? 1 : 0.55 }}>
                    {/* Image thumbnail */}
                    {item.image_url ? (
                      <img src={item.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                        {item.icon || '📄'}
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                        <span style={{ background: SECTION_COLORS[item.section], color: '#fff', borderRadius: 4, padding: '1px 7px', fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                          {SECTION_LABELS[item.section]}
                        </span>
                        {item.icon && <span style={{ fontSize: '1rem' }}>{item.icon}</span>}
                        {!item.is_active && <span style={{ background: 'var(--paper-3)', color: 'var(--ink-dim)', borderRadius: 4, padding: '1px 7px', fontSize: '.7rem' }}>Hidden</span>}
                        <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>Sort: {item.sort_order}</span>
                      </div>
                      {item.title && <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--navy)', fontSize: '.9rem', marginBottom: '.2rem' }}>{item.title}</div>}
                      {item.title_maithili && <div style={{ color: 'var(--gold)', fontSize: '.78rem', marginBottom: '.25rem' }}>{item.title_maithili}</div>}
                      <p className="text-sm text-muted" style={{ margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.content}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(item)} title={item.is_active ? 'Hide' : 'Show'}>
                        {item.is_active ? '👁️' : '🙈'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditItem(item)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdd && <ContentModal secret={secret} onClose={() => setShowAdd(false)} onSave={handleSave} />}
      {editItem && <ContentModal item={editItem} secret={secret} onClose={() => setEditItem(null)} onSave={handleSave} />}
    </>
  );
}
