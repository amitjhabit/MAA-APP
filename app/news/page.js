'use client';
// app/news/page.js
import { useState, useEffect } from 'react';
import PublicNav from '@/app/components/PublicNav';

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
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.8rem', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem' }}>
        © {new Date().getFullYear()} Maithil Association of America · <a href="/admin" style={{ color: 'var(--gold)' }}>Admin</a>
      </div>
    </footer>
  );
}

const CAT_COLORS = {
  general:      { bg: 'var(--paper-3)',       color: 'var(--ink-soft)' },
  cultural:     { bg: 'var(--saffron-light)', color: 'var(--saffron-dark)' },
  event:        { bg: '#E3F2FD',              color: '#0D47A1' },
  announcement: { bg: 'var(--gold-light)',    color: 'var(--gold)' },
  newsletter:   { bg: 'var(--forest-light)',  color: 'var(--forest)' },
};

function NewsCard({ post, featured }) {
  const cat = CAT_COLORS[post.category] || CAT_COLORS.general;
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '.65rem', ...(featured ? { borderTop: '3px solid var(--saffron)' } : {}) }}>
      {featured && (
        <div style={{ background: 'var(--saffron)', color: '#fff', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '.2rem .6rem', borderRadius: 4, alignSelf: 'flex-start' }}>⭐ Featured</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
        <span className="badge" style={{ background: cat.bg, color: cat.color }}>{post.category}</span>
        <span className="text-xs text-muted">{localDate(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: featured ? '1.2rem' : '1.05rem', color: 'var(--navy)', lineHeight: 1.3, marginBottom: '.3rem' }}>{post.title}</div>
        {post.title_maithili && <div className="maithili" style={{ fontSize: '.85rem', marginBottom: '.35rem' }}>{post.title_maithili}</div>}
      </div>
      {post.excerpt && <p className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{post.excerpt}</p>}
      {post.content && !post.excerpt && <p className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{post.content.slice(0, 200)}…</p>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '.5rem' }}>
        {post.author && <span className="text-xs text-muted">✍️ {post.author}</span>}
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    fetch('/api/public/news?limit=50', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.success) setPosts(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p => {
    const catOk = catFilter === 'all' || p.category === catFilter;
    const searchOk = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase());
    return catOk && searchOk;
  });

  const featured = filtered[0];
  const rest     = filtered.slice(1);

  return (
    <>
      <PublicNav active="/news" />

      {/* Hero */}
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">समाचार आ घोषणा</span>
          <h1>News &amp; <em>Announcements</em></h1>
          <p className="hero-sub">Stay updated with the latest news, cultural updates, and announcements from MAA.</p>
        </div>
      </section>

      <div className="shell">
        {/* Search + filter */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search news…" style={{ flex: '1 1 220px', maxWidth: 300 }} />
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {[['all', 'All'], ['announcement', 'Announcements'], ['cultural', 'Cultural'], ['event', 'Events'], ['newsletter', 'Newsletter']].map(([v, l]) => (
              <button key={v} className={`filter-btn${catFilter === v ? ' active' : ''}`} onClick={() => setCatFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" />Loading news…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">📰</div><p>No posts found.</p></div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <div style={{ marginBottom: '2rem' }}>
                <NewsCard post={featured} featured />
              </div>
            )}
            {/* Rest */}
            {rest.length > 0 && (
              <div className="grid-3">
                {rest.map(p => <NewsCard key={p.id} post={p} />)}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </>
  );
}
