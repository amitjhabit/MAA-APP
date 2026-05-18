// lib/receipts.js — shared auto-generate-and-send receipt logic
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { renderTemplate, fmtAmount, sendEmail } from '@/lib/email';
import { generateReceiptPdf, inlineLocalImages } from '@/lib/pdf';

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

// Clean email body — always has logo, rep name, date; no declaration (that stays in PDF only)
function buildEmailHtml({ logoTag, receiptNumber, recipientName, amount, amountWords, description, paymentMethod, transactionDate, generatedDate, referenceType }) {
  const isMemb = referenceType === 'membership';
  const typeLabel = isMemb ? 'Membership Payment Receipt' : 'Donation Receipt';
  const thankMsg = isMemb
    ? 'Thank you for your membership payment to the Maithil Association of America.'
    : 'Thank you for your generous donation to the Maithil Association of America.';
  const row = (label, value, shade) =>
    `<tr style="${shade ? 'background:#fdf6e3;' : ''}"><td style="padding:10px 14px;color:#555;width:42%;border:1px solid #e0c97f;font-size:14px">${label}</td><td style="padding:10px 14px;color:#0D2137;border:1px solid #e0c97f;font-size:14px">${value}</td></tr>`;

  return `<div style="font-family:Georgia,serif;max-width:620px;margin:0 auto;padding:36px;border:1px solid #e0c97f;border-radius:8px;background:#fff">
  <div style="text-align:center;border-bottom:3px solid #E8720C;padding-bottom:16px;margin-bottom:28px">
    ${logoTag}
    <h1 style="color:#0D2137;font-size:22px;margin:8px 0 0">Maithil Association of America</h1>
    <p style="color:#C9960C;margin:4px 0 0;font-style:italic;font-size:13px">मैथिल एसोसिएशन ऑफ अमेरिका</p>
    <h2 style="color:#E8720C;font-size:14px;margin:10px 0 0;letter-spacing:2px;text-transform:uppercase">${typeLabel}</h2>
  </div>

  <p style="color:#333;font-size:15px;margin:0 0 16px">Dear <strong>${recipientName}</strong>,</p>
  <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px">${thankMsg} Please find your official receipt details below. A signed PDF copy is attached for your records and tax purposes.</p>

  <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
    ${row('Receipt No.', `<strong>${receiptNumber}</strong>`, true)}
    ${row('Date', transactionDate, false)}
    ${row('Amount', `<strong style="color:#E8720C">${amountWords} ($ ${amount})</strong>`, true)}
    ${row('Description', description || '—', false)}
    ${row('Payment Method', paymentMethod || '—', true)}
    ${row('EIN', '99-1915636', false)}
  </table>

  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e0c97f">
    <p style="color:#555;font-size:13px;margin:0 0 4px">Sincerely,</p>
    <p style="color:#0D2137;font-size:15px;font-weight:700;margin:4px 0 0">Sunil Jha</p>
    <p style="color:#555;font-size:13px;margin:2px 0 0">President, Maithil Association of America</p>
    <p style="color:#888;font-size:12px;margin:4px 0 0">${generatedDate}</p>
  </div>

  <div style="margin-top:28px;padding-top:14px;border-top:1px solid #eee;text-align:center;color:#999;font-size:11px">
    <p style="margin:0">MAA is a 501(c)(3) non-profit organization &middot; EIN: 99-1915636</p>
    <p style="margin:4px 0 0">San Ramon, California &middot; Contributemaa@maithilusa.org</p>
  </div>
</div>`;
}

function makeReceiptNumber() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `RCP-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function autoGenerateAndSendReceipt({
  sql,
  recipientName,
  recipientEmail,
  amount,
  description,
  paymentMethod = '',
  transactionDate = '',
  referenceType = 'other',
  referenceId = null,
}) {
  try {
    // 1. Find best template (used for PDF only)
    const templates = await sql`
      SELECT * FROM receipt_templates
      WHERE is_active = TRUE
      ORDER BY is_default DESC, id ASC
      LIMIT 1
    `;
    if (!templates.length) {
      console.warn('autoGenerateAndSendReceipt: no active receipt template found');
      return null;
    }
    const tmpl = templates[0];

    // 2. Build variables
    const receiptNumber = makeReceiptNumber();
    const PST = { timeZone: 'America/Los_Angeles' };
    const fmtDate = d => {
      if (!d) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', ...PST });
      const dt = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)
        ? new Date(d + 'T12:00:00Z')
        : new Date(d);
      return isNaN(dt) ? String(d) : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', ...PST });
    };

    const [president] = await sql`
      SELECT name FROM committee_members
      WHERE LOWER(role) LIKE '%president%' AND is_current = TRUE
      ORDER BY sort_order LIMIT 1
    `;

    const logoTag = getLogoImgTag();
    const txDate = fmtDate(transactionDate);
    const genDate = fmtDate(null);
    const repName = president?.name || 'Sunil Jha';

    const vars = {
      receipt_number:      receiptNumber,
      recipient_name:      recipientName || 'Valued Member',
      recipient_email:     recipientEmail || '',
      amount:              fmtAmount(amount),
      amount_words:        amountToWords(amount),
      description:         description || '',
      payment_method:      paymentMethod || '',
      transaction_date:    txDate,
      generated_date:      genDate,
      status:              'received',
      app_url:             process.env.NEXT_PUBLIC_APP_URL || '',
      representative_name: repName,
      logo_img:            logoTag,
    };

    // 3. Full receipt HTML (for PDF and storage) — inline any /images/... as base64
    const receiptHtml = inlineLocalImages(renderTemplate(tmpl.body_html || '', vars));

    // 4. Clean email body — always has logo, rep name, date; NO declaration
    const emailHtml = buildEmailHtml({
      logoTag,
      receiptNumber,
      recipientName:  vars.recipient_name,
      amount:         vars.amount,
      amountWords:    vars.amount_words,
      description:    vars.description,
      paymentMethod:  vars.payment_method,
      transactionDate: txDate,
      generatedDate:  genDate,
      referenceType,
    });

    // 5. Store receipt
    const [saved] = await sql`
      INSERT INTO receipts (receipt_number, template_id, recipient_name, recipient_email, html_content, amount)
      VALUES (${receiptNumber}, ${tmpl.id}, ${vars.recipient_name}, ${recipientEmail || null}, ${receiptHtml}, ${amount || 0})
      RETURNING *
    `;

    // 6. Generate PDF from full receipt HTML
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateReceiptPdf(receiptHtml);
      await sql`UPDATE receipts SET pdf_base64 = ${pdfBuffer.toString('base64')} WHERE id = ${saved.id}`;
    } catch (pdfErr) {
      console.error('PDF generation failed (email will still send without attachment):', pdfErr.message);
    }

    // 7. Send clean email with PDF attached
    if (recipientEmail) {
      const subject = renderTemplate(tmpl.subject || 'Your MAA Receipt — {{receipt_number}}', vars);
      const attachments = pdfBuffer ? [{
        filename: `${receiptNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }] : [];
      try {
        await sendEmail({ to: recipientEmail, subject, html: emailHtml, attachments });
        await sql`UPDATE receipts SET emailed_at = NOW() WHERE id = ${saved.id}`;
      } catch (mailErr) {
        console.error('Receipt email send failed:', mailErr.message);
      }
    }

    return { receiptId: saved.id, receiptNumber };
  } catch (err) {
    console.error('autoGenerateAndSendReceipt error:', err.message);
    return null;
  }
}
