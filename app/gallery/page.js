'use client';
// app/gallery/page.js
import { useState, useEffect } from 'react';
import PublicNav from '@/app/components/PublicNav';

function Footer() {
  return (
    <footer className="pub-footer">
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem' }}>
        © {new Date().getFullYear()} Maithil Association of America · <a href="/admin" style={{ color: 'var(--gold)' }}>Admin</a>
      </div>
    </footer>
  );
}

// Fix paths saved with accidental "public/" prefix
function fixUrl(url) {
  if (!url) return '';
  return url.replace(/^public\//, '/');
}

const CATEGORIES = ['All', 'Cultural', 'Religious', 'Social', 'Educational', 'General'];

const CAT_COLORS = {
  cultural:    { bg: 'var(--saffron-light)', color: 'var(--saffron-dark)' },
  religious:   { bg: 'var(--crimson-light)',  color: 'var(--crimson)' },
  social:      { bg: 'var(--forest-light)',   color: 'var(--forest)' },
  educational: { bg: '#E3F2FD',               color: '#0D47A1' },
  general:     { bg: 'var(--paper-3)',        color: 'var(--ink-soft)' },
};

export default function GalleryPage() {
  const [allPhotos, setAllPhotos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightbox, setLightbox]   = useState(null);

  // Fetch all photos from the database on mount
  useEffect(() => {
    fetch('/api/public/gallery?limit=200')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setAllPhotos(d.data || []);
        } else {
          setError('Could not load gallery.');
        }
      })
      .catch(() => setError('Network error loading gallery.'))
      .finally(() => setLoading(false));
  }, []);

  // Filter by selected category
  const displayPhotos = activeCategory === 'All'
    ? allPhotos
    : allPhotos.filter(p => (p.category || 'general').toLowerCase() === activeCategory.toLowerCase());

  // Categories that actually have photos (for showing filter buttons)
  const usedCategories = ['All', ...Array.from(new Set(allPhotos.map(p => p.category || 'general').map(c => c.charAt(0).toUpperCase() + c.slice(1))))];

  // Lightbox navigation
  const currentIndex = lightbox !== null ? displayPhotos.findIndex(p => p.id === lightbox.id) : -1;

  const goNext = e => { e.stopPropagation(); if (currentIndex < displayPhotos.length - 1) setLightbox(displayPhotos[currentIndex + 1]); };
  const goPrev = e => { e.stopPropagation(); if (currentIndex > 0) setLightbox(displayPhotos[currentIndex - 1]); };

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = e => {
      if (e.key === 'ArrowRight') { if (currentIndex < displayPhotos.length - 1) setLightbox(displayPhotos[currentIndex + 1]); }
      if (e.key === 'ArrowLeft')  { if (currentIndex > 0) setLightbox(displayPhotos[currentIndex - 1]); }
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, currentIndex, displayPhotos]);

  return (
    <>
      <PublicNav active="/gallery" />

      {/* Hero */}
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">गैलरी</span>
          <h1>Photo <em>Gallery</em></h1>
          <p className="hero-sub">Memories from our events, celebrations, and community gatherings.</p>
        </div>
      </section>

      <div className="shell">

        {/* Loading */}
        {loading && (
          <div className="loading-state"><span className="spinner" />Loading gallery…</div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ background: 'var(--crimson-light)', border: '1px solid rgba(155,29,32,.2)', borderRadius: 'var(--radius)', padding: '1rem', color: 'var(--crimson)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Empty state — no photos in DB */}
        {!loading && !error && allPhotos.length === 0 && (
          <div className="empty-state">
            <div className="icon">🖼️</div>
            <p style={{ marginBottom: '.75rem' }}>No photos in the gallery yet.</p>
            <a href="/admin/gallery" className="btn btn-primary btn-sm">Add Photos in Admin →</a>
          </div>
        )}

        {/* Gallery content */}
        {!loading && !error && allPhotos.length > 0 && (
          <>
            {/* Stats + category filter bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '.85rem', color: 'var(--ink-soft)' }}>
                Showing <strong style={{ color: 'var(--navy)' }}>{displayPhotos.length}</strong> of <strong style={{ color: 'var(--navy)' }}>{allPhotos.length}</strong> photos
              </div>
              <div className="filter-bar" style={{ margin: 0 }}>
                {usedCategories.map(cat => (
                  <button
                    key={cat}
                    className={`filter-btn${activeCategory === cat ? ' active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* No results for selected category */}
            {displayPhotos.length === 0 && (
              <div className="empty-state">
                <div className="icon">🔍</div>
                <p>No photos in the <strong>{activeCategory}</strong> category.</p>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: '.75rem' }} onClick={() => setActiveCategory('All')}>Show All Photos</button>
              </div>
            )}

            {/* Photo grid */}
            {displayPhotos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                {displayPhotos.map(photo => {
                  const imgUrl = fixUrl(photo.image_url || photo.thumbnail_url);
                  const cat    = (photo.category || 'general').toLowerCase();
                  const badge  = CAT_COLORS[cat] || CAT_COLORS.general;
                  return (
                    <div
                      key={photo.id}
                      className="card"
                      style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                      onClick={() => setLightbox(photo)}
                    >
                      {/* Image */}
                      <div style={{ position: 'relative', paddingBottom: '66%', background: 'var(--paper-3)' }}>
                        <img
                          src={imgUrl}
                          alt={photo.title || 'MAA Gallery'}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/400x266?text=MAA+Photo'; }}
                        />
                        {photo.is_featured && (
                          <div style={{ position: 'absolute', top: '.5rem', left: '.5rem', background: 'var(--saffron)', color: '#fff', fontSize: '.65rem', fontWeight: 700, padding: '.2rem .5rem', borderRadius: 4 }}>⭐ Featured</div>
                        )}
                        {/* Hover overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,33,55,.35)', opacity: 0, transition: 'opacity .25s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                          🔍
                        </div>
                      </div>

                      {/* Card body */}
                      {(photo.title || photo.description || photo.category) && (
                        <div style={{ padding: '.85rem 1rem' }}>
                          {photo.title && <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--navy)', marginBottom: '.2rem' }}>{photo.title}</div>}
                          {photo.description && <div className="text-xs text-muted" style={{ marginBottom: '.4rem' }}>{photo.description}</div>}
                          {photo.category && (
                            <span className="badge" style={{ background: badge.bg, color: badge.color, marginTop: '.15rem' }}>{photo.category}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (() => {
        const imgUrl = fixUrl(lightbox.image_url || lightbox.thumbnail_url);
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.93)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setLightbox(null)}
          >
            {/* Close */}
            <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLightbox(null)}>✕</button>

            {/* Counter */}
            <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,.6)', fontSize: '.8rem' }}>
              {currentIndex + 1} / {displayPhotos.length}
            </div>

            {/* Prev */}
            {currentIndex > 0 && (
              <button style={{ position: 'absolute', left: '1rem', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={goPrev}>‹</button>
            )}

            {/* Image */}
            <div style={{ maxWidth: 960, width: '100%' }} onClick={e => e.stopPropagation()}>
              <img
                src={imgUrl}
                alt={lightbox.title || 'MAA Gallery'}
                style={{ width: '100%', maxHeight: '78vh', objectFit: 'contain', borderRadius: 'var(--radius)', display: 'block' }}
                onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/800x533?text=MAA+Photo'; }}
              />
              {(lightbox.title || lightbox.description) && (
                <div style={{ textAlign: 'center', marginTop: '.85rem' }}>
                  {lightbox.title && <div style={{ color: '#fff', fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 600 }}>{lightbox.title}</div>}
                  {lightbox.description && <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '.875rem', marginTop: '.25rem' }}>{lightbox.description}</div>}
                  {lightbox.category && (
                    <span style={{ display: 'inline-block', marginTop: '.5rem', background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.8)', fontSize: '.7rem', fontWeight: 600, padding: '.2rem .65rem', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '.07em' }}>{lightbox.category}</span>
                  )}
                </div>
              )}
            </div>

            {/* Next */}
            {currentIndex < displayPhotos.length - 1 && (
              <button style={{ position: 'absolute', right: '1rem', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={goNext}>›</button>
            )}
          </div>
        );
      })()}

      <Footer />
    </>
  );
}
