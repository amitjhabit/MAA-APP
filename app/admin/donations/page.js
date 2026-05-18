'use client';
// app/admin/donations/page.js
import { useState, useCallback, useEffect } from 'react';
import { useAdminAuth } from '@/app/admin/layout';

function useToast(){const[t,setT]=useState([]);const show=useCallback((msg,type='success')=>{const id=Date.now();setT(p=>[...p,{id,msg,type}]);setTimeout(()=>setT(p=>p.filter(x=>x.id!==id)),3500);},[]);return{toasts:t,show};}
function Toast({toasts}){return<div className="toast-wrap">{toasts.map(t=><div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;}

function Sidebar({active}){
  const NL=({href,icon,label,a})=><a href={href} className={`admin-nav-link${a?' active':''}`}><span className="nav-icon">{icon}</span>{label}</a>;
  return(<aside className="admin-sidebar"><div className="admin-sidebar-brand"><img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}} /><div className="logo-sub">मैथिल एसोसिएशन</div></div><nav className="admin-nav">
    <div className="admin-nav-section">Main</div>
    <NL href="/admin" icon="🏠" label="Dashboard"/><NL href="/admin/members" icon="👥" label="Members"/><NL href="/admin/events" icon="📅" label="Events"/><NL href="/admin/donations" icon="💰" label="Donations" a/><NL href="/admin/finance" icon="📊" label="Finance"/><NL href="/admin/analytics" icon="📈" label="Analytics"/>
    <div className="admin-nav-section">Content</div>
    <NL href="/admin/news" icon="📰" label="News"/><NL href="/admin/gallery" icon="🖼️" label="Gallery"/><NL href="/admin/homepage" icon="🏡" label="Home"/><NL href="/admin/about" icon="📝" label="About Us"/>
    <div className="admin-nav-section">Organization</div>
    <NL href="/admin/volunteers" icon="🙋" label="Volunteers"/><NL href="/admin/committee" icon="🏛️" label="Committee"/><NL href="/admin/inquiries" icon="✉️" label="Inquiries"/>
    <div className="admin-nav-section">Settings</div>
    <NL href="/" icon="🌐" label="Public Site"/>
  </nav></aside>);
}

function Modal({donation, secret, onClose, onSave}){
  const isEdit=!!donation;
  const blank={donor_name:'',donor_email:'',donor_phone:'',amount:'',payment_method:'zelle',campaign:'',purpose:'',status:'received',transaction_id:'',receipt_sent:false,notes:'',donated_at:new Date().toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'})};
  const[form,setForm]=useState(isEdit?{...blank,...donation,donated_at:donation.donated_at?.split('T')[0]||blank.donated_at,amount:donation.amount||''}:blank);
  const[busy,setBusy]=useState(false);
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value}));
  const submit=async()=>{setBusy(true);try{const res=await fetch(isEdit?`/api/donations/${donation.id}`:'/api/donations',{method:isEdit?'PATCH':'POST',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify({...form,amount:parseFloat(form.amount)||0})});const data=await res.json();if(data.success){onSave(data.data,isEdit);onClose();}else alert(data.message||'Error');}catch{}setBusy(false);};
  return(<div className="modal-backdrop" onClick={onClose}><div className="modal" style={{maxWidth:620}} onClick={e=>e.stopPropagation()}>
    <div className="modal-header"><h3 className="modal-title">{isEdit?'Edit Donation':'💰 Record New Donation'}</h3><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
    <div className="form-grid">
      <div className="form-group"><label>Donor Name <span className="req">*</span></label><input value={form.donor_name} onChange={set('donor_name')} placeholder="Full name"/></div>
      <div className="form-group"><label>Email</label><input type="email" value={form.donor_email} onChange={set('donor_email')}/></div>
      <div className="form-group"><label>Phone</label><input value={form.donor_phone} onChange={set('donor_phone')}/></div>
      <div className="form-group"><label>Amount ($) <span className="req">*</span></label><input type="number" value={form.amount} onChange={set('amount')} placeholder="50.00" min="0" step="0.01"/></div>
      <div className="form-group"><label>Payment Method</label><select value={form.payment_method} onChange={set('payment_method')}><option value="zelle">Zelle</option><option value="credit_card">Credit Card</option><option value="check">Check</option><option value="cash">Cash</option><option value="other">Other</option></select></div>
      <div className="form-group"><label>Status</label><select value={form.status} onChange={set('status')}><option value="received">Received</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></div>
      <div className="form-group"><label>Campaign / Fund</label><input value={form.campaign} onChange={set('campaign')} placeholder="General Fund"/></div>
      <div className="form-group"><label>Transaction ID</label><input value={form.transaction_id} onChange={set('transaction_id')}/></div>
      <div className="form-group"><label>Donation Date</label><input type="date" value={form.donated_at} onChange={set('donated_at')}/></div>
      <div className="form-group" style={{display:'flex',alignItems:'center',gap:'.5rem',paddingTop:'1.5rem'}}><input type="checkbox" checked={form.receipt_sent} onChange={set('receipt_sent')} style={{width:'auto'}}/><label style={{marginBottom:0}}>Receipt Sent</label></div>
      <div className="form-group span-2"><label>Notes</label><textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Any notes about this donation…"/></div>
    </div>
    <div style={{display:'flex',gap:'.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy?<><span className="spinner"/>Saving…</>:isEdit?'Save Changes':'Record Donation'}</button>
    </div>
  </div></div>);
}

export default function DonationsPage(){
  const{toasts,show}=useToast();
  const { secret, logout } = useAdminAuth();
  const[donations,setDonations]=useState([]);const[stats,setStats]=useState({total:0,total_amount:0,received_amount:0,pending:0});
  const[loading,setLoading]=useState(false);
  const[search,setSearch]=useState('');const[filterStatus,setFilterStatus]=useState('all');const[filterMethod,setFilterMethod]=useState('all');
  const[showAdd,setShowAdd]=useState(false);const[editD,setEditD]=useState(null);

  const load=useCallback(async(opts={})=>{setLoading(true);try{const qs=new URLSearchParams({page:'1',limit:'50',search:opts.search??search,status:opts.status??filterStatus,method:opts.method??filterMethod});const res=await fetch(`/api/donations?${qs}`,{headers:{'x-admin-secret':secret}});const data=await res.json();if(data.success){setDonations(data.data);setStats(data.stats);}else show(data.message,'error');}catch{show('Error','error');}setLoading(false);},[secret,search,filterStatus,filterMethod,show]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{const t=setTimeout(()=>load({search}),380);return()=>clearTimeout(t);},[search]);
  const handleDelete=async id=>{if(!confirm('Delete?'))return;try{const r=await fetch(`/api/donations/${id}`,{method:'DELETE',headers:{'x-admin-secret':secret}});const d=await r.json();if(d.success){setDonations(p=>p.filter(x=>x.id!==id));show('Deleted');load();}else show(d.message,'error');}catch{}};
  const handleSave=(saved,isEdit)=>{if(isEdit)setDonations(p=>p.map(x=>x.id===saved.id?saved:x));else setDonations(p=>[saved,...p]);show(isEdit?'Updated!':'Recorded!');load();};
  const toggleReceipt=async(id,sent)=>{try{const r=await fetch(`/api/donations/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify({receipt_sent:sent})});const d=await r.json();if(d.success){setDonations(p=>p.map(x=>x.id===id?d.data:x));show('Updated!');}}catch{}};
  const[sendingReceipt,setSendingReceipt]=useState(null);
  const sendReceipt=async(d)=>{if(!d.donor_email){show('No email address for this donor','error');return;}setSendingReceipt(d.id);try{const r=await fetch(`/api/donations/${d.id}`,{method:'PATCH',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify({action:'resend_receipt'})});const res=await r.json();if(res.success){setDonations(p=>p.map(x=>x.id===d.id?{...x,receipt_sent:true}:x));show(`Receipt ${res.receipt_number} sent to ${d.donor_email}`);}else show(res.message,'error');}catch{show('Error sending receipt','error');}setSendingReceipt(null);};

  const STATUS_C={received:{bg:'var(--forest-light)',color:'var(--forest)'},pending:{bg:'var(--gold-light)',color:'var(--gold)'},failed:{bg:'var(--crimson-light)',color:'var(--crimson)'},refunded:{bg:'var(--paper-3)',color:'var(--ink-soft)'}};
  return(<><div className="admin-layout"><Sidebar/>
    <div className="admin-main">
      <div className="admin-topbar"><div><div style={{fontFamily:'var(--serif)',fontSize:'1.2rem',color:'var(--navy)',fontWeight:600}}>Donations Management</div><div className="text-sm text-muted">दान प्रबंधन · Total: ${(stats.total_amount||0).toLocaleString()}</div></div>
        <div style={{display:'flex',gap:'.65rem'}}><button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ Record Donation</button><button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button></div>
      </div>
      <div className="admin-content">
        <div className="stats-grid">
          {[{label:'Total',num:stats.total,color:'var(--saffron)'},{label:'Received ($)',num:`$${(stats.received_amount||0).toLocaleString()}`,color:'var(--forest)'},{label:'Pending',num:stats.pending||0,color:'var(--gold)'},{label:'Zelle',num:donations.filter(d=>d.payment_method==='zelle').length,color:'#185FA5'}].map(s=>(<div className="stat-card" key={s.label}><div className="stat-num" style={{color:s.color,fontSize:'1.5rem'}}>{s.num}</div><div className="stat-label">{s.label}</div></div>))}
        </div>
        <div style={{display:'flex',gap:'.65rem',flexWrap:'wrap',marginBottom:'1.25rem',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search donor, email, campaign…" style={{flex:'1 1 200px',maxWidth:300}}/>
          <select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);load({status:e.target.value});}} style={{width:'auto'}}><option value="all">All Status</option><option value="received">Received</option><option value="pending">Pending</option><option value="failed">Failed</option></select>
          <select value={filterMethod} onChange={e=>{setFilterMethod(e.target.value);load({method:e.target.value});}} style={{width:'auto'}}><option value="all">All Methods</option><option value="zelle">Zelle</option><option value="credit_card">Credit Card</option><option value="check">Check</option><option value="cash">Cash</option></select>
          <button className="btn btn-ghost btn-sm" onClick={()=>load()}>↻</button>
        </div>
        {loading?(<div className="loading-state"><span className="spinner"/>Loading…</div>):donations.length===0?(<div className="empty-state"><div className="icon">💰</div><p>No donations yet.</p><button className="btn btn-primary btn-sm" style={{marginTop:'1rem'}} onClick={()=>setShowAdd(true)}>+ Record First Donation</button></div>):(
          <div className="table-wrap"><table>
            <thead><tr><th>#</th><th>Donor</th><th>Amount</th><th>Method</th><th>Campaign</th><th>Status</th><th>Receipt</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>{donations.map(d=>{const sc=STATUS_C[d.status]||STATUS_C.pending;return(<tr key={d.id}>
              <td className="text-xs text-muted">{d.id}</td>
              <td><div style={{fontWeight:600,fontSize:'.875rem'}}>{d.donor_name}</div>{d.donor_email&&<div className="text-xs text-muted">{d.donor_email}</div>}</td>
              <td style={{fontFamily:'var(--serif)',fontWeight:700,color:'var(--forest)',fontSize:'1rem'}}>${parseFloat(d.amount).toFixed(2)}</td>
              <td><span className="badge" style={{background:'var(--paper-3)',color:'var(--ink-soft)'}}>{(d.payment_method||'').replace('_',' ')}</span></td>
              <td className="text-sm text-muted">{d.campaign||'—'}</td>
              <td><span className="badge" style={{background:sc.bg,color:sc.color}}>{d.status}</span></td>
              <td><button onClick={()=>toggleReceipt(d.id,!d.receipt_sent)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'1.1rem'}}>{d.receipt_sent?'✅':'⬜'}</button></td>
              <td className="text-xs text-muted">{d.donated_at?new Date(d.donated_at).toLocaleDateString():''}</td>
              <td><div style={{display:'flex',gap:'.3rem'}}>
                <button className="btn btn-ghost btn-sm" style={{padding:'.3rem .6rem',fontSize:'.72rem'}} onClick={()=>sendReceipt(d)} disabled={sendingReceipt===d.id} title={d.donor_email?`Send receipt to ${d.donor_email}`:'No email on file'}>{sendingReceipt===d.id?<span className="spinner"/>:'📄'}</button>
                <button className="btn btn-primary btn-sm" style={{padding:'.3rem .6rem'}} onClick={()=>setEditD(d)}>✏️</button>
                <button className="btn btn-danger btn-sm" style={{padding:'.3rem .6rem'}} onClick={()=>handleDelete(d.id)}>🗑</button>
              </div></td>
            </tr>);})}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  </div>
  {showAdd&&<Modal donation={null} secret={secret} onClose={()=>setShowAdd(false)} onSave={handleSave}/>}
  {editD&&<Modal donation={editD} secret={secret} onClose={()=>setEditD(null)} onSave={handleSave}/>}
  <Toast toasts={toasts}/></>);
}
