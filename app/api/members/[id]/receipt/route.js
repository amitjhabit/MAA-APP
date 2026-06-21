// app/api/members/[id]/receipt/route.js — Send membership receipt email
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { autoGenerateAndSendReceipt, resendExistingReceipt } from '@/lib/receipts';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function POST(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const [member] = await sql`SELECT * FROM members WHERE id = ${params.id}`;
    if (!member) return NextResponse.json({ success: false, message: 'Member not found' }, { status: 404 });
    if (!member.email) return NextResponse.json({ success: false, message: 'No email address on file for this member' }, { status: 400 });
    if (!member.amount_paid || parseFloat(member.amount_paid) <= 0)
      return NextResponse.json({ success: false, message: 'No payment amount recorded for this member' }, { status: 400 });

    const typeLabel = { individual: 'Individual', student: 'Student', honorary: 'Honorary', corporate: 'Corporate' }[member.membership_type] || 'Individual';
    const planLabel = member.membership_plan === 'lifetime' ? 'Lifetime' : 'Annual';
    const description = `${typeLabel} ${planLabel} Membership — Maithil Association of America`;

    // Check for an existing membership receipt for this member
    const [existing] = await sql`
      SELECT r.*, rt.signature_base64, rt.subject AS tmpl_subject
      FROM receipts r
      LEFT JOIN receipt_templates rt ON rt.id = r.template_id
      WHERE r.reference_type = 'membership' AND r.reference_id = ${params.id}
      ORDER BY r.created_at DESC LIMIT 1
    `;

    let receiptNumber;
    if (existing) {
      await resendExistingReceipt({ sql, receipt: existing, recipientEmail: member.email });
      receiptNumber = existing.receipt_number;
    } else {
      const result = await autoGenerateAndSendReceipt({
        sql,
        recipientName:   `${member.first_name} ${member.last_name}`,
        recipientEmail:  member.email,
        amount:          member.amount_paid,
        description,
        paymentMethod:   member.payment_method || '',
        transactionDate: member.joined_date || member.created_at,
        referenceType:   'membership',
        referenceId:     member.id,
      });
      if (!result) return NextResponse.json({ success: false, message: 'Receipt generation failed — check SMTP config' }, { status: 500 });
      receiptNumber = result.receiptNumber;
    }

    return NextResponse.json({ success: true, message: `Receipt ${receiptNumber} sent to ${member.email}`, receipt_number: receiptNumber });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
