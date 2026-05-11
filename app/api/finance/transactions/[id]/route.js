// app/api/finance/transactions/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function PATCH(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const b = await req.json();
    const [ex] = await sql`SELECT * FROM finance_transactions WHERE id=${params.id}`;
    if (!ex) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const [tx] = await sql`
      UPDATE finance_transactions SET
        type             = ${b.type             ?? ex.type},
        category_id      = ${b.category_id      !== undefined ? (b.category_id||null) : ex.category_id},
        reference_type   = ${b.reference_type   ?? ex.reference_type},
        reference_id     = ${b.reference_id     !== undefined ? (b.reference_id||null) : ex.reference_id},
        amount           = ${b.amount           !== undefined ? parseFloat(b.amount) : ex.amount},
        description      = ${b.description      ?? ex.description},
        payer_name       = ${b.payer_name       ?? ex.payer_name},
        payer_email      = ${b.payer_email      ?? ex.payer_email},
        payment_method   = ${b.payment_method   ?? ex.payment_method},
        transaction_date = ${b.transaction_date ?? ex.transaction_date},
        status           = ${b.status           ?? ex.status},
        notes            = ${b.notes            ?? ex.notes}
      WHERE id=${params.id} RETURNING *`;
    return NextResponse.json({ success: true, data: tx });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const [d] = await sql`DELETE FROM finance_transactions WHERE id=${params.id} RETURNING id, description`;
    if (!d) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `"${d.description}" deleted` });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
