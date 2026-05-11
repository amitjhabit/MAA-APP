// app/api/finance/pl/route.js
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

    const monthFilter = month
      ? `AND EXTRACT(MONTH FROM transaction_date) = ${parseInt(month)}`
      : '';

    const rows = await sql(
      `SELECT
         c.id AS category_id,
         c.name AS category_name,
         c.type AS category_type,
         COALESCE(SUM(CASE WHEN t.status NOT IN ('cancelled','refunded') THEN t.amount ELSE 0 END), 0) AS actual,
         COALESCE(bi.allocated_amount, 0) AS budgeted
       FROM budget_categories c
       LEFT JOIN finance_transactions t
         ON t.category_id = c.id
         AND EXTRACT(YEAR FROM t.transaction_date) = $1
         ${monthFilter}
       LEFT JOIN budget_items bi
         ON bi.category_id = c.id
         AND bi.fiscal_year = $1
         AND ${month ? `bi.fiscal_month = ${parseInt(month)}` : 'bi.fiscal_month IS NULL'}
       WHERE c.is_active = true
       GROUP BY c.id, c.name, c.type, bi.allocated_amount
       ORDER BY c.type, c.sort_order, c.name`,
      [year]
    );

    const income   = rows.filter(r => r.category_type === 'income');
    const expense  = rows.filter(r => r.category_type === 'expense');
    const totalIncome  = income.reduce((s, r) => s + parseFloat(r.actual), 0);
    const totalExpense = expense.reduce((s, r) => s + parseFloat(r.actual), 0);
    const budgetedIncome  = income.reduce((s, r) => s + parseFloat(r.budgeted), 0);
    const budgetedExpense = expense.reduce((s, r) => s + parseFloat(r.budgeted), 0);

    return NextResponse.json({
      success: true,
      year,
      month,
      income,
      expense,
      summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        net: totalIncome - totalExpense,
        budgeted_income: budgetedIncome,
        budgeted_expense: budgetedExpense,
        budgeted_net: budgetedIncome - budgetedExpense,
      },
    });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
