'use client';
// app/components/CommitteeSection.js
// Fetches committee data fresh on every mount — bypasses Next.js router cache
import { useState, useEffect } from 'react';

function MemberCard({ m, past }) {
  return (
    <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', opacity: past ? 0.85 : 1 }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: past ? 'var(--paper-3)' : 'var(--saffron-light)',
        border: `2px solid ${past ? 'var(--border-hi)' : 'var(--saffron)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', fontWeight: 700,
        color: past ? 'var(--ink-soft)' : 'var(--saffron)',
        flexShrink: 0, overflow: 'hidden',
      }}>
        {m.photo_url
          ? <img src={m.photo_url} alt={m.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          : m.name[0]}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, color: 'var(--navy)' }}>{m.name}</div>
        <div style={{ color: past ? 'var(--ink-soft)' : 'var(--saffron)', fontSize: '.875rem', fontWeight: 600 }}>{m.role}</div>
        {m.email && <div className="text-xs text-muted">{m.email}</div>}
        {(m.term_start || m.term_end) && (
          <div className="text-xs text-muted">
            Term: {m.term_start ? new Date(m.term_start).getFullYear() : '?'} – {m.term_end ? new Date(m.term_end).getFullYear() : (past ? '?' : 'Present')}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommitteeSection({ initialMembers = [] }) {
  const [members, setMembers] = useState(initialMembers);

  // Re-fetch on every mount so admin changes appear immediately
  useEffect(() => {
    fetch('/api/public/committee', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.success) setMembers(d.data || []); })
      .catch(() => {});
  }, []);

  const current = members.filter(m => m.is_current);
  const past    = members.filter(m => !m.is_current);

  return (
    <>
      {/* Current Committee */}
      {current.length > 0 && (
        <>
          <div className="section-header">
            <div>
              <div className="section-eyebrow">नेतृत्व</div>
              <h2 className="section-title">Executive <span>Committee</span></h2>
            </div>
          </div>
          <div className="grid-2" style={{ marginBottom: '3.5rem' }}>
            {current.map(m => <MemberCard key={m.id} m={m} past={false} />)}
          </div>
        </>
      )}

      {/* Past Members */}
      {past.length > 0 && (
        <>
          <div className="section-header">
            <div>
              <div className="section-eyebrow">पूर्व नेतृत्व</div>
              <h2 className="section-title">Past <span>Committee Members</span></h2>
            </div>
          </div>
          <div className="grid-2" style={{ marginBottom: '3.5rem' }}>
            {past.map(m => <MemberCard key={m.id} m={m} past={true} />)}
          </div>
        </>
      )}
    </>
  );
}
