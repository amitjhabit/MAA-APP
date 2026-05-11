// app/api/finance/transactions/route.js
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
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit    = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    const offset   = (page - 1) * limit;
    const type     = searchParams.get('type')   || 'all';
    const status   = searchParams.get('status') || 'all';
    const year     = searchParams.get('year')   || '';
    const month    = searchParams.get('month')  || '';
    const search   = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const conds = [], params = [];
    if (type !== 'all')   { params.push(type);   conds.push(`t.type = $${params.length}`); }
    if (status !== 'all') { params.push(status);  conds.push(`t.status = $${params.length}`); }
    if (year)  { params.push(year);  conds.push(`EXTRACT(YEAR  FROM t.transaction_date) = $${params.length}`); }
    if (month) { params.push(month); conds.push(`EXTRACT(MONTH FROM t.transaction_date) = $${params.length}`); }
    if (category) { params.push(category); conds.push(`t.category_id = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conds.push(`(t.description ILIKE $${params.length} OR t.payer_name ILIKE $${params.length} OR t.payer_email ILIKE $${params.length})`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const rows = await sql(
      `SELECT t.*, c.name AS category_name, c.type AS category_type
       FROM finance_transactions t LEFT JOIN budget_categories c ON c.id = t.category_id
       ${where} ORDER BY t.transaction_date DESC, t.id DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    const [tot] = await sql(`SELECT COUNT(*) AS c, COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) AS total_income, COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) AS total_expense FROM finance_transactions t ${where}`, params);

    return NextResponse.json({
      success: true, data: rows,
      stats: { total: parseInt(tot.c), total_income: parseFloat(tot.total_income), total_expense: parseFloat(tot.total_expense), net: parseFloat(tot.total_income) - parseFloat(tot.total_expense) },
      pagination: { page, pages: Math.ceil(parseInt(tot.c)/limit), total: parseInt(tot.c) },
    });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const b = await req.json();
    const errors = {};
    if (!b.description?.trim()) errors.description = 'Description is required';
    if (!b.amount || isNaN(parseFloat(b.amount)) || parseFloat(b.amount) <= 0) errors.amount = 'Valid amount required';
    if (!['income','expense'].includes(b.type)) errors.type = 'Type must be income or expense';
    if (Object.keys(errors).length) return NextResponse.json({ success: false, errors }, { status: 400 });

    const [tx] = await sql`
      INSERT INTO finance_transactions (type,category_id,reference_type,reference_id,amount,description,payer_name,payer_email,payment_method,transaction_date,status,notes)
      VALUES (${b.type},${b.category_id||null},${b.reference_type||null},${b.reference_id||null},${parseFloat(b.amount)},${b.description.trim()},${b.payer_name||null},${b.payer_email||null},${b.payment_method||null},${b.transaction_date||new Date().toISOString().split('T')[0]},${b.status||'completed'},${b.notes||null})
      RETURNING *`;
    return NextResponse.json({ success: true, data: tx });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
