// app/api/finance/receipts/generate/route.js
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
import { renderTemplate, fmtAmount } from '@/lib/email';
import { generateReceiptPdf } from '@/lib/pdf';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

function receiptNumber() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `RCP-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}

function amountToWords(amount) {
  const num = parseFloat(amount || 0);
  const dollars = Math.floor(num);
  const cents = Math.round((num - dollars) * 100);
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function below1000(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? '-'+ones[n%10] : '');
    return ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+below1000(n%100) : '');
  }
  function toWords(n) {
    if (n === 0) return 'Zero';
    let r = '';
    if (n >= 1000000) { r += below1000(Math.floor(n/1000000))+' Million '; n %= 1000000; }
    if (n >= 1000) { r += below1000(Math.floor(n/1000))+' Thousand '; n %= 1000; }
    if (n > 0) r += below1000(n);
    return r.trim();
  }
  return `${toWords(dollars)} and ${String(cents).padStart(2,'0')}/100`;
}

function getLogoImgTag() {
  try {
    const p = join(process.cwd(), 'public', 'images', 'gallery', 'Mithila_logo.jpeg');
    if (existsSync(p)) {
      const b64 = readFileSync(p).toString('base64');
      return `<img src="data:image/jpeg;base64,${b64}" alt="MAA Logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;border:3px solid #E8720C;">`;
    }
  } catch {}
  return '';
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
    if (!tmpl.body_html) return NextResponse.json({ success: false, message: 'Template has no body. Please edit the template and add HTML content.' }, { status: 400 });

    const [president] = await sql`
      SELECT name FROM committee_members
      WHERE LOWER(role) LIKE '%president%' AND is_current = TRUE
      ORDER BY sort_order LIMIT 1
    `;
    const representativeName = president?.name || 'Sunil Jha';
    const logoImg = getLogoImgTag();

    const txRows = await sql(
      `SELECT t.*, c.name AS category_name
       FROM finance_transactions t
       LEFT JOIN budget_categories c ON c.id = t.category_id
       WHERE t.id = ANY($1::int[])`,
      [transaction_ids]
    );

    const generated = [];
    for (const tx of txRows) {
      const [existing] = await sql`SELECT * FROM receipts WHERE transaction_id = ${tx.id}`;

      const rnum = existing?.receipt_number || receiptNumber();

      const txDate = tx.transaction_date
        ? new Date(tx.transaction_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

      const vars = {
        receipt_number:      rnum,
        recipient_name:      tx.payer_name  || 'Member',
        recipient_email:     tx.payer_email || '',
        amount:              fmtAmount(tx.amount),
        amount_words:        amountToWords(tx.amount),
        description:         tx.description || '',
        category:            tx.category_name || '',
        payment_method:      tx.payment_method || '',
        transaction_date:    txDate,
        generated_date:      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        status:              tx.status || '',
        app_url:             process.env.NEXT_PUBLIC_APP_URL || '',
        representative_name: representativeName,
        logo_img:            logoImg,
      };

      const htmlContent = renderTemplate(tmpl.body_html, vars);

      let saved;
      if (existing) {
        const [updated] = await sql`
          UPDATE receipts SET
            html_content    = ${htmlContent},
            template_id     = ${template_id},
            recipient_name  = ${vars.recipient_name},
            recipient_email = ${vars.recipient_email},
            generated_at    = NOW(),
            pdf_base64      = NULL
          WHERE id = ${existing.id} RETURNING *`;
        saved = updated;
      } else {
        const [inserted] = await sql`
          INSERT INTO receipts (transaction_id, template_id, receipt_number, recipient_name, recipient_email, html_content)
          VALUES (${tx.id}, ${template_id}, ${rnum}, ${vars.recipient_name}, ${vars.recipient_email}, ${htmlContent})
          RETURNING *`;
        saved = inserted;
      }

      // Generate PDF and store as base64
      try {
        const pdfBuffer = await generateReceiptPdf(htmlContent);
        const [withPdf] = await sql`UPDATE receipts SET pdf_base64 = ${pdfBuffer.toString('base64')} WHERE id = ${saved.id} RETURNING *`;
        saved = withPdf;
      } catch (pdfErr) {
        console.error(`PDF generation failed for receipt ${saved.receipt_number}:`, pdfErr.message);
      }

      generated.push(saved);
    }

    return NextResponse.json({ success: true, generated, count: generated.length });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
