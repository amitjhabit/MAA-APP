'use client';
// app/admin/committee/page.js
import { useState, useCallback, useEffect } from 'react';
function useToast(){const[t,setT]=useState([]);const show=useCallback((msg,type='success')=>{const id=Date.now();setT(p=>[...p,{id,msg,type}]);setTimeout(()=>setT(p=>p.filter(x=>x.id!==id)),3500);},[]);return{toasts:t,show};}
function Toast({toasts}){return<div className="toast-wrap">{toasts.map(t=><div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;}
function Sidebar(){const NL=({href,icon,label,a})=><a href={href} className={`admin-nav-link${a?' active':''}`}><span className="nav-icon">{icon}</span>{label}</a>;return(<aside className="admin-sidebar"><div className="admin-sidebar-brand"><img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}} /><div className="logo-sub">मैथिल एसोसिएशन</div></div><nav className="admin-nav"><div className="admin-nav-section">Main</div><NL href="/admin" icon="🏠" label="Dashboard"/><NL href="/admin/members" icon="👥" label="Members"/><NL href="/admin/events" icon="📅" label="Events"/><NL href="/admin/donations" icon="💰" label="Donations"/><NL href="/admin/finance" icon="📊" label="Finance"/><NL href="/admin/analytics" icon="📈" label="Analytics"/><div className="admin-nav-section">Content</div><NL href="/admin/news" icon="📰" label="News"/><NL href="/admin/gallery" icon="🖼️" label="Gallery"/><NL href="/admin/about" icon="📝" label="About Us"/><div className="admin-nav-section">Organization</div><NL href="/admin/volunteers" icon="🙋" label="Volunteers"/><NL href="/admin/committee" icon="🏛️" label="Committee" a/><NL href="/admin/inquiries" icon="✉️" label="Inquiries"/><div className="admin-nav-section">Settings</div><NL href="/" icon="🌐" label="Public Site"/></nav></aside>);}

function Modal({member,secret,onClose,onSave}){
  const isEdit=!!member;
  const blank={name:'',email:'',phone:'',role:'',committee:'executive',term_start:'',term_end:'',is_current:true,bio:'',photo_url:'',sort_order:'0'};
  const norm=m=>({...blank,...m,term_start:m.term_start?.split('T')[0]||'',term_end:m.term_end?.split('T')[0]||'',sort_order:String(m.sort_order||0)});
  const[form,setForm]=useState(isEdit?norm(member):blank);
  const[busy,setBusy]=useState(false);
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value}));
  const submit=async()=>{setBusy(true);try{const res=await fetch(isEdit?`/api/committee/${member.id}`:'/api/committee',{method:isEdit?'PATCH':'POST',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify({...form,sort_order:parseInt(form.sort_order)||0})});const data=await res.json();if(data.success){onSave(data.data,isEdit);onClose();}else alert(data.message);}catch{}setBusy(false);};
  return(<div className="modal-backdrop" onClick={onClose}><div className="modal" style={{maxWidth:620}} onClick={e=>e.stopPropagation()}>
    <div className="modal-header"><h3 className="modal-title">{isEdit?`Edit — ${member.name}`:'🏛️ Add Committee Member'}</h3><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
    <div className="form-grid">
      <div className="form-group"><label>Full Name <span className="req">*</span></label><input value={form.name} onChange={set('name')}/></div>
      <div className="form-group"><label>Role / Title <span className="req">*</span></label><input value={form.role} onChange={set('role')} placeholder="President, Treasurer…"/></div>
      <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={set('email')}/></div>
      <div className="form-group"><label>Phone</label><input value={form.phone} onChange={set('phone')}/></div>
      <div className="form-group"><label>Committee</label><select value={form.committee} onChange={set('committee')}><option value="executive">Executive</option><option value="board">Board</option><option value="cultural">Cultural</option><option value="finance">Finance</option><option value="events">Events</option><option value="youth">Youth</option><option value="other">Other</option></select></div>
      <div className="form-group"><label>Sort Order</label><input type="number" value={form.sort_order} onChange={set('sort_order')} min="0"/></div>
      <div className="form-group"><label>Term Start</label><input type="date" value={form.term_start} onChange={set('term_start')}/></div>
      <div className="form-group"><label>Term End</label><input type="date" value={form.term_end} onChange={set('term_end')}/></div>
      <div className="form-group span-2"><label>Photo URL</label><input type="url" value={form.photo_url} onChange={set('photo_url')} placeholder="https://…"/></div>
      <div className="form-group span-2"><label>Bio</label><textarea value={form.bio} onChange={set('bio')} rows={3}/></div>
      <div className="form-group" style={{display:'flex',alignItems:'center',gap:'.5rem'}}><input type="checkbox" checked={form.is_current} onChange={set('is_current')} style={{width:'auto'}}/><label style={{marginBottom:0}}>Currently Serving</label></div>
    </div>
    <div style={{display:'flex',gap:'.75rem',justifyContent:'flex-end',marginTop:'1rem'}}><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={busy}>{busy?<><span className="spinner"/>…</>:isEdit?'Save':'Add'}</button></div>
  </div></div>);
}

export default function CommitteePage(){
  const{toasts,show}=useToast();
  const[secret,setSecret]=useState('');const[authed,setAuthed]=useState(false);const[authErr,setAuthErr]=useState('');const[authBusy,setAuthBusy]=useState(false);
  const[members,setMembers]=useState([]);const[stats,setStats]=useState({total:0,current:0,past:0});
  const[loading,setLoading]=useState(false);const[filterCommittee,setFilterCommittee]=useState('all');
  const[showAdd,setShowAdd]=useState(false);const[editM,setEditM]=useState(null);

  const load=useCallback(async(opts={})=>{setLoading(true);try{const qs=new URLSearchParams({committee:opts.committee??filterCommittee});const res=await fetch(`/api/committee?${qs}`,{headers:{'x-admin-secret':secret}});const data=await res.json();if(data.success){setMembers(data.data);setStats(data.stats);}else show(data.message,'error');}catch{show('Error','error');}setLoading(false);},[secret,filterCommittee,show]);
  useEffect(()=>{if(authed)load();},[authed,load]);
  const handleLogin=async e=>{e.preventDefault();setAuthBusy(true);setAuthErr('');try{const r=await fetch('/api/committee',{headers:{'x-admin-secret':secret}});if(r.ok)setAuthed(true);else setAuthErr('Invalid password.');}catch{setAuthErr('Network error.');}setAuthBusy(false);};
  const handleDelete=async id=>{if(!confirm('Remove?'))return;try{const r=await fetch(`/api/committee/${id}`,{method:'DELETE',headers:{'x-admin-secret':secret}});const d=await r.json();if(d.success){setMembers(p=>p.filter(x=>x.id!==id));show('Removed');load();}else show(d.message,'error');}catch{}};
  const handleSave=(saved,isEdit)=>{if(isEdit)setMembers(p=>p.map(x=>x.id===saved.id?saved:x));else setMembers(p=>[...p,saved].sort((a,b)=>a.sort_order-b.sort_order));show(isEdit?'Updated!':'Added!');load();};

  if(!authed)return(<div className="login-wrap"><div className="login-card"><div style={{fontSize:'2rem',marginBottom:'.5rem'}}>🏛️</div><h2>Committee</h2><p>MAA Admin — Committee Management</p>{authErr&&<div style={{background:'var(--crimson-light)',borderRadius:'var(--radius)',padding:'.7rem',marginBottom:'1rem',color:'var(--crimson)',fontSize:'.82rem'}}>{authErr}</div>}<form onSubmit={handleLogin}><div className="form-group" style={{marginBottom:'1rem'}}><label>Admin Password</label><input type="password" value={secret} onChange={e=>setSecret(e.target.value)} autoFocus/></div><button type="submit" className="btn btn-primary w-full" disabled={authBusy}>{authBusy?'Verifying…':'Enter →'}</button></form><div style={{textAlign:'center',marginTop:'1rem'}}><a href="/admin" style={{color:'var(--saffron)',fontSize:'.85rem'}}>← Dashboard</a></div></div></div>);

  return(<><div className="admin-layout"><Sidebar/>
    <div className="admin-main">
      <div className="admin-topbar"><div><div style={{fontFamily:'var(--serif)',fontSize:'1.2rem',color:'var(--navy)',fontWeight:600}}>Committee & Board</div><div className="text-sm text-muted">समिति · {stats.current} currently serving</div></div>
        <div style={{display:'flex',gap:'.65rem'}}><button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ Add Member</button><button className="btn btn-ghost btn-sm" onClick={()=>{setAuthed(false);setSecret('');}}>Sign Out</button></div>
      </div>
      <div className="admin-content">
        <div className="stats-grid">{[{label:'Total',num:stats.total,color:'var(--saffron)'},{label:'Currently Serving',num:stats.current,color:'var(--forest)'},{label:'Past Members',num:stats.past,color:'var(--gold)'}].map(s=>(<div className="stat-card" key={s.label}><div className="stat-num" style={{color:s.color}}>{s.num}</div><div className="stat-label">{s.label}</div></div>))}</div>
        <div style={{marginBottom:'1.25rem'}}>
          <div className="filter-bar" style={{marginBottom:0}}>{[['all','All'],['executive','Executive'],['board','Board'],['cultural','Cultural'],['finance','Finance'],['events','Events'],['youth','Youth']].map(([v,l])=>(<button key={v} className={`filter-btn${filterCommittee===v?' active':''}`} onClick={()=>{setFilterCommittee(v);load({committee:v});}}>{l}</button>))}</div>
        </div>
        {loading?(<div className="loading-state"><span className="spinner"/>Loading…</div>):members.length===0?(<div className="empty-state"><div className="icon">🏛️</div><p>No members yet.</p><button className="btn btn-primary btn-sm" style={{marginTop:'1rem'}} onClick={()=>setShowAdd(true)}>+ Add First Member</button></div>):(
          <div className="grid-2">
            {members.map(m=>(<div key={m.id} className="card" style={{display:'flex',gap:'1rem',alignItems:'flex-start'}}>
              <div style={{width:52,height:52,borderRadius:'50%',background:'var(--saffron-light)',border:'2px solid var(--saffron)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',fontWeight:700,color:'var(--saffron)',flexShrink:0,overflow:'hidden'}}>
                {m.photo_url?<img src={m.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:m.name[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'.5rem'}}>
                  <div>
                    <div style={{fontFamily:'var(--serif)',fontWeight:600,color:'var(--navy)'}}>{m.name}</div>
                    <div style={{color:'var(--saffron)',fontSize:'.875rem',fontWeight:600}}>{m.role}</div>
                    <div className="text-xs text-muted" style={{textTransform:'capitalize'}}>{m.committee} committee</div>
                  </div>
                  <span className="badge" style={{background:m.is_current?'var(--forest-light)':'var(--paper-3)',color:m.is_current?'var(--forest)':'var(--ink-soft)',flexShrink:0}}>{m.is_current?'Current':'Past'}</span>
                </div>
                {m.email&&<div className="text-xs text-muted" style={{marginTop:'.35rem'}}>{m.email}</div>}
                {(m.term_start||m.term_end)&&<div className="text-xs text-muted">Term: {m.term_start?new Date(m.term_start).getFullYear():'?'} – {m.term_end?new Date(m.term_end).getFullYear():'Present'}</div>}
                {m.bio&&<div className="text-xs text-muted" style={{marginTop:'.25rem'}}>{m.bio.slice(0,80)}{m.bio.length>80?'…':''}</div>}
                <div style={{display:'flex',gap:'.4rem',marginTop:'.65rem'}}>
                  <button className="btn btn-primary btn-sm" onClick={()=>setEditM(m)}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(m.id)}>🗑 Remove</button>
                </div>
              </div>
            </div>))}
          </div>
        )}
      </div>
    </div>
  </div>
  {showAdd&&<Modal member={null} secret={secret} onClose={()=>setShowAdd(false)} onSave={handleSave}/>}
  {editM&&<Modal member={editM} secret={secret} onClose={()=>setEditM(null)} onSave={handleSave}/>}
  <Toast toasts={toasts}/></>);
}
