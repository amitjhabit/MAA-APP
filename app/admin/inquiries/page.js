'use client';
// app/admin/inquiries/page.js
import { useState, useCallback, useEffect } from 'react';
import { useAdminAuth } from '@/app/admin/layout';
function useToast(){const[t,setT]=useState([]);const show=useCallback((msg,type='success')=>{const id=Date.now();setT(p=>[...p,{id,msg,type}]);setTimeout(()=>setT(p=>p.filter(x=>x.id!==id)),3500);},[]);return{toasts:t,show};}
function Toast({toasts}){return<div className="toast-wrap">{toasts.map(t=><div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;}
function Sidebar(){const NL=({href,icon,label,a})=><a href={href} className={`admin-nav-link${a?' active':''}`}><span className="nav-icon">{icon}</span>{label}</a>;return(<aside className="admin-sidebar"><div className="admin-sidebar-brand"><img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}} /><div className="logo-sub">मैथिल एसोसिएशन</div></div><nav className="admin-nav"><div className="admin-nav-section">Main</div><NL href="/admin" icon="🏠" label="Dashboard"/><NL href="/admin/members" icon="👥" label="Members"/><NL href="/admin/events" icon="📅" label="Events"/><NL href="/admin/donations" icon="💰" label="Donations"/><NL href="/admin/finance" icon="📊" label="Finance"/><NL href="/admin/analytics" icon="📈" label="Analytics"/><div className="admin-nav-section">Content</div><NL href="/admin/news" icon="📰" label="News"/><NL href="/admin/gallery" icon="🖼️" label="Gallery"/><NL href="/admin/homepage" icon="🏡" label="Mission"/><NL href="/admin/about" icon="📝" label="About Us"/><div className="admin-nav-section">Organization</div><NL href="/admin/volunteers" icon="🙋" label="Volunteers"/><NL href="/admin/committee" icon="🏛️" label="Committee"/><NL href="/admin/inquiries" icon="✉️" label="Inquiries" a/><div className="admin-nav-section">Settings</div><NL href="/" icon="🌐" label="Public Site"/></nav></aside>);}

function DetailPanel({inquiry,onClose,onStatusChange}){
  if(!inquiry)return null;
  const SC={new:{bg:'#E3F2FD',color:'#0D47A1'},read:{bg:'var(--paper-3)',color:'var(--ink-soft)'},replied:{bg:'var(--forest-light)',color:'var(--forest)'},archived:{bg:'var(--gold-light)',color:'var(--gold)'}};
  const s=SC[inquiry.status]||SC.new;
  return(<>
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(13,33,55,.3)',zIndex:79}}/>
    <div className="detail-panel">
      <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:'.7rem',textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ink-dim)'}}>Inquiry Detail</span>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
      </div>
      <div style={{padding:'1.25rem',borderBottom:'1px solid var(--border)'}}>
        <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.05rem',color:'var(--navy)',marginBottom:'.35rem'}}>{inquiry.subject}</div>
        <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
          <span className="badge" style={{background:s.bg,color:s.color}}>{inquiry.status}</span>
          <span className="badge" style={{background:'var(--paper-3)',color:'var(--ink-soft)'}}>{inquiry.inquiry_type}</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'1.25rem'}}>
        <div style={{marginBottom:'1rem'}}>
          <div style={{fontSize:'.7rem',textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-dim)',marginBottom:'.25rem'}}>From</div>
          <div style={{fontWeight:600,color:'var(--navy)'}}>{inquiry.name}</div>
          <a href={`mailto:${inquiry.email}`} style={{color:'var(--saffron)',fontSize:'.875rem'}}>{inquiry.email}</a>
          {inquiry.phone&&<div className="text-sm text-muted">{inquiry.phone}</div>}
        </div>
        <div style={{marginBottom:'1rem'}}>
          <div style={{fontSize:'.7rem',textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-dim)',marginBottom:'.25rem'}}>Message</div>
          <div style={{background:'var(--paper-2)',borderRadius:'var(--radius)',padding:'1rem',fontSize:'.875rem',lineHeight:1.7,color:'var(--ink)',whiteSpace:'pre-wrap'}}>{inquiry.message}</div>
        </div>
        <div style={{fontSize:'.75rem',color:'var(--ink-dim)'}}>Received: {new Date(inquiry.created_at).toLocaleString()}</div>
      </div>
      <div style={{padding:'1rem 1.25rem',borderTop:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:'.5rem'}}>
        <div style={{fontSize:'.72rem',fontWeight:600,color:'var(--ink-dim)',textTransform:'uppercase',marginBottom:'.2rem'}}>Update Status</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.4rem'}}>
          {['read','replied','archived','new'].filter(s=>s!==inquiry.status).map(s=>(<button key={s} className="btn btn-ghost btn-sm" style={{justifyContent:'center',textTransform:'capitalize'}} onClick={()=>{onStatusChange(inquiry.id,s);onClose();}}>{s}</button>))}
        </div>
        <a href={`mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject)}`} className="btn btn-primary btn-sm" style={{justifyContent:'center',marginTop:'.25rem'}}>✉️ Reply via Email</a>
      </div>
    </div>
  </>);
}

export default function InquiriesPage(){
  const{toasts,show}=useToast();
  const { secret, logout } = useAdminAuth();
  const[inquiries,setInquiries]=useState([]);const[stats,setStats]=useState({total:0,new:0,read:0,replied:0,archived:0});
  const[loading,setLoading]=useState(false);const[search,setSearch]=useState('');const[filterStatus,setFilterStatus]=useState('all');const[filterType,setFilterType]=useState('all');
  const[panel,setPanel]=useState(null);

  const load=useCallback(async(opts={})=>{setLoading(true);try{const qs=new URLSearchParams({limit:'50',search:opts.search??search,status:opts.status??filterStatus,type:opts.type??filterType});const res=await fetch(`/api/inquiries?${qs}`,{headers:{'x-admin-secret':secret}});const data=await res.json();if(data.success){setInquiries(data.data);setStats(data.stats);}else show(data.message,'error');}catch{show('Error','error');}setLoading(false);},[secret,search,filterStatus,filterType,show]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{const t=setTimeout(()=>load({search}),380);return()=>clearTimeout(t);},[search]);
  const handleStatus=async(id,status)=>{try{const r=await fetch(`/api/inquiries/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify({status})});const d=await r.json();if(d.success){setInquiries(p=>p.map(x=>x.id===id?d.data:x));setStats(s=>({...s,[d.data.status]:(s[d.data.status]||0)+1}));show('Status updated!');}else show(d.message,'error');}catch{}};
  const handleDelete=async id=>{if(!confirm('Delete?'))return;try{const r=await fetch(`/api/inquiries/${id}`,{method:'DELETE',headers:{'x-admin-secret':secret}});const d=await r.json();if(d.success){setInquiries(p=>p.filter(x=>x.id!==id));show('Deleted');load();}else show(d.message,'error');}catch{}};

  const SC={new:{bg:'#E3F2FD',color:'#0D47A1'},read:{bg:'var(--paper-3)',color:'var(--ink-soft)'},replied:{bg:'var(--forest-light)',color:'var(--forest)'},archived:{bg:'var(--gold-light)',color:'var(--gold)'}};
  return(<><div className="admin-layout"><Sidebar/>
    <div className="admin-main" style={{marginRight:panel?380:0,transition:'margin-right .22s'}}>
      <div className="admin-topbar"><div><div style={{fontFamily:'var(--serif)',fontSize:'1.2rem',color:'var(--navy)',fontWeight:600}}>Inquiries & Messages</div><div className="text-sm text-muted">पूछताछ · {stats.new} new · {stats.total} total</div></div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
      </div>
      <div className="admin-content">
        {stats.new>0&&<div style={{background:'var(--crimson-light)',border:'1px solid rgba(155,29,32,.2)',borderRadius:'var(--radius-lg)',padding:'1rem 1.5rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'1rem'}}>
          <span style={{fontSize:'1.5rem'}}>🔔</span>
          <div><div style={{fontWeight:700,color:'var(--crimson)'}}>You have {stats.new} new {stats.new===1?'inquiry':'inquiries'}!</div><div className="text-sm text-muted">Click to view and respond.</div></div>
        </div>}
        <div className="stats-grid">
          {[{label:'Total',num:stats.total,color:'var(--saffron)'},{label:'New',num:stats.new,color:'#0D47A1'},{label:'Replied',num:stats.replied,color:'var(--forest)'},{label:'Archived',num:stats.archived,color:'var(--gold)'}].map(s=>(<div className="stat-card" key={s.label}><div className="stat-num" style={{color:s.color}}>{s.num}</div><div className="stat-label">{s.label}</div></div>))}
        </div>
        <div style={{display:'flex',gap:'.65rem',flexWrap:'wrap',marginBottom:'1.25rem',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search name, email, subject…" style={{flex:'1 1 200px',maxWidth:300}}/>
          <div className="filter-bar" style={{marginBottom:0}}>
            {[['all','All'],['new','New'],['read','Read'],['replied','Replied'],['archived','Archived']].map(([v,l])=>(<button key={v} className={`filter-btn${filterStatus===v?' active':''}`} onClick={()=>{setFilterStatus(v);load({status:v});}}>{l}</button>))}
          </div>
          <select value={filterType} onChange={e=>{setFilterType(e.target.value);load({type:e.target.value});}} style={{width:'auto'}}><option value="all">All Types</option><option value="general">General</option><option value="membership">Membership</option><option value="event">Event</option><option value="donation">Donation</option><option value="volunteer">Volunteer</option></select>
        </div>
        {loading?(<div className="loading-state"><span className="spinner"/>Loading…</div>):inquiries.length===0?(<div className="empty-state"><div className="icon">✉️</div><p>No inquiries yet.</p></div>):(
          <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
            {inquiries.map(inq=>{const sc=SC[inq.status]||SC.new;const isNew=inq.status==='new';return(<div key={inq.id} className="card" style={{display:'flex',gap:'1rem',alignItems:'flex-start',borderLeft:isNew?'3px solid #0D47A1':'none',cursor:'pointer'}} onClick={()=>setPanel(inq)}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap',marginBottom:'.3rem'}}>
                  <span className="badge" style={{background:sc.bg,color:sc.color}}>{inq.status}</span>
                  <span className="badge" style={{background:'var(--paper-3)',color:'var(--ink-soft)'}}>{inq.inquiry_type}</span>
                </div>
                <div style={{fontWeight:isNew?700:500,fontSize:'.9rem',color:'var(--navy)',marginBottom:'.2rem'}}>{inq.subject}</div>
                <div style={{display:'flex',gap:'1rem'}}>
                  <span className="text-sm" style={{color:'var(--ink-soft)'}}>{inq.name}</span>
                  <span className="text-sm text-muted">{inq.email}</span>
                </div>
                <div className="text-sm text-muted" style={{marginTop:'.2rem'}}>{inq.message.slice(0,100)}{inq.message.length>100?'…':''}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'.35rem',flexShrink:0}} onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',gap:'.3rem'}}>
                  <button className="btn btn-ghost btn-sm" style={{padding:'.3rem .6rem'}} onClick={()=>setPanel(inq)} title="View">👁</button>
                  <a href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`} className="btn btn-primary btn-sm" style={{padding:'.3rem .6rem'}} title="Reply">✉️</a>
                  <button className="btn btn-danger btn-sm" style={{padding:'.3rem .6rem'}} onClick={()=>handleDelete(inq.id)} title="Delete">🗑</button>
                </div>
                <select value={inq.status} onChange={e=>handleStatus(inq.id,e.target.value)} style={{fontSize:'.72rem',padding:'.2rem .45rem',width:'auto',border:`1px solid ${sc.color}44`,background:sc.bg,color:sc.color,borderRadius:4}} onClick={e=>e.stopPropagation()}>
                  <option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archived</option>
                </select>
              </div>
            </div>);})}
          </div>
        )}
      </div>
    </div>
  </div>
  {panel&&<DetailPanel inquiry={panel} onClose={()=>setPanel(null)} onStatusChange={(id,status)=>{handleStatus(id,status);}}/>}
  <Toast toasts={toasts}/></>);
}
