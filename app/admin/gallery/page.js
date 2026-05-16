'use client';
// app/admin/gallery/page.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAdminAuth } from '@/app/admin/layout';
function useToast(){const[t,setT]=useState([]);const show=useCallback((msg,type='success')=>{const id=Date.now();setT(p=>[...p,{id,msg,type}]);setTimeout(()=>setT(p=>p.filter(x=>x.id!==id)),3500);},[]);return{toasts:t,show};}
function Toast({toasts}){return<div className="toast-wrap">{toasts.map(t=><div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;}
function Sidebar(){const NL=({href,icon,label,a})=><a href={href} className={`admin-nav-link${a?' active':''}`}><span className="nav-icon">{icon}</span>{label}</a>;return(<aside className="admin-sidebar"><div className="admin-sidebar-brand"><img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}} /><div className="logo-sub">मैथिल एसोसिएशन</div></div><nav className="admin-nav"><div className="admin-nav-section">Main</div><NL href="/admin" icon="🏠" label="Dashboard"/><NL href="/admin/members" icon="👥" label="Members"/><NL href="/admin/events" icon="📅" label="Events"/><NL href="/admin/donations" icon="💰" label="Donations"/><NL href="/admin/finance" icon="📊" label="Finance"/><NL href="/admin/analytics" icon="📈" label="Analytics"/><div className="admin-nav-section">Content</div><NL href="/admin/news" icon="📰" label="News"/><NL href="/admin/gallery" icon="🖼️" label="Gallery" a/><NL href="/admin/homepage" icon="🏡" label="Home"/><NL href="/admin/about" icon="📝" label="About Us"/><div className="admin-nav-section">Organization</div><NL href="/admin/volunteers" icon="🙋" label="Volunteers"/><NL href="/admin/committee" icon="🏛️" label="Committee"/><NL href="/admin/inquiries" icon="✉️" label="Inquiries"/><div className="admin-nav-section">Settings</div><NL href="/" icon="🌐" label="Public Site"/></nav></aside>);}

function toSlug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* ─── Album Modal ─────────────────────────────────────────── */
function AlbumModal({ album, secret, onClose, onSave }) {
  const isEdit = !!album;
  const blank = { display_name: '', name: '', description: '', folder_path: '', cover_image_url: '', sort_order: '0' };
  const [form, setForm] = useState(isEdit ? { ...blank, ...album, sort_order: String(album.sort_order || 0) } : blank);
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState({});

  const set = k => e => {
    const val = e.target.value;
    setForm(p => {
      const next = { ...p, [k]: val };
      if (k === 'display_name' && !isEdit) next.name = toSlug(val);
      return next;
    });
  };

  const submit = async () => {
    setErrs({});
    setBusy(true);
    try {
      const url = isEdit ? `/api/gallery/albums?id=${album.id}` : '/api/gallery/albums';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ ...form, sort_order: parseInt(form.sort_order) || 0 }),
      });
      const data = await res.json();
      if (data.success) { onSave(data.data, isEdit); onClose(); }
      else if (data.errors) setErrs(data.errors);
      else alert(data.message);
    } catch {}
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Album' : '📁 New Album'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid">
          <div className="form-group span-2">
            <label>Album Name <span className="req">*</span></label>
            <input value={form.display_name} onChange={set('display_name')} placeholder="e.g. Diwali 2024" />
            {errs.display_name && <div style={{ color: 'var(--crimson)', fontSize: '.8rem' }}>{errs.display_name}</div>}
          </div>
          <div className="form-group">
            <label>Slug (URL-safe) <span className="req">*</span></label>
            <input value={form.name} onChange={set('name')} placeholder="diwali-2024" />
            <div className="text-xs text-muted" style={{ marginTop: '.2rem' }}>lowercase, letters, numbers, hyphens only</div>
            {errs.name && <div style={{ color: 'var(--crimson)', fontSize: '.8rem' }}>{errs.name}</div>}
          </div>
          <div className="form-group">
            <label>Folder Path</label>
            <input value={form.folder_path} onChange={set('folder_path')} placeholder="diwaliImages24" />
            <div className="text-xs text-muted" style={{ marginTop: '.2rem' }}>Subfolder under <code>public/images/gallery/</code></div>
          </div>
          <div className="form-group span-2">
            <label>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Brief description of this album" />
          </div>
          <div className="form-group">
            <label>Cover Image URL</label>
            <input value={form.cover_image_url} onChange={set('cover_image_url')} placeholder="/images/gallery/diwaliImages24/photo.jpg" />
          </div>
          <div className="form-group">
            <label>Sort Order</label>
            <input type="number" value={form.sort_order} onChange={set('sort_order')} min="0" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? <><span className="spinner" />Saving…</> : isEdit ? 'Save Changes' : 'Create Album'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Photo Modal ─────────────────────────────────────────── */
function PhotoModal({ photo, albumId, albumFolderPath, secret, onClose, onSave }) {
  const isEdit = !!photo;

  const normalizeUrl = url => {
    if (!url) return '';
    return url.replace(/^public\//, '/').replace(/^\/\//, '/');
  };

  const blank = { image_url: '', title: '', description: '', category: 'general', is_featured: false, sort_order: '0', uploaded_by: '' };
  const initUrl = isEdit ? normalizeUrl(photo.image_url) : '';
  const [form, setForm] = useState(isEdit ? { ...blank, ...photo, image_url: initUrl, sort_order: String(photo.sort_order || 0) } : blank);
  const [busy, setBusy] = useState(false);
  const [uploadMode, setUploadMode] = useState(isEdit && initUrl ? 'url' : 'file');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [localPreview, setLocalPreview] = useState('');
  const [uploadDone, setUploadDone] = useState(false);
  const fileRef = useRef();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const previewSrc = localPreview || (uploadMode === 'url' ? normalizeUrl(form.image_url) : form.image_url);

  const handleFileChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadErr(''); setUploadDone(false);
    const reader = new FileReader();
    reader.onload = ev => setLocalPreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (albumFolderPath) fd.append('folder_path', albumFolderPath);
      const res = await fetch('/api/gallery/upload', { method: 'POST', headers: { 'x-admin-secret': secret }, body: fd });
      const data = await res.json();
      if (data.success) { setForm(p => ({ ...p, image_url: data.url })); setUploadDone(true); }
      else { setUploadErr(data.message || 'Upload failed.'); setLocalPreview(''); }
    } catch { setUploadErr('Network error during upload.'); setLocalPreview(''); }
    setUploading(false);
  };

  const handleUrlChange = e => setForm(p => ({ ...p, image_url: normalizeUrl(e.target.value) }));

  const submit = async () => {
    if (!form.image_url) { setUploadErr('Please upload an image or enter a URL.'); return; }
    setBusy(true);
    try {
      const payload = { ...form, sort_order: parseInt(form.sort_order) || 0, album_id: albumId || null };
      const res = await fetch(isEdit ? `/api/gallery/${photo.id}` : '/api/gallery', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { onSave(data.data, isEdit); onClose(); }
      else alert(data.message);
    } catch {}
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Photo' : '🖼️ Add Photo'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '.35rem', marginBottom: '1rem', background: 'var(--paper-2)', borderRadius: 'var(--radius)', padding: '.3rem' }}>
          <button onClick={() => { setUploadMode('file'); setUploadErr(''); }} style={{ flex: 1, padding: '.4rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.8rem', background: uploadMode === 'file' ? '#fff' : 'transparent', color: uploadMode === 'file' ? 'var(--saffron)' : 'var(--ink-soft)', boxShadow: uploadMode === 'file' ? 'var(--shadow)' : 'none', transition: 'var(--trans)' }}>
            📁 Upload from Computer
          </button>
          <button onClick={() => { setUploadMode('url'); setUploadErr(''); }} style={{ flex: 1, padding: '.4rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.8rem', background: uploadMode === 'url' ? '#fff' : 'transparent', color: uploadMode === 'url' ? 'var(--saffron)' : 'var(--ink-soft)', boxShadow: uploadMode === 'url' ? 'var(--shadow)' : 'none', transition: 'var(--trans)' }}>
            🔗 Enter Image URL / Path
          </button>
        </div>

        {uploadMode === 'file' && (
          <div style={{ marginBottom: '1rem' }}>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={handleFileChange} />
            <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${uploading ? 'var(--gold)' : uploadDone ? 'var(--forest)' : 'var(--border-hi)'}`, borderRadius: 'var(--radius)', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', background: uploadDone ? 'var(--forest-light)' : 'var(--paper-2)', transition: 'var(--trans)' }}>
              {uploading ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', color: 'var(--gold)' }}><span className="spinner" /><span className="text-sm">Uploading…</span></div>
                : uploadDone ? <div style={{ color: 'var(--forest)', fontWeight: 600, fontSize: '.875rem' }}>✅ Upload complete — click to replace</div>
                : <><div style={{ fontSize: '2rem', marginBottom: '.4rem' }}>📷</div><div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '.9rem' }}>Click to choose a photo</div><div className="text-xs text-muted" style={{ marginTop: '.2rem' }}>JPG, PNG, GIF, WEBP — max 5 MB{albumFolderPath ? ` · saves to ${albumFolderPath}/` : ''}</div></>}
            </div>
            {uploadErr && <div style={{ color: 'var(--crimson)', fontSize: '.8rem', marginTop: '.5rem' }}>{uploadErr}</div>}
          </div>
        )}

        {uploadMode === 'url' && (
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Image URL or path <span className="req">*</span></label>
            <input value={form.image_url} onChange={handleUrlChange} placeholder="/images/gallery/photo.jpg  or  https://example.com/photo.jpg" />
            <div className="text-xs text-muted" style={{ marginTop: '.3rem' }}>Start path with <code>/</code> for local images</div>
            {uploadErr && <div style={{ color: 'var(--crimson)', fontSize: '.8rem', marginTop: '.25rem' }}>{uploadErr}</div>}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '.35rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Preview</div>
          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--paper-3)', border: '1px solid var(--border)', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {previewSrc ? <img src={previewSrc} alt="Preview" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', display: 'block' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} /> : null}
            <div style={{ display: previewSrc ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', color: 'var(--ink-dim)', padding: '2rem' }}><span style={{ fontSize: '2.5rem' }}>🖼️</span><span className="text-sm">No image yet</span></div>
            <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '.5rem', color: 'var(--crimson)', padding: '2rem' }}><span style={{ fontSize: '2rem' }}>⚠️</span><span className="text-sm">Image could not be loaded</span></div>
          </div>
          {form.image_url && <div style={{ marginTop: '.35rem', fontSize: '.72rem', color: 'var(--ink-dim)', wordBreak: 'break-all' }}>Saved as: <code style={{ color: 'var(--saffron)' }}>{form.image_url}</code></div>}
        </div>

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

/* ─── Main Page ───────────────────────────────────────────── */
export default function GalleryPage() {
  const { toasts, show } = useToast();
  const { secret, logout } = useAdminAuth();

  // view: 'albums' | 'photos'
  const [view, setView] = useState('albums');
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanBanner, setScanBanner] = useState('');

  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [editAlbum, setEditAlbum] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editPhoto, setEditPhoto] = useState(null);

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gallery/albums', { headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) setAlbums(data.data);
      else show(data.message, 'error');
    } catch { show('Error loading albums', 'error'); }
    setLoading(false);
  }, [secret, show]);

  const loadPhotos = useCallback(async (albumId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gallery?album_id=${albumId}`, { headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) setPhotos(data.data);
      else show(data.message, 'error');
    } catch { show('Error loading photos', 'error'); }
    setLoading(false);
  }, [secret, show]);

  useEffect(() => { loadAlbums(); }, [loadAlbums]);

  const openAlbum = album => {
    setSelectedAlbum(album);
    setView('photos');
    setScanBanner('');
    loadPhotos(album.id);
  };

  const backToAlbums = () => {
    setView('albums');
    setSelectedAlbum(null);
    setPhotos([]);
    setScanBanner('');
    loadAlbums();
  };

  const handleScanFolder = async () => {
    if (!selectedAlbum?.folder_path) return;
    setScanBanner('');
    try {
      const res = await fetch(`/api/gallery/albums/${selectedAlbum.id}/scan`, { method: 'POST', headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) {
        setScanBanner(`Inserted ${data.inserted} photos, skipped ${data.skipped} already imported.`);
        loadPhotos(selectedAlbum.id);
        loadAlbums();
      } else { show(data.message, 'error'); }
    } catch { show('Scan failed', 'error'); }
  };

  const handleDeleteAlbum = async album => {
    if (!confirm(`Delete album "${album.display_name}"? Photos will remain in the gallery without an album.`)) return;
    try {
      const res = await fetch(`/api/gallery/albums?id=${album.id}`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) { show('Album deleted'); loadAlbums(); }
      else show(data.message, 'error');
    } catch {}
  };

  const handleDeletePhoto = async id => {
    if (!confirm('Delete this photo?')) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) { setPhotos(p => p.filter(x => x.id !== id)); show('Deleted'); loadAlbums(); }
      else show(data.message, 'error');
    } catch {}
  };

  const handleSaveAlbum = (saved, isEdit) => {
    if (isEdit) setAlbums(p => p.map(x => x.id === saved.id ? { ...x, ...saved } : x));
    else loadAlbums();
    show(isEdit ? 'Album updated!' : 'Album created!');
  };

  const handleSavePhoto = (saved, isEdit) => {
    if (isEdit) setPhotos(p => p.map(x => x.id === saved.id ? saved : x));
    else loadPhotos(selectedAlbum.id);
    show(isEdit ? 'Updated!' : 'Photo added!');
    loadAlbums();
  };

  const toggleFeatured = async p => {
    try {
      const res = await fetch(`/api/gallery/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret }, body: JSON.stringify({ is_featured: !p.is_featured }) });
      const data = await res.json();
      if (data.success) { setPhotos(prev => prev.map(x => x.id === p.id ? data.data : x)); show('Updated!'); }
    } catch {}
  };

  return (
    <>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">

          {/* ── Topbar ── */}
          <div className="admin-topbar">
            <div>
              {view === 'albums' ? (
                <>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--navy)', fontWeight: 600 }}>Photo Gallery · Albums</div>
                  <div className="text-sm text-muted">गैलरी · {albums.length} albums</div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={backToAlbums}>← Albums</button>
                  <span style={{ color: 'var(--border-hi)' }}>/</span>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--navy)', fontWeight: 600 }}>{selectedAlbum?.display_name}</span>
                  <span className="text-sm text-muted">· {photos.length} photos</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '.65rem' }}>
              {view === 'albums' && (
                <button className="btn btn-primary btn-sm" onClick={() => { setEditAlbum(null); setShowAlbumModal(true); }}>+ New Album</button>
              )}
              {view === 'photos' && (
                <>
                  <button className="btn btn-primary btn-sm" onClick={() => { setEditPhoto(null); setShowPhotoModal(true); }}>+ Add Photo</button>
                  {selectedAlbum?.folder_path && (
                    <button className="btn btn-ghost btn-sm" onClick={handleScanFolder} title={`Scan public/images/gallery/${selectedAlbum.folder_path}`}>🔍 Scan Folder</button>
                  )}
                </>
              )}
              <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
            </div>
          </div>

          <div className="admin-content">
            {/* Info banner (albums view only) */}
            {view === 'albums' && (
              <div style={{ background: 'var(--gold-light)', border: '1px solid rgba(201,150,12,.3)', borderRadius: 'var(--radius)', padding: '.75rem 1rem', marginBottom: '1.5rem', fontSize: '.85rem', color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--gold)' }}>📁 Album-Based Gallery</strong> — Create albums and link them to image folders under <code style={{ background: 'var(--paper-3)', padding: '.1rem .3rem', borderRadius: 3 }}>public/images/gallery/</code>. Use <strong>Scan Folder</strong> inside an album to bulk-import all images from its folder automatically.
              </div>
            )}

            {scanBanner && <div className="scan-banner">{scanBanner}</div>}

            {loading ? (
              <div className="loading-state"><span className="spinner" />Loading…</div>
            ) : view === 'albums' ? (
              /* ── Albums Grid ── */
              albums.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">📁</div>
                  <p>No albums yet. Create one to start organizing your gallery.</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setShowAlbumModal(true)}>+ New Album</button>
                </div>
              ) : (
                <div className="admin-album-grid">
                  {albums.map(a => (
                    <div key={a.id} className="admin-album-card">
                      <div className="admin-album-thumb">
                        {a.cover_image_url
                          ? <img src={a.cover_image_url} alt={a.display_name} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          : null}
                        <div className="admin-album-no-cover" style={{ display: a.cover_image_url ? 'none' : 'flex' }}>📷</div>
                        <div style={{ position: 'absolute', top: '.4rem', right: '.4rem', background: 'rgba(13,33,55,.72)', color: '#fff', fontSize: '.7rem', fontWeight: 700, padding: '.15rem .45rem', borderRadius: 100 }}>{a.photo_count} photos</div>
                      </div>
                      <div className="admin-album-info">
                        <div className="admin-album-name">{a.display_name}</div>
                        <div className="admin-album-slug">{a.name}{a.folder_path ? ` · ${a.folder_path}` : ''}</div>
                        {a.description && <div className="text-xs text-muted">{a.description}</div>}
                        <div className="admin-album-actions">
                          <button className="btn btn-primary btn-sm" style={{ fontSize: '.72rem' }} onClick={() => openAlbum(a)}>Open</button>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: '.72rem' }} onClick={() => { setEditAlbum(a); setShowAlbumModal(true); }}>✏️ Edit</button>
                          <button className="btn btn-danger btn-sm" style={{ fontSize: '.72rem' }} onClick={() => handleDeleteAlbum(a)}>🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* ── Photos Grid ── */
              photos.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">🖼️</div>
                  <p>No photos in this album yet.{selectedAlbum?.folder_path ? ' Use Scan Folder to import images, or add photos manually.' : ' Add photos using the button above.'}</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setShowPhotoModal(true)}>+ Add Photo</button>
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
                        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: '.72rem' }} onClick={() => toggleFeatured(p)}>{p.is_featured ? '★ Unfeature' : '☆ Feature'}</button>
                          <button className="btn btn-primary btn-sm" style={{ fontSize: '.72rem' }} onClick={() => { setEditPhoto(p); setShowPhotoModal(true); }}>✏️</button>
                          <button className="btn btn-danger btn-sm" style={{ fontSize: '.72rem' }} onClick={() => handleDeletePhoto(p.id)}>🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {showAlbumModal && (
        <AlbumModal
          album={editAlbum}
          secret={secret}
          onClose={() => { setShowAlbumModal(false); setEditAlbum(null); }}
          onSave={handleSaveAlbum}
        />
      )}
      {showPhotoModal && (
        <PhotoModal
          photo={editPhoto}
          albumId={selectedAlbum?.id}
          albumFolderPath={selectedAlbum?.folder_path}
          secret={secret}
          onClose={() => { setShowPhotoModal(false); setEditPhoto(null); }}
          onSave={handleSavePhoto}
        />
      )}
      <Toast toasts={toasts} />
    </>
  );
}
