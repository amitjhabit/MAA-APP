'use client';
// app/admin/news/page.js
import { useState, useCallback, useEffect } from 'react';
function useToast(){const[t,setT]=useState([]);const show=useCallback((msg,type='success')=>{const id=Date.now();setT(p=>[...p,{id,msg,type}]);setTimeout(()=>setT(p=>p.filter(x=>x.id!==id)),3500);},[]);return{toasts:t,show};}
function Toast({toasts}){return<div className="toast-wrap">{toasts.map(t=><div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;}
function Sidebar(){const NL=({href,icon,label,a})=><a href={href} className={`admin-nav-link${a?' active':''}`}><span className="nav-icon">{icon}</span>{label}</a>;return(<aside className="admin-sidebar"><div className="admin-sidebar-brand"><div className="logo-text">MAA CRM</div><div className="logo-sub">मैथिल एसोसिएशन</div></div><nav className="admin-nav"><div className="admin-nav-section">Main</div><NL href="/admin" icon="🏠" label="Dashboard"/><NL href="/admin/members" icon="👥" label="Members"/><NL href="/admin/events" icon="📅" label="Events"/><NL href="/admin/donations" icon="💰" label="Donations"/><div className="admin-nav-section">Content</div><NL href="/admin/news" icon="📰" label="News" a/><NL href="/admin/gallery" icon="🖼️" label="Gallery"/><div className="admin-nav-section">Organization</div><NL href="/admin/volunteers" icon="🙋" label="Volunteers"/><NL href="/admin/committee" icon="🏛️" label="Committee"/><NL href="/admin/inquiries" icon="✉️" label="Inquiries"/><div className="admin-nav-section">Settings</div><NL href="/" icon="🌐" label="Public Site"/></nav></aside>);}

function NewsModal({post,secret,onClose,onSave}){
  const isEdit=!!post;
  const blank={title:'',title_maithili:'',excerpt:'',content:'',content_maithili:'',category:'general',status:'draft',featured_image:'',author:''};
  const[form,setForm]=useState(isEdit?{...blank,...post}:blank);
  const[busy,setBusy]=useState(false);
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const submit=async()=>{setBusy(true);try{const res=await fetch(isEdit?`/api/news/${post.id}`:'/api/news',{method:isEdit?'PATCH':'POST',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify(form)});const data=await res.json();if(data.success){onSave(data.data,isEdit);onClose();}else alert(data.message||'Error');}catch{}setBusy(false);};
  return(<div className="modal-backdrop" onClick={onClose}><div className="modal" style={{maxWidth:680}} onClick={e=>e.stopPropagation()}>
    <div className="modal-header"><h3 className="modal-title">{isEdit?`Edit — ${post.title}`:'📰 New Post'}</h3><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
    <div className="form-grid">
      <div className="form-group span-2"><label>Title (English) <span className="req">*</span></label><input value={form.title} onChange={set('title')} placeholder="Post title"/></div>
      <div className="form-group span-2"><label>Title in Maithili (मैथिली)</label><input value={form.title_maithili} onChange={set('title_maithili')} placeholder="मैथिली शीर्षक"/></div>
      <div className="form-group"><label>Category</label><select value={form.category} onChange={set('category')}><option value="general">General</option><option value="cultural">Cultural</option><option value="event">Event</option><option value="announcement">Announcement</option><option value="newsletter">Newsletter</option></select></div>
      <div className="form-group"><label>Status</label><select value={form.status} onChange={set('status')}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
      <div className="form-group"><label>Author</label><input value={form.author} onChange={set('author')} placeholder="MAA Communications Team"/></div>
      <div className="form-group"><label>Featured Image URL</label><input type="url" value={form.featured_image} onChange={set('featured_image')} placeholder="https://…"/></div>
      <div className="form-group span-2"><label>Excerpt / Summary</label><textarea value={form.excerpt} onChange={set('excerpt')} rows={2} placeholder="Brief summary shown on homepage and news listing…"/></div>
      <div className="form-group span-2"><label>Full Content</label><textarea value={form.content} onChange={set('content')} rows={6} placeholder="Full article content…"/></div>
      <div className="form-group span-2"><label>Content in Maithili (optional)</label><textarea value={form.content_maithili} onChange={set('content_maithili')} rows={4} placeholder="मैथिली में सामग्री…"/></div>
    </div>
    <div style={{display:'flex',gap:'.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      {form.status==='draft'&&<button className="btn btn-gold" onClick={()=>{setForm(p=>({...p,status:'published'}));setTimeout(submit,0);}}>Publish Now</button>}
      <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy?<><span className="spinner"/>Saving…</>:isEdit?'Save':'Create Post'}</button>
    </div>
  </div></div>);
}

export default function NewsPage(){
  const{toasts,show}=useToast();
  const[secret,setSecret]=useState('');const[authed,setAuthed]=useState(false);const[authErr,setAuthErr]=useState('');const[authBusy,setAuthBusy]=useState(false);
  const[posts,setPosts]=useState([]);const[stats,setStats]=useState({total:0,published:0,draft:0});
  const[loading,setLoading]=useState(false);const[search,setSearch]=useState('');const[filterStatus,setFilterStatus]=useState('all');
  const[showAdd,setShowAdd]=useState(false);const[editPost,setEditPost]=useState(null);

  const load=useCallback(async(opts={})=>{setLoading(true);try{const qs=new URLSearchParams({limit:'50',search:opts.search??search,status:opts.status??filterStatus});const res=await fetch(`/api/news?${qs}`,{headers:{'x-admin-secret':secret}});const data=await res.json();if(data.success){setPosts(data.data);setStats(data.stats);}else show(data.message,'error');}catch{show('Error','error');}setLoading(false);},[secret,search,filterStatus,show]);
  useEffect(()=>{if(authed)load();},[authed,load]);
  useEffect(()=>{if(!authed)return;const t=setTimeout(()=>load({search}),380);return()=>clearTimeout(t);},[search,authed]);

  const handleLogin=async e=>{e.preventDefault();setAuthBusy(true);setAuthErr('');try{const r=await fetch('/api/news?limit=1',{headers:{'x-admin-secret':secret}});if(r.ok)setAuthed(true);else setAuthErr('Invalid password.');}catch{setAuthErr('Network error.');}setAuthBusy(false);};
  const handleDelete=async id=>{if(!confirm('Delete this post?'))return;try{const r=await fetch(`/api/news/${id}`,{method:'DELETE',headers:{'x-admin-secret':secret}});const d=await r.json();if(d.success){setPosts(p=>p.filter(x=>x.id!==id));show('Deleted');load();}else show(d.message,'error');}catch{}};
  const handleSave=(saved,isEdit)=>{if(isEdit)setPosts(p=>p.map(x=>x.id===saved.id?saved:x));else setPosts(p=>[saved,...p]);show(isEdit?'Updated!':'Created!');load();};
  const toggleStatus=async(post)=>{const ns=post.status==='published'?'draft':'published';try{const r=await fetch(`/api/news/${post.id}`,{method:'PATCH',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify({status:ns})});const d=await r.json();if(d.success){setPosts(p=>p.map(x=>x.id===post.id?d.data:x));show(ns==='published'?'Published!':'Moved to Draft');}}catch{}};

  if(!authed)return(<div className="login-wrap"><div className="login-card"><div style={{fontSize:'2rem',marginBottom:'.5rem'}}>📰</div><h2>News & Posts</h2><p>MAA Admin — Content Management</p>{authErr&&<div style={{background:'var(--crimson-light)',borderRadius:'var(--radius)',padding:'.7rem',marginBottom:'1rem',color:'var(--crimson)',fontSize:'.82rem'}}>{authErr}</div>}<form onSubmit={handleLogin}><div className="form-group" style={{marginBottom:'1rem'}}><label>Admin Password</label><input type="password" value={secret} onChange={e=>setSecret(e.target.value)} autoFocus/></div><button type="submit" className="btn btn-primary w-full" disabled={authBusy}>{authBusy?'Verifying…':'Enter →'}</button></form><div style={{textAlign:'center',marginTop:'1rem'}}><a href="/admin" style={{color:'var(--saffron)',fontSize:'.85rem'}}>← Dashboard</a></div></div></div>);

  const SC={draft:{bg:'var(--gold-light)',color:'var(--gold)'},published:{bg:'var(--forest-light)',color:'var(--forest)'},archived:{bg:'var(--paper-3)',color:'var(--ink-soft)'}};
  return(<><div className="admin-layout"><Sidebar/>
    <div className="admin-main">
      <div className="admin-topbar"><div><div style={{fontFamily:'var(--serif)',fontSize:'1.2rem',color:'var(--navy)',fontWeight:600}}>News & Announcements</div><div className="text-sm text-muted">समाचार प्रबंधन · {stats.published} published · {stats.draft} drafts</div></div>
        <div style={{display:'flex',gap:'.65rem'}}><button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ New Post</button><button className="btn btn-ghost btn-sm" onClick={()=>{setAuthed(false);setSecret('');}}>Sign Out</button></div>
      </div>
      <div className="admin-content">
        <div className="stats-grid">
          {[{label:'Total',num:stats.total,color:'var(--saffron)'},{label:'Published',num:stats.published,color:'var(--forest)'},{label:'Drafts',num:stats.draft,color:'var(--gold)'},{label:'Archived',num:stats.archived||0,color:'var(--ink-dim)'}].map(s=>(<div className="stat-card" key={s.label}><div className="stat-num" style={{color:s.color}}>{s.num}</div><div className="stat-label">{s.label}</div></div>))}
        </div>
        <div style={{display:'flex',gap:'.65rem',flexWrap:'wrap',marginBottom:'1.25rem',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search posts…" style={{flex:'1 1 200px',maxWidth:300}}/>
          <div className="filter-bar" style={{marginBottom:0}}>
            {[['all','All'],['published','Published'],['draft','Drafts'],['archived','Archived']].map(([v,l])=>(<button key={v} className={`filter-btn${filterStatus===v?' active':''}`} onClick={()=>{setFilterStatus(v);load({status:v});}}>{l}</button>))}
          </div>
        </div>
        {loading?(<div className="loading-state"><span className="spinner"/>Loading…</div>):posts.length===0?(<div className="empty-state"><div className="icon">📰</div><p>No posts yet.</p><button className="btn btn-primary btn-sm" style={{marginTop:'1rem'}} onClick={()=>setShowAdd(true)}>+ Create First Post</button></div>):(
          <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
            {posts.map(p=>{const sc=SC[p.status]||SC.draft;return(<div key={p.id} className="card" style={{display:'flex',gap:'1rem',alignItems:'flex-start'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap',marginBottom:'.35rem'}}>
                  <span className="badge" style={{background:sc.bg,color:sc.color}}>{p.status}</span>
                  <span className="badge" style={{background:'var(--paper-3)',color:'var(--ink-soft)'}}>{p.category}</span>
                </div>
                <div style={{fontFamily:'var(--serif)',fontWeight:600,fontSize:'1rem',color:'var(--navy)',marginBottom:'.2rem'}}>{p.title}</div>
                {p.title_maithili&&<div style={{color:'var(--gold)',fontFamily:'var(--serif)',fontStyle:'italic',fontSize:'.82rem',marginBottom:'.25rem'}}>{p.title_maithili}</div>}
                {p.excerpt&&<div className="text-sm text-muted">{p.excerpt.slice(0,120)}{p.excerpt.length>120?'…':''}</div>}
                <div style={{display:'flex',gap:'1rem',marginTop:'.35rem'}}>
                  {p.author&&<span className="text-xs text-muted">✍️ {p.author}</span>}
                  <span className="text-xs text-muted">📅 {new Date(p.created_at).toLocaleDateString()}</span>
                  {p.published_at&&<span className="text-xs text-muted">🚀 {new Date(p.published_at).toLocaleDateString()}</span>}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'.35rem',flexShrink:0}}>
                <button className="btn btn-primary btn-sm" onClick={()=>setEditPost(p)}>✏️ Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>toggleStatus(p)}>{p.status==='published'?'↙ Unpublish':'🚀 Publish'}</button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(p.id)}>🗑 Delete</button>
              </div>
            </div>);})}
          </div>
        )}
      </div>
    </div>
  </div>
  {showAdd&&<NewsModal post={null} secret={secret} onClose={()=>setShowAdd(false)} onSave={handleSave}/>}
  {editPost&&<NewsModal post={editPost} secret={secret} onClose={()=>setEditPost(null)} onSave={handleSave}/>}
  <Toast toasts={toasts}/></>);
}
