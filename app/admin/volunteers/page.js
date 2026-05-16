'use client';
// app/admin/volunteers/page.js
import { useState, useCallback, useEffect } from 'react';
import { useAdminAuth } from '@/app/admin/layout';
function useToast(){const[t,setT]=useState([]);const show=useCallback((msg,type='success')=>{const id=Date.now();setT(p=>[...p,{id,msg,type}]);setTimeout(()=>setT(p=>p.filter(x=>x.id!==id)),3500);},[]);return{toasts:t,show};}
function Toast({toasts}){return<div className="toast-wrap">{toasts.map(t=><div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;}
function Sidebar(){const NL=({href,icon,label,a})=><a href={href} className={`admin-nav-link${a?' active':''}`}><span className="nav-icon">{icon}</span>{label}</a>;return(<aside className="admin-sidebar"><div className="admin-sidebar-brand"><img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}} /><div className="logo-sub">मैथिल एसोसिएशन</div></div><nav className="admin-nav"><div className="admin-nav-section">Main</div><NL href="/admin" icon="🏠" label="Dashboard"/><NL href="/admin/members" icon="👥" label="Members"/><NL href="/admin/events" icon="📅" label="Events"/><NL href="/admin/donations" icon="💰" label="Donations"/><NL href="/admin/finance" icon="📊" label="Finance"/><NL href="/admin/analytics" icon="📈" label="Analytics"/><div className="admin-nav-section">Content</div><NL href="/admin/news" icon="📰" label="News"/><NL href="/admin/gallery" icon="🖼️" label="Gallery"/><NL href="/admin/homepage" icon="🏡" label="Home"/><NL href="/admin/about" icon="📝" label="About Us"/><div className="admin-nav-section">Organization</div><NL href="/admin/volunteers" icon="🙋" label="Volunteers" a/><NL href="/admin/committee" icon="🏛️" label="Committee"/><NL href="/admin/inquiries" icon="✉️" label="Inquiries"/><div className="admin-nav-section">Settings</div><NL href="/" icon="🌐" label="Public Site"/></nav></aside>);}

function Modal({volunteer,secret,onClose,onSave}){
  const isEdit=!!volunteer;
  const blank={name:'',email:'',phone:'',role:'',skills:'',availability:'',hours_total:'0',status:'active',joined_date:'',notes:''};
  const[form,setForm]=useState(isEdit?{...blank,...volunteer,joined_date:volunteer.joined_date?.split('T')[0]||'',hours_total:volunteer.hours_total||'0'}:blank);
  const[busy,setBusy]=useState(false);
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const submit=async()=>{setBusy(true);try{const res=await fetch(isEdit?`/api/volunteers/${volunteer.id}`:'/api/volunteers',{method:isEdit?'PATCH':'POST',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify({...form,hours_total:parseFloat(form.hours_total)||0})});const data=await res.json();if(data.success){onSave(data.data,isEdit);onClose();}else alert(data.message);}catch{}setBusy(false);};
  return(<div className="modal-backdrop" onClick={onClose}><div className="modal" style={{maxWidth:600}} onClick={e=>e.stopPropagation()}>
    <div className="modal-header"><h3 className="modal-title">{isEdit?`Edit — ${volunteer.name}`:'🙋 Add Volunteer'}</h3><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
    <div className="form-grid">
      <div className="form-group"><label>Name <span className="req">*</span></label><input value={form.name} onChange={set('name')}/></div>
      <div className="form-group"><label>Email <span className="req">*</span></label><input type="email" value={form.email} onChange={set('email')}/></div>
      <div className="form-group"><label>Phone</label><input value={form.phone} onChange={set('phone')}/></div>
      <div className="form-group"><label>Role</label><input value={form.role} onChange={set('role')} placeholder="Event Coordinator"/></div>
      <div className="form-group span-2"><label>Skills</label><input value={form.skills} onChange={set('skills')} placeholder="Photography, Event planning, Web design"/></div>
      <div className="form-group"><label>Availability</label><input value={form.availability} onChange={set('availability')} placeholder="Weekends"/></div>
      <div className="form-group"><label>Total Hours</label><input type="number" value={form.hours_total} onChange={set('hours_total')} min="0" step="0.5"/></div>
      <div className="form-group"><label>Status</label><select value={form.status} onChange={set('status')}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
      <div className="form-group"><label>Joined Date</label><input type="date" value={form.joined_date} onChange={set('joined_date')}/></div>
      <div className="form-group span-2"><label>Notes</label><textarea value={form.notes} onChange={set('notes')} rows={2}/></div>
    </div>
    <div style={{display:'flex',gap:'.75rem',justifyContent:'flex-end',marginTop:'1rem'}}><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={busy}>{busy?<><span className="spinner"/>…</>:isEdit?'Save':'Add'}</button></div>
  </div></div>);
}

export default function VolunteersPage(){
  const{toasts,show}=useToast();
  const { secret, logout } = useAdminAuth();
  const[volunteers,setVolunteers]=useState([]);const[stats,setStats]=useState({total:0,active:0,inactive:0});
  const[loading,setLoading]=useState(false);const[search,setSearch]=useState('');const[filterStatus,setFilterStatus]=useState('all');
  const[showAdd,setShowAdd]=useState(false);const[editV,setEditV]=useState(null);

  const load=useCallback(async(opts={})=>{setLoading(true);try{const qs=new URLSearchParams({search:opts.search??search,status:opts.status??filterStatus});const res=await fetch(`/api/volunteers?${qs}`,{headers:{'x-admin-secret':secret}});const data=await res.json();if(data.success){setVolunteers(data.data);setStats(data.stats);}else show(data.message,'error');}catch{show('Error','error');}setLoading(false);},[secret,search,filterStatus,show]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{const t=setTimeout(()=>load({search}),380);return()=>clearTimeout(t);},[search]);
  const handleDelete=async id=>{if(!confirm('Remove?'))return;try{const r=await fetch(`/api/volunteers/${id}`,{method:'DELETE',headers:{'x-admin-secret':secret}});const d=await r.json();if(d.success){setVolunteers(p=>p.filter(x=>x.id!==id));show('Removed');load();}else show(d.message,'error');}catch{}};
  const handleSave=(saved,isEdit)=>{if(isEdit)setVolunteers(p=>p.map(x=>x.id===saved.id?saved:x));else setVolunteers(p=>[saved,...p]);show(isEdit?'Updated!':'Added!');load();};

  return(<><div className="admin-layout"><Sidebar/>
    <div className="admin-main">
      <div className="admin-topbar"><div><div style={{fontFamily:'var(--serif)',fontSize:'1.2rem',color:'var(--navy)',fontWeight:600}}>Volunteers</div><div className="text-sm text-muted">स्वयंसेवक · {stats.active} active</div></div>
        <div style={{display:'flex',gap:'.65rem'}}><button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ Add Volunteer</button><button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button></div>
      </div>
      <div className="admin-content">
        <div className="stats-grid">{[{label:'Total',num:stats.total,color:'var(--saffron)'},{label:'Active',num:stats.active,color:'var(--forest)'},{label:'Inactive',num:stats.inactive,color:'var(--gold)'},{label:'Total Hours',num:volunteers.reduce((a,v)=>a+parseFloat(v.hours_total||0),0).toFixed(0),color:'#185FA5'}].map(s=>(<div className="stat-card" key={s.label}><div className="stat-num" style={{color:s.color}}>{s.num}</div><div className="stat-label">{s.label}</div></div>))}</div>
        <div style={{display:'flex',gap:'.65rem',flexWrap:'wrap',marginBottom:'1.25rem',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search name, email, role, skills…" style={{flex:'1 1 200px',maxWidth:300}}/>
          <div className="filter-bar" style={{marginBottom:0}}>{[['all','All'],['active','Active'],['inactive','Inactive']].map(([v,l])=>(<button key={v} className={`filter-btn${filterStatus===v?' active':''}`} onClick={()=>{setFilterStatus(v);load({status:v});}}>{l}</button>))}</div>
        </div>
        {loading?(<div className="loading-state"><span className="spinner"/>Loading…</div>):volunteers.length===0?(<div className="empty-state"><div className="icon">🙋</div><p>No volunteers yet.</p><button className="btn btn-primary btn-sm" style={{marginTop:'1rem'}} onClick={()=>setShowAdd(true)}>+ Add First Volunteer</button></div>):(
          <div className="grid-2">
            {volunteers.map(v=>(<div key={v.id} className="card" style={{display:'flex',flexDirection:'column',gap:'.6rem'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                <div><div style={{fontFamily:'var(--serif)',fontWeight:600,color:'var(--navy)'}}>{v.name}</div><div className="text-sm text-muted">{v.email}</div></div>
                <span className="badge" style={{background:v.status==='active'?'var(--forest-light)':'var(--paper-3)',color:v.status==='active'?'var(--forest)':'var(--ink-soft)'}}>{v.status}</span>
              </div>
              {v.role&&<div className="text-sm" style={{color:'var(--saffron)',fontWeight:600}}>{v.role}</div>}
              {v.skills&&<div className="text-xs text-muted">🛠 {v.skills}</div>}
              {v.availability&&<div className="text-xs text-muted">📅 {v.availability}</div>}
              {v.hours_total>0&&<div className="text-xs" style={{color:'var(--forest)'}}>⏱ {v.hours_total} hours volunteered</div>}
              <div style={{display:'flex',gap:'.4rem',borderTop:'1px solid var(--border)',paddingTop:'.65rem'}}>
                <button className="btn btn-primary btn-sm" style={{flex:1,justifyContent:'center'}} onClick={()=>setEditV(v)}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" style={{flex:1,justifyContent:'center'}} onClick={()=>handleDelete(v.id)}>🗑 Remove</button>
              </div>
            </div>))}
          </div>
        )}
      </div>
    </div>
  </div>
  {showAdd&&<Modal volunteer={null} secret={secret} onClose={()=>setShowAdd(false)} onSave={handleSave}/>}
  {editV&&<Modal volunteer={editV} secret={secret} onClose={()=>setEditV(null)} onSave={handleSave}/>}
  <Toast toasts={toasts}/></>);
}
