'use client';
// app/admin/finance/page.js — MAA Finance Management

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from '@/app/admin/layout';

/* ══════════════════════════════════════ HELPERS ══════════════════════════════════════ */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}
function Toast({ toasts }) {
  return <div className="toast-wrap">{toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>;
}

function fmt(n) { return parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) {
  if (!d) return '—';
  const s = String(d);
  // Date-only strings (YYYY-MM-DD) must be parsed at UTC noon to avoid PST day-shift.
  // Timestamp strings are passed as-is and converted to PST via timeZone option.
  const dt = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00Z') : new Date(s);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
}

/* ══════════════════════════════════════ SIDEBAR ══════════════════════════════════════ */
function Sidebar() {
  const NL = ({ href, icon, label, active }) => (
    <a href={href} className={`admin-nav-link${active ? ' active' : ''}`}>
      <span className="nav-icon">{icon}</span>{label}
    </a>
  );
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}} />
        <div className="logo-sub">मैथिल एसोसिएशन</div>
      </div>
      <nav className="admin-nav">
        <div className="admin-nav-section">Main</div>
        <NL href="/admin"           icon="🏠" label="Dashboard" />
        <NL href="/admin/members"   icon="👥" label="Members" />
        <NL href="/admin/events"    icon="📅" label="Events" />
        <NL href="/admin/donations" icon="💰" label="Donations" />
        <NL href="/admin/finance"   icon="📊" label="Finance" active />
        <div className="admin-nav-section">Content</div>
        <NL href="/admin/news"      icon="📰" label="News & Posts" />
        <NL href="/admin/gallery"   icon="🖼️" label="Gallery" />
        <NL href="/admin/homepage"  icon="🏡" label="Mission" />
        <NL href="/admin/about"     icon="📝" label="About Us" />
        <NL href="/admin/mithila"   icon="🗺️" label="Mithila" />
        <div className="admin-nav-section">Organization</div>
        <NL href="/admin/volunteers" icon="🙋" label="Volunteers" />
        <NL href="/admin/committee"  icon="🏛️" label="Committee" />
        <NL href="/admin/inquiries"  icon="✉️" label="Inquiries" />
        <div className="admin-nav-section">Settings</div>
        <NL href="/"              icon="🌐" label="Public Site" />
        <a href="/api/health" target="_blank" className="admin-nav-link"><span className="nav-icon">⚡</span>Health</a>
      </nav>
    </aside>
  );
}


/* ══════════════════════════════════════ MODAL ══════════════════════════════════════ */
function Modal({ title, onClose, children, wide }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,33,55,.45)', zIndex: 199 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 12, zIndex: 200, boxShadow: '0 8px 40px rgba(0,0,0,.25)',
        width: wide ? 720 : 500, maxWidth: '95vw', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)' }}>{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '1.25rem', flex: 1 }}>{children}</div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════ P&L TAB ══════════════════════════════════════ */
function PLTab({ secret }) {
  const [year, setYear]   = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ year });
    if (month) q.set('month', month);
    const res = await fetch(`/api/finance/pl?${q}`, { headers: { 'x-admin-secret': secret } });
    const j = await res.json();
    if (j.success) setData(j);
    setLoading(false);
  }, [secret, year, month]);

  useEffect(() => { load(); }, [load]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <select className="admin-input" value={year} onChange={e => setYear(e.target.value)} style={{ width: 100 }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="admin-input" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 120 }}>
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {loading && <div className="loading-spinner" style={{ margin: '3rem auto' }} />}
      {data && !loading && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Income',    val: data.summary.total_income,   color: 'var(--forest)', bg: 'var(--forest-light)' },
              { label: 'Total Expense',   val: data.summary.total_expense,  color: 'var(--crimson)', bg: 'var(--crimson-light)' },
              { label: 'Net Surplus',     val: data.summary.net,            color: data.summary.net >= 0 ? 'var(--forest)' : 'var(--crimson)', bg: '#f5f5f5' },
              { label: 'Budgeted Income', val: data.summary.budgeted_income, color: 'var(--ink-soft)', bg: 'var(--paper-2)' },
            ].map(c => (
              <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.1em', color: c.color, marginBottom: '.3rem' }}>{c.label}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: c.color }}>${fmt(c.val)}</div>
              </div>
            ))}
          </div>

          {/* Income Table */}
          {data.income.length > 0 && (
            <PLTable title="Income" rows={data.income} color="var(--forest)" />
          )}

          {/* Expense Table */}
          {data.expense.length > 0 && (
            <PLTable title="Expenses" rows={data.expense} color="var(--crimson)" />
          )}
        </>
      )}
    </div>
  );
}

function PLTable({ title, rows, color }) {
  const total = rows.reduce((s, r) => s + parseFloat(r.actual), 0);
  const budgeted = rows.reduce((s, r) => s + parseFloat(r.budgeted), 0);
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontWeight: 700, color, fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem', padding: '.4rem .75rem', background: color === 'var(--forest)' ? 'var(--forest-light)' : 'var(--crimson-light)', borderRadius: 6 }}>
        {title}
      </div>
      <table className="admin-table" style={{ marginBottom: 0 }}>
        <thead>
          <tr><th>Category</th><th style={{ textAlign: 'right' }}>Budgeted</th><th style={{ textAlign: 'right' }}>Actual</th><th style={{ textAlign: 'right' }}>Variance</th></tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const variance = parseFloat(r.actual) - parseFloat(r.budgeted);
            return (
              <tr key={r.category_id}>
                <td>{r.category_name}</td>
                <td style={{ textAlign: 'right' }}>${fmt(r.budgeted)}</td>
                <td style={{ textAlign: 'right' }}>${fmt(r.actual)}</td>
                <td style={{ textAlign: 'right', color: variance >= 0 ? 'var(--forest)' : 'var(--crimson)' }}>
                  {variance >= 0 ? '+' : ''}{fmt(variance)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, background: 'var(--paper-2)' }}>
            <td>Total</td>
            <td style={{ textAlign: 'right' }}>${fmt(budgeted)}</td>
            <td style={{ textAlign: 'right' }}>${fmt(total)}</td>
            <td style={{ textAlign: 'right', color: (total-budgeted) >= 0 ? 'var(--forest)' : 'var(--crimson)' }}>
              {(total-budgeted) >= 0 ? '+' : ''}{fmt(total-budgeted)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════ TRANSACTIONS TAB ══════════════════════════════════════ */
function TransactionsTab({ secret, toast }) {
  const [rows, setRows]       = useState([]);
  const [stats, setStats]     = useState({});
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({ type: 'all', status: 'all', year: '', month: '', category: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx]   = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [chosenTemplate, setChosenTemplate] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const q = new URLSearchParams({ ...filters, page: p, limit: 50 });
    const res = await fetch(`/api/finance/transactions?${q}`, { headers: { 'x-admin-secret': secret } });
    const j = await res.json();
    if (j.success) { setRows(j.data); setStats(j.stats); setPages(j.pagination.pages); }
    setLoading(false);
  }, [secret, filters]);

  useEffect(() => { load(page); }, [load, page]);

  useEffect(() => {
    fetch('/api/finance/categories', { headers: { 'x-admin-secret': secret } })
      .then(r => r.json()).then(j => { if (j.success) setCategories(j.data); });
    fetch('/api/finance/templates', { headers: { 'x-admin-secret': secret } })
      .then(r => r.json()).then(j => { if (j.success) { setTemplates(j.data); if (j.data.length) setChosenTemplate(j.data.find(t => t.is_default)?.id || j.data[0].id); } });
  }, [secret]);

  const toggleSelect = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(s => s.size === rows.length ? new Set() : new Set(rows.map(r => r.id)));

  const deleteTx = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    const res = await fetch(`/api/finance/transactions/${id}`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
    const j = await res.json();
    if (j.success) { toast.show(j.message); load(page); setSelected(s => { const n = new Set(s); n.delete(id); return n; }); }
    else toast.show(j.message || 'Error', 'error');
  };

  const handleGenerate = async () => {
    if (!chosenTemplate) return toast.show('Select a template', 'error');
    setGenerating(true);
    const res = await fetch('/api/finance/receipts/generate', {
      method: 'POST',
      headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_ids: [...selected], template_id: parseInt(chosenTemplate) }),
    });
    const j = await res.json();
    setGenerating(false);
    if (j.success) { toast.show(`Generated ${j.count} receipt(s)`); setShowGenerate(false); setSelected(new Set()); }
    else toast.show(j.message || 'Error', 'error');
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '.75rem', marginBottom: '1rem' }}>
        {[
          { label: 'Income',  val: stats.total_income,  color: 'var(--forest)', bg: 'var(--forest-light)' },
          { label: 'Expense', val: stats.total_expense, color: 'var(--crimson)', bg: 'var(--crimson-light)' },
          { label: 'Net',     val: stats.net,           color: (stats.net||0) >= 0 ? 'var(--forest)' : 'var(--crimson)', bg: 'var(--paper-2)' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 8, padding: '.75rem 1rem' }}>
            <div style={{ fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.08em', color: c.color }}>{c.label}</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: c.color }}>${fmt(c.val)}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <input className="admin-input" placeholder="Search…" value={filters.search} onChange={e => setFilter('search', e.target.value)} style={{ width: 160 }} />
        <select className="admin-input" value={filters.type} onChange={e => setFilter('type', e.target.value)} style={{ width: 110 }}>
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select className="admin-input" value={filters.status} onChange={e => setFilter('status', e.target.value)} style={{ width: 120 }}>
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <select className="admin-input" value={filters.year} onChange={e => setFilter('year', e.target.value)} style={{ width: 90 }}>
          <option value="">Year</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="admin-input" value={filters.month} onChange={e => setFilter('month', e.target.value)} style={{ width: 100 }}>
          <option value="">Month</option>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select className="admin-input" value={filters.category} onChange={e => setFilter('category', e.target.value)} style={{ width: 140 }}>
          <option value="">Category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
          {selected.size > 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowGenerate(true)}>
              Generate Receipts ({selected.size})
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => { setEditTx(null); setShowForm(true); }}>+ Add Transaction</button>
        </div>
      </div>

      {/* Table */}
      {loading ? <div className="loading-spinner" style={{ margin: '2rem auto' }} /> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} />
                </th>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Payer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ background: selected.has(r.id) ? 'var(--saffron-light)' : '' }}>
                  <td><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '.8rem' }}>{fmtDate(r.transaction_date)}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</td>
                  <td>
                    <span className="badge" style={{ background: r.type === 'income' ? 'var(--forest-light)' : 'var(--crimson-light)', color: r.type === 'income' ? 'var(--forest)' : 'var(--crimson)' }}>
                      {r.type}
                    </span>
                  </td>
                  <td style={{ fontSize: '.8rem' }}>{r.category_name || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--mono, monospace)', fontSize: '.875rem' }}>${fmt(r.amount)}</td>
                  <td style={{ fontSize: '.8rem' }}>{r.payer_name || '—'}</td>
                  <td>
                    <span className="badge" style={{ background: r.status === 'completed' ? 'var(--forest-light)' : r.status === 'cancelled' ? 'var(--crimson-light)' : 'var(--paper-3)', color: r.status === 'completed' ? 'var(--forest)' : r.status === 'cancelled' ? 'var(--crimson)' : 'var(--ink-soft)' }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditTx(r); setShowForm(true); }}>Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--crimson)' }} onClick={() => deleteTx(r.id)}>Del</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--ink-dim)', padding: '2rem' }}>No transactions</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ padding: '.35rem .75rem', fontSize: '.85rem', color: 'var(--ink-soft)' }}>Page {page} / {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm secret={secret} tx={editTx} categories={categories} onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(page); toast.show(editTx ? 'Transaction updated' : 'Transaction added'); }} toast={toast} />
      )}

      {/* Generate Receipt Modal */}
      {showGenerate && (
        <Modal title="Generate Receipts" onClose={() => setShowGenerate(false)}>
          <p style={{ marginBottom: '1rem', color: 'var(--ink-soft)', fontSize: '.875rem' }}>
            Generating receipts for <strong>{selected.size}</strong> transaction(s).
          </p>
          <label className="admin-label">Receipt Template</label>
          <select className="admin-input" value={chosenTemplate} onChange={e => setChosenTemplate(e.target.value)} style={{ marginBottom: '1.25rem' }}>
            <option value="">-- Select Template --</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}{t.is_default ? ' (default)' : ''}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setShowGenerate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating || !chosenTemplate}>
              {generating ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════ TRANSACTION FORM ══════════════════════════════════════ */
function TransactionForm({ secret, tx, categories, onClose, onSaved, toast }) {
  const [form, setForm] = useState({
    type: tx?.type || 'income',
    category_id: tx?.category_id || '',
    description: tx?.description || '',
    amount: tx?.amount || '',
    payer_name: tx?.payer_name || '',
    payer_email: tx?.payer_email || '',
    payment_method: tx?.payment_method || '',
    transaction_date: tx?.transaction_date ? String(tx.transaction_date).slice(0,10) : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
    status: tx?.status || 'completed',
    notes: tx?.notes || '',
    reference_type: tx?.reference_type || '',
    reference_id: tx?.reference_id || '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const url = tx ? `/api/finance/transactions/${tx.id}` : '/api/finance/transactions';
    const method = tx ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await res.json();
    setSaving(false);
    if (j.success) onSaved();
    else { setErrors(j.errors || {}); if (j.message) toast.show(j.message, 'error'); }
  };

  const filteredCats = categories.filter(c => c.type === form.type);
  const PAYMENT_METHODS = ['cash', 'check', 'bank_transfer', 'zelle', 'venmo', 'paypal', 'credit_card', 'other'];

  return (
    <Modal title={tx ? 'Edit Transaction' : 'Add Transaction'} onClose={onClose} wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label className="admin-label">Type *</label>
          <select className="admin-input" value={form.type} onChange={e => { set('type', e.target.value); set('category_id', ''); }}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="admin-label">Category</label>
          <select className="admin-input" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
            <option value="">-- None --</option>
            {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label className="admin-label">Description *</label>
          <input className={`admin-input${errors.description ? ' error' : ''}`} value={form.description} onChange={e => set('description', e.target.value)} />
          {errors.description && <div className="admin-error">{errors.description}</div>}
        </div>
        <div>
          <label className="admin-label">Amount (USD) *</label>
          <input className={`admin-input${errors.amount ? ' error' : ''}`} type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} />
          {errors.amount && <div className="admin-error">{errors.amount}</div>}
        </div>
        <div>
          <label className="admin-label">Date</label>
          <input className="admin-input" type="date" value={form.transaction_date} onChange={e => set('transaction_date', e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Payer / Member Name</label>
          <input className="admin-input" value={form.payer_name} onChange={e => set('payer_name', e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Payer Email</label>
          <input className="admin-input" type="email" value={form.payer_email} onChange={e => set('payer_email', e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Payment Method</label>
          <select className="admin-input" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
            <option value="">-- Select --</option>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="admin-label">Status</label>
          <select className="admin-input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div>
          <label className="admin-label">Reference Type</label>
          <select className="admin-input" value={form.reference_type} onChange={e => set('reference_type', e.target.value)}>
            <option value="">-- None --</option>
            <option value="member">Member</option>
            <option value="event">Event</option>
            <option value="donation">Donation</option>
          </select>
        </div>
        <div>
          <label className="admin-label">Reference ID</label>
          <input className="admin-input" value={form.reference_id} onChange={e => set('reference_id', e.target.value)} placeholder="ID of linked record" />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label className="admin-label">Notes</label>
          <textarea className="admin-input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : (tx ? 'Update' : 'Add')}</button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════ BUDGET TAB ══════════════════════════════════════ */
function BudgetTab({ secret, toast }) {
  const [year, setYear]   = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');
  const [data, setData]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [saving, setSaving] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ year });
    if (month) q.set('month', month);
    const [bRes, cRes] = await Promise.all([
      fetch(`/api/finance/budget?${q}`, { headers: { 'x-admin-secret': secret } }),
      fetch('/api/finance/categories', { headers: { 'x-admin-secret': secret } }),
    ]);
    const [bJ, cJ] = await Promise.all([bRes.json(), cRes.json()]);
    if (bJ.success) setData(bJ.data);
    if (cJ.success) setCategories(cJ.data);
    setLoading(false);
  }, [secret, year, month]);

  useEffect(() => { load(); }, [load]);

  const saveBudget = async (catId) => {
    setSaving(true);
    const res = await fetch('/api/finance/budget', {
      method: 'POST',
      headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: catId, fiscal_year: year, fiscal_month: month || null, allocated_amount: parseFloat(editVal) || 0 }),
    });
    const j = await res.json();
    setSaving(false);
    if (j.success) { toast.show('Budget saved'); setEditRow(null); load(); }
    else toast.show(j.message || 'Error', 'error');
  };

  const incomeCats = categories.filter(c => c.type === 'income' && c.is_active);
  const expenseCats = categories.filter(c => c.type === 'expense' && c.is_active);

  const budgetMap = {};
  data.forEach(d => { budgetMap[d.category_id] = d; });

  const BudgetRow = ({ cat }) => {
    const b = budgetMap[cat.id];
    const allocated = parseFloat(b?.allocated_amount || 0);
    const actual = parseFloat(b?.actual || 0);
    const variance = actual - allocated;
    const isEditing = editRow === cat.id;

    return (
      <tr>
        <td>{cat.name}</td>
        <td style={{ textAlign: 'right' }}>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
              <input type="number" step="0.01" className="admin-input" style={{ width: 110, padding: '.3rem .5rem' }}
                value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus />
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => saveBudget(cat.id)}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditRow(null)}>✕</button>
            </div>
          ) : (
            <span onClick={() => { setEditRow(cat.id); setEditVal(allocated.toFixed(2)); }}
              style={{ cursor: 'pointer', borderBottom: '1px dashed var(--border)', paddingBottom: 1 }}>
              ${fmt(allocated)}
            </span>
          )}
        </td>
        <td style={{ textAlign: 'right' }}>${fmt(actual)}</td>
        <td style={{ textAlign: 'right', color: variance >= 0 ? 'var(--forest)' : 'var(--crimson)' }}>
          {variance >= 0 ? '+' : ''}{fmt(variance)}
        </td>
        <td style={{ textAlign: 'right' }}>
          {allocated > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'flex-end' }}>
              <div style={{ width: 80, height: 6, background: 'var(--paper-3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (actual/allocated)*100)}%`, height: '100%', background: actual > allocated ? 'var(--crimson)' : 'var(--forest)', borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: '.75rem', color: 'var(--ink-soft)' }}>{Math.round((actual/allocated)*100)}%</span>
            </div>
          ) : '—'}
        </td>
      </tr>
    );
  };

  const SubTable = ({ title, cats, color }) => {
    const totAllocated = cats.reduce((s, c) => s + parseFloat(budgetMap[c.id]?.allocated_amount || 0), 0);
    const totActual    = cats.reduce((s, c) => s + parseFloat(budgetMap[c.id]?.actual || 0), 0);
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, color, fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem', padding: '.4rem .75rem', background: color === 'var(--forest)' ? 'var(--forest-light)' : 'var(--crimson-light)', borderRadius: 6 }}>{title}</div>
        <table className="admin-table" style={{ marginBottom: 0 }}>
          <thead><tr><th>Category</th><th style={{ textAlign: 'right' }}>Budgeted <span style={{ fontWeight: 400, fontSize: '.7rem' }}>(click to edit)</span></th><th style={{ textAlign: 'right' }}>Actual</th><th style={{ textAlign: 'right' }}>Variance</th><th style={{ textAlign: 'right' }}>Usage</th></tr></thead>
          <tbody>
            {cats.map(c => <BudgetRow key={c.id} cat={c} />)}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 700, background: 'var(--paper-2)' }}>
              <td>Total</td>
              <td style={{ textAlign: 'right' }}>${fmt(totAllocated)}</td>
              <td style={{ textAlign: 'right' }}>${fmt(totActual)}</td>
              <td style={{ textAlign: 'right', color: (totActual-totAllocated) >= 0 ? 'var(--forest)' : 'var(--crimson)' }}>{(totActual-totAllocated) >= 0 ? '+' : ''}{fmt(totActual-totAllocated)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <select className="admin-input" value={year} onChange={e => setYear(e.target.value)} style={{ width: 100 }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="admin-input" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 120 }}>
          <option value="">Annual Budget</option>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <span style={{ fontSize: '.8rem', color: 'var(--ink-soft)', marginLeft: '.5rem' }}>Click an amount to edit it.</span>
      </div>
      {loading ? <div className="loading-spinner" style={{ margin: '2rem auto' }} /> : (
        <>
          {incomeCats.length > 0 && <SubTable title="Income Budget" cats={incomeCats} color="var(--forest)" />}
          {expenseCats.length > 0 && <SubTable title="Expense Budget" cats={expenseCats} color="var(--crimson)" />}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════ RECEIPTS TAB ══════════════════════════════════════ */
function ReceiptsTab({ secret, toast }) {
  const [rows, setRows]         = useState([]);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [driveResults, setDriveResults] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const q = new URLSearchParams({ page: p, limit: 50 });
    if (search) q.set('search', search);
    const res = await fetch(`/api/finance/receipts?${q}`, { headers: { 'x-admin-secret': secret } });
    const j = await res.json();
    if (j.success) { setRows(j.data); setPages(j.pagination.pages); }
    setLoading(false);
  }, [secret, search]);

  useEffect(() => { load(page); }, [load, page]);

  const toggleSelect = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll    = () => setSelected(s => s.size === rows.length ? new Set() : new Set(rows.map(r => r.id)));

  const sendReceipts = async () => {
    if (!selected.size) return;
    setSending(true);
    const res = await fetch('/api/finance/receipts/send', {
      method: 'POST',
      headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt_ids: [...selected] }),
    });
    const j = await res.json();
    setSending(false);
    if (j.success) { toast.show(`Sent ${j.sent}, failed ${j.failed}`); setSelected(new Set()); load(page); }
    else toast.show(j.message || 'Error', 'error');
  };

  const uploadToDrive = async () => {
    if (!selected.size) return;
    setUploading(true);
    try {
      const res = await fetch('/api/finance/receipts/upload-drive', {
        method: 'POST',
        headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_ids: [...selected] }),
      });
      const j = await res.json();
      if (j.success) { setDriveResults(j.results); setSelected(new Set()); load(page); }
      else toast.show(j.message || 'Upload failed', 'error');
    } catch (e) { toast.show(e.message || 'Upload failed', 'error'); }
    setUploading(false);
  };

  const deleteReceipt = async (r) => {
    if (!confirm(`Delete receipt ${r.receipt_number}? This cannot be undone.`)) return;
    const res = await fetch(`/api/finance/receipts?id=${r.id}`, {
      method: 'DELETE', headers: { 'x-admin-secret': secret },
    });
    const j = await res.json();
    if (j.success) { toast.show('Receipt deleted'); load(page); }
    else toast.show(j.message || 'Delete failed', 'error');
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <input className="admin-input" placeholder="Search receipts…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ width: 200 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
          {selected.size > 0 && (<>
            <button className="btn btn-primary btn-sm" onClick={sendReceipts} disabled={sending}>
              {sending ? 'Sending…' : `Email ${selected.size} Receipt(s)`}
            </button>
            <button
              className="btn btn-sm"
              style={{ background: '#1a73e8', color: '#fff', border: 'none' }}
              onClick={uploadToDrive}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : `⬆ Drive (${selected.size})`}
            </button>
          </>)}
        </div>
      </div>

      {loading ? <div className="loading-spinner" style={{ margin: '2rem auto' }} /> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} /></th>
                <th>Receipt #</th>
                <th>Recipient</th>
                <th>Email</th>
                <th>Description</th>
                <th>Event / Sponsorship Detail</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Generated</th>
                <th>Emailed</th>
                <th>Drive</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ background: selected.has(r.id) ? 'var(--saffron-light)' : '' }}>
                  <td><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                  <td style={{ fontFamily: 'var(--mono, monospace)', fontSize: '.8rem' }}>{r.receipt_number}</td>
                  <td>{r.recipient_name}</td>
                  <td style={{ fontSize: '.8rem' }}>{r.recipient_email || '—'}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '.8rem' }}>
                    {r.transaction_description || (r.donation_campaign ? `Donation — ${r.donation_campaign}` : '—')}
                  </td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '.8rem', color: r.donation_purpose ? 'var(--navy)' : 'var(--ink-dim)' }}>
                    {r.donation_purpose || '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '.875rem' }}>${fmt(r.transaction_amount)}</td>
                  <td style={{ fontSize: '.8rem' }}>{fmtDate(r.generated_at)}</td>
                  <td style={{ fontSize: '.8rem' }}>{r.emailed_at ? fmtDate(r.emailed_at) : <span style={{ color: 'var(--ink-dim)' }}>Not sent</span>}</td>
                  <td style={{ fontSize: '.8rem' }}>
                    {r.drive_link
                      ? <a href={r.drive_link} target="_blank" rel="noreferrer" style={{ color: '#1a73e8' }}>↗ Drive</a>
                      : <span style={{ color: 'var(--ink-dim)' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '.35rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        // Convert relative /images/... paths to absolute so they render in srcDoc iframe
                        const origin = window.location.origin;
                        let html = r.html_content || '';
                        // Inject logo if missing (old receipts saved before logo fix)
                        if (html && !html.includes('Mithila_logo') && !html.includes('data:image')) {
                          const logoTag = `<img src="${origin}/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;border:3px solid #E8720C;">`;
                          html = html.replace(/<h1 /i, `${logoTag}<h1 `);
                        }
                        // Make relative paths absolute for srcDoc rendering
                        html = html.replace(/src="(\/[^"]+)"/g, `src="${origin}$1"`);
                        setPreviewHtml(html);
                      }}>Preview</button>
                      <a
                        href={r.html_content ? `/api/finance/receipts/${r.id}/pdf?secret=${encodeURIComponent(secret)}` : '#'}
                        download={r.html_content ? `${r.receipt_number}.pdf` : undefined}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '.75rem', opacity: r.html_content ? 1 : 0.35, pointerEvents: r.html_content ? 'auto' : 'none' }}
                      >PDF</a>
                      <button
                        style={{ fontSize: '.75rem', padding: '3px 8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                        onClick={() => deleteReceipt(r)}
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--ink-dim)', padding: '2rem' }}>No receipts yet. Generate them from the Transactions tab.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ padding: '.35rem .75rem', fontSize: '.85rem', color: 'var(--ink-soft)' }}>Page {page} / {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Google Drive Upload Results Modal */}
      {driveResults && (
        <Modal title="Uploaded to Google Drive" onClose={() => setDriveResults(null)} wide>
          <div style={{ padding: '1rem', overflowY: 'auto', maxHeight: 400 }}>
            {driveResults.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.6rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1.1rem' }}>{r.success ? '✅' : '❌'}</span>
                <span style={{ flex: 1, fontSize: '.875rem', color: 'var(--navy)' }}>{r.name || `Receipt #${r.id}`}</span>
                {r.success
                  ? <a href={r.link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: '.75rem' }}>Open in Drive ↗</a>
                  : <span style={{ fontSize: '.8rem', color: 'var(--crimson)' }}>{r.error}</span>}
              </div>
            ))}
          </div>
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setDriveResults(null)}>Done</button>
          </div>
        </Modal>
      )}

      {/* HTML Preview Modal */}
      {previewHtml && (
        <Modal title="Receipt Preview" onClose={() => setPreviewHtml(null)} wide>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <iframe srcDoc={previewHtml} style={{ width: '100%', height: 500, border: 'none' }} title="Receipt Preview" />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════ CATEGORIES TAB ══════════════════════════════════════ */
function CategoriesTab({ secret, toast }) {
  const [cats, setCats]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'income', description: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/finance/categories', { headers: { 'x-admin-secret': secret } });
    const j = await res.json();
    if (j.success) setCats(j.data);
    setLoading(false);
  }, [secret]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditCat(null); setForm({ name: '', type: 'income', description: '', sort_order: 0 }); setErrors({}); setShowForm(true); };
  const openEdit = (c) => { setEditCat(c); setForm({ name: c.name, type: c.type, description: c.description||'', sort_order: c.sort_order||0 }); setErrors({}); setShowForm(true); };

  const save = async () => {
    setSaving(true);
    const url = editCat ? '/api/finance/categories' : '/api/finance/categories';
    const method = editCat ? 'PATCH' : 'POST';
    const body = editCat ? { id: editCat.id, ...form } : form;
    const res = await fetch(url, { method, headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await res.json();
    setSaving(false);
    if (j.success) { toast.show(editCat ? 'Category updated' : 'Category added'); setShowForm(false); load(); }
    else { setErrors(j.errors || {}); if (j.message) toast.show(j.message, 'error'); }
  };

  const deleteCat = async (id, name) => {
    if (!confirm(`Delete category "${name}"? Transactions linked to it will lose their category.`)) return;
    const res = await fetch(`/api/finance/categories?id=${id}`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
    const j = await res.json();
    if (j.success) { toast.show(j.message); load(); }
    else toast.show(j.message, 'error');
  };

  const toggleActive = async (c) => {
    const res = await fetch('/api/finance/categories', { method: 'PATCH', headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, is_active: !c.is_active }) });
    const j = await res.json();
    if (j.success) load(); else toast.show(j.message, 'error');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Category</button>
      </div>
      {loading ? <div className="loading-spinner" style={{ margin: '2rem auto' }} /> : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Type</th><th>Description</th><th>Sort</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {cats.map(c => (
              <tr key={c.id} style={{ opacity: c.is_active ? 1 : .5 }}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td><span className="badge" style={{ background: c.type === 'income' ? 'var(--forest-light)' : 'var(--crimson-light)', color: c.type === 'income' ? 'var(--forest)' : 'var(--crimson)' }}>{c.type}</span></td>
                <td style={{ fontSize: '.8rem', color: 'var(--ink-soft)' }}>{c.description || '—'}</td>
                <td>{c.sort_order}</td>
                <td>
                  <button className={`btn btn-sm ${c.is_active ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggleActive(c)}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--crimson)' }} onClick={() => deleteCat(c.id, c.name)}>Del</button>
                </td>
              </tr>
            ))}
            {cats.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-dim)', padding: '2rem' }}>No categories</td></tr>}
          </tbody>
        </table>
      )}
      {showForm && (
        <Modal title={editCat ? 'Edit Category' : 'Add Category'} onClose={() => setShowForm(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <div>
              <label className="admin-label">Name *</label>
              <input className={`admin-input${errors.name ? ' error' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <div className="admin-error">{errors.name}</div>}
            </div>
            <div>
              <label className="admin-label">Type *</label>
              <select className={`admin-input${errors.type ? ' error' : ''}`} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="admin-label">Description</label>
              <input className="admin-input" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div>
              <label className="admin-label">Sort Order</label>
              <input className="admin-input" type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : (editCat ? 'Update' : 'Add')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════ TEMPLATES TAB ══════════════════════════════════════ */
function TemplatesTab({ secret, toast }) {
  const [tmpls, setTmpls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editTmpl, setEditTmpl] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', body_html: '', is_default: false });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewHtml, setPreviewHtml] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const fileRefs = useRef({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/finance/templates', { headers: { 'x-admin-secret': secret } });
    const j = await res.json();
    if (j.success) setTmpls(j.data);
    setLoading(false);
  }, [secret]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditTmpl(null); setForm({ name: '', subject: '', body_html: '', is_default: false }); setErrors({}); setShowForm(true); };
  const openEdit = (t) => { setEditTmpl(t); setForm({ name: t.name, subject: t.subject, body_html: t.body_html, is_default: t.is_default }); setErrors({}); setShowForm(true); };

  const save = async () => {
    setSaving(true);
    const url = editTmpl ? `/api/finance/templates/${editTmpl.id}` : '/api/finance/templates';
    const method = editTmpl ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await res.json();
    setSaving(false);
    if (j.success) { toast.show(editTmpl ? 'Template updated' : 'Template added'); setShowForm(false); load(); }
    else { setErrors(j.errors || {}); if (j.message) toast.show(j.message, 'error'); }
  };

  const deleteTmpl = async (id, name) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    const res = await fetch(`/api/finance/templates/${id}`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
    const j = await res.json();
    if (j.success) { toast.show(j.message); load(); }
    else toast.show(j.message, 'error');
  };

  const uploadSignature = async (tmplId, file) => {
    setUploadingId(tmplId);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/finance/templates/${tmplId}/signature`, { method: 'POST', headers: { 'x-admin-secret': secret }, body: fd });
    const j = await res.json();
    setUploadingId(null);
    if (j.success) { toast.show('Signature saved'); load(); }
    else toast.show(j.message || 'Upload failed', 'error');
  };

  const clearSignature = async (tmplId) => {
    const res = await fetch(`/api/finance/templates/${tmplId}/signature`, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
    const j = await res.json();
    if (j.success) { toast.show('Signature removed'); load(); }
    else toast.show(j.message || 'Error', 'error');
  };

  const VARS = ['receipt_number','recipient_name','recipient_email','amount','amount_words','description','category','payment_method','transaction_date','generated_date','status','representative_name','logo_img'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.5rem', marginBottom: '1rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={async () => {
          const r = await fetch('/api/admin/reseed-templates', { method: 'POST', headers: { 'x-admin-secret': secret } });
          const j = await r.json();
          if (j.success) { toast.show('Templates resynced'); load(); } else toast.show(j.message, 'error');
        }}>↺ Resync Templates</button>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Template</button>
      </div>
      {loading ? <div className="loading-spinner" style={{ margin: '2rem auto' }} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tmpls.map(t => (
            <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '1rem 1.25rem', background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '1rem' }}>{t.name}</span>
                {t.is_default && <span className="badge" style={{ background: 'var(--saffron-light)', color: 'var(--saffron-dark)' }}>Default</span>}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => {
                    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' });
                    const logoUrl = `${window.location.origin}/images/gallery/Mithila_logo.jpeg`;
                    const logoTag = `<img src="${logoUrl}" alt="MAA Logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;border:3px solid #E8720C;">`;
                    const preview = t.body_html
                      .replace(/\{\{logo_img\}\}/g, logoTag)
                      .replace(/\{\{app_url\}\}/g, window.location.origin)
                      .replace(/\{\{receipt_number\}\}/g, 'RCP-20260517-ABCDE')
                      .replace(/\{\{recipient_name\}\}/g, 'Sample Donor')
                      .replace(/\{\{recipient_email\}\}/g, 'donor@example.com')
                      .replace(/\{\{amount\}\}/g, '150.00')
                      .replace(/\{\{amount_words\}\}/g, 'One Hundred Fifty and 00/100')
                      .replace(/\{\{description\}\}/g, 'Annual Donation')
                      .replace(/\{\{payment_method\}\}/g, 'Zelle')
                      .replace(/\{\{transaction_date\}\}/g, today)
                      .replace(/\{\{generated_date\}\}/g, today)
                      .replace(/\{\{representative_name\}\}/g, 'Sunil Jha')
                      .replace(/\{\{status\}\}/g, 'received')
                      .replace(/\{\{\w+\}\}/g, '');
                    setPreviewHtml(preview);
                  }}>Preview</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--crimson)' }} onClick={() => deleteTmpl(t.id, t.name)}>Delete</button>
                </div>
              </div>
              <div style={{ fontSize: '.8rem', color: 'var(--ink-soft)' }}>Subject: <em>{t.subject}</em></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginTop: '.75rem', paddingTop: '.75rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '.8rem', color: 'var(--ink-soft)', fontWeight: 600, flexShrink: 0 }}>Signature:</span>
                {t.signature_base64
                  ? <>
                      <img src={t.signature_base64} alt="Signature" style={{ maxHeight: 38, maxWidth: 160, border: '1px solid var(--border)', borderRadius: 4, background: '#fff', padding: 3 }} />
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--crimson)', fontSize: '.75rem' }} onClick={() => clearSignature(t.id)}>✕ Remove</button>
                    </>
                  : <span style={{ fontSize: '.8rem', color: 'var(--ink-dim)', fontStyle: 'italic' }}>No signature</span>
                }
                <input type="file" accept="image/*" style={{ display: 'none' }} ref={el => { if (el) fileRefs.current[t.id] = el; }} onChange={e => { if (e.target.files[0]) uploadSignature(t.id, e.target.files[0]); e.target.value = ''; }} />
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', fontSize: '.75rem' }} disabled={uploadingId === t.id} onClick={() => fileRefs.current[t.id]?.click()}>
                  {uploadingId === t.id ? 'Uploading…' : '⬆ Upload Signature'}
                </button>
              </div>
            </div>
          ))}
          {tmpls.length === 0 && <div style={{ textAlign: 'center', color: 'var(--ink-dim)', padding: '2rem' }}>No templates</div>}
        </div>
      )}

      {showForm && (
        <Modal title={editTmpl ? 'Edit Template' : 'Add Template'} onClose={() => setShowForm(false)} wide>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <div>
              <label className="admin-label">Template Name *</label>
              <input className={`admin-input${errors.name ? ' error' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <div className="admin-error">{errors.name}</div>}
            </div>
            <div>
              <label className="admin-label">Email Subject *</label>
              <input className={`admin-input${errors.subject ? ' error' : ''}`} value={form.subject} onChange={e => set('subject', e.target.value)} />
              {errors.subject && <div className="admin-error">{errors.subject}</div>}
            </div>
            <div>
              <label className="admin-label">Body HTML * <span style={{ fontSize: '.7rem', color: 'var(--ink-dim)', fontWeight: 400 }}>Available variables: {VARS.map(v => `{{${v}}}`).join(', ')}</span></label>
              <textarea className={`admin-input${errors.body_html ? ' error' : ''}`} rows={14} value={form.body_html} onChange={e => set('body_html', e.target.value)} style={{ fontFamily: 'var(--mono, monospace)', fontSize: '.8rem', resize: 'vertical' }} />
              {errors.body_html && <div className="admin-error">{errors.body_html}</div>}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.875rem' }}>
              <input type="checkbox" checked={form.is_default} onChange={e => set('is_default', e.target.checked)} />
              Set as default template
            </label>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : (editTmpl ? 'Update' : 'Add')}</button>
          </div>
        </Modal>
      )}

      {previewHtml && (
        <Modal title="Template Preview" onClose={() => setPreviewHtml(null)} wide>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <iframe srcDoc={previewHtml} style={{ width: '100%', height: 500, border: 'none' }} title="Template Preview" />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════ MAIN PAGE ══════════════════════════════════════ */
const TABS = [
  { id: 'pl',           label: '📊 P&L' },
  { id: 'transactions', label: '💳 Transactions' },
  { id: 'budget',       label: '📋 Budget' },
  { id: 'receipts',     label: '🧾 Receipts' },
  { id: 'categories',   label: '🏷️ Categories' },
  { id: 'templates',    label: '📄 Templates' },
];

export default function FinancePage() {
  const { secret, logout } = useAdminAuth();
  const toast = useToast();
  const [tab, setTab] = useState('pl');

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <Toast toasts={toast.toasts} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Finance Management</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '.85rem', margin: '.2rem 0 0' }}>Transactions, budget, P&L, and receipts</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.25rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '.55rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? 'var(--navy)' : 'var(--ink-soft)', borderBottom: tab === t.id ? '2px solid var(--navy)' : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          {tab === 'pl'           && <PLTab secret={secret} />}
          {tab === 'transactions' && <TransactionsTab secret={secret} toast={toast} />}
          {tab === 'budget'       && <BudgetTab secret={secret} toast={toast} />}
          {tab === 'receipts'     && <ReceiptsTab secret={secret} toast={toast} />}
          {tab === 'categories'   && <CategoriesTab secret={secret} toast={toast} />}
          {tab === 'templates'    && <TemplatesTab secret={secret} toast={toast} />}
        </div>
      </main>
    </div>
  );
}
