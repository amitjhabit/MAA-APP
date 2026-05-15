'use client';
// app/admin/members/page.js — MAA Members CRM with CSV/Excel Import

import { useState, useEffect, useCallback, useRef } from 'react';

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type='success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}
function Toast({ toasts }) {
  return <div className="toast-wrap">{toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;
}
function localDate(val) { if (!val) return new Date(NaN); if (val instanceof Date) return new Date(val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate()); const m = String(val).match(/(\d{4})-(\d{2})-(\d{2})/); if (!m) return new Date(NaN); return new Date(+m[1], +m[2]-1, +m[3]); }
function fmtDate(d) { if (!d) return '—'; const dt = localDate(d); return isNaN(dt) ? '—' : dt.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); }
function calcAge(dob) { if (!dob) return null; return Math.floor((Date.now()-localDate(dob))/(1000*60*60*24*365.25)); }

const TYPE_LABELS = { individual:'Individual', student:'Student', honorary:'Honorary', corporate:'Corporate' };
const PLAN_LABELS = { annual:'Annual', lifetime:'Lifetime' };

/* ── CSV Column Map ── */
const COL_MAP = {
  first_name:'first_name',firstname:'first_name','first name':'first_name',fname:'first_name',
  last_name:'last_name',lastname:'last_name','last name':'last_name',lname:'last_name',surname:'last_name',
  email:'email','email address':'email',
  phone:'phone','phone number':'phone',mobile:'phone',cell:'phone',
  date_of_birth:'date_of_birth',dob:'date_of_birth','birth date':'date_of_birth','date of birth':'date_of_birth',
  gender:'gender',sex:'gender',
  address:'address',street:'address','street address':'address',
  city:'city',town:'city',state:'state',zip:'zip','zip code':'zip',zipcode:'zip','postal code':'zip',country:'country',
  maithili_name:'maithili_name','maithili name':'maithili_name','name in maithili':'maithili_name',
  village_district:'village_district',village:'village_district',district:'village_district','village district':'village_district','village/district':'village_district',
  occupation:'occupation',job:'occupation',profession:'occupation',
  photo_url:'photo_url',photo:'photo_url','photo url':'photo_url',
  membership_type:'membership_type','membership type':'membership_type','member type':'membership_type',type:'membership_type',tier:'membership_type',
  membership_plan:'membership_plan','membership plan':'membership_plan',plan:'membership_plan',
  membership_status:'membership_status','membership status':'membership_status',status:'membership_status',
  is_active:'is_active',active:'is_active','is active':'is_active',ismemberactive:'is_active',
  joined_date:'joined_date','join date':'joined_date','member since':'joined_date','date joined':'joined_date',
  expiry_date:'expiry_date',expiry:'expiry_date','expiry date':'expiry_date','expiration date':'expiry_date','end date':'expiry_date',
  amount_paid:'amount_paid',amount:'amount_paid','amount paid':'amount_paid',fee:'amount_paid',dues:'amount_paid',
  payment_method:'payment_method','payment method':'payment_method','paid via':'payment_method',
  notes:'notes',remarks:'notes',comments:'notes',
};

function parseCSVText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));
  if (lines.length < 2) throw new Error('Need a header row and at least one data row (rows starting with # are ignored).');
  const parseRow = line => {
    const cells=[]; let cell='', inQ=false;
    for(const ch of line){ if(ch==='"'){inQ=!inQ;} else if(ch===','&&!inQ){cells.push(cell.trim());cell='';} else{cell+=ch;} }
    cells.push(cell.trim());
    return cells;
  };
  const rawHeaders = parseRow(lines[0]).map(h => h.toLowerCase().replace(/^"|"$/g,''));
  const fieldMap   = rawHeaders.map(h => COL_MAP[h]||null);
  const rows = [];
  for (let i=1; i<lines.length; i++) {
    const cells = parseRow(lines[i]);
    if (cells.every(c=>!c)) continue;
    const row = {};
    fieldMap.forEach((f,idx)=>{ if(f) row[f]=(cells[idx]||'').replace(/^"|"$/g,'').trim(); });
    rows.push(row);
  }
  return { rows, fieldMap, rawHeaders };
}

async function parseXLSXFile(file) {
  return new Promise((resolve, reject) => {
    const doIt = () => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb   = window.XLSX.read(data, { type:'array', cellDates:true });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          const json = window.XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
          if (json.length<2) throw new Error('Sheet needs a header row and at least one data row.');
          const rawHeaders = json[0].map(h=>String(h).trim().toLowerCase());
          const fieldMap   = rawHeaders.map(h=>COL_MAP[h]||null);
          const rows = json.slice(1).filter(r=>r.some(c=>c!=='')).map(cells=>{
            const row={};
            fieldMap.forEach((f,idx)=>{ if(!f)return; let v=cells[idx]; if(v instanceof Date)v=v.toISOString().split('T')[0]; row[f]=String(v??'').trim(); });
            return row;
          });
          resolve({ rows, fieldMap, rawHeaders });
        } catch(err){reject(err);}
      };
      reader.onerror=()=>reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    };
    if (window.XLSX) return doIt();
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload=doIt; s.onerror=()=>reject(new Error('Could not load Excel parser')); document.head.appendChild(s);
  });
}

/* ══════════════════════════════════════
   IMPORT MODAL
══════════════════════════════════════ */
function ImportModal({ secret, onClose, onDone }) {
  const [step, setStep]         = useState('upload');
  const [drag, setDrag]         = useState(false);
  const [file, setFile]         = useState(null);
  const [err,  setErr]          = useState('');
  const [rows, setRows]         = useState([]);
  const [headers, setHeaders]   = useState([]);
  const [fieldMap, setFieldMap] = useState([]);
  const [mode, setMode]         = useState('skip');
  const [busy, setBusy]         = useState(false);
  const [results, setResults]   = useState(null);
  const inputRef = useRef();

  const process = useCallback(async f => {
    setFile(f); setErr('');
    try {
      const parsed = f.name.toLowerCase().endsWith('.csv')||f.name.toLowerCase().endsWith('.txt')
        ? parseCSVText(await f.text())
        : await parseXLSXFile(f);
      setRows(parsed.rows); setHeaders(parsed.rawHeaders); setFieldMap(parsed.fieldMap); setStep('preview');
    } catch(e){ setErr(e.message); }
  }, []);

  const onDrop = useCallback(e => { e.preventDefault(); setDrag(false); const f=e.dataTransfer.files[0]; if(f)process(f); },[process]);

  const doImport = async () => {
    setBusy(true);
    try {
      const res  = await fetch('/api/members/import', { method:'POST', headers:{'Content-Type':'application/json','x-admin-secret':secret}, body:JSON.stringify({rows,mode}) });
      const data = await res.json();
      setResults(data.results); setStep('done'); if(data.success)onDone();
    } catch(e){ setErr('Import failed: '+e.message); setBusy(false); }
  };

  const REQUIRED=['first_name','last_name','email'];
  const detected=new Set(fieldMap.filter(Boolean));
  const missing=REQUIRED.filter(f=>!detected.has(f));
  const canImport=missing.length===0&&rows.length>0&&!busy;

  const SB = { background:'var(--paper-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'.9rem 1rem' };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div style={{ background:'var(--white)', borderRadius:'var(--radius-lg)', borderTop:'4px solid var(--saffron)', width:'100%', maxWidth:680, maxHeight:'90vh', display:'flex', flexDirection:'column', animation:'modalIn .2s cubic-bezier(.34,1.56,.64,1)' }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'var(--serif)', fontSize:'1.15rem', fontWeight:700, color:'var(--navy)' }}>📊 Import Members — सदस्य आयात</div>
            <div style={{ fontSize:'.78rem', color:'var(--ink-dim)', marginTop:'.15rem' }}>
              {step==='upload'&&'Upload CSV or Excel to bulk-add members'}
              {step==='preview'&&`${rows.length} rows detected — review before importing`}
              {step==='done'&&'Import complete!'}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding:'1.5rem', overflowY:'auto', flex:1 }}>

          {/* Step 1: Upload */}
          {step==='upload' && <>
            <div style={{ ...SB, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', marginBottom:'1.25rem' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:'.9rem', color:'var(--navy)', marginBottom:'.15rem' }}>📥 Download MAA Template</div>
                <div style={{ fontSize:'.78rem', color:'var(--ink-dim)' }}>CSV with all fields, sample data, and instructions</div>
              </div>
              <a href="/api/members/template" download className="btn btn-ghost btn-sm" style={{ flexShrink:0, color:'var(--saffron)', borderColor:'var(--saffron)' }}>↓ Template.csv</a>
            </div>

            <div onDrop={onDrop} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onClick={()=>inputRef.current?.click()}
              style={{ border:`2px dashed ${drag?'var(--saffron)':'var(--border-hi)'}`, borderRadius:'var(--radius-lg)', padding:'3rem 2rem', textAlign:'center', cursor:'pointer', transition:'var(--trans)', background:drag?'var(--saffron-light)':'transparent' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'.65rem' }}>📂</div>
              <div style={{ fontFamily:'var(--serif)', fontWeight:600, fontSize:'1.05rem', color:drag?'var(--saffron)':'var(--navy)', marginBottom:'.35rem' }}>
                {drag?'Drop it here!':'Drag & drop your file here'}
              </div>
              <div style={{ fontSize:'.82rem', color:'var(--ink-dim)', marginBottom:'1.25rem' }}>Supports .csv · .xlsx · .xls · Max 1,000 rows</div>
              <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();inputRef.current?.click();}}>Browse files</button>
              <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.txt" onChange={e=>{const f=e.target.files[0];if(f)process(f);}} style={{display:'none'}} />
            </div>

            {err && <div style={{ background:'var(--crimson-light)', borderRadius:'var(--radius)', padding:'.75rem 1rem', marginTop:'1rem', color:'var(--crimson)', fontSize:'.83rem' }}>⚠️ {err}</div>}

            <div style={{ marginTop:'1.5rem' }}>
              <div style={{ fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.1em', color:'var(--ink-dim)', marginBottom:'.5rem', fontWeight:600 }}>Accepted column names</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.3rem' }}>
                {['first_name*','last_name*','email*','phone','date_of_birth','gender','address','city','state','zip','country','maithili_name','village_district','occupation','membership_type','membership_plan','membership_status','is_active','joined_date','expiry_date','amount_paid','payment_method','notes'].map(f=>(
                  <span key={f} style={{ background:f.endsWith('*')?'var(--saffron-light)':'var(--paper-3)', color:f.endsWith('*')?'var(--saffron-dark)':'var(--ink-dim)', border:`1px solid ${f.endsWith('*')?'rgba(232,114,12,.3)':'var(--border)'}`, borderRadius:4, padding:'.15rem .55rem', fontSize:'.7rem', fontFamily:'var(--mono)' }}>
                    {f.replace('*','')}
                    {f.endsWith('*')?' *':''}
                  </span>
                ))}
              </div>
              <div style={{ fontSize:'.7rem', color:'var(--ink-dim)', marginTop:'.4rem' }}>* Required · Column names are flexible ("First Name", "fname" etc. all work) · Comment rows (#) are skipped</div>
            </div>
          </>}

          {/* Step 2: Preview */}
          {step==='preview' && <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
              <div style={SB}>
                <div style={{ fontSize:'.68rem', textTransform:'uppercase', letterSpacing:'.1em', color:'var(--ink-dim)', marginBottom:'.4rem' }}>File</div>
                <div style={{ fontWeight:600, fontSize:'.875rem', color:'var(--navy)' }}>📄 {file?.name}</div>
                <div style={{ fontSize:'.78rem', color:'var(--ink-dim)', marginTop:'.2rem' }}>{rows.length} rows · {detected.size} columns mapped</div>
              </div>
              <div style={SB}>
                <div style={{ fontSize:'.68rem', textTransform:'uppercase', letterSpacing:'.1em', color:'var(--ink-dim)', marginBottom:'.4rem' }}>Duplicate emails</div>
                {[['skip','Skip duplicates (safe)'],['overwrite','Overwrite existing records']].map(([v,l])=>(
                  <label key={v} style={{ display:'flex', alignItems:'center', gap:'.4rem', cursor:'pointer', fontSize:'.82rem', marginBottom:'.3rem' }}>
                    <input type="radio" name="mode" value={v} checked={mode===v} onChange={()=>setMode(v)} style={{width:'auto'}} />{l}
                  </label>
                ))}
              </div>
            </div>

            {missing.length>0&&<div style={{ background:'var(--crimson-light)', border:'1px solid rgba(155,29,32,.25)', borderRadius:'var(--radius)', padding:'.75rem 1rem', marginBottom:'1rem', color:'var(--crimson)', fontSize:'.83rem' }}>⚠️ Missing required columns: <strong>{missing.join(', ')}</strong></div>}

            <div style={{ marginBottom:'1.25rem' }}>
              <div style={{ fontSize:'.68rem', textTransform:'uppercase', letterSpacing:'.1em', color:'var(--ink-dim)', marginBottom:'.5rem', fontWeight:600 }}>Column mapping</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.3rem' }}>
                {headers.map((h,i)=>(
                  <span key={i} style={{ background:fieldMap[i]?'var(--forest-light)':'var(--crimson-light)', color:fieldMap[i]?'var(--forest)':'var(--crimson)', border:`1px solid ${fieldMap[i]?'rgba(27,94,32,.25)':'rgba(155,29,32,.25)'}`, borderRadius:4, padding:'.18rem .6rem', fontSize:'.7rem', fontFamily:'var(--mono)' }}>
                    {h} {fieldMap[i]?`→ ${fieldMap[i]}`:'✗ ignored'}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize:'.68rem', textTransform:'uppercase', letterSpacing:'.1em', color:'var(--ink-dim)', marginBottom:'.5rem', fontWeight:600 }}>Preview — first {Math.min(5,rows.length)} of {rows.length} rows</div>
              <div style={{ overflowX:'auto', border:'1px solid var(--border)', borderRadius:'var(--radius)' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.78rem' }}>
                  <thead><tr style={{background:'var(--navy)'}}>
                    {['first_name','last_name','email','membership_type','plan','status','maithili_name'].map(c=>(
                      <th key={c} style={{ padding:'.45rem .75rem', textAlign:'left', color:'rgba(255,255,255,.8)', fontSize:'.65rem', textTransform:'uppercase', letterSpacing:'.07em', whiteSpace:'nowrap' }}>{c}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {rows.slice(0,5).map((row,i)=>(
                      <tr key={i} style={{ borderBottom:'1px solid var(--border)', background:i%2?'var(--paper-2)':'var(--white)' }}>
                        {['first_name','last_name','email','membership_type','membership_plan','membership_status','maithili_name'].map(c=>(
                          <td key={c} style={{ padding:'.45rem .75rem', color:row[c]?'var(--ink)':'var(--ink-dim)', fontStyle:row[c]?'normal':'italic', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row[c]||'—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length>5&&<div style={{ fontSize:'.72rem', color:'var(--ink-dim)', marginTop:'.35rem' }}>…and {rows.length-5} more rows</div>}
            </div>
          </>}

          {/* Step 3: Done */}
          {step==='done'&&results&&<>
            <div style={{ textAlign:'center', padding:'1.5rem 0 1.75rem' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--forest-light)', border:'1px solid rgba(27,94,32,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.75rem', margin:'0 auto 1rem' }}>✓</div>
              <div style={{ fontFamily:'var(--serif)', fontSize:'1.3rem', fontWeight:700, color:'var(--navy)' }}>Import Complete!</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1.5rem' }}>
              {[{label:'Added',num:results.inserted,color:'var(--forest)'},{label:'Updated',num:results.updated,color:'#185FA5'},{label:'Skipped',num:results.skipped,color:'var(--gold)'},{label:'Errors',num:results.errors?.length||0,color:results.errors?.length?'var(--crimson)':'var(--ink-dim)'}].map(s=>(
                <div key={s.label} style={{ background:'var(--paper-2)', borderRadius:'var(--radius)', padding:'.85rem', textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--serif)', fontSize:'1.8rem', fontWeight:700, color:s.color, lineHeight:1 }}>{s.num}</div>
                  <div style={{ fontSize:'.72rem', color:'var(--ink-dim)', marginTop:'.3rem', textTransform:'uppercase', letterSpacing:'.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {results.errors?.length>0&&<div style={{ background:'var(--crimson-light)', border:'1px solid rgba(155,29,32,.2)', borderRadius:'var(--radius)', padding:'1rem', maxHeight:200, overflowY:'auto' }}>
              <div style={{ fontSize:'.7rem', fontWeight:600, color:'var(--crimson)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.5rem' }}>Row Errors</div>
              {results.errors.map((e,i)=><div key={i} style={{ fontSize:'.78rem', color:'var(--ink-soft)', padding:'.3rem 0', borderBottom:'1px solid rgba(155,29,32,.1)' }}>Row {e.row} · <span style={{color:'var(--ink)'}}>{e.email||'?'}</span> · {e.reason}</div>)}
            </div>}
          </>}
        </div>

        {/* Footer */}
        <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--border)', display:'flex', gap:'.75rem', justifyContent:'flex-end' }}>
          {step==='upload'&&<button className="btn btn-ghost" onClick={onClose}>Cancel</button>}
          {step==='preview'&&<>
            <button className="btn btn-ghost" onClick={()=>{setStep('upload');setRows([]);setFile(null);}}>← Back</button>
            <button className="btn btn-primary" onClick={doImport} disabled={!canImport}>
              {busy?<><span className="spinner"/>Importing…</>:`Import ${rows.length} Members →`}
            </button>
          </>}
          {step==='done'&&<>
            <button className="btn btn-ghost" onClick={()=>{setStep('upload');setRows([]);setFile(null);setResults(null);}}>Import Another</button>
            <button className="btn btn-primary" onClick={onClose}>Done ✓</button>
          </>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MEMBER AVATAR
══════════════════════════════════════ */
function Avatar({ m, size=40 }) {
  const colors={individual:'#E8720C',student:'#1B5E20',honorary:'#C9960C',corporate:'#0D47A1'};
  const bg=colors[m.membership_type]||'#E8720C';
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:bg+'22',border:`2px solid ${bg}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.32,fontWeight:700,color:bg,flexShrink:0,overflow:'hidden'}}>
      {m.photo_url?<img src={m.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>:`${m.first_name[0]}${m.last_name[0]}`}
    </div>
  );
}

/* ── Active Toggle ── */
function Toggle({ active, onChange }) {
  return (
    <div onClick={onChange} style={{width:38,height:22,borderRadius:11,background:active?'var(--saffron)':'var(--paper-3)',border:`1.5px solid ${active?'var(--saffron)':'var(--border-hi)'}`,position:'relative',cursor:'pointer',transition:'var(--trans)',flexShrink:0}}>
      <div style={{width:16,height:16,borderRadius:'50%',background:active?'#fff':'var(--ink-dim)',position:'absolute',top:2,left:active?18:2,transition:'var(--trans)'}}/>
    </div>
  );
}

/* ══════════════════════════════════════
   DETAIL PANEL
══════════════════════════════════════ */
function DetailPanel({ m, onClose, onEdit, onDelete }) {
  const expired=m.expiry_date&&localDate(m.expiry_date)<new Date();
  const age=calcAge(m.date_of_birth);
  const R=({icon,label,value,danger})=>{
    if(!value&&value!==0)return null;
    return(<div style={{display:'flex',gap:'.75rem',padding:'.5rem 0',borderBottom:'1px solid var(--border)',alignItems:'flex-start'}}>
      <span style={{fontSize:'.9rem',width:22,textAlign:'center',flexShrink:0}}>{icon}</span>
      <div><div style={{fontSize:'.62rem',textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-dim)',marginBottom:'.08rem'}}>{label}</div>
      <div style={{fontSize:'.875rem',color:danger?'var(--crimson)':'var(--ink)'}}>{value}</div></div>
    </div>);
  };
  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(13,33,55,.3)',zIndex:79}}/>
      <div className="detail-panel">
        <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:'.7rem',textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ink-dim)'}}>Member Detail</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{padding:'1.5rem 1.25rem 1rem',borderBottom:'1px solid var(--border)',textAlign:'center'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:'.75rem'}}><Avatar m={m} size={70}/></div>
          <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.15rem',color:'var(--navy)'}}>{m.first_name} {m.last_name}</div>
          {m.maithili_name&&<div style={{color:'var(--gold)',fontFamily:'var(--serif)',fontStyle:'italic',fontSize:'.9rem',marginTop:'.2rem'}}>{m.maithili_name}</div>}
          <div style={{display:'flex',gap:'.35rem',justifyContent:'center',flexWrap:'wrap',marginTop:'.6rem'}}>
            <span className={`badge badge-${m.membership_type}`}>{TYPE_LABELS[m.membership_type]}</span>
            <span className={`badge badge-${m.membership_plan}`}>{PLAN_LABELS[m.membership_plan]}</span>
            <span className={`badge badge-${m.membership_status}`}>{m.membership_status}</span>
            <span className="badge" style={{background:m.is_active?'var(--forest-light)':'var(--paper-3)',color:m.is_active?'var(--forest)':'var(--ink-dim)'}}>{m.is_active?'● Active':'○ Inactive'}</span>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'0 1.25rem'}}>
          <R icon="✉" label="Email" value={m.email}/>
          <R icon="☎" label="Phone" value={m.phone}/>
          <R icon="🎂" label="Date of Birth" value={m.date_of_birth?`${fmtDate(m.date_of_birth)}${age?` (Age ${age})`:''}`:'—'}/>
          <R icon="⚧" label="Gender" value={m.gender?.replace(/_/g,' ')}/>
          <R icon="📍" label="Address" value={[m.address,m.city,m.state,m.zip,m.country].filter(Boolean).join(', ')}/>
          <R icon="🏡" label="Village / District" value={m.village_district}/>
          <R icon="💼" label="Occupation" value={m.occupation}/>
          <R icon="📅" label="Joined" value={fmtDate(m.joined_date)}/>
          <R icon="⏳" label="Expiry" value={m.expiry_date?fmtDate(m.expiry_date):'—'} danger={expired}/>
          <R icon="💰" label="Amount Paid" value={m.amount_paid>0?`$${parseFloat(m.amount_paid).toFixed(2)}${m.payment_method?` (${m.payment_method})`:''}`:'—'}/>
          <R icon="📝" label="Notes" value={m.notes}/>
          <R icon="🪪" label="Member ID" value={`#${m.id}`}/>
          <R icon="🕐" label="Registered" value={new Date(m.created_at).toLocaleString()}/>
        </div>
        <div style={{padding:'1rem 1.25rem',borderTop:'1px solid var(--border)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.5rem'}}>
          <button className="btn btn-danger btn-sm" style={{justifyContent:'center'}} onClick={()=>{onDelete(m.id);onClose();}}>🗑 Delete</button>
          <button className="btn btn-primary btn-sm" style={{justifyContent:'center'}} onClick={()=>{onEdit(m);onClose();}}>✏️ Edit</button>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════
   MEMBER FORM MODAL
══════════════════════════════════════ */
function MemberModal({ member, secret, onClose, onSave }) {
  const isEdit=!!member;
  const today=new Date().toISOString().split('T')[0];
  const blank={first_name:'',last_name:'',email:'',phone:'',address:'',city:'',state:'',zip:'',country:'USA',date_of_birth:'',gender:'',photo_url:'',membership_type:'individual',membership_plan:'annual',membership_status:'active',is_active:true,joined_date:today,expiry_date:'',amount_paid:'',payment_method:'',maithili_name:'',village_district:'',occupation:'',notes:'',is_committee:false,committee_role:''};
  const norm=m=>({...blank,...m,date_of_birth:m.date_of_birth?.split('T')[0]||'',joined_date:m.joined_date?.split('T')[0]||today,expiry_date:m.expiry_date?.split('T')[0]||'',amount_paid:m.amount_paid||'',is_committee:m.is_committee||false,committee_role:m.committee_role||''});
  const [form,setForm]=useState(isEdit?norm(member):blank);
  const [errors,setErrors]=useState({});
  const [busy,setBusy]=useState(false);
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value}));

  const submit=async()=>{
    setErrors({});setBusy(true);
    try{
      const res=await fetch(isEdit?`/api/members/${member.id}`:'/api/members',{method:isEdit?'PATCH':'POST',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify({...form,date_of_birth:form.date_of_birth||null,expiry_date:form.expiry_date||null,photo_url:form.photo_url||null,amount_paid:parseFloat(form.amount_paid)||0})});
      const data=await res.json();
      if(data.success){onSave(data.data,isEdit);onClose();}
      else if(data.errors)setErrors(data.errors);
      else setErrors({_:data.message});
    }catch{setErrors({_:'Network error'});}
    setBusy(false);
  };

  const SH=t=><p style={{fontSize:'.68rem',textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ink-dim)',margin:'.75rem 0 .5rem',fontWeight:600}}>{t}</p>;
  const HR=()=><hr className="divider"/>;

  return(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{maxWidth:680}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit?`Edit — ${member.first_name} ${member.last_name}`:'👤 Add New Member'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {errors._&&<div style={{background:'var(--crimson-light)',border:'1px solid rgba(155,29,32,.25)',borderRadius:'var(--radius)',padding:'.7rem 1rem',marginBottom:'1rem',color:'var(--crimson)',fontSize:'.83rem'}}>{errors._}</div>}

        {SH('Personal Information')}
        <div className="form-grid">
          <div className="form-group"><label>First Name <span className="req">*</span></label><input value={form.first_name} onChange={set('first_name')} placeholder="Rajesh"/>{errors.first_name&&<span className="field-error">{errors.first_name}</span>}</div>
          <div className="form-group"><label>Last Name <span className="req">*</span></label><input value={form.last_name} onChange={set('last_name')} placeholder="Jha"/>{errors.last_name&&<span className="field-error">{errors.last_name}</span>}</div>
          <div className="form-group"><label>Maithili Name (मैथिली नाम)</label><input value={form.maithili_name} onChange={set('maithili_name')} placeholder="राजेश झा"/></div>
          <div className="form-group"><label>Email <span className="req">*</span></label><input type="email" value={form.email} onChange={set('email')} placeholder="rajesh@example.com"/>{errors.email&&<span className="field-error">{errors.email}</span>}</div>
          <div className="form-group"><label>Phone</label><input type="tel" value={form.phone} onChange={set('phone')} placeholder="555-0100"/></div>
          <div className="form-group"><label>Date of Birth</label><input type="date" value={form.date_of_birth} onChange={set('date_of_birth')}/></div>
          <div className="form-group"><label>Gender</label><select value={form.gender} onChange={set('gender')}><option value="">Select…</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></div>
          <div className="form-group"><label>Occupation</label><input value={form.occupation} onChange={set('occupation')} placeholder="Software Engineer"/></div>
          <div className="form-group span-2"><label>Photo URL</label><input type="url" value={form.photo_url} onChange={set('photo_url')} placeholder="https://…"/></div>
        </div>

        <HR/>{SH('Address & Origin')}
        <div className="form-grid">
          <div className="form-group span-2"><label>Street Address</label><input value={form.address} onChange={set('address')} placeholder="123 Main St"/></div>
          <div className="form-group"><label>City</label><input value={form.city} onChange={set('city')} placeholder="Edison"/></div>
          <div className="form-group"><label>State</label><input value={form.state} onChange={set('state')} placeholder="NJ"/></div>
          <div className="form-group"><label>ZIP</label><input value={form.zip} onChange={set('zip')} placeholder="08817"/></div>
          <div className="form-group"><label>Country</label><input value={form.country} onChange={set('country')}/></div>
          <div className="form-group span-2"><label>Village / District (गाम / जिला)</label><input value={form.village_district} onChange={set('village_district')} placeholder="Darbhanga, Bihar"/></div>
        </div>

        <HR/>{SH('Membership Details')}
        <div className="form-grid">
          <div className="form-group"><label>Type</label><select value={form.membership_type} onChange={set('membership_type')}><option value="individual">Individual</option><option value="student">Student</option><option value="honorary">Honorary</option><option value="corporate">Corporate / Sponsor</option></select></div>
          <div className="form-group"><label>Plan</label><select value={form.membership_plan} onChange={set('membership_plan')}><option value="annual">Annual</option><option value="lifetime">Lifetime</option></select></div>
          <div className="form-group"><label>Status</label><select value={form.membership_status} onChange={set('membership_status')}><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option><option value="expired">Expired</option></select></div>
          <div className="form-group"><label>Payment Method</label><select value={form.payment_method} onChange={set('payment_method')}><option value="">Select…</option><option value="zelle">Zelle</option><option value="credit_card">Credit Card</option><option value="check">Check</option><option value="cash">Cash</option><option value="other">Other</option></select></div>
          <div className="form-group"><label>Amount Paid ($)</label><input type="number" value={form.amount_paid} onChange={set('amount_paid')} placeholder="50.00"/></div>
          <div className="form-group"><label>Joined Date</label><input type="date" value={form.joined_date} onChange={set('joined_date')}/></div>
          <div className="form-group"><label>Expiry Date</label><input type="date" value={form.expiry_date} onChange={set('expiry_date')}/></div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:'.85rem',margin:'.5rem 0 .75rem',padding:'.75rem 1rem',background:'var(--paper-2)',borderRadius:'var(--radius)'}}>
          <Toggle active={form.is_active} onChange={()=>setForm(p=>({...p,is_active:!p.is_active}))}/>
          <span style={{fontWeight:600,fontSize:'.9rem'}}>Is Member Active</span>
          <span style={{marginLeft:'auto',fontSize:'.78rem',color:form.is_active?'var(--forest)':'var(--ink-dim)'}}>{form.is_active?'✓ Active':'✗ Inactive'}</span>
        </div>

        <HR/>{SH('Executive Committee')}
        <div style={{display:'flex',alignItems:'center',gap:'.85rem',margin:'.25rem 0 .75rem',padding:'.75rem 1rem',background:form.is_committee?'rgba(232,114,12,.08)':'var(--paper-2)',border:`1px solid ${form.is_committee?'rgba(232,114,12,.3)':'var(--border)'}`,borderRadius:'var(--radius)',transition:'var(--trans)'}}>
          <Toggle active={form.is_committee} onChange={()=>setForm(p=>({...p,is_committee:!p.is_committee}))}/>
          <div>
            <span style={{fontWeight:600,fontSize:'.9rem'}}>Executive Committee Member</span>
            <div style={{fontSize:'.72rem',color:'var(--ink-dim)'}}>Show on About Us page under Executive Committee</div>
          </div>
          <span style={{marginLeft:'auto',fontSize:'.78rem',color:form.is_committee?'var(--saffron)':'var(--ink-dim)'}}>{form.is_committee?'🏛️ Committee':'—'}</span>
        </div>
        {form.is_committee && (
          <div className="form-group" style={{marginBottom:'1rem'}}>
            <label>Committee Role / Title</label>
            <input value={form.committee_role} onChange={set('committee_role')} placeholder="e.g. President, Vice President, Treasurer, Secretary…"/>
          </div>
        )}

        <div className="form-group"><label>Notes / Remarks</label><textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Any additional notes…"/></div>

        <div style={{display:'flex',gap:'.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy?<><span className="spinner"/>Saving…</>:isEdit?'Save Changes':'Add Member'}</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function AdminMembersPage() {
  const {toasts,show}=useToast();
  const [secret,setSecret]=useState('');
  const [authed,setAuthed]=useState(false);
  const [authErr,setAuthErr]=useState('');
  const [authBusy,setAuthBusy]=useState(false);

  const [members,setMembers]=useState([]);
  const [stats,setStats]=useState({total:0,active:0,individual:0,student:0,honorary:0,corporate:0,annual:0,lifetime:0});
  const [loading,setLoading]=useState(false);
  const [pagination,setPagination]=useState({page:1,pages:1,total:0});

  const [search,setSearch]=useState('');
  const [filterType,setFilterType]=useState('all');
  const [filterStatus,setFilterStatus]=useState('all');
  const [filterPlan,setFilterPlan]=useState('all');
  const [viewMode,setViewMode]=useState('grid');

  const [showAdd,setShowAdd]=useState(false);
  const [showImport,setShowImport]=useState(false);
  const [editMember,setEditMember]=useState(null);
  const [panelMember,setPanelMember]=useState(null);

  const fetchMembers=useCallback(async(opts={})=>{
    setLoading(true);
    try{
      const qs=new URLSearchParams({page:String(opts.page||1),limit:'20',search:opts.search!==undefined?opts.search:search,type:opts.type!==undefined?opts.type:filterType,status:opts.status!==undefined?opts.status:filterStatus,plan:opts.plan!==undefined?opts.plan:filterPlan});
      const res=await fetch(`/api/members?${qs}`,{headers:{'x-admin-secret':secret}});
      const data=await res.json();
      if(data.success){setMembers(data.data);setStats(data.stats);setPagination(data.pagination);}
      else show(data.message,'error');
    }catch{show('Network error','error');}
    setLoading(false);
  },[secret,search,filterType,filterStatus,filterPlan,show]);

  useEffect(()=>{if(authed)fetchMembers();},[authed,fetchMembers]);
  useEffect(()=>{if(!authed)return;const t=setTimeout(()=>fetchMembers({search}),380);return()=>clearTimeout(t);},[search,authed]);

  const handleLogin=async e=>{
    e.preventDefault();if(!secret.trim())return;setAuthBusy(true);setAuthErr('');
    try{const res=await fetch('/api/members?limit=1',{headers:{'x-admin-secret':secret}});if(res.ok)setAuthed(true);else setAuthErr('Invalid password. Check ADMIN_SECRET in .env.local');}
    catch{setAuthErr('Network error');}
    setAuthBusy(false);
  };

  const handleDelete=async id=>{
    if(!confirm('Delete this member permanently?'))return;
    try{const res=await fetch(`/api/members/${id}`,{method:'DELETE',headers:{'x-admin-secret':secret}});const data=await res.json();if(data.success){setMembers(p=>p.filter(m=>m.id!==id));show('Member deleted');fetchMembers();}else show(data.message,'error');}
    catch{show('Delete failed','error');}
  };

  const handleSave=(saved,isEdit)=>{
    if(isEdit)setMembers(p=>p.map(m=>m.id===saved.id?saved:m));else setMembers(p=>[saved,...p]);
    show(isEdit?'Member updated!':'Member added!');fetchMembers();
  };

  const handleToggle=async m=>{
    try{const res=await fetch(`/api/members/${m.id}`,{method:'PATCH',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify({is_active:!m.is_active})});const data=await res.json();if(data.success){setMembers(p=>p.map(x=>x.id===m.id?data.data:x));if(panelMember?.id===m.id)setPanelMember(data.data);show('Updated!');}}
    catch{show('Failed','error');}
  };

  /* ── Login ── */
  if(!authed)return(
    <div className="login-wrap">
      <div className="login-card">
        <div style={{fontSize:'2rem',marginBottom:'.5rem'}}>🏛️</div>
        <h2>MAA Admin CRM</h2>
        <p>Maithil Association of America — Member Management</p>
        {authErr&&<div style={{background:'var(--crimson-light)',borderRadius:'var(--radius)',padding:'.7rem',marginBottom:'1rem',color:'var(--crimson)',fontSize:'.82rem'}}>{authErr}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{marginBottom:'1rem'}}><label>Admin Password</label><input type="password" value={secret} onChange={e=>setSecret(e.target.value)} placeholder="ADMIN_SECRET" autoFocus/></div>
          <button type="submit" className="btn btn-primary w-full" disabled={authBusy}>{authBusy?<><span className="spinner"/>Verifying…</>:'Enter CRM →'}</button>
        </form>
        <div style={{textAlign:'center',marginTop:'1rem',fontSize:'.8rem',color:'var(--ink-dim)'}}><a href="/" style={{color:'var(--saffron)'}}>← Public Website</a>{' · '}<a href="/api/health" target="_blank" style={{color:'var(--saffron)'}}>Health Check</a></div>
      </div>
    </div>
  );

  const NL=({href,icon,label,active})=><a href={href} className={`admin-nav-link${active?' active':''}`}><span className="nav-icon">{icon}</span>{label}</a>;

  return(
    <>
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand"><img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}} /><div className="logo-sub">मैथिल एसोसिएशन</div></div>
          <nav className="admin-nav">
            <div className="admin-nav-section">Main</div>
            <NL href="/admin" icon="🏠" label="Dashboard"/>
            <NL href="/admin/members" icon="👥" label="Members" active/>
            <NL href="/admin/events" icon="📅" label="Events"/>
            <NL href="/admin/donations" icon="💰" label="Donations"/>
            <NL href="/admin/finance"   icon="📊" label="Finance"/>
            <NL href="/admin/analytics" icon="📈" label="Analytics"/>
            <div className="admin-nav-section">Content</div>
            <NL href="/admin/news" icon="📰" label="News & Posts"/>
            <NL href="/admin/gallery" icon="🖼️" label="Gallery"/>
            <NL href="/admin/about"   icon="📝" label="About Us"/>
            <div className="admin-nav-section">Organization</div>
            <NL href="/admin/volunteers" icon="🙋" label="Volunteers"/>
            <NL href="/admin/committee" icon="🏛️" label="Committee"/>
            <NL href="/admin/inquiries" icon="✉️" label="Inquiries"/>
            <div className="admin-nav-section">Settings</div>
            <NL href="/" icon="🌐" label="Public Site"/>
            <a href="/api/health" target="_blank" className="admin-nav-link"><span className="nav-icon">⚡</span>Health</a>
          </nav>
        </aside>

        {/* Main */}
        <div className="admin-main">
          <div className="admin-topbar">
            <div>
              <div style={{fontFamily:'var(--serif)',fontSize:'1.2rem',color:'var(--navy)',fontWeight:600}}>Members Management</div>
              <div className="text-sm text-muted">सदस्य प्रबंधन · {stats.total} total</div>
            </div>
            <div style={{display:'flex',gap:'.65rem',alignItems:'center'}}>
              <div style={{display:'flex',border:'1px solid var(--border-hi)',borderRadius:'var(--radius)',overflow:'hidden'}}>
                {[['grid','⊞ Grid'],['table','☰ Table']].map(([k,l])=>(
                  <button key={k} onClick={()=>setViewMode(k)} style={{padding:'.35rem .85rem',border:'none',cursor:'pointer',fontWeight:600,fontSize:'.82rem',background:viewMode===k?'var(--saffron)':'transparent',color:viewMode===k?'#fff':'var(--ink-soft)',transition:'var(--trans)'}}>{l}</button>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowImport(true)} style={{borderColor:'var(--saffron)',color:'var(--saffron)'}}>📊 Import CSV</button>
              <button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ Add Member</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setAuthed(false);setSecret('');setMembers([]);}}>Sign Out</button>
            </div>
          </div>

          <div className="admin-content">
            {/* Stats */}
            <div className="stats-grid">
              {[{label:'Total',num:stats.total,color:'var(--saffron)'},{label:'Active',num:stats.active,color:'var(--forest)'},{label:'Lifetime',num:stats.lifetime,color:'var(--gold)'},{label:'Students',num:stats.student,color:'#185FA5'}].map(s=>(
                <div className="stat-card" key={s.label}><div className="stat-num" style={{color:s.color}}>{s.num}</div><div className="stat-label">{s.label}</div></div>
              ))}
            </div>

            {/* Filters */}
            <div style={{display:'flex',gap:'.65rem',flexWrap:'wrap',marginBottom:'1.25rem',alignItems:'center'}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search name, email, Maithili name, city…" style={{flex:'1 1 220px',maxWidth:320}}/>
              <select value={filterType} onChange={e=>{setFilterType(e.target.value);fetchMembers({type:e.target.value});}} style={{width:'auto'}}>
                <option value="all">All Types</option><option value="individual">Individual</option><option value="student">Student</option><option value="honorary">Honorary</option><option value="corporate">Corporate</option>
              </select>
              <select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);fetchMembers({status:e.target.value});}} style={{width:'auto'}}>
                <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option><option value="expired">Expired</option>
              </select>
              <select value={filterPlan} onChange={e=>{setFilterPlan(e.target.value);fetchMembers({plan:e.target.value});}} style={{width:'auto'}}>
                <option value="all">All Plans</option><option value="annual">Annual</option><option value="lifetime">Lifetime</option>
              </select>
              <button className="btn btn-ghost btn-sm" onClick={()=>fetchMembers()}>↻</button>
            </div>

            {/* Grid View */}
            {loading?(
              <div className="loading-state"><span className="spinner"/>Loading members…</div>
            ):members.length===0?(
              <div className="empty-state"><div className="icon">👥</div><p>No members found.</p><button className="btn btn-primary btn-sm" style={{marginTop:'1rem'}} onClick={()=>setShowAdd(true)}>+ Add First Member</button></div>
            ):viewMode==='grid'?(
              <div className="grid-2" style={{marginBottom:'1.5rem'}}>
                {members.map(m=>(
                  <div key={m.id} className="card" style={{display:'flex',flexDirection:'column',gap:'.65rem'}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'.65rem',cursor:'pointer',flex:1}} onClick={()=>setPanelMember(m)}>
                        <Avatar m={m} size={46}/>
                        <div>
                          <div style={{fontFamily:'var(--serif)',fontWeight:600,fontSize:'1rem',color:'var(--navy)',lineHeight:1.2}}>{m.first_name} {m.last_name}</div>
                          {m.maithili_name&&<div style={{fontSize:'.78rem',color:'var(--gold)',fontFamily:'var(--serif)',fontStyle:'italic'}}>{m.maithili_name}</div>}
                          <div style={{fontSize:'.72rem',color:'var(--ink-dim)'}}>#{m.id}{calcAge(m.date_of_birth)?` · ${calcAge(m.date_of_birth)} yrs`:''}</div>
                        </div>
                      </div>
                      <Toggle active={m.is_active} onChange={()=>handleToggle(m)}/>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'.28rem'}}>
                      <div className="text-sm text-muted">✉ <span style={{color:'var(--ink)'}}>{m.email}</span></div>
                      {m.phone&&<div className="text-sm text-muted">☎ {m.phone}</div>}
                      {(m.city||m.state)&&<div className="text-sm text-muted">📍 {[m.city,m.state].filter(Boolean).join(', ')}</div>}
                      {m.village_district&&<div className="text-sm text-muted">🏡 {m.village_district}</div>}
                    </div>
                    <div style={{display:'flex',gap:'.35rem',flexWrap:'wrap'}}>
                      <span className={`badge badge-${m.membership_type}`}>{TYPE_LABELS[m.membership_type]}</span>
                      <span className={`badge badge-${m.membership_plan}`}>{PLAN_LABELS[m.membership_plan]}</span>
                      <span className={`badge badge-${m.membership_status}`}>{m.membership_status}</span>
                    </div>
                    <div style={{fontSize:'.75rem',color:'var(--ink-dim)',display:'flex',gap:'1rem'}}>
                      <span>Joined: <b style={{color:'var(--ink)'}}>{fmtDate(m.joined_date)}</b></span>
                      {m.expiry_date&&<span>Exp: <b style={{color:localDate(m.expiry_date)<new Date()?'var(--crimson)':'var(--ink)'}}>{fmtDate(m.expiry_date)}</b></span>}
                    </div>
                    {m.amount_paid>0&&<div style={{fontSize:'.75rem',color:'var(--forest)'}}>💰 ${parseFloat(m.amount_paid).toFixed(2)}{m.payment_method?` via ${m.payment_method}`:''}</div>}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'.4rem',borderTop:'1px solid var(--border)',paddingTop:'.75rem'}}>
                      <button className="btn btn-ghost btn-sm" style={{justifyContent:'center'}} onClick={()=>setPanelMember(m)}>👁 View</button>
                      <button className="btn btn-primary btn-sm" style={{justifyContent:'center'}} onClick={()=>setEditMember(m)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" style={{justifyContent:'center'}} onClick={()=>handleDelete(m.id)}>🗑 Del</button>
                    </div>
                  </div>
                ))}
              </div>
            ):(
              /* Table View */
              <div className="table-wrap" style={{marginBottom:'1.5rem'}}>
                <table>
                  <thead><tr><th>#</th><th>Member</th><th>Email</th><th>Phone</th><th>Type</th><th>Plan</th><th>Status</th><th>Active</th><th>Joined</th><th>Actions</th></tr></thead>
                  <tbody>
                    {members.map(m=>(
                      <tr key={m.id}>
                        <td className="text-xs text-muted">{m.id}</td>
                        <td><div style={{display:'flex',alignItems:'center',gap:'.6rem',cursor:'pointer'}} onClick={()=>setPanelMember(m)}><Avatar m={m} size={34}/><div><div style={{fontWeight:600,fontSize:'.875rem',color:'var(--navy)'}}>{m.first_name} {m.last_name}</div>{m.maithili_name&&<div style={{fontSize:'.72rem',color:'var(--gold)',fontFamily:'var(--serif)',fontStyle:'italic'}}>{m.maithili_name}</div>}</div></div></td>
                        <td className="text-sm truncate" style={{maxWidth:180}}>{m.email}</td>
                        <td className="text-sm text-muted">{m.phone||'—'}</td>
                        <td><span className={`badge badge-${m.membership_type}`}>{TYPE_LABELS[m.membership_type]}</span></td>
                        <td><span className={`badge badge-${m.membership_plan}`}>{PLAN_LABELS[m.membership_plan]}</span></td>
                        <td><span className={`badge badge-${m.membership_status}`}>{m.membership_status}</span></td>
                        <td><Toggle active={m.is_active} onChange={()=>handleToggle(m)}/></td>
                        <td className="text-xs text-muted">{fmtDate(m.joined_date)}</td>
                        <td><div style={{display:'flex',gap:'.3rem'}}>
                          <button className="btn btn-ghost btn-sm" style={{padding:'.3rem .6rem'}} onClick={()=>setPanelMember(m)} title="View">👁</button>
                          <button className="btn btn-primary btn-sm" style={{padding:'.3rem .6rem'}} onClick={()=>setEditMember(m)} title="Edit">✏️</button>
                          <button className="btn btn-danger btn-sm" style={{padding:'.3rem .6rem'}} onClick={()=>handleDelete(m.id)} title="Delete">🗑</button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages>1&&(
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}} className="text-sm text-muted">
                <span>Page {pagination.page} of {pagination.pages} ({pagination.total} members)</span>
                <div style={{display:'flex',gap:'.5rem'}}>
                  <button className="btn btn-ghost btn-sm" disabled={pagination.page<=1} onClick={()=>fetchMembers({page:pagination.page-1})}>← Prev</button>
                  <button className="btn btn-ghost btn-sm" disabled={pagination.page>=pagination.pages} onClick={()=>fetchMembers({page:pagination.page+1})}>Next →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {panelMember&&<DetailPanel m={panelMember} onClose={()=>setPanelMember(null)} onEdit={m=>{setEditMember(m);setPanelMember(null);}} onDelete={id=>{handleDelete(id);setPanelMember(null);}}/>}
      {showAdd&&<MemberModal member={null} secret={secret} onClose={()=>setShowAdd(false)} onSave={handleSave}/>}
      {editMember&&<MemberModal member={editMember} secret={secret} onClose={()=>setEditMember(null)} onSave={handleSave}/>}
      {showImport&&<ImportModal secret={secret} onClose={()=>setShowImport(false)} onDone={()=>{setShowImport(false);fetchMembers();show('Import complete! Members refreshed.');}}/>}
      <Toast toasts={toasts}/>
    </>
  );
}
