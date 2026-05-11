// app/api/analytics/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const [
      memberSummary,
      membersByStatus,
      membersByType,
      membersByPlan,
      membersByMonth,
      membersByState,

      donationSummary,
      donationsByMonth,
      donationsByCampaign,
      donationsByMethod,
      topDonors,

      txSummary,
      txByMonth,
      txByCategory,

      budgetVsActual,

      eventSummary,
      eventsByCategory,
    ] = await Promise.all([

      // ── MEMBERS ──
      sql`SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE membership_status='active') AS active,
            COUNT(*) FILTER (WHERE membership_status='expired') AS expired,
            COUNT(*) FILTER (WHERE membership_status='pending') AS pending,
            COUNT(*) FILTER (WHERE membership_status='inactive') AS inactive,
            COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM joined_date)=${year}) AS new_this_year
          FROM members WHERE is_active=true`,

      sql`SELECT membership_status AS label, COUNT(*) AS count FROM members WHERE is_active=true GROUP BY membership_status ORDER BY count DESC`,

      sql`SELECT membership_type AS label, COUNT(*) AS count FROM members WHERE is_active=true GROUP BY membership_type ORDER BY count DESC`,

      sql`SELECT membership_plan AS label, COUNT(*) AS count FROM members WHERE is_active=true GROUP BY membership_plan ORDER BY count DESC`,

      sql`SELECT EXTRACT(MONTH FROM joined_date)::int AS month, COUNT(*) AS count
          FROM members WHERE is_active=true AND EXTRACT(YEAR FROM joined_date)=${year}
          GROUP BY month ORDER BY month`,

      sql`SELECT COALESCE(NULLIF(state,''),'Unknown') AS label, COUNT(*) AS count
          FROM members WHERE is_active=true GROUP BY label ORDER BY count DESC LIMIT 10`,

      // ── DONATIONS ──
      sql`SELECT
            COUNT(*) AS total,
            COALESCE(SUM(amount) FILTER (WHERE status='received'),0) AS total_received,
            COALESCE(SUM(amount) FILTER (WHERE status='received' AND EXTRACT(YEAR FROM donated_at)=${year}),0) AS this_year,
            COALESCE(AVG(amount) FILTER (WHERE status='received'),0) AS avg_amount,
            COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM donated_at)=${year}) AS count_this_year
          FROM donations`,

      sql`SELECT EXTRACT(MONTH FROM donated_at)::int AS month,
                 COALESCE(SUM(amount),0) AS amount, COUNT(*) AS count
          FROM donations WHERE status='received' AND EXTRACT(YEAR FROM donated_at)=${year}
          GROUP BY month ORDER BY month`,

      sql`SELECT COALESCE(NULLIF(campaign,''),'General') AS label,
                 COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount
          FROM donations WHERE status='received'
          GROUP BY label ORDER BY amount DESC LIMIT 8`,

      sql`SELECT COALESCE(NULLIF(payment_method,''),'Unknown') AS label,
                 COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount
          FROM donations WHERE status='received'
          GROUP BY label ORDER BY amount DESC`,

      sql`SELECT donor_name, COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
          FROM donations WHERE status='received'
          GROUP BY donor_name ORDER BY total DESC LIMIT 10`,

      // ── FINANCE TRANSACTIONS ──
      sql`SELECT
            COALESCE(SUM(amount) FILTER (WHERE type='income' AND status NOT IN ('cancelled','refunded')),0) AS total_income,
            COALESCE(SUM(amount) FILTER (WHERE type='expense' AND status NOT IN ('cancelled','refunded')),0) AS total_expense,
            COUNT(*) FILTER (WHERE type='income') AS income_count,
            COUNT(*) FILTER (WHERE type='expense') AS expense_count
          FROM finance_transactions WHERE EXTRACT(YEAR FROM transaction_date)=${year}`,

      sql`SELECT EXTRACT(MONTH FROM transaction_date)::int AS month,
                 COALESCE(SUM(amount) FILTER (WHERE type='income'),0) AS income,
                 COALESCE(SUM(amount) FILTER (WHERE type='expense'),0) AS expense
          FROM finance_transactions
          WHERE EXTRACT(YEAR FROM transaction_date)=${year} AND status NOT IN ('cancelled','refunded')
          GROUP BY month ORDER BY month`,

      sql`SELECT c.name AS label, c.type,
                 COALESCE(SUM(t.amount),0) AS amount, COUNT(t.id) AS count
          FROM budget_categories c
          LEFT JOIN finance_transactions t ON t.category_id=c.id
            AND EXTRACT(YEAR FROM t.transaction_date)=${year}
            AND t.status NOT IN ('cancelled','refunded')
          WHERE c.is_active=true
          GROUP BY c.id, c.name, c.type ORDER BY amount DESC LIMIT 12`,

      // ── BUDGET VS ACTUAL ──
      sql`SELECT c.name AS category, c.type,
                 COALESCE(bi.allocated_amount,0) AS budgeted,
                 COALESCE(SUM(t.amount) FILTER (WHERE t.status NOT IN ('cancelled','refunded')),0) AS actual
          FROM budget_categories c
          LEFT JOIN budget_items bi ON bi.category_id=c.id AND bi.fiscal_year=${year} AND bi.fiscal_month IS NULL
          LEFT JOIN finance_transactions t ON t.category_id=c.id AND EXTRACT(YEAR FROM t.transaction_date)=${year}
          WHERE c.is_active=true
          GROUP BY c.id, c.name, c.type, bi.allocated_amount
          ORDER BY c.type, budgeted DESC`,

      // ── EVENTS ──
      sql`SELECT COUNT(*) AS total,
                 COUNT(*) FILTER (WHERE status='completed') AS completed,
                 COUNT(*) FILTER (WHERE status='upcoming') AS upcoming,
                 COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM event_date)=${year}) AS this_year
          FROM events`,

      sql`SELECT category AS label, COUNT(*) AS count
          FROM events WHERE EXTRACT(YEAR FROM event_date)=${year}
          GROUP BY category ORDER BY count DESC`,
    ]);

    return NextResponse.json({
      success: true,
      year,
      members: {
        summary: memberSummary[0],
        byStatus: membersByStatus,
        byType: membersByType,
        byPlan: membersByPlan,
        byMonth: membersByMonth,
        byState: membersByState,
      },
      donations: {
        summary: donationSummary[0],
        byMonth: donationsByMonth,
        byCampaign: donationsByCampaign,
        byMethod: donationsByMethod,
        topDonors,
      },
      finance: {
        summary: txSummary[0],
        byMonth: txByMonth,
        byCategory: txByCategory,
        budgetVsActual,
      },
      events: {
        summary: eventSummary[0],
        byCategory: eventsByCategory,
      },
    });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
