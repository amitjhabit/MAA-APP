'use client';
// app/gallery/page.js
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
            <a key={h} href={h} className={`pub-nav-link${h === '/gallery' ? ' active' : ''}`}>{l}</a>
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
        © {new Date().getFullYear()} Maithil Association of America · <a href="/admin" style={{ color: 'var(--gold)' }}>Admin</a>
      </div>
    </footer>
  );
}

const samplePhotos = [
  { id: 1, title: 'Chhath Puja 2024', description: 'Annual Chhath Puja celebration at the waterfront', category: 'religious', image_url: 'https://photos.fife.usercontent.google.com/pw/AP1GczPb4uHKK9Vg0FTr-FBuqLKDX4AwNCwz3UmQQzCvnv7U26nPtt-C7iTxLA=w1892-h1420-s-no-gm?authuser=0' },
  { id: 2, title: 'Cultural Program', description: 'Maithili dance performance at annual gala', category: 'cultural', image_url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80' },
  { id: 3, title: 'Community Gathering', description: 'Members gathering at Edison community center', category: 'social', image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80' },
  { id: 4, title: 'Language Workshop', description: 'Maithili language learning session', category: 'educational', image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80' },
  { id: 5, title: 'Food Festival', description: 'Traditional Maithili cuisine showcase', category: 'cultural', image_url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80' },
  { id: 6, title: 'Annual Gala', description: 'MAA Annual Gala 2024 celebration', category: 'cultural', image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80' },
];

export default function GalleryPage() {
  // 'albums' = album grid, 'photos' = album photo view, 'flat' = legacy flat view
  const [mode, setMode]               = useState('albums');
  const [albums, setAlbums]           = useState([]);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [photos, setPhotos]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [lightbox, setLightbox]       = useState(null);

  // Load albums on mount
  useEffect(() => {
    fetch('/api/public/gallery/albums', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          setAlbums(d.data);
          setMode('albums');
        } else {
          // No albums — fall back to flat gallery
          setMode('flat');
          return fetch('/api/public/gallery').then(r => r.json()).then(d2 => {
            if (d2.success) setPhotos(d2.data);
          });
        }
      })
      .catch(() => setMode('flat'))
      .finally(() => setLoading(false));
  }, []);

  const openAlbum = async album => {
    setActiveAlbum(album);
    setMode('photos');
    setLightbox(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/public/gallery?album_id=${album.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setPhotos(data.data);
    } catch {}
    setLoading(false);
  };

  const backToAlbums = () => {
    setMode('albums');
    setActiveAlbum(null);
    setPhotos([]);
    setLightbox(null);
  };

  const displayPhotos = (mode === 'flat' && photos.length === 0) ? samplePhotos : photos;
  const currentIndex  = lightbox !== null ? displayPhotos.findIndex(p => p.id === lightbox.id) : -1;

  return (
    <>
      <Nav />

      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">गैलरी</span>
          <h1>Photo <em>Gallery</em></h1>
          <p className="hero-sub">Memories from our events, celebrations, and community gatherings.</p>
        </div>
      </section>

      <div className="shell">
        {/* ── Album Grid ── */}
        {mode === 'albums' && (
          loading ? (
            <div className="loading-state"><span className="spinner" />Loading albums…</div>
          ) : (
            <div className="gallery-albums-grid">
              {albums.map(album => (
                <div key={album.id} className="gallery-album-card" onClick={() => openAlbum(album)}>
                  <div className="gallery-album-thumb">
                    {album.cover_image_url
                      ? <img src={album.cover_image_url} alt={album.display_name} onError={e => { e.target.style.display = 'none'; }} />
                      : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📷</div>}
                    <div className="gallery-album-count">{album.photo_count} photos</div>
                  </div>
                  <div className="gallery-album-info">
                    <div className="gallery-album-name">{album.display_name}</div>
                    {album.description && <div className="gallery-album-desc">{album.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Album Photo View ── */}
        {mode === 'photos' && (
          <>
            <div className="gallery-breadcrumb">
              <button onClick={backToAlbums}>← All Albums</button>
              <span className="sep">/</span>
              <span className="current">{activeAlbum?.display_name}</span>
            </div>
            {loading ? (
              <div className="loading-state"><span className="spinner" />Loading photos…</div>
            ) : photos.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🖼️</div>
                <p>No photos in this album yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                {photos.map(photo => (
                  <div key={photo.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setLightbox(photo)}>
                    <div style={{ position: 'relative', paddingBottom: '66%', background: 'var(--paper-3)' }}>
                      <img
                        src={photo.image_url || photo.thumbnail_url}
                        alt={photo.title || 'MAA Gallery'}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                        onError={e => { e.target.src = 'https://via.placeholder.com/400x266?text=MAA+Photo'; }}
                      />
                      {photo.is_featured && (
                        <div style={{ position: 'absolute', top: '.5rem', left: '.5rem', background: 'var(--saffron)', color: '#fff', fontSize: '.65rem', fontWeight: 700, padding: '.2rem .5rem', borderRadius: 4 }}>⭐ Featured</div>
                      )}
                    </div>
                    {(photo.title || photo.description) && (
                      <div style={{ padding: '.85rem 1rem' }}>
                        {photo.title && <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--navy)', marginBottom: '.2rem' }}>{photo.title}</div>}
                        {photo.description && <div className="text-xs text-muted">{photo.description}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Flat / Legacy View (no albums) ── */}
        {mode === 'flat' && (
          <>
            {photos.length === 0 && !loading && (
              <div style={{ background: 'var(--gold-light)', border: '1px solid rgba(201,150,12,.3)', borderRadius: 'var(--radius)', padding: '.75rem 1rem', marginBottom: '1.5rem', fontSize: '.875rem', color: 'var(--gold)' }}>
                Showing sample photos. Add real photos via the <a href="/admin" style={{ color: 'var(--saffron)' }}>Admin Gallery</a>.
              </div>
            )}
            {loading ? (
              <div className="loading-state"><span className="spinner" />Loading gallery…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                {displayPhotos.map(photo => (
                  <div key={photo.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setLightbox(photo)}>
                    <div style={{ position: 'relative', paddingBottom: '66%', background: 'var(--paper-3)' }}>
                      <img
                        src={photo.image_url || photo.thumbnail_url}
                        alt={photo.title || 'MAA Gallery'}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                        onError={e => { e.target.src = 'https://via.placeholder.com/400x266?text=MAA+Photo'; }}
                      />
                      {photo.is_featured && (
                        <div style={{ position: 'absolute', top: '.5rem', left: '.5rem', background: 'var(--saffron)', color: '#fff', fontSize: '.65rem', fontWeight: 700, padding: '.2rem .5rem', borderRadius: 4 }}>⭐ Featured</div>
                      )}
                    </div>
                    {(photo.title || photo.description) && (
                      <div style={{ padding: '.85rem 1rem' }}>
                        {photo.title && <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--navy)', marginBottom: '.2rem' }}>{photo.title}</div>}
                        {photo.description && <div className="text-xs text-muted">{photo.description}</div>}
                        {photo.category && <span className="badge" style={{ background: 'var(--saffron-light)', color: 'var(--saffron-dark)', marginTop: '.4rem', display: 'inline-flex' }}>{photo.category}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setLightbox(null)}>
          <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', fontSize: '1.75rem', cursor: 'pointer' }} onClick={() => setLightbox(null)}>✕</button>
          {currentIndex > 0 && (
            <button style={{ position: 'absolute', left: '1rem', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', borderRadius: '50%', width: 44, height: 44 }}
              onClick={e => { e.stopPropagation(); setLightbox(displayPhotos[currentIndex - 1]); }}>‹</button>
          )}
          <div style={{ maxWidth: 900, width: '100%' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.image_url} alt={lightbox.title} style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 'var(--radius)' }} onError={e => { e.target.src = 'https://via.placeholder.com/800x533?text=MAA+Photo'; }} />
            {(lightbox.title || lightbox.description) && (
              <div style={{ textAlign: 'center', marginTop: '.75rem' }}>
                {lightbox.title && <div style={{ color: '#fff', fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 600 }}>{lightbox.title}</div>}
                {lightbox.description && <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '.875rem', marginTop: '.25rem' }}>{lightbox.description}</div>}
              </div>
            )}
          </div>
          {currentIndex < displayPhotos.length - 1 && (
            <button style={{ position: 'absolute', right: '1rem', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', borderRadius: '50%', width: 44, height: 44 }}
              onClick={e => { e.stopPropagation(); setLightbox(displayPhotos[currentIndex + 1]); }}>›</button>
          )}
        </div>
      )}

      <Footer />
    </>
  );
}
