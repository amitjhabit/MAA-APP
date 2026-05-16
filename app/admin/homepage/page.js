'use client';
// app/admin/homepage/page.js
import { useState, useCallback, useEffect } from 'react';
import { useAdminAuth } from '@/app/admin/layout';

function useToast(){const[t,setT]=useState([]);const show=useCallback((msg,type='success')=>{const id=Date.now();setT(p=>[...p,{id,msg,type}]);setTimeout(()=>setT(p=>p.filter(x=>x.id!==id)),3500);},[]);return{toasts:t,show};}
function Toast({toasts}){return<div className="toast-wrap">{toasts.map(t=><div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;}
function Sidebar(){const NL=({href,icon,label,a})=><a href={href} className={`admin-nav-link${a?' active':''}`}><span className="nav-icon">{icon}</span>{label}</a>;return(<aside className="admin-sidebar"><div className="admin-sidebar-brand"><img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}} /><div className="logo-sub">मैथिल एसोसिएशन</div></div><nav className="admin-nav"><div className="admin-nav-section">Main</div><NL href="/admin" icon="🏠" label="Dashboard"/><NL href="/admin/members" icon="👥" label="Members"/><NL href="/admin/events" icon="📅" label="Events"/><NL href="/admin/donations" icon="💰" label="Donations"/><NL href="/admin/finance" icon="📊" label="Finance"/><NL href="/admin/analytics" icon="📈" label="Analytics"/><div className="admin-nav-section">Content</div><NL href="/admin/news" icon="📰" label="News"/><NL href="/admin/gallery" icon="🖼️" label="Gallery"/><NL href="/admin/homepage" icon="🏡" label="Home" a/><NL href="/admin/about" icon="📝" label="About Us"/><div className="admin-nav-section">Organization</div><NL href="/admin/volunteers" icon="🙋" label="Volunteers"/><NL href="/admin/committee" icon="🏛️" label="Committee"/><NL href="/admin/inquiries" icon="✉️" label="Inquiries"/><div className="admin-nav-section">Settings</div><NL href="/" icon="🌐" label="Public Site"/></nav></aside>);}

const SECTIONS = [
  {
    key: 'hero',
    label: 'Hero Banner',
    icon: '🏠',
    hint: 'The large dark banner at the very top of the homepage.',
    fields: [
      { key: 'eyebrow',        label: 'Eyebrow Text',            type: 'input',    default: 'Est. 2004 · Connecting Communities' },
      { key: 'title',          label: 'Main Title (English)',     type: 'input',    default: 'Celebrating Maithili Culture & Heritage' },
      { key: 'title_maithili', label: 'Title in Maithili',       type: 'input',    default: 'मैथिली संस्कृति आ विरासतक उत्सव' },
      { key: 'subtitle',       label: 'Subtitle / Description',  type: 'textarea', default: 'Uniting the Maithili-speaking community across America — preserving our language, traditions, and cultural identity for future generations.' },
    ],
  },
];

export default function AdminHomepagePage() {
  const { toasts, show } = useToast();
  const { secret, logout } = useAdminAuth();
  const [content, setContent] = useState({});
  const [localValues, setLocalValues] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/homepage', { headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) {
        const map = {};
        for (const row of data.data) map[`${row.section}.${row.key}`] = row.value;
        setContent(map);
        setLocalValues(map);
      } else show(data.message, 'error');
    } catch { show('Error loading', 'error'); }
    setLoading(false);
  }, [secret, show]);

  useEffect(() => { load(); }, [load]);

  const getVal = (section, key, def) => {
    const k = `${section}.${key}`;
    return localValues[k] !== undefined ? localValues[k] : def;
  };

  const setVal = (section, key, value) =>
    setLocalValues(p => ({ ...p, [`${section}.${key}`]: value }));

  const saveSection = async (sectionKey) => {
    const section = SECTIONS.find(s => s.key === sectionKey);
    if (!section) return;
    setSaving(p => ({ ...p, [sectionKey]: true }));
    try {
      const items = section.fields.map(f => ({
        section: sectionKey, key: f.key,
        value: getVal(sectionKey, f.key, f.default),
      }));
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        const map = { ...content };
        for (const row of data.data) map[`${row.section}.${row.key}`] = row.value;
        setContent(map);
        show('Section saved! Refresh the homepage to see changes.');
      } else show(data.message, 'error');
    } catch { show('Save failed', 'error'); }
    setSaving(p => ({ ...p, [sectionKey]: false }));
  };

  const resetSection = (sectionKey) => {
    const section = SECTIONS.find(s => s.key === sectionKey);
    if (!section) return;
    const updates = {};
    for (const f of section.fields) updates[`${sectionKey}.${f.key}`] = f.default;
    setLocalValues(p => ({ ...p, ...updates }));
  };

  const isDirty = (sectionKey) => {
    const section = SECTIONS.find(s => s.key === sectionKey);
    if (!section) return false;
    return section.fields.some(f => {
      const k = `${sectionKey}.${f.key}`;
      return localValues[k] !== content[k];
    });
  };

  return (
    <>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <div className="admin-topbar">
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--navy)', fontWeight: 600 }}>Home Content</div>
              <div className="text-sm text-muted">🏡 Edit hero text, CTA banners, and section copy</div>
            </div>
            <div style={{ display: 'flex', gap: '.65rem' }}>
              <a href="/" target="_blank" className="btn btn-ghost btn-sm">View Home ↗</a>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
            </div>
          </div>

          <div className="admin-content">
            {loading ? (
              <div className="loading-state"><span className="spinner" />Loading…</div>
            ) : (
              SECTIONS.map(section => (
                <div key={section.key} style={{ marginBottom: '2rem' }}>
                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem', paddingBottom: '.6rem', borderBottom: '2px solid var(--border)' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--navy)', fontWeight: 600 }}>{section.icon} {section.label}</div>
                      <div className="text-xs text-muted" style={{ marginTop: '.15rem' }}>{section.hint}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => resetSection(section.key)} title="Restore default text">↺ Reset</button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => saveSection(section.key)}
                        disabled={saving[section.key] || !isDirty(section.key)}
                      >
                        {saving[section.key] ? <><span className="spinner" />Saving…</> : isDirty(section.key) ? '💾 Save' : '✓ Saved'}
                      </button>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {section.fields.map(field => (
                      <div key={field.key} className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--navy)', marginBottom: '.3rem', display: 'block' }}>{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea
                            rows={3}
                            value={getVal(section.key, field.key, field.default)}
                            onChange={e => setVal(section.key, field.key, e.target.value)}
                            placeholder={field.default}
                            style={{ width: '100%' }}
                          />
                        ) : (
                          <input
                            value={getVal(section.key, field.key, field.default)}
                            onChange={e => setVal(section.key, field.key, e.target.value)}
                            placeholder={field.default}
                            style={{ width: '100%' }}
                          />
                        )}
                        <div className="text-xs text-muted" style={{ marginTop: '.25rem' }}>
                          Default: <em style={{ color: 'var(--ink-dim)' }}>{field.default}</em>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Toast toasts={toasts} />
    </>
  );
}
