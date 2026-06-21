// app/api/finance/receipts/send/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { buildEmailHtml, amountToWordsExport } from '@/lib/receipts';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

const PST = { timeZone: 'America/Los_Angeles' };
function fmtDate(d) {
  if (!d) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', ...PST });
  const dt = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00Z') : new Date(d);
  return isNaN(dt) ? String(d) : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', ...PST });
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const { receipt_ids } = await req.json();

    if (!Array.isArray(receipt_ids) || receipt_ids.length === 0)
      return NextResponse.json({ success: false, message: 'receipt_ids array required' }, { status: 400 });

    const rows = await sql(
      `SELECT r.*, tmpl.subject,
              t.description AS tx_description,
              t.payment_method AS tx_payment_method,
              t.transaction_date AS tx_date
       FROM receipts r
       JOIN receipt_templates tmpl ON tmpl.id = r.template_id
       LEFT JOIN finance_transactions t ON t.id = r.transaction_id
       WHERE r.id = ANY($1::int[])`,
      [receipt_ids]
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const results = [];
    for (const r of rows) {
      if (!r.recipient_email) {
        results.push({ id: r.id, success: false, error: 'No email address' });
        continue;
      }
      try {
        // Build a clean email body (no embedded base64 images) so email clients can render it
        const { html: emailHtml, text: emailText } = buildEmailHtml({
          appUrl,
          receiptNumber:   r.receipt_number,
          recipientName:   r.recipient_name,
          amount:          parseFloat(r.amount || 0).toFixed(2),
          amountWords:     amountToWordsExport(r.amount),
          description:     r.tx_description || '',
          paymentMethod:   r.tx_payment_method || '',
          transactionDate: fmtDate(r.tx_date || r.generated_at),
          generatedDate:   fmtDate(null),
          referenceType:   r.reference_type || 'other',
        });

        const attachments = r.pdf_base64 ? [{
          filename: `${r.receipt_number}.pdf`,
          content: Buffer.from(r.pdf_base64, 'base64'),
          contentType: 'application/pdf',
        }] : [];

        await sendEmail({ to: r.recipient_email, subject: r.subject, html: emailHtml, text: emailText, attachments });
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
