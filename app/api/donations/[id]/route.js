// app/api/donations/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { autoGenerateAndSendReceipt, resendExistingReceipt } from '@/lib/receipts';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function PATCH(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb(), b = await req.json();
    const [ex] = await sql`SELECT * FROM donations WHERE id = ${params.id}`;
    if (!ex) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    // Resend receipt — reuse existing receipt number if one exists for this donation
    if (b.action === 'resend_receipt') {
      if (!ex.donor_email) return NextResponse.json({ success: false, message: 'No email address on this donation' }, { status: 400 });

      const [existing] = await sql`
        SELECT r.*, rt.signature_base64, rt.subject AS tmpl_subject
        FROM receipts r
        LEFT JOIN receipt_templates rt ON rt.id = r.template_id
        WHERE r.donation_id = ${params.id}
        ORDER BY r.created_at DESC LIMIT 1
      `;

      let receiptNumber;
      if (existing) {
        // Reuse the same receipt — just resend the email
        await resendExistingReceipt({ sql, receipt: existing, recipientEmail: ex.donor_email });
        receiptNumber = existing.receipt_number;
      } else {
        // First time — create a new receipt
        const result = await autoGenerateAndSendReceipt({
          sql,
          recipientName:   ex.donor_name,
          recipientEmail:  ex.donor_email,
          amount:          ex.amount,
          description:     ex.campaign ? `Donation — ${ex.campaign}` : 'Donation to Maithil Association of America',
          paymentMethod:   ex.payment_method || '',
          transactionDate: ex.donated_at,
          referenceType:   'donation',
          referenceId:     ex.id,
        });
        if (!result) return NextResponse.json({ success: false, message: 'Receipt generation failed — check SMTP config' }, { status: 500 });
        receiptNumber = result.receiptNumber;
      }

      await sql`UPDATE donations SET receipt_sent = TRUE WHERE id = ${params.id}`;
      return NextResponse.json({ success: true, message: `Receipt ${receiptNumber} sent to ${ex.donor_email}`, receipt_number: receiptNumber });
    }

    const [d] = await sql`UPDATE donations SET donor_name=${b.donor_name??ex.donor_name},donor_email=${b.donor_email??ex.donor_email},donor_phone=${b.donor_phone??ex.donor_phone},amount=${b.amount?parseFloat(b.amount):ex.amount},payment_method=${b.payment_method??ex.payment_method},campaign=${b.campaign??ex.campaign},purpose=${b.purpose??ex.purpose},status=${b.status??ex.status},transaction_id=${b.transaction_id??ex.transaction_id},receipt_sent=${b.receipt_sent!==undefined?b.receipt_sent:ex.receipt_sent},notes=${b.notes??ex.notes} WHERE id=${params.id} RETURNING *`;
    return NextResponse.json({ success: true, data: d });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    // Delete linked receipts first so Finance → Receipts stays in sync
    await sql`DELETE FROM receipts WHERE donation_id = ${params.id}`;
    const [d] = await sql`DELETE FROM donations WHERE id = ${params.id} RETURNING id, donor_name`;
    if (!d) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Donation from ${d.donor_name} deleted` });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
