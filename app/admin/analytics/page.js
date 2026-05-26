'use client';
// app/admin/analytics/page.js — MAA Analytics & Reports

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/app/admin/layout';

/* ══════════════════════════════════════ HELPERS ══════════════════════════════════════ */
function fmt(n, decimals = 0) {
  return parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtUSD(n) { return '$' + fmt(n, 2); }

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


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
        <NL href="/admin"            icon="🏠" label="Dashboard" />
        <NL href="/admin/members"    icon="👥" label="Members" />
        <NL href="/admin/events"     icon="📅" label="Events" />
        <NL href="/admin/donations"  icon="💰" label="Donations" />
        <NL href="/admin/finance"    icon="📊" label="Finance" />
        <NL href="/admin/analytics"  icon="📈" label="Analytics" active />
        <div className="admin-nav-section">Content</div>
        <NL href="/admin/news"       icon="📰" label="News & Posts" />
        <NL href="/admin/gallery"    icon="🖼️" label="Gallery" />
        <NL href="/admin/homepage"   icon="🏡" label="Mission" />
        <NL href="/admin/about"      icon="📝" label="About Us" />
        <NL href="/admin/mithila"    icon="🗺️" label="Mithila" />
        <div className="admin-nav-section">Organization</div>
        <NL href="/admin/volunteers" icon="🙋" label="Volunteers" />
        <NL href="/admin/committee"  icon="🏛️" label="Committee" />
        <NL href="/admin/inquiries"  icon="✉️" label="Inquiries" />
        <div className="admin-nav-section">Settings</div>
        <NL href="/" icon="🌐" label="Public Site" />
        <a href="/api/health" target="_blank" className="admin-nav-link"><span className="nav-icon">⚡</span>Health</a>
      </nav>
    </aside>
  );
}

/* ══════════════════════════════════════ CHART PRIMITIVES ══════════════════════════════════════ */
function StatCard({ icon, label, value, sub, color = 'var(--navy)', bg = 'var(--paper-2)' }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
      <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.1em', color, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
        {icon && <span>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '.72rem', color: 'var(--ink-soft)' }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, valueKey = 'count', labelKey = 'label', color = 'var(--saffron)', formatValue, height = 160, horizontal }) {
  if (!data?.length) return <div style={{ color: 'var(--ink-dim)', padding: '1.5rem', textAlign: 'center', fontSize: '.85rem' }}>No data</div>;
  const max = Math.max(...data.map(d => parseFloat(d[valueKey]) || 0), 1);
  const fmtVal = formatValue || (v => fmt(v));

  if (horizontal) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
        {data.map((d, i) => {
          const pct = ((parseFloat(d[valueKey]) || 0) / max) * 100;
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 70px', alignItems: 'center', gap: '.5rem' }}>
              <div style={{ fontSize: '.78rem', color: 'var(--ink)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={d[labelKey]}>{d[labelKey]}</div>
              <div style={{ background: 'var(--paper-3)', borderRadius: 4, height: 18, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s ease' }} />
              </div>
              <div style={{ fontSize: '.78rem', fontWeight: 600, color, textAlign: 'right' }}>{fmtVal(d[valueKey])}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, paddingTop: 20, position: 'relative' }}>
      {data.map((d, i) => {
        const pct = ((parseFloat(d[valueKey]) || 0) / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: '.6rem', color: 'var(--ink-soft)', textAlign: 'center' }}>{pct > 0 ? fmtVal(d[valueKey]) : ''}</div>
            <div title={`${d[labelKey]}: ${fmtVal(d[valueKey])}`}
              style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: `${Math.max(pct, pct > 0 ? 2 : 0)}%`, transition: 'height .4s ease', cursor: 'default' }} />
            <div style={{ fontSize: '.62rem', color: 'var(--ink-dim)', textAlign: 'center', lineHeight: 1.1 }}>{d[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data, labelKey = 'label', valueKey = 'count', colors, size = 120 }) {
  if (!data?.length) return <div style={{ color: 'var(--ink-dim)', padding: '1rem', textAlign: 'center', fontSize: '.85rem' }}>No data</div>;
  const COLORS = colors || ['var(--saffron)','var(--navy)','var(--forest)','var(--crimson)','var(--gold)','#7B1FA2','#0097A7','#FF6F00'];
  const total = data.reduce((s, d) => s + (parseFloat(d[valueKey]) || 0), 0);
  let cumulative = 0;
  const slices = data.map((d, i) => {
    const val = parseFloat(d[valueKey]) || 0;
    const pct = total > 0 ? val / total : 0;
    const startAngle = cumulative * 360;
    cumulative += pct;
    const endAngle = cumulative * 360;
    return { ...d, val, pct, startAngle, endAngle, color: COLORS[i % COLORS.length] };
  });

  const r = size / 2;
  const inner = r * 0.58;
  const cx = r, cy = r;

  function polarToCartesian(angle) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arcPath(start, end) {
    const s = polarToCartesian(start), e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    const si = { x: cx + inner * Math.cos(((start - 90) * Math.PI) / 180), y: cy + inner * Math.sin(((start - 90) * Math.PI) / 180) };
    const ei = { x: cx + inner * Math.cos(((end - 90) * Math.PI) / 180), y: cy + inner * Math.sin(((end - 90) * Math.PI) / 180) };
    return `M${s.x},${s.y} A${r},${r},0,${largeArc},1,${e.x},${e.y} L${ei.x},${ei.y} A${inner},${inner},0,${largeArc},0,${si.x},${si.y} Z`;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => (
          s.pct > 0 && <path key={i} d={arcPath(s.startAngle, s.endAngle > s.startAngle ? s.endAngle : s.startAngle + 0.1)} fill={s.color} />
        ))}
        <circle cx={cx} cy={cy} r={inner - 2} fill="#fff" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--navy)">{fmt(total)}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fill="var(--ink-soft)">total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem', flex: 1, minWidth: 100 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.78rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--ink)', flex: 1 }}>{s[labelKey]}</span>
            <span style={{ fontWeight: 600, color: s.color }}>{fmt(s.val)}</span>
            <span style={{ color: 'var(--ink-dim)' }}>({Math.round(s.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyDualBar({ data, height = 180 }) {
  if (!data?.length) return <div style={{ color: 'var(--ink-dim)', padding: '1.5rem', textAlign: 'center', fontSize: '.85rem' }}>No data for this year</div>;
  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const found = data.find(d => d.month === i + 1);
    return { month: i + 1, label: MONTH_NAMES[i], income: parseFloat(found?.income || 0), expense: parseFloat(found?.expense || 0) };
  });
  const max = Math.max(...allMonths.flatMap(d => [d.income, d.expense]), 1);

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.72rem' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--forest)' }} />Income</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.72rem' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--crimson)' }} />Expense</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height, paddingTop: 20 }}>
        {allMonths.map(d => (
          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', display: 'flex', gap: 1, alignItems: 'flex-end', height: '90%' }}>
              <div title={`Income: $${fmt(d.income, 2)}`} style={{ flex: 1, background: 'var(--forest)', borderRadius: '2px 2px 0 0', height: `${(d.income / max) * 100}%`, minHeight: d.income > 0 ? 2 : 0 }} />
              <div title={`Expense: $${fmt(d.expense, 2)}`} style={{ flex: 1, background: 'var(--crimson)', borderRadius: '2px 2px 0 0', height: `${(d.expense / max) * 100}%`, minHeight: d.expense > 0 ? 2 : 0 }} />
            </div>
            <div style={{ fontSize: '.55rem', color: 'var(--ink-dim)', textAlign: 'center' }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children, action }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '.9rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Grid({ cols = 4, children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '.75rem', marginBottom: '1.25rem' }}>{children}</div>;
}

/* ══════════════════════════════════════ MEMBERS REPORT ══════════════════════════════════════ */
function MembersReport({ data, year }) {
  if (!data) return null;
  const { summary, byStatus, byType, byPlan, byMonth, byState } = data;

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const found = byMonth.find(d => d.month === i + 1);
    return { label: MONTH_NAMES[i], count: parseInt(found?.count || 0) };
  });

  return (
    <>
      <Grid cols={4}>
        <StatCard icon="👥" label="Total Members" value={fmt(summary.total)} bg="var(--paper-2)" color="var(--navy)" />
        <StatCard icon="✅" label="Active" value={fmt(summary.active)} bg="var(--forest-light)" color="var(--forest)" />
        <StatCard icon="⏰" label="Expired" value={fmt(summary.expired)} bg="var(--crimson-light)" color="var(--crimson)" />
        <StatCard icon="🆕" label={`New in ${year}`} value={fmt(summary.new_this_year)} bg="var(--saffron-light)" color="var(--saffron-dark)" />
      </Grid>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <Section title="Membership Status">
          <DonutChart data={byStatus} labelKey="label" valueKey="count" colors={['var(--forest)','var(--crimson)','var(--saffron)','var(--ink-soft)']} />
        </Section>
        <Section title="Membership Type">
          <DonutChart data={byType} labelKey="label" valueKey="count" colors={['var(--navy)','var(--saffron)','var(--forest)','var(--gold)']} />
        </Section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <Section title={`New Members by Month — ${year}`}>
          <BarChart data={monthlyData} valueKey="count" labelKey="label" color="var(--saffron)" height={160} />
        </Section>
        <Section title="Membership Plan">
          <DonutChart data={byPlan} labelKey="label" valueKey="count" colors={['var(--navy)','var(--gold)']} />
        </Section>
      </div>

      <Section title="Members by State (Top 10)">
        <BarChart data={byState} valueKey="count" labelKey="label" color="var(--navy)" horizontal />
      </Section>
    </>
  );
}

/* ══════════════════════════════════════ DONATIONS REPORT ══════════════════════════════════════ */
function DonationsReport({ data, year }) {
  if (!data) return null;
  const { summary, byMonth, byCampaign, byMethod, topDonors } = data;

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const found = byMonth.find(d => d.month === i + 1);
    return { label: MONTH_NAMES[i], amount: parseFloat(found?.amount || 0) };
  });

  return (
    <>
      <Grid cols={4}>
        <StatCard icon="💰" label="Total Received" value={fmtUSD(summary.total_received)} bg="var(--forest-light)" color="var(--forest)" />
        <StatCard icon="📅" label={`${year} Donations`} value={fmtUSD(summary.this_year)} bg="var(--saffron-light)" color="var(--saffron-dark)" />
        <StatCard icon="📊" label="Avg Donation" value={fmtUSD(summary.avg_amount)} bg="var(--paper-2)" color="var(--navy)" />
        <StatCard icon="🔢" label={`${year} Count`} value={fmt(summary.count_this_year)} bg="var(--paper-2)" color="var(--navy)" />
      </Grid>

      <Section title={`Monthly Donations — ${year}`}>
        <BarChart data={monthlyData} valueKey="amount" labelKey="label" color="var(--forest)" height={180} formatValue={v => '$' + fmt(v)} />
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <Section title="By Campaign">
          <BarChart data={byCampaign} valueKey="amount" labelKey="label" color="var(--saffron)" horizontal formatValue={v => '$' + fmt(v, 0)} />
        </Section>
        <Section title="By Payment Method">
          <DonutChart data={byMethod} labelKey="label" valueKey="amount" colors={['var(--navy)','var(--saffron)','var(--forest)','var(--crimson)','var(--gold)']} />
        </Section>
      </div>

      <Section title="Top 10 Donors">
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ marginBottom: 0 }}>
            <thead><tr><th>#</th><th>Donor</th><th style={{ textAlign: 'right' }}>Total Donated</th><th style={{ textAlign: 'right' }}>Donations</th></tr></thead>
            <tbody>
              {topDonors.map((d, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--ink-dim)', width: 32 }}>{i + 1}</td>
                  <td style={{ fontWeight: i < 3 ? 700 : 400 }}>
                    {i === 0 && '🥇 '}
                    {i === 1 && '🥈 '}
                    {i === 2 && '🥉 '}
                    {d.donor_name}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--forest)' }}>{fmtUSD(d.total)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--ink-soft)' }}>{d.count}x</td>
                </tr>
              ))}
              {topDonors.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-dim)', padding: '1.5rem' }}>No donations yet</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

/* ══════════════════════════════════════ FINANCE REPORT ══════════════════════════════════════ */
function FinanceReport({ data, year }) {
  if (!data) return null;
  const { summary, byMonth, byCategory, budgetVsActual } = data;
  const net = parseFloat(summary.total_income) - parseFloat(summary.total_expense);

  const incomeCategories = byCategory.filter(c => c.type === 'income');
  const expenseCategories = byCategory.filter(c => c.type === 'expense');

  return (
    <>
      <Grid cols={4}>
        <StatCard icon="📈" label="Total Income" value={fmtUSD(summary.total_income)} bg="var(--forest-light)" color="var(--forest)" />
        <StatCard icon="📉" label="Total Expense" value={fmtUSD(summary.total_expense)} bg="var(--crimson-light)" color="var(--crimson)" />
        <StatCard icon="💼" label="Net Surplus" value={fmtUSD(net)} bg={net >= 0 ? 'var(--forest-light)' : 'var(--crimson-light)'} color={net >= 0 ? 'var(--forest)' : 'var(--crimson)'} />
        <StatCard icon="🔢" label="Transactions" value={fmt(parseInt(summary.income_count) + parseInt(summary.expense_count))} bg="var(--paper-2)" color="var(--navy)" />
      </Grid>

      <Section title={`Monthly Income vs Expense — ${year}`}>
        <MonthlyDualBar data={byMonth} height={180} />
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <Section title="Income by Category">
          {incomeCategories.length > 0
            ? <BarChart data={incomeCategories} valueKey="amount" labelKey="label" color="var(--forest)" horizontal formatValue={v => '$' + fmt(v, 0)} />
            : <div style={{ color: 'var(--ink-dim)', padding: '1rem', textAlign: 'center', fontSize: '.85rem' }}>No income transactions</div>}
        </Section>
        <Section title="Expense by Category">
          {expenseCategories.length > 0
            ? <BarChart data={expenseCategories} valueKey="amount" labelKey="label" color="var(--crimson)" horizontal formatValue={v => '$' + fmt(v, 0)} />
            : <div style={{ color: 'var(--ink-dim)', padding: '1rem', textAlign: 'center', fontSize: '.85rem' }}>No expense transactions</div>}
        </Section>
      </div>

      <Section title={`Budget vs Actual — ${year}`}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ marginBottom: 0 }}>
            <thead>
              <tr><th>Category</th><th>Type</th><th style={{ textAlign: 'right' }}>Budgeted</th><th style={{ textAlign: 'right' }}>Actual</th><th style={{ textAlign: 'right' }}>Variance</th><th style={{ width: 120 }}>Usage</th></tr>
            </thead>
            <tbody>
              {budgetVsActual.map((r, i) => {
                const budgeted = parseFloat(r.budgeted);
                const actual = parseFloat(r.actual);
                const variance = actual - budgeted;
                const pct = budgeted > 0 ? Math.min(100, (actual / budgeted) * 100) : 0;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{r.category}</td>
                    <td><span className="badge" style={{ background: r.type === 'income' ? 'var(--forest-light)' : 'var(--crimson-light)', color: r.type === 'income' ? 'var(--forest)' : 'var(--crimson)' }}>{r.type}</span></td>
                    <td style={{ textAlign: 'right' }}>{budgeted > 0 ? fmtUSD(budgeted) : '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{actual > 0 ? fmtUSD(actual) : '—'}</td>
                    <td style={{ textAlign: 'right', color: variance === 0 ? 'var(--ink-soft)' : variance > 0 ? 'var(--forest)' : 'var(--crimson)', fontWeight: 500 }}>
                      {budgeted > 0 || actual > 0 ? (variance >= 0 ? '+' : '') + fmtUSD(variance) : '—'}
                    </td>
                    <td>
                      {budgeted > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--paper-3)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: actual > budgeted ? 'var(--crimson)' : 'var(--forest)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: '.7rem', color: 'var(--ink-soft)', width: 32, textAlign: 'right' }}>{Math.round(pct)}%</span>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
              {budgetVsActual.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-dim)', padding: '1.5rem' }}>No data</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

/* ══════════════════════════════════════ OVERVIEW REPORT ══════════════════════════════════════ */
function OverviewReport({ data, year }) {
  if (!data) return null;
  return (
    <>
      <Grid cols={4}>
        <StatCard icon="👥" label="Total Members" value={fmt(data.members.summary.total)} sub={`${fmt(data.members.summary.active)} active`} bg="var(--saffron-light)" color="var(--saffron-dark)" />
        <StatCard icon="💰" label="Total Donations" value={fmtUSD(data.donations.summary.total_received)} sub={`${fmtUSD(data.donations.summary.this_year)} in ${year}`} bg="var(--forest-light)" color="var(--forest)" />
        <StatCard icon="📊" label={`${year} Net`} value={fmtUSD(parseFloat(data.finance.summary.total_income) - parseFloat(data.finance.summary.total_expense))} sub={`Income ${fmtUSD(data.finance.summary.total_income)}`} bg="var(--paper-2)" color="var(--navy)" />
        <StatCard icon="📅" label="Events" value={fmt(data.events.summary.total)} sub={`${fmt(data.events.summary.this_year)} in ${year}`} bg="#E3F2FD" color="#0D47A1" />
      </Grid>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <Section title="Member Status">
          <DonutChart data={data.members.byStatus} labelKey="label" valueKey="count" colors={['var(--forest)','var(--crimson)','var(--saffron)','var(--ink-soft)']} />
        </Section>
        <Section title={`Monthly Income vs Expense — ${year}`}>
          <MonthlyDualBar data={data.finance.byMonth} height={150} />
        </Section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <Section title="Donations by Campaign">
          <BarChart data={data.donations.byCampaign} valueKey="amount" labelKey="label" color="var(--saffron)" horizontal formatValue={v => '$' + fmt(v, 0)} />
        </Section>
        <Section title="Events by Category">
          <DonutChart data={data.events.byCategory} labelKey="label" valueKey="count" colors={['var(--saffron)','var(--crimson)','var(--forest)','#0D47A1','var(--gold)','var(--ink-soft)']} />
        </Section>
      </div>

      <Section title="Top Donors">
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ marginBottom: 0 }}>
            <thead><tr><th>#</th><th>Donor</th><th style={{ textAlign: 'right' }}>Total</th><th style={{ textAlign: 'right' }}>Count</th></tr></thead>
            <tbody>
              {data.donations.topDonors.slice(0, 5).map((d, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--ink-dim)' }}>{i + 1}</td>
                  <td>{i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{d.donor_name}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--forest)' }}>{fmtUSD(d.total)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--ink-soft)' }}>{d.count}x</td>
                </tr>
              ))}
              {data.donations.topDonors.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-dim)', padding: '1rem' }}>No donations yet</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

/* ══════════════════════════════════════ TRAFFIC REPORT ══════════════════════════════════════ */
function TrafficReport({ data }) {
  if (!data) return <div style={{ color: 'var(--ink-dim)', padding: '3rem', textAlign: 'center' }}>No traffic data yet — visits will appear after the first page load.</div>;
  const { total_views, today_views, week_views, month_views, top_pages, last_30_days } = data;
  return (
    <>
      <Grid cols={4}>
        <StatCard icon="👁️" label="Total Page Views"  value={fmt(total_views)}  bg="var(--saffron-light)"  color="var(--saffron-dark)" />
        <StatCard icon="📅" label="Today"             value={fmt(today_views)}  bg="var(--paper-2)"        color="var(--navy)" />
        <StatCard icon="📆" label="Last 7 Days"       value={fmt(week_views)}   bg="var(--forest-light)"   color="var(--forest)" />
        <StatCard icon="🗓️" label="Last 30 Days"      value={fmt(month_views)}  bg="#E3F2FD"               color="#0D47A1" />
      </Grid>
      <Section title="Daily Views — Last 30 Days">
        <BarChart data={last_30_days} valueKey="count" labelKey="label" color="var(--saffron)" height={180} />
      </Section>
      <Section title="Top Pages">
        <BarChart data={top_pages} valueKey="count" labelKey="label" color="var(--navy)" horizontal />
      </Section>
    </>
  );
}

/* ══════════════════════════════════════ MAIN PAGE ══════════════════════════════════════ */
const TABS = [
  { id: 'overview',  label: '🏠 Overview' },
  { id: 'members',   label: '👥 Members' },
  { id: 'donations', label: '💰 Donations' },
  { id: 'finance',   label: '📊 Finance' },
  { id: 'traffic',   label: '🌐 Website Traffic' },
];

export default function AnalyticsPage() {
  const { secret, logout } = useAdminAuth();
  const [tab, setTab]     = useState('overview');
  const [year, setYear]   = useState(new Date().getFullYear());
  const [data, setData]   = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [loading, setLoading] = useState(false);

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, tRes] = await Promise.all([
      fetch(`/api/analytics?year=${year}`, { headers: { 'x-admin-secret': secret } }),
      fetch('/api/analytics/traffic',      { headers: { 'x-admin-secret': secret } }),
    ]);
    const [j, t] = await Promise.all([res.json(), tRes.json()]);
    if (j.success) setData(j);
    if (t.success) setTraffic(t.traffic);
    setLoading(false);
  }, [secret, year]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Analytics & Reports</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '.85rem', margin: '.2rem 0 0' }}>Members, donations, budget, finance, and website traffic</p>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <select className="admin-input" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: 100 }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.25rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '.55rem 1.1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.875rem', fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? 'var(--navy)' : 'var(--ink-soft)', borderBottom: tab === t.id ? '2px solid var(--navy)' : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div className="loading-spinner" style={{ margin: '4rem auto' }} />}

        {!loading && (
          <>
            {tab === 'overview'  && data && <OverviewReport  data={data} year={year} />}
            {tab === 'members'   && data && <MembersReport   data={data.members} year={year} />}
            {tab === 'donations' && data && <DonationsReport data={data.donations} year={year} />}
            {tab === 'finance'   && data && <FinanceReport   data={data.finance} year={year} />}
            {tab === 'traffic'   && <TrafficReport data={traffic} />}
          </>
        )}
      </main>
    </div>
  );
}
