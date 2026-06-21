// app/api/finance/receipts/route.js
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
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    const donationId = searchParams.get('donation_id');
    const conds = [], params = [];
    if (search) { params.push(`%${search}%`); conds.push(`(r.recipient_name ILIKE $${params.length} OR r.recipient_email ILIKE $${params.length} OR r.receipt_number ILIKE $${params.length})`); }
    if (donationId) { params.push(parseInt(donationId)); conds.push(`r.donation_id = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const rows = await sql(
      `SELECT r.*, t.description AS transaction_description,
              COALESCE(t.amount, r.amount, 0) AS transaction_amount,
              t.transaction_date, tmpl.name AS template_name
       FROM receipts r
       LEFT JOIN finance_transactions t ON t.id = r.transaction_id
       LEFT JOIN receipt_templates tmpl ON tmpl.id = r.template_id
       ${where}
       ORDER BY r.generated_at DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    const [tot] = await sql(`SELECT COUNT(*) AS c FROM receipts r ${where}`, params);

    return NextResponse.json({
      success: true, data: rows,
      pagination: { page, pages: Math.ceil(parseInt(tot.c)/limit), total: parseInt(tot.c) },
    });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function DELETE(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
    const [deleted] = await sql`DELETE FROM receipts WHERE id = ${id} RETURNING id, receipt_number, donation_id`;
    if (!deleted) return NextResponse.json({ success: false, message: 'Receipt not found' }, { status: 404 });
    // Reset receipt_sent on the linked donation so it no longer shows a receipt
    if (deleted.donation_id) {
      await sql`UPDATE donations SET receipt_sent = FALSE WHERE id = ${deleted.donation_id}`;
    }
    return NextResponse.json({ success: true, message: `Receipt ${deleted.receipt_number} deleted` });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
