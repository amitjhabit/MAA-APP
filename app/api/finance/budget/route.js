// app/api/finance/budget/route.js
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
    const year  = parseInt(searchParams.get('year')  || String(new Date().getFullYear()));
    const month = searchParams.get('month') || null;

    const budgetRows = await sql(
      `SELECT bi.*, c.name AS category_name, c.type AS category_type
       FROM budget_items bi JOIN budget_categories c ON c.id = bi.category_id
       WHERE bi.fiscal_year = $1 ${month ? 'AND bi.fiscal_month = $2' : 'AND bi.fiscal_month IS NULL'}
       ORDER BY c.type, c.sort_order`,
      month ? [year, parseInt(month)] : [year]
    );

    const actuals = await sql(
      `SELECT category_id, type, COALESCE(SUM(amount),0) AS actual
       FROM finance_transactions
       WHERE status NOT IN ('cancelled','refunded')
         AND EXTRACT(YEAR FROM transaction_date) = $1
         ${month ? 'AND EXTRACT(MONTH FROM transaction_date) = $2' : ''}
       GROUP BY category_id, type`,
      month ? [year, parseInt(month)] : [year]
    );
    const actualMap = {};
    actuals.forEach(r => { actualMap[r.category_id] = parseFloat(r.actual); });

    const data = budgetRows.map(b => ({
      ...b,
      actual: actualMap[b.category_id] || 0,
      variance: (actualMap[b.category_id] || 0) - parseFloat(b.allocated_amount),
    }));

    return NextResponse.json({ success: true, data, year, month });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const b = await req.json();
    if (!b.category_id || !b.fiscal_year) return NextResponse.json({ success: false, message: 'category_id and fiscal_year required' }, { status: 400 });
    const [item] = await sql`
      INSERT INTO budget_items (category_id, fiscal_year, fiscal_month, allocated_amount, notes)
      VALUES (${b.category_id}, ${b.fiscal_year}, ${b.fiscal_month||null}, ${parseFloat(b.allocated_amount)||0}, ${b.notes||null})
      ON CONFLICT (category_id, fiscal_year, fiscal_month)
      DO UPDATE SET allocated_amount=${parseFloat(b.allocated_amount)||0}, notes=${b.notes||null}
      RETURNING *`;
    return NextResponse.json({ success: true, data: item });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
