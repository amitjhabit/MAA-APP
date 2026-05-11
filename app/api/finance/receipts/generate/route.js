// app/api/finance/receipts/generate/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
import { renderTemplate, fmtAmount } from '@/lib/email';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

function receiptNumber() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `RCP-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { transaction_ids, template_id } = await req.json();

    if (!Array.isArray(transaction_ids) || transaction_ids.length === 0)
      return NextResponse.json({ success: false, message: 'transaction_ids array required' }, { status: 400 });
    if (!template_id)
      return NextResponse.json({ success: false, message: 'template_id required' }, { status: 400 });

    const [tmpl] = await sql`SELECT * FROM receipt_templates WHERE id = ${template_id}`;
    if (!tmpl) return NextResponse.json({ success: false, message: 'Template not found' }, { status: 404 });

    const txRows = await sql(
      `SELECT t.*, c.name AS category_name
       FROM finance_transactions t
       LEFT JOIN budget_categories c ON c.id = t.category_id
       WHERE t.id = ANY($1::int[])`,
      [transaction_ids]
    );

    const generated = [];
    for (const tx of txRows) {
      const existing = await sql`SELECT id FROM receipts WHERE transaction_id = ${tx.id}`;
      const rnum = existing[0]?.receipt_number || receiptNumber();

      const vars = {
        receipt_number:   rnum,
        recipient_name:   tx.payer_name || 'Member',
        recipient_email:  tx.payer_email || '',
        amount:           fmtAmount(tx.amount),
        description:      tx.description,
        category:         tx.category_name || '',
        payment_method:   tx.payment_method || '',
        transaction_date: tx.transaction_date
          ? new Date(tx.transaction_date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
          : '',
        generated_date:   new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }),
        status:           tx.status,
      };

      const htmlContent = renderTemplate(tmpl.body_html, vars);

      if (existing[0]) {
        await sql`UPDATE receipts SET html_content=${htmlContent}, template_id=${template_id}, generated_at=NOW() WHERE transaction_id=${tx.id}`;
        generated.push({ ...existing[0], transaction_id: tx.id, receipt_number: rnum, recipient_name: vars.recipient_name, recipient_email: vars.recipient_email });
      } else {
        const [r] = await sql`
          INSERT INTO receipts (transaction_id, template_id, receipt_number, recipient_name, recipient_email, html_content)
          VALUES (${tx.id}, ${template_id}, ${rnum}, ${vars.recipient_name}, ${vars.recipient_email}, ${htmlContent})
          RETURNING *`;
        generated.push(r);
      }
    }

    return NextResponse.json({ success: true, generated, count: generated.length });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
