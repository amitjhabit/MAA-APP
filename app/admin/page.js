'use client';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [stats,  setStats]  = useState({ members:0, events:0, news:0 });
  const [loading, setLoading] = useState(false);

  const handleLogin = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch('/api/members?limit=1', { headers: { 'x-admin-secret': secret } });
      if (res.ok) {
        setAuthed(true);
        const s = await fetch('/api/public/stats').then(r=>r.json());
        if (s.success) setStats(s.data);
      } else alert('Invalid password');
    } catch {}
    setLoading(false);
  };

  if (!authed) return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>🏛️</div>
        <h2>MAA Admin</h2>
        <p>Maithil Association of America — Admin Dashboard</p>
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom:'1rem' }}>
            <label>Admin Password</label>
            <input type="password" value={secret} onChange={e=>setSecret(e.target.value)} placeholder="ADMIN_SECRET" autoFocus />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading?'Verifying…':'Enter Admin →'}</button>
        </form>
        <div style={{ textAlign:'center', marginTop:'1rem' }}><a href="/" style={{ color:'var(--saffron)', fontSize:'.85rem' }}>← Public Website</a></div>
      </div>
    </div>
  );

  const modules = [
    { icon:'👥', title:'Members',    sub:'सदस्य',        href:'/admin/members',   stat:stats.members, color:'var(--saffron)' },
    { icon:'📅', title:'Events',     sub:'कार्यक्रम',    href:'/admin/events',    stat:stats.events,  color:'#185FA5' },
    { icon:'💰', title:'Donations',  sub:'दान',          href:'/admin/donations', stat:null,          color:'var(--forest)' },
    { icon:'📰', title:'News',       sub:'समाचार',       href:'/admin/news',      stat:stats.news,    color:'var(--gold)' },
    { icon:'🙋', title:'Volunteers', sub:'स्वयंसेवक',    href:'/admin/volunteers',stat:null,          color:'var(--crimson)' },
    { icon:'🏛️', title:'Committee', sub:'समिति',        href:'/admin/committee', stat:null,          color:'var(--navy)' },
    { icon:'🖼️', title:'Gallery',   sub:'गैलरी',        href:'/admin/gallery',   stat:null,          color:'#7B1FA2' },
    { icon:'✉️', title:'Inquiries', sub:'पूछताछ',       href:'/admin/inquiries', stat:null,          color:'#0097A7' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--paper)' }}>
      <div style={{ background:'var(--navy)', borderBottom:'3px solid var(--saffron)', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ color:'#fff', fontFamily:'var(--serif)', fontSize:'1.2rem', fontWeight:700 }}>MAA Admin Dashboard</div>
          <div style={{ color:'var(--gold)', fontSize:'.78rem' }}>मैथिल एसोसिएशन ऑफ अमेरिका</div>
        </div>
        <div style={{ display:'flex', gap:'.75rem' }}>
          <a href="/" className="btn btn-ghost btn-sm" style={{ color:'rgba(255,255,255,.8)', borderColor:'rgba(255,255,255,.2)' }}>🌐 Public Site</a>
          <a href="/api/health" target="_blank" className="btn btn-ghost btn-sm" style={{ color:'rgba(255,255,255,.8)', borderColor:'rgba(255,255,255,.2)' }}>⚡ Health</a>
          <button className="btn btn-ghost btn-sm" style={{ color:'rgba(255,255,255,.8)', borderColor:'rgba(255,255,255,.2)' }} onClick={()=>setAuthed(false)}>Sign Out</button>
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontFamily:'var(--serif)', fontSize:'1.6rem', color:'var(--navy)', marginBottom:'.25rem' }}>Welcome to MAA CRM</h1>
          <p style={{ color:'var(--ink-dim)', fontSize:'.9rem' }}>Select a module to manage your association data.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
          {modules.map(m=>(
            <a href={m.href} key={m.title} className="card" style={{ textDecoration:'none', display:'flex', flexDirection:'column', gap:'.5rem', borderTop:`3px solid ${m.color}` }}>
              <div style={{ fontSize:'2rem' }}>{m.icon}</div>
              <div style={{ fontFamily:'var(--serif)', fontSize:'1.1rem', fontWeight:600, color:'var(--navy)' }}>{m.title}</div>
              <div style={{ fontSize:'.8rem', color:'var(--gold)', fontFamily:'var(--serif)', fontStyle:'italic' }}>{m.sub}</div>
              {m.stat!==null&&<div style={{ marginTop:'auto', fontFamily:'var(--serif)', fontSize:'1.5rem', fontWeight:700, color:m.color }}>{m.stat}</div>}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
