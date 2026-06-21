'use client';
// app/admin/donations/page.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAdminAuth } from '@/app/admin/layout';

function useToast(){const[t,setT]=useState([]);const show=useCallback((msg,type='success')=>{const id=Date.now();setT(p=>[...p,{id,msg,type}]);setTimeout(()=>setT(p=>p.filter(x=>x.id!==id)),4500);},[]);return{toasts:t,show};}
function Toast({toasts}){return<div className="toast-wrap">{toasts.map(t=><div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;}

function Sidebar(){
  const NL=({href,icon,label,a})=><a href={href} className={`admin-nav-link${a?' active':''}`}><span className="nav-icon">{icon}</span>{label}</a>;
  return(<aside className="admin-sidebar"><div className="admin-sidebar-brand"><img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}} /><div className="logo-sub">मैथिल एसोसिएशन</div></div><nav className="admin-nav">
    <div className="admin-nav-section">Main</div>
    <NL href="/admin" icon="🏠" label="Dashboard"/><NL href="/admin/members" icon="👥" label="Members"/><NL href="/admin/events" icon="📅" label="Events"/><NL href="/admin/donations" icon="💰" label="Donations" a/><NL href="/admin/finance" icon="📊" label="Finance"/><NL href="/admin/analytics" icon="📈" label="Analytics"/>
    <div className="admin-nav-section">Content</div>
    <NL href="/admin/news" icon="📰" label="News"/><NL href="/admin/gallery" icon="🖼️" label="Gallery"/><NL href="/admin/homepage" icon="🏡" label="Mission"/><NL href="/admin/about" icon="📝" label="About Us"/><NL href="/admin/mithila" icon="🗺️" label="Mithila"/>
    <div className="admin-nav-section">Organization</div>
    <NL href="/admin/volunteers" icon="🙋" label="Volunteers"/><NL href="/admin/committee" icon="🏛️" label="Committee"/><NL href="/admin/inquiries" icon="✉️" label="Inquiries"/>
    <div className="admin-nav-section">Settings</div>
    <NL href="/" icon="🌐" label="Public Site"/>
  </nav></aside>);
}

function EmailAutocomplete({ value, onChange, onSelect, secret }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const timer = useRef(null);
  const inputRef = useRef(null);

  const updatePos = () => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: r.width });
  };

  const search = (q) => {
    clearTimeout(timer.current);
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/members/lookup?q=${encodeURIComponent(q)}`, { headers: { 'x-admin-secret': secret } });
        const d = await res.json();
        if (d.success && d.data.length) { updatePos(); setSuggestions(d.data); setOpen(true); setActive(-1); }
        else { setSuggestions([]); setOpen(false); }
      } catch {}
    }, 220);
  };

  const pick = (member) => { onSelect(member); setSuggestions([]); setOpen(false); };

  const onKey = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(suggestions[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  useEffect(() => {
    const handler = (e) => { if (inputRef.current && !inputRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <input
        ref={inputRef}
        type="email"
        value={value}
        onChange={e => { onChange(e); search(e.target.value); }}
        onKeyDown={onKey}
        onFocus={() => { if (suggestions.length) { updatePos(); setOpen(true); } }}
        autoComplete="off"
        placeholder="Type to search members…"
      />
      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'fixed', zIndex: 99999,
          top: dropPos.top, left: dropPos.left, width: dropPos.width,
          background: '#fff', border: '1px solid #e0c97f', borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,.15)', margin: 0, padding: 0,
          listStyle: 'none', maxHeight: 220, overflowY: 'auto',
        }}>
          {suggestions.map((m, i) => (
            <li
              key={m.email}
              onMouseDown={() => pick(m)}
              style={{
                padding: '8px 12px', cursor: 'pointer',
                background: i === active ? '#fdf6e3' : '#fff',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, color: '#0D2137' }}>{m.name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{m.email}{m.phone ? ` · ${m.phone}` : ''}</div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <div style={{ color: 'var(--crimson)', fontSize: '.75rem', marginTop: '.25rem' }}>⚠ {msg}</div>;
}

function Modal({ donation, secret, onClose, onSave }) {
  const isEdit = !!donation;
  const blank = {
    donor_name: '', donor_email: '', donor_phone: '',
    amount: '', payment_method: 'zelle', campaign: '', purpose: '',
    status: 'received', transaction_id: '', notes: '',
    donated_at: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
  };
  const [form, setForm] = useState(
    isEdit
      ? { ...blank, ...donation, donated_at: donation.donated_at?.split('T')[0] || blank.donated_at, amount: donation.amount || '' }
      : blank
  );
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.donor_name.trim()) errs.donor_name = 'Donor name is required';
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount greater than $0';
    return errs;
  };

  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch(
        isEdit ? `/api/donations/${donation.id}` : '/api/donations',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
          body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
        }
      );
      const data = await res.json();
      if (data.success) { onSave(data.data, isEdit); onClose(); }
      else if (data.errors) setErrors(data.errors);
      else setErrors({ _general: data.message || 'Save failed. Please try again.' });
    } catch { setErrors({ _general: 'Network error. Please try again.' }); }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Donation' : '💰 Record New Donation'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {errors._general && (
          <div style={{ margin: '0 1.5rem', padding: '.6rem .9rem', background: 'var(--crimson-light)', color: 'var(--crimson)', borderRadius: 6, fontSize: '.82rem' }}>
            ⚠ {errors._general}
          </div>
        )}

        <div className="form-grid" style={{ marginTop: errors._general ? '.75rem' : 0 }}>
          <div className="form-group">
            <label>Donor Name <span className="req">*</span></label>
            <input value={form.donor_name} onChange={set('donor_name')} placeholder="Full name"
              style={{ borderColor: errors.donor_name ? 'var(--crimson)' : '' }} />
            <FieldError msg={errors.donor_name} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <EmailAutocomplete
              value={form.donor_email}
              onChange={set('donor_email')}
              onSelect={m => setForm(p => ({ ...p, donor_email: m.email, donor_phone: m.phone || p.donor_phone, donor_name: p.donor_name || m.name }))}
              secret={secret}
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={form.donor_phone} onChange={set('donor_phone')} />
          </div>
          <div className="form-group">
            <label>Amount ($) <span className="req">*</span></label>
            <input type="number" value={form.amount} onChange={set('amount')}
              min="0.01" step="0.01"
              style={{ borderColor: errors.amount ? 'var(--crimson)' : '' }} />
            <FieldError msg={errors.amount} />
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select value={form.payment_method} onChange={set('payment_method')}>
              <option value="zelle">Zelle</option>
              <option value="credit_card">Credit Card</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={set('status')}>
              <option value="received">Received</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="form-group">
            <label>Donation Type</label>
            <select value={form.campaign} onChange={set('campaign')}>
              <option value="">— Select Type —</option>
              <option value="Membership">Membership</option>
              <option value="Event">Event</option>
              <option value="Drive">Drive</option>
              <option value="Sponsorship">Sponsorship</option>
              <option value="General Fund">General Fund</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Event / Sponsorship Detail</label>
            <input
              value={form.purpose}
              onChange={set('purpose')}
              placeholder="e.g. Diwali Gala 2025, Spring Drive, Gold Sponsor"
            />
          </div>
          <div className="form-group">
            <label>Transaction ID</label>
            <input value={form.transaction_id} onChange={set('transaction_id')} />
          </div>
          <div className="form-group">
            <label>Donation Date</label>
            <input type="date" value={form.donated_at} onChange={set('donated_at')} />
          </div>
          <div className="form-group span-2">
            <label>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Any notes about this donation…" />
          </div>
        </div>

        <div style={{ margin: '0 1.5rem 1rem', padding: '.55rem .85rem', background: 'var(--paper-2)', borderRadius: 6, fontSize: '.78rem', color: 'var(--ink-soft)', borderLeft: '3px solid var(--saffron)' }}>
          💡 After saving, use the <strong>📄</strong> button in the list to email the receipt to the donor.
        </div>

        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', padding: '0 1.5rem 1.25rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? <><span className="spinner" />Saving…</> : isEdit ? 'Save Changes' : 'Record Donation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DonationsPage() {
  const { toasts, show } = useToast();
  const { secret, logout } = useAdminAuth();
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ total: 0, total_amount: 0, received_amount: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editD, setEditD] = useState(null);
  const [sendingReceipt, setSendingReceipt] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(null);
  // Banner shown after successful email send: { donorName, email }
  const [sentBanner, setSentBanner] = useState(null);

  const load = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: '1', limit: '50', search: opts.search ?? search, status: opts.status ?? filterStatus, method: opts.method ?? filterMethod });
      const res = await fetch(`/api/donations?${qs}`, { headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) { setDonations(data.data); setStats(data.stats); }
      else show(data.message, 'error');
    } catch { show('Error loading donations', 'error'); }
    setLoading(false);
  }, [secret, search, filterStatus, filterMethod, show]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setTimeout(() => load({ search }), 380); return () => clearTimeout(t); }, [search]);

  const handleDelete = async id => {
    if (!confirm('Delete this donation?')) return;
    try {
      const r = await fetch(`/api/donations/${id}`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      const d = await r.json();
      if (d.success) { setDonations(p => p.filter(x => x.id !== id)); show('Deleted'); load(); }
      else show(d.message, 'error');
    } catch {}
  };

  const handleSave = (saved, isEdit) => {
    if (isEdit) setDonations(p => p.map(x => x.id === saved.id ? saved : x));
    else setDonations(p => [saved, ...p]);
    show(isEdit ? 'Donation updated!' : 'Donation recorded!');
    load();
  };

  const sendReceipt = async (d) => {
    if (!d.donor_email) { show('No email address on file for this donor. Edit the donation to add one.', 'error'); return; }
    setSendingReceipt(d.id);
    setSentBanner(null);
    try {
      const r = await fetch(`/api/donations/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ action: 'resend_receipt' }),
      });
      const res = await r.json();
      if (res.success) {
        setDonations(p => p.map(x => x.id === d.id ? { ...x, receipt_sent: true } : x));
        setSentBanner({ donorName: d.donor_name, email: d.donor_email, receiptNumber: res.receipt_number });
        show(`Receipt ${res.receipt_number} emailed to ${d.donor_email}`, 'success');
      } else {
        show(res.message || 'Failed to send receipt', 'error');
      }
    } catch { show('Error sending receipt', 'error'); }
    setSendingReceipt(null);
  };

  const previewReceipt = async (d) => {
    try {
      const r = await fetch(`/api/finance/receipts?donation_id=${d.id}&limit=1`, { headers: { 'x-admin-secret': secret } });
      const res = await r.json();
      if (res.success && res.data.length > 0) {
        const origin = window.location.origin;
        let html = res.data[0].html_content || '';
        if (html && !html.includes('Mithila_logo') && !html.includes('data:image')) {
          const logoTag = `<img src="${origin}/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;border:3px solid #E8720C;">`;
          html = html.replace(/<h1 /i, `${logoTag}<h1 `);
        }
        html = html.replace(/src="(\/[^"]+)"/g, `src="${origin}$1"`);
        setPreviewHtml(html);
      } else {
        show('No receipt generated yet. Use the 📄 button to send one first, then preview it.', 'error');
      }
    } catch { show('Error loading receipt preview', 'error'); }
  };

  const STATUS_C = {
    received: { bg: 'var(--forest-light)', color: 'var(--forest)' },
    pending:  { bg: 'var(--gold-light)',   color: 'var(--gold)' },
    failed:   { bg: 'var(--crimson-light)', color: 'var(--crimson)' },
    refunded: { bg: 'var(--paper-3)',       color: 'var(--ink-soft)' },
  };

  return (
    <>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <div className="admin-topbar">
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--navy)', fontWeight: 600 }}>Donations Management</div>
              <div className="text-sm text-muted">दान प्रबंधन · Total received: ${(stats.received_amount || 0).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', gap: '.65rem' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Record Donation</button>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
            </div>
          </div>

          <div className="admin-content">
            {/* Stats */}
            <div className="stats-grid">
              {[
                { label: 'Total Donations', num: stats.total, color: 'var(--saffron)' },
                { label: 'Received ($)', num: `$${(stats.received_amount || 0).toLocaleString()}`, color: 'var(--forest)' },
                { label: 'Pending', num: stats.pending || 0, color: 'var(--gold)' },
                { label: 'Via Zelle', num: donations.filter(d => d.payment_method === 'zelle').length, color: '#185FA5' },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-num" style={{ color: s.color, fontSize: '1.5rem' }}>{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Email sent confirmation banner */}
            {sentBanner && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.75rem',
                background: 'var(--forest-light)', border: '1px solid rgba(27,94,32,.25)',
                borderRadius: 8, padding: '.75rem 1rem', marginBottom: '1rem',
              }}>
                <span style={{ fontSize: '1.2rem' }}>✉️</span>
                <div style={{ flex: 1, fontSize: '.875rem', color: 'var(--forest)' }}>
                  <strong>Receipt emailed!</strong> Receipt <code style={{ background: 'rgba(27,94,32,.1)', padding: '1px 5px', borderRadius: 3 }}>{sentBanner.receiptNumber}</code> was sent to <strong>{sentBanner.donorName}</strong> at <strong>{sentBanner.email}</strong>.
                </div>
                <button onClick={() => setSentBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--forest)', fontSize: '1rem', padding: '2px 6px' }}>✕</button>
              </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search donor, email…" style={{ flex: '1 1 200px', maxWidth: 300 }} />
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); load({ status: e.target.value }); }} style={{ width: 'auto' }}>
                <option value="all">All Status</option>
                <option value="received">Received</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <select value={filterMethod} onChange={e => { setFilterMethod(e.target.value); load({ method: e.target.value }); }} style={{ width: 'auto' }}>
                <option value="all">All Methods</option>
                <option value="zelle">Zelle</option>
                <option value="credit_card">Credit Card</option>
                <option value="check">Check</option>
                <option value="cash">Cash</option>
              </select>
              <button className="btn btn-ghost btn-sm" onClick={() => load()}>↻</button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="loading-state"><span className="spinner" />Loading…</div>
            ) : donations.length === 0 ? (
              <div className="empty-state">
                <div className="icon">💰</div>
                <p>No donations yet.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setShowAdd(true)}>+ Record First Donation</button>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Donor</th><th>Amount</th><th>Method</th>
                      <th>Donation Type</th><th>Status</th><th>Receipt</th><th>Date</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map(d => {
                      const sc = STATUS_C[d.status] || STATUS_C.pending;
                      return (
                        <tr key={d.id}>
                          <td className="text-xs text-muted">{d.id}</td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{d.donor_name}</div>
                            {d.donor_email && <div className="text-xs text-muted">{d.donor_email}</div>}
                          </td>
                          <td style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--forest)', fontSize: '1rem' }}>
                            ${parseFloat(d.amount).toFixed(2)}
                          </td>
                          <td>
                            <span className="badge" style={{ background: 'var(--paper-3)', color: 'var(--ink-soft)' }}>
                              {(d.payment_method || '').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="text-sm text-muted">
                            {d.campaign || '—'}
                            {d.purpose && <div className="text-xs text-muted" style={{ marginTop: 2 }}>{d.purpose}</div>}
                          </td>
                          <td><span className="badge" style={{ background: sc.bg, color: sc.color }}>{d.status}</span></td>
                          <td>
                            {d.receipt_sent
                              ? <span style={{ fontSize: '.78rem', color: 'var(--forest)', fontWeight: 600 }}>✉ Sent</span>
                              : <span style={{ fontSize: '.78rem', color: 'var(--ink-dim)' }}>Not sent</span>}
                          </td>
                          <td className="text-xs text-muted">
                            {d.donated_at ? new Date(String(d.donated_at).slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' }) : ''}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '.3rem .6rem', fontSize: '.72rem' }}
                                onClick={() => previewReceipt(d)}
                                title="Preview receipt"
                              >👁</button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '.3rem .6rem', fontSize: '.72rem' }}
                                onClick={() => sendReceipt(d)}
                                disabled={sendingReceipt === d.id}
                                title={d.donor_email ? `Email receipt to ${d.donor_email}` : 'No email on file — edit donation to add one'}
                              >
                                {sendingReceipt === d.id ? <span className="spinner" /> : '📄'}
                              </button>
                              <button className="btn btn-primary btn-sm" style={{ padding: '.3rem .6rem' }} onClick={() => setEditD(d)}>✏️</button>
                              <button className="btn btn-danger btn-sm" style={{ padding: '.3rem .6rem' }} onClick={() => handleDelete(d.id)}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdd && <Modal donation={null} secret={secret} onClose={() => setShowAdd(false)} onSave={handleSave} />}
      {editD && <Modal donation={editD} secret={secret} onClose={() => setEditD(null)} onSave={handleSave} />}

      {previewHtml && (
        <div className="modal-backdrop" onClick={() => setPreviewHtml(null)}>
          <div className="modal" style={{ maxWidth: 700, width: '95vw' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Receipt Preview</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreviewHtml(null)}>✕</button>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', margin: '1rem' }}>
              <iframe srcDoc={previewHtml} style={{ width: '100%', height: 520, border: 'none' }} title="Receipt Preview" />
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} />
    </>
  );
}
