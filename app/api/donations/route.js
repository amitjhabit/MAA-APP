// app/api/donations/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
import { autoGenerateAndSendReceipt } from '@/lib/receipts';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const method = searchParams.get('method') || 'all';
    const page   = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit  = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    const conds = [], params = [];
    if (search) { params.push(`%${search}%`); conds.push(`(donor_name ILIKE $${params.length} OR donor_email ILIKE $${params.length} OR campaign ILIKE $${params.length})`); }
    if (status !== 'all') { params.push(status); conds.push(`status = $${params.length}`); }
    if (method !== 'all') { params.push(method); conds.push(`payment_method = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const donations = await sql(`SELECT * FROM donations ${where} ORDER BY donated_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, limit, offset]);
    const [tot]     = await sql(`SELECT COUNT(*) AS total, COALESCE(SUM(amount),0) AS total_amount FROM donations ${where}`, params);
    const statsRows = await sql`SELECT status, COUNT(*) AS c, COALESCE(SUM(amount),0) AS amt FROM donations GROUP BY status`;
    const stats = { total: 0, total_amount: 0, received: 0, received_amount: 0, pending: 0 };
    statsRows.forEach(({ status: s, c, amt }) => { stats.total += parseInt(c); stats.total_amount += parseFloat(amt); stats[s] = parseInt(c); stats[`${s}_amount`] = parseFloat(amt); });

    return NextResponse.json({ success: true, data: donations, stats, pagination: { page, limit, total: parseInt(tot.total), pages: Math.ceil(tot.total / limit), total_amount: parseFloat(tot.total_amount) } });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function POST(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb(), b = await request.json();
    if (!b.donor_name?.trim()) return NextResponse.json({ success: false, errors: { donor_name: 'Required' } }, { status: 400 });
    if (!b.amount || parseFloat(b.amount) <= 0) return NextResponse.json({ success: false, errors: { amount: 'Valid amount required' } }, { status: 400 });
    const [d] = await sql`INSERT INTO donations (donor_name,donor_email,donor_phone,amount,currency,payment_method,campaign,purpose,status,transaction_id,receipt_sent,notes,donated_at) VALUES (${b.donor_name.trim()},${b.donor_email||null},${b.donor_phone||null},${parseFloat(b.amount)},${b.currency||'USD'},${b.payment_method||null},${b.campaign||null},${b.purpose||null},${b.status||'received'},${b.transaction_id||null},${b.receipt_sent||false},${b.notes||null},${b.donated_at||new Date().toISOString()}) RETURNING *`;

    // Auto-generate and email receipt if donor has an email address
    let receiptNumber = null;
    if (d.donor_email) {
      const result = await autoGenerateAndSendReceipt({
        sql,
        recipientName:   d.donor_name,
        recipientEmail:  d.donor_email,
        amount:          d.amount,
        description:     d.campaign ? `Donation — ${d.campaign}` : 'Donation to Maithil Association of America',
        paymentMethod:   d.payment_method || '',
        transactionDate: d.donated_at,
        referenceType:   'donation',
        referenceId:     d.id,
      });
      if (result) {
        receiptNumber = result.receiptNumber;
        await sql`UPDATE donations SET receipt_sent = TRUE WHERE id = ${d.id}`;
        d.receipt_sent = true;
      }
    }

    return NextResponse.json({ success: true, data: d, receipt_number: receiptNumber }, { status: 201 });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
