'use client';
// app/admin/gallery/page.js
import { useState, useCallback, useEffect, useRef } from 'react';
function useToast(){const[t,setT]=useState([]);const show=useCallback((msg,type='success')=>{const id=Date.now();setT(p=>[...p,{id,msg,type}]);setTimeout(()=>setT(p=>p.filter(x=>x.id!==id)),3500);},[]);return{toasts:t,show};}
function Toast({toasts}){return<div className="toast-wrap">{toasts.map(t=><div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;}
function Sidebar(){const NL=({href,icon,label,a})=><a href={href} className={`admin-nav-link${a?' active':''}`}><span className="nav-icon">{icon}</span>{label}</a>;return(<aside className="admin-sidebar"><div className="admin-sidebar-brand"><div className="logo-text">MAA CRM</div><div className="logo-sub">मैथिल एसोसिएशन</div></div><nav className="admin-nav"><div className="admin-nav-section">Main</div><NL href="/admin" icon="🏠" label="Dashboard"/><NL href="/admin/members" icon="👥" label="Members"/><NL href="/admin/events" icon="📅" label="Events"/><NL href="/admin/donations" icon="💰" label="Donations"/><div className="admin-nav-section">Content</div><NL href="/admin/news" icon="📰" label="News"/><NL href="/admin/gallery" icon="🖼️" label="Gallery" a/><div className="admin-nav-section">Organization</div><NL href="/admin/volunteers" icon="🙋" label="Volunteers"/><NL href="/admin/committee" icon="🏛️" label="Committee"/><NL href="/admin/inquiries" icon="✉️" label="Inquiries"/><div className="admin-nav-section">Settings</div><NL href="/" icon="🌐" label="Public Site"/></nav></aside>);}

function Modal({ photo, secret, onClose, onSave }) {
  const isEdit = !!photo;
  const blank = { image_url: '', title: '', description: '', category: 'general', is_featured: false, sort_order: '0', uploaded_by: '' };
  const [form, setForm] = useState(isEdit ? { ...blank, ...photo, sort_order: String(photo.sort_order || 0) } : blank);
  const [busy, setBusy] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [preview, setPreview] = useState(isEdit ? photo.image_url : '');
  const fileRef = useRef();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleFileChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadErr('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/gallery/upload', { method: 'POST', headers: { 'x-admin-secret': secret }, body: fd });
      const data = await res.json();
      if (data.success) {
        setForm(p => ({ ...p, image_url: data.url }));
        setPreview(data.url);
      } else {
        setUploadErr(data.message || 'Upload failed.');
      }
    } catch {
      setUploadErr('Network error during upload.');
    }
    setUploading(false);
  };

  const handleUrlChange = e => {
    setForm(p => ({ ...p, image_url: e.target.value }));
    setPreview(e.target.value);
  };

  const submit = async () => {
    if (!form.image_url) { setUploadErr('Please upload an image or enter a URL.'); return; }
    setBusy(true);
    try {
      const res = await fetch(isEdit ? `/api/gallery/${photo.id}` : '/api/gallery', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ ...form, sort_order: parseInt(form.sort_order) || 0 }),
      });
      const data = await res.json();
      if (data.success) { onSave(data.data, isEdit); onClose(); }
      else alert(data.message);
    } catch {}
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Photo' : '🖼️ Add Photo'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Upload mode tabs */}
        <div style={{ display: 'flex', gap: '.35rem', marginBottom: '1rem', background: 'var(--paper-2)', borderRadius: 'var(--radius)', padding: '.3rem' }}>
          <button onClick={() => setUploadMode('file')} style={{ flex: 1, padding: '.4rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.8rem', background: uploadMode === 'file' ? '#fff' : 'transparent', color: uploadMode === 'file' ? 'var(--saffron)' : 'var(--ink-soft)', boxShadow: uploadMode === 'file' ? 'var(--shadow)' : 'none', transition: 'var(--trans)' }}>
            📁 Upload from Computer
          </button>
          <button onClick={() => setUploadMode('url')} style={{ flex: 1, padding: '.4rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.8rem', background: uploadMode === 'url' ? '#fff' : 'transparent', color: uploadMode === 'url' ? 'var(--saffron)' : 'var(--ink-soft)', boxShadow: uploadMode === 'url' ? 'var(--shadow)' : 'none', transition: 'var(--trans)' }}>
            🔗 Enter Image URL
          </button>
        </div>

        {/* File upload */}
        {uploadMode === 'file' && (
          <div style={{ marginBottom: '1rem' }}>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={handleFileChange} />
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed var(--border-hi)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: 'var(--paper-2)', transition: 'var(--trans)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--saffron)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-hi)'}
            >
              {uploading ? (
                <><span className="spinner" style={{ margin: '0 auto .5rem', display: 'block' }} /><div className="text-sm text-muted">Uploading…</div></>
              ) : form.image_url && uploadMode === 'file' ? (
                <div className="text-sm" style={{ color: 'var(--forest)' }}>✅ Uploaded — click to change</div>
              ) : (
                <>
                  <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📷</div>
                  <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '.25rem', fontSize: '.9rem' }}>Click to choose a photo</div>
                  <div className="text-xs text-muted">JPG, PNG, GIF, WEBP — max 5 MB</div>
                </>
              )}
            </div>
            {uploadErr && <div style={{ color: 'var(--crimson)', fontSize: '.8rem', marginTop: '.5rem' }}>{uploadErr}</div>}
          </div>
        )}

        {/* URL input */}
        {uploadMode === 'url' && (
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Image URL <span className="req">*</span></label>
            <input type="url" value={form.image_url} onChange={handleUrlChange} placeholder="https://example.com/photo.jpg" />
            {uploadErr && <div style={{ color: 'var(--crimson)', fontSize: '.8rem', marginTop: '.25rem' }}>{uploadErr}</div>}
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div style={{ marginBottom: '1rem', borderRadius: 'var(--radius)', overflow: 'hidden', maxHeight: 180, background: 'var(--paper-3)' }}>
            <img src={preview} alt="Preview" style={{ width: '100%', objectFit: 'cover', maxHeight: 180, display: 'block' }} onError={e => e.target.style.display = 'none'} />
          </div>
        )}

        {/* Hidden path display */}
        {form.image_url && (
          <div style={{ background: 'var(--paper-2)', borderRadius: 'var(--radius)', padding: '.5rem .75rem', marginBottom: '1rem', fontSize: '.75rem', color: 'var(--ink-soft)', wordBreak: 'break-all' }}>
            📌 Path: <code style={{ color: 'var(--saffron)' }}>{form.image_url}</code>
          </div>
        )}

        <div className="form-grid">
          <div className="form-group"><label>Title</label><input value={form.title} onChange={set('title')} /></div>
          <div className="form-group"><label>Category</label>
            <select value={form.category} onChange={set('category')}>
              <option value="general">General</option>
              <option value="cultural">Cultural</option>
              <option value="religious">Religious</option>
              <option value="social">Social</option>
              <option value="educational">Educational</option>
            </select>
          </div>
          <div className="form-group span-2"><label>Description</label><textarea value={form.description} onChange={set('description')} rows={2} /></div>
          <div className="form-group"><label>Uploaded By</label><input value={form.uploaded_by} onChange={set('uploaded_by')} /></div>
          <div className="form-group"><label>Sort Order</label><input type="number" value={form.sort_order} onChange={set('sort_order')} min="0" /></div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', paddingTop: '1.5rem' }}>
            <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} style={{ width: 'auto' }} />
            <label style={{ marginBottom: 0 }}>⭐ Featured Photo</label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy || uploading}>
            {busy ? <><span className="spinner" />Saving…</> : isEdit ? 'Save Changes' : 'Add Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const { toasts, show } = useToast();
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState({ total: 0, featured: 0 });
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editP, setEditP] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gallery', { headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) { setPhotos(data.data); setStats(data.stats); }
      else show(data.message, 'error');
    } catch { show('Error loading photos', 'error'); }
    setLoading(false);
  }, [secret, show]);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  const handleLogin = async e => {
    e.preventDefault(); setAuthBusy(true); setAuthErr('');
    try {
      const r = await fetch('/api/gallery', { headers: { 'x-admin-secret': secret } });
      if (r.ok) setAuthed(true); else setAuthErr('Invalid password.');
    } catch { setAuthErr('Network error.'); }
    setAuthBusy(false);
  };

  const handleDelete = async id => {
    if (!confirm('Delete this photo?')) return;
    try {
      const r = await fetch(`/api/gallery/${id}`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      const d = await r.json();
      if (d.success) { setPhotos(p => p.filter(x => x.id !== id)); show('Deleted'); load(); }
      else show(d.message, 'error');
    } catch {}
  };

  const handleSave = (saved, isEdit) => {
    if (isEdit) setPhotos(p => p.map(x => x.id === saved.id ? saved : x));
    else setPhotos(p => [saved, ...p]);
    show(isEdit ? 'Updated!' : 'Photo added!');
    load();
  };

  const toggleFeatured = async p => {
    try {
      const r = await fetch(`/api/gallery/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret }, body: JSON.stringify({ is_featured: !p.is_featured }) });
      const d = await r.json();
      if (d.success) { setPhotos(prev => prev.map(x => x.id === p.id ? d.data : x)); show('Updated!'); }
    } catch {}
  };

  if (!authed) return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🖼️</div>
        <h2>Gallery</h2>
        <p>MAA Admin — Photo Gallery Management</p>
        {authErr && <div style={{ background: 'var(--crimson-light)', borderRadius: 'var(--radius)', padding: '.7rem', marginBottom: '1rem', color: 'var(--crimson)', fontSize: '.82rem' }}>{authErr}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Admin Password</label>
            <input type="password" value={secret} onChange={e => setSecret(e.target.value)} autoFocus />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={authBusy}>{authBusy ? 'Verifying…' : 'Enter →'}</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a href="/admin" style={{ color: 'var(--saffron)', fontSize: '.85rem' }}>← Dashboard</a>
        </div>
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
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--navy)', fontWeight: 600 }}>Photo Gallery</div>
              <div className="text-sm text-muted">गैलरी · {stats.total} photos · {stats.featured} featured</div>
            </div>
            <div style={{ display: 'flex', gap: '.65rem' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Photo</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAuthed(false); setSecret(''); }}>Sign Out</button>
            </div>
          </div>

          <div className="admin-content">
            {/* Info banner */}
            <div style={{ background: 'var(--gold-light)', border: '1px solid rgba(201,150,12,.3)', borderRadius: 'var(--radius)', padding: '.75rem 1rem', marginBottom: '1.5rem', fontSize: '.85rem', color: 'var(--ink-soft)' }}>
              <strong style={{ color: 'var(--gold)' }}>📁 Local Image Storage</strong> — Upload photos from your computer. Images are saved to <code style={{ background: 'var(--paper-3)', padding: '.1rem .3rem', borderRadius: 3 }}>public/images/gallery/</code> in the project and served as <code style={{ background: 'var(--paper-3)', padding: '.1rem .3rem', borderRadius: 3 }}>/images/gallery/filename.jpg</code>.
              {' '}<span style={{ color: 'var(--crimson)', fontWeight: 600 }}>Note:</span> Upload works when running locally. On Vercel, place images in the folder, commit to git, then enter the path manually using the URL tab.
            </div>

            {loading ? (
              <div className="loading-state"><span className="spinner" />Loading…</div>
            ) : photos.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🖼️</div>
                <p>No photos yet.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setShowAdd(true)}>+ Add First Photo</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem' }}>
                {photos.map(p => (
                  <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ position: 'relative', paddingBottom: '66%', background: 'var(--paper-3)' }}>
                      <img src={p.image_url || p.thumbnail_url} alt={p.title || 'Photo'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = 'https://via.placeholder.com/400x266?text=Photo'; }} />
                      {p.is_featured && <div style={{ position: 'absolute', top: '.4rem', left: '.4rem', background: 'var(--saffron)', color: '#fff', fontSize: '.65rem', fontWeight: 700, padding: '.15rem .4rem', borderRadius: 3 }}>⭐ Featured</div>}
                    </div>
                    <div style={{ padding: '.85rem' }}>
                      {p.title && <div style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--navy)', marginBottom: '.2rem' }}>{p.title}</div>}
                      {p.description && <div className="text-xs text-muted" style={{ marginBottom: '.4rem' }}>{p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}</div>}
                      <div className="text-xs text-muted" style={{ marginBottom: '.65rem', textTransform: 'capitalize' }}>{p.category}</div>
                      <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: '.72rem' }} onClick={() => toggleFeatured(p)}>{p.is_featured ? '★ Unfeature' : '☆ Feature'}</button>
                        <button className="btn btn-primary btn-sm" style={{ fontSize: '.72rem' }} onClick={() => setEditP(p)}>✏️</button>
                        <button className="btn btn-danger btn-sm" style={{ fontSize: '.72rem' }} onClick={() => handleDelete(p.id)}>🗑</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {showAdd && <Modal photo={null} secret={secret} onClose={() => setShowAdd(false)} onSave={handleSave} />}
      {editP && <Modal photo={editP} secret={secret} onClose={() => setEditP(null)} onSave={handleSave} />}
      <Toast toasts={toasts} />
    </>
  );
}
