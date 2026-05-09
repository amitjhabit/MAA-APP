'use client';
// app/admin/about/page.js
import { useState, useCallback, useEffect } from 'react';

function useToast() { const [t, setT] = useState([]); const show = useCallback((msg, type = 'success') => { const id = Date.now(); setT(p => [...p, { id, msg, type }]); setTimeout(() => setT(p => p.filter(x => x.id !== id)), 3500); }, []); return { toasts: t, show }; }
function Toast({ toasts }) { return <div className="toast-wrap">{toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>; }

function Sidebar() {
  const NL = ({ href, icon, label, a }) => <a href={href} className={`admin-nav-link${a ? ' active' : ''}`}><span className="nav-icon">{icon}</span>{label}</a>;
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand"><div className="logo-text">MAA CRM</div><div className="logo-sub">मैथिल एसोसिएशन</div></div>
      <nav className="admin-nav">
        <div className="admin-nav-section">Main</div>
        <NL href="/admin" icon="🏠" label="Dashboard" />
        <NL href="/admin/members" icon="👥" label="Members" />
        <NL href="/admin/events" icon="📅" label="Events" />
        <NL href="/admin/donations" icon="💰" label="Donations" />
        <div className="admin-nav-section">Content</div>
        <NL href="/admin/news" icon="📰" label="News" />
        <NL href="/admin/gallery" icon="🖼️" label="Gallery" />
        <NL href="/admin/about" icon="ℹ️" label="About Us" a />
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

const TYPE_LABELS = {
  paragraph:  { label: 'About Paragraph', icon: '📝', color: 'var(--navy)' },
  quote:      { label: 'Closing Quote',   icon: '💬', color: 'var(--gold)' },
  core_value: { label: 'Core Value',      icon: '⭐', color: 'var(--saffron)' },
  activity:   { label: 'What We Do',      icon: '🎯', color: 'var(--forest)' },
};

const BLANK = { type: 'paragraph', icon: '', title: '', content: '', sort_order: '0', is_active: true };

function ItemModal({ item, secret, onClose, onSave }) {
  const isEdit = !!item;
  const [form, setForm] = useState(isEdit ? { ...item, sort_order: String(item.sort_order || 0) } : { ...BLANK });
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const needsIcon  = form.type === 'core_value' || form.type === 'activity';
  const needsTitle = form.type !== 'paragraph';

  const submit = async () => {
    if (!form.content.trim()) { alert('Content is required.'); return; }
    setBusy(true);
    try {
      const url = isEdit ? `/api/admin/about/${item.id}` : '/api/admin/about';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ ...form, sort_order: parseInt(form.sort_order) || 0 }),
      });
      const data = await res.json();
      if (data.success) { onSave(data.data, isEdit); onClose(); }
      else alert(data.message);
    } catch { alert('Network error'); }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Item' : 'Add Content Item'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="form-grid">
          <div className="form-group"><label>Section Type</label>
            <select value={form.type} onChange={set('type')} disabled={isEdit}>
              <option value="paragraph">📝 About Paragraph</option>
              <option value="quote">💬 Closing Quote</option>
              <option value="core_value">⭐ Core Value</option>
              <option value="activity">🎯 What We Do</option>
            </select>
          </div>
          <div className="form-group"><label>Sort Order</label>
            <input type="number" value={form.sort_order} onChange={set('sort_order')} min="0" />
          </div>

          {needsIcon && (
            <div className="form-group"><label>Icon (emoji)</label>
              <input value={form.icon} onChange={set('icon')} placeholder="🌍" maxLength={4} />
            </div>
          )}

          {needsTitle && (
            <div className={`form-group${needsIcon ? '' : ' span-2'}`}><label>Title</label>
              <input value={form.title} onChange={set('title')} placeholder={form.type === 'quote' ? 'Optional quote attribution' : 'e.g. Cultural Representation'} />
            </div>
          )}

          <div className="form-group span-2">
            <label>Content <span className="req">*</span></label>
            <textarea value={form.content} onChange={set('content')} rows={form.type === 'paragraph' ? 5 : 3}
              placeholder={
                form.type === 'paragraph' ? 'Write the paragraph text here…' :
                form.type === 'quote' ? 'Enter the quote text…' :
                'Brief description (1-2 sentences)'
              }
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', paddingTop: '1.2rem' }}>
            <input type="checkbox" checked={form.is_active} onChange={set('is_active')} style={{ width: 'auto' }} id="is_active" />
            <label htmlFor="is_active" style={{ marginBottom: 0 }}>Visible on public page</label>
          </div>
        </div>

        {/* Live preview for quotes */}
        {form.type === 'quote' && form.content && (
          <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem', marginTop: '.75rem', borderLeft: '4px solid var(--saffron)' }}>
            <div style={{ color: 'var(--gold)', fontSize: '1.3rem', lineHeight: 1 }}>"</div>
            <p style={{ color: 'rgba(255,255,255,.9)', fontFamily: 'var(--serif)', fontStyle: 'italic', margin: '.25rem 0', fontSize: '.95rem' }}>{form.content}</p>
            <div style={{ color: 'var(--gold)', fontSize: '1.3rem', textAlign: 'right', lineHeight: 1 }}>"</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? <><span className="spinner" />Saving…</> : isEdit ? 'Save Changes' : 'Add Item'}</button>
        </div>
      </div>
    </div>
  );
}

const SECTIONS = [
  { type: 'paragraph',  label: 'About Paragraphs',  icon: '📝', hint: 'Main description text shown at the top of the About page.' },
  { type: 'quote',      label: 'Closing Quote',      icon: '💬', hint: 'The highlighted quote block (only the first active one is shown).' },
  { type: 'core_value', label: 'Core Values',        icon: '⭐', hint: '"Our Core Values" grid — each card has an icon, title, and description.' },
  { type: 'activity',   label: 'What We Do',         icon: '🎯', hint: '"What We Do" grid — each card has an icon, title, and description.' },
];

export default function AdminAboutPage() {
  const { toasts, show } = useToast();
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showAdd, setShowAdd] = useState(null); // type string
  const [editItem, setEditItem] = useState(null);

  const seed = useCallback(async (s) => {
    try {
      const res = await fetch('/api/admin/about', { method: 'PUT', headers: { 'x-admin-secret': s } });
      const data = await res.json();
      if (data.success) show(`✅ ${data.message}`, 'success');
    } catch {}
  }, [show]);

  const load = useCallback(async (s) => {
    const sec = s || secret;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/about', { headers: { 'x-admin-secret': sec } });
      const data = await res.json();
      if (data.success) {
        // Auto-seed if table is empty
        if (data.data.length === 0) {
          await seed(sec);
          // Reload after seeding
          const res2 = await fetch('/api/admin/about', { headers: { 'x-admin-secret': sec } });
          const data2 = await res2.json();
          if (data2.success) setItems(data2.data);
        } else {
          setItems(data.data);
        }
      } else show(data.message, 'error');
    } catch { show('Error loading', 'error'); }
    setLoading(false);
  }, [secret, show, seed]);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  const seedDefaults = async () => {
    if (!confirm('This will populate the About page with default content. Continue?')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/about', { method: 'PUT', headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) { show(`✅ ${data.message}`, 'success'); load(); }
      else show(data.message, 'error');
    } catch { show('Seed failed', 'error'); }
    setSeeding(false);
  };

  const handleLogin = async e => {
    e.preventDefault(); setAuthBusy(true); setAuthErr('');
    try {
      const r = await fetch('/api/admin/about', { headers: { 'x-admin-secret': secret } });
      if (r.ok) { setAuthed(true); load(secret); } else setAuthErr('Invalid password.');
    } catch { setAuthErr('Network error.'); }
    setAuthBusy(false);
  };

  const handleSave = (saved, isEdit) => {
    if (isEdit) setItems(p => p.map(x => x.id === saved.id ? saved : x));
    else setItems(p => [...p, saved]);
    show(isEdit ? 'Updated!' : 'Added!');
  };

  const handleDelete = async item => {
    if (!confirm(`Delete "${item.title || item.content.slice(0, 40)}…"?`)) return;
    try {
      const r = await fetch(`/api/admin/about/${item.id}`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      const d = await r.json();
      if (d.success) { setItems(p => p.filter(x => x.id !== item.id)); show('Deleted'); }
      else show(d.message, 'error');
    } catch { show('Error', 'error'); }
  };

  const toggleActive = async item => {
    try {
      const r = await fetch(`/api/admin/about/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret }, body: JSON.stringify({ is_active: !item.is_active }) });
      const d = await r.json();
      if (d.success) { setItems(p => p.map(x => x.id === item.id ? d.data : x)); show(d.data.is_active ? 'Visible' : 'Hidden'); }
    } catch {}
  };

  if (!authed) return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>ℹ️</div>
        <h2>About Us</h2>
        <p>MAA Admin — About Page Content</p>
        {authErr && <div style={{ background: 'var(--crimson-light)', borderRadius: 'var(--radius)', padding: '.7rem', marginBottom: '1rem', color: 'var(--crimson)', fontSize: '.82rem' }}>{authErr}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1rem' }}><label>Admin Password</label><input type="password" value={secret} onChange={e => setSecret(e.target.value)} autoFocus /></div>
          <button type="submit" className="btn btn-primary w-full" disabled={authBusy}>{authBusy ? 'Verifying…' : 'Enter →'}</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}><a href="/admin" style={{ color: 'var(--saffron)', fontSize: '.85rem' }}>← Dashboard</a></div>
      </div>
    </div>
  );

  return (
    <>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <div className="admin-topbar">
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--navy)', fontWeight: 600 }}>About Us Content</div>
              <div className="text-sm text-muted">ℹ️ Manage all sections of the public About page</div>
            </div>
            <div style={{ display: 'flex', gap: '.65rem', alignItems: 'center' }}>
              <span style={{ fontSize: '.75rem', padding: '.25rem .65rem', borderRadius: 20, background: items.length > 0 ? 'var(--forest-light)' : 'var(--paper-3)', color: items.length > 0 ? 'var(--forest)' : 'var(--ink-dim)', fontWeight: 600 }}>
                {items.length > 0 ? `✅ ${items.length} items in DB` : '⚠️ DB empty — using defaults'}
              </span>
              {items.length === 0 && (
                <button className="btn btn-gold btn-sm" onClick={seedDefaults} disabled={seeding}>
                  {seeding ? <><span className="spinner" />Seeding…</> : '🌱 Seed Default Content'}
                </button>
              )}
              <a href="/about" target="_blank" className="btn btn-ghost btn-sm">View Public Page ↗</a>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAuthed(false); setSecret(''); }}>Sign Out</button>
            </div>
          </div>

          <div className="admin-content">
            {loading ? (
              <div className="loading-state"><span className="spinner" />Loading…</div>
            ) : (
              SECTIONS.map(section => {
                const sectionItems = items.filter(i => i.type === section.type);
                return (
                  <div key={section.type} style={{ marginBottom: '2.5rem' }}>
                    {/* Section header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem', paddingBottom: '.6rem', borderBottom: '2px solid var(--border)' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--navy)', fontWeight: 600 }}>{section.icon} {section.label}</div>
                        <div className="text-xs text-muted" style={{ marginTop: '.15rem' }}>{section.hint}</div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(section.type)}>+ Add</button>
                    </div>

                    {/* Items */}
                    {sectionItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--ink-dim)', fontSize: '.875rem', background: 'var(--paper-2)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                        No items yet — click <strong>+ Add</strong> to create one
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                        {sectionItems.map(item => (
                          <div key={item.id} className="card" style={{ padding: '.85rem 1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', opacity: item.is_active ? 1 : 0.55, borderLeft: `3px solid ${TYPE_LABELS[item.type]?.color || 'var(--border)'}` }}>
                            {item.icon && <div style={{ fontSize: '1.6rem', flexShrink: 0, lineHeight: 1, marginTop: '.1rem' }}>{item.icon}</div>}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {item.title && <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '.2rem', fontSize: '.9rem' }}>{item.title}</div>}
                              <div className="text-sm text-muted" style={{ lineHeight: 1.6 }}>{item.content.slice(0, 160)}{item.content.length > 160 ? '…' : ''}</div>
                              <div style={{ marginTop: '.35rem', display: 'flex', gap: '.35rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '.7rem', color: item.is_active ? 'var(--forest)' : 'var(--ink-dim)', fontWeight: 600 }}>{item.is_active ? '● Visible' : '○ Hidden'}</span>
                                <span className="text-xs text-muted">· Order: {item.sort_order}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '.35rem', flexShrink: 0 }}>
                              <button className="btn btn-ghost btn-sm" style={{ fontSize: '.72rem' }} onClick={() => toggleActive(item)}>{item.is_active ? 'Hide' : 'Show'}</button>
                              <button className="btn btn-primary btn-sm" style={{ fontSize: '.72rem' }} onClick={() => setEditItem(item)}>✏️</button>
                              <button className="btn btn-danger btn-sm" style={{ fontSize: '.72rem' }} onClick={() => handleDelete(item)}>🗑</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <ItemModal
          item={null}
          secret={secret}
          onClose={() => setShowAdd(null)}
          onSave={(saved) => { handleSave(saved, false); setShowAdd(null); }}
        />
      )}
      {editItem && (
        <ItemModal
          item={{ ...editItem, type: showAdd || editItem.type }}
          secret={secret}
          onClose={() => setEditItem(null)}
          onSave={(saved) => { handleSave(saved, true); setEditItem(null); }}
        />
      )}

      <Toast toasts={toasts} />
    </>
  );
}
