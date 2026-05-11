// app/api/finance/receipts/send/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendEmail } from '@/lib/email';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const { receipt_ids } = await req.json();

    if (!Array.isArray(receipt_ids) || receipt_ids.length === 0)
      return NextResponse.json({ success: false, message: 'receipt_ids array required' }, { status: 400 });

    const rows = await sql(
      `SELECT r.*, tmpl.subject FROM receipts r
       JOIN receipt_templates tmpl ON tmpl.id = r.template_id
       WHERE r.id = ANY($1::int[])`,
      [receipt_ids]
    );

    const results = [];
    for (const r of rows) {
      if (!r.recipient_email) {
        results.push({ id: r.id, success: false, error: 'No email address' });
        continue;
      }
      try {
        await sendEmail({ to: r.recipient_email, subject: r.subject, html: r.html_content });
        await sql`UPDATE receipts SET emailed_at = NOW() WHERE id = ${r.id}`;
        results.push({ id: r.id, success: true, to: r.recipient_email });
      } catch (err) {
        results.push({ id: r.id, success: false, error: err.message });
      }
    }

    const sent = results.filter(r => r.success).length;
    return NextResponse.json({ success: true, results, sent, failed: results.length - sent });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
