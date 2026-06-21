// lib/receipts.js — shared auto-generate-and-send receipt logic
import { renderTemplate, fmtAmount, sendEmail } from '@/lib/email';
import { generateReceiptPdf, inlineLocalImages } from '@/lib/pdf';
import { uploadReceiptToDrive } from '@/lib/drive';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load logo once as a buffer for inline CID attachment — works in all email clients
function readLogoBuffer() {
  try {
    return readFileSync(join(process.cwd(), 'public', 'images', 'gallery', 'Mithila_logo.jpeg'));
  } catch {
    return null;
  }
}

// Replace the empty signature placeholder div with one containing the actual signature image.
// Matches any div with border-bottom in its style that is immediately followed by the
// "Representative's Signature" label — covers all template versions (old flex, new plain).
export function injectSignature(html, signatureBase64) {
  if (!signatureBase64 || !html) return html;
  const sigImg = `<img src="${signatureBase64}" alt="Authorized Signature" style="height:90px;max-width:280px;display:block;mix-blend-mode:multiply;">`;
  const sigDiv = `<div style="border-bottom:2px solid #333;min-height:110px;padding:10px 0 6px;background:#fff">${sigImg}</div>`;
  return html.replace(
    /<div[^>]*border-bottom[^>]*>(?:<img[^>]*>)?<\/div>(\s*<p[^>]*>Representative's Signature<\/p>)/,
    `${sigDiv}$1`
  );
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

export function amountToWordsExport(amount) {
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

// Build clean email body — logo embedded via CID inline attachment (works in all email clients)
export function buildEmailHtml({ receiptNumber, recipientName, amount, amountWords,
  description, detail, paymentMethod, transactionDate, generatedDate, referenceType, logoCid }) {
  const isMemb = referenceType === 'membership';
  const typeLabel = isMemb ? 'Membership Payment Receipt' : 'Donation Receipt';
  const thankMsg = isMemb
    ? 'Thank you for your membership payment to the Maithil Association of America.'
    : 'Thank you for your generous donation to the Maithil Association of America.';
  const logoTag = logoCid
    ? `<img src="cid:${logoCid}" alt="MAA Logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;border:3px solid #E8720C;">`
    : '';
  const row = (label, value, shade) =>
    `<tr${shade ? ' style="background:#fdf6e3"' : ''}><td style="padding:10px 14px;color:#555;width:42%;border:1px solid #e0c97f;font-size:14px">${label}</td><td style="padding:10px 14px;color:#0D2137;border:1px solid #e0c97f;font-size:14px">${value}</td></tr>`;

  const html = [
    '<div style="font-family:Georgia,serif;max-width:620px;margin:0 auto;padding:36px;border:1px solid #e0c97f;border-radius:8px;background:#fff">',
    '<div style="text-align:center;border-bottom:3px solid #E8720C;padding-bottom:16px;margin-bottom:28px">',
    logoTag,
    '<h1 style="color:#0D2137;font-size:22px;margin:8px 0 0">Maithil Association of America</h1>',
    '<p style="color:#C9960C;margin:4px 0 0;font-style:italic;font-size:13px">मैथिल एसोसिएशन ऑफ अमेरिका</p>',
    `<h2 style="color:#E8720C;font-size:14px;margin:10px 0 0;letter-spacing:2px;text-transform:uppercase">${typeLabel}</h2>`,
    '</div>',
    `<p style="color:#333;font-size:15px;margin:0 0 16px">Dear <strong>${recipientName}</strong>,</p>`,
    `<p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px">${thankMsg} Your official receipt is attached as a PDF for your records and tax purposes.</p>`,
    '<table style="width:100%;border-collapse:collapse;margin-bottom:28px">',
    row('Receipt No.', `<strong>${receiptNumber}</strong>`, true),
    row('Date', transactionDate, false),
    row('Amount', `<strong style="color:#E8720C">${amountWords} ($ ${amount})</strong>`, true),
    row('Description', description || '&mdash;', false),
    ...(detail ? [row('Event / Sponsorship Detail', detail, true)] : []),
    row('Payment Method', paymentMethod || '&mdash;', detail ? false : true),
    row('EIN', '99-1915636', detail ? true : false),
    '</table>',
    '<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e0c97f">',
    '<p style="color:#555;font-size:13px;margin:0 0 4px">Sincerely,</p>',
    '<p style="color:#0D2137;font-size:15px;font-weight:700;margin:4px 0 0">Sunil Jha</p>',
    '<p style="color:#555;font-size:13px;margin:2px 0 0">President, Maithil Association of America</p>',
    `<p style="color:#888;font-size:12px;margin:4px 0 0">${generatedDate}</p>`,
    '</div>',
    '<div style="margin-top:28px;padding-top:14px;border-top:1px solid #eee;text-align:center;color:#999;font-size:11px">',
    '<p style="margin:0">MAA is a 501(c)(3) non-profit organization &middot; EIN: 99-1915636</p>',
    '<p style="margin:4px 0 0">San Ramon, California &middot; info@maithilusa.org</p>',
    '</div>',
    '</div>',
  ].join('\n');

  const text = [
    'Maithil Association of America',
    typeLabel.toUpperCase(),
    '',
    `Dear ${recipientName},`,
    '',
    thankMsg,
    'Your official receipt is attached as a PDF for your records and tax purposes.',
    '',
    `Receipt No.: ${receiptNumber}`,
    `Date: ${transactionDate}`,
    `Amount: ${amountWords} ($ ${amount})`,
    `Description: ${description || '—'}`,
    ...(detail ? [`Event / Sponsorship Detail: ${detail}`] : []),
    `Payment Method: ${paymentMethod || '—'}`,
    'EIN: 99-1915636',
    '',
    'Sincerely,',
    'Sunil Jha',
    'President, Maithil Association of America',
    generatedDate,
    '',
    'MAA is a 501(c)(3) non-profit organization | EIN: 99-1915636',
    'San Ramon, California | info@maithilusa.org',
  ].join('\n');

  return { html, text };
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
  detail = '',
  paymentMethod = '',
  transactionDate = '',
  referenceType = 'other',
  referenceId = null,
}) {
  try {
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

    const receiptNumber = makeReceiptNumber();
    const PST = { timeZone: 'America/Los_Angeles' };
    const fmtDate = d => {
      if (!d) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', ...PST });
      // Always extract the YYYY-MM-DD portion and parse at UTC noon to prevent UTC→PST day-shift
      const s = (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10);
      const dt = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00Z') : new Date(d);
      return isNaN(dt) ? String(d) : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', ...PST });
    };

    const [president] = await sql`
      SELECT name FROM committee_members
      WHERE LOWER(role) LIKE '%president%' AND is_current = TRUE
      ORDER BY sort_order LIMIT 1
    `;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const txDate = fmtDate(transactionDate);
    const genDate = fmtDate(null);

    // Embed logo as base64 data URI directly so html_content is self-contained
    // — preview iframe, PDF, and email CID all work without external URL dependency
    const logoCid = 'maa-logo@maa';
    const logoBuffer = readLogoBuffer();
    const logoDataUrl = logoBuffer ? `data:image/jpeg;base64,${logoBuffer.toString('base64')}` : '';
    const logoImgTag = logoDataUrl
      ? `<img src="${logoDataUrl}" alt="MAA Logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;border:3px solid #E8720C;">`
      : '';

    const vars = {
      receipt_number:      receiptNumber,
      recipient_name:      recipientName || 'Valued Member',
      recipient_email:     recipientEmail || '',
      amount:              fmtAmount(amount),
      amount_words:        amountToWords(amount),
      description:         description || '',
      purpose:             detail || '',
      payment_method:      paymentMethod || '',
      transaction_date:    txDate,
      generated_date:      genDate,
      status:              'received',
      app_url:             appUrl,
      representative_name: president?.name || 'Sunil Jha',
      logo_img:            logoImgTag,
    };

    // Full receipt HTML — stored in DB and used for PDF (logo already base64, no inlineLocalImages needed for it)
    const receiptHtml = inlineLocalImages(renderTemplate(tmpl.body_html || '', vars));

    // Clean email body — built in code, always reliable
    const { html: emailHtml, text: emailText } = buildEmailHtml({
      receiptNumber,
      recipientName:   vars.recipient_name,
      amount:          vars.amount,
      amountWords:     vars.amount_words,
      description:     vars.description,
      detail:          vars.purpose,
      paymentMethod:   vars.payment_method,
      transactionDate: txDate,
      generatedDate:   genDate,
      referenceType,
      logoCid:         logoBuffer ? logoCid : null,
    });

    // Store receipt row
    const donationId = referenceType === 'donation' ? (referenceId || null) : null;
    const [saved] = await sql`
      INSERT INTO receipts (receipt_number, template_id, recipient_name, recipient_email, html_content, amount, donation_id, reference_type, reference_id)
      VALUES (${receiptNumber}, ${tmpl.id}, ${vars.recipient_name}, ${recipientEmail || null}, ${receiptHtml}, ${amount || 0}, ${donationId}, ${referenceType || null}, ${referenceId || null})
      RETURNING *
    `;

    // ── Send email FIRST (before PDF) so it always arrives even if PDF times out ──
    if (recipientEmail) {
      const subject = renderTemplate(tmpl.subject || 'Receipt {{receipt_number}} — Maithil Association of America', vars);
      try {
        // Try PDF — but only wait up to available time; email sends regardless
        let pdfBuffer = null;
        try {
          const htmlForPdf = injectSignature(receiptHtml, tmpl.signature_base64);
          pdfBuffer = await generateReceiptPdf(htmlForPdf);
          await sql`UPDATE receipts SET pdf_base64 = ${pdfBuffer.toString('base64')} WHERE id = ${saved.id}`;
          try { await uploadReceiptToDrive(sql, saved.id, pdfBuffer, receiptNumber); }
          catch (driveErr) { console.error('Drive upload failed (non-fatal):', driveErr.message); }
        } catch (pdfErr) {
          console.error('PDF generation failed, sending email without attachment:', pdfErr.message);
        }
        const attachments = [];
        if (logoBuffer) attachments.push({ filename: 'logo.jpeg', content: logoBuffer, contentType: 'image/jpeg', cid: logoCid });
        if (pdfBuffer)  attachments.push({ filename: `${receiptNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' });
        await sendEmail({ to: recipientEmail, subject, html: emailHtml, text: emailText, attachments });
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

// Resend an existing receipt — same receipt number, same PDF, only emailed_at updated
export async function resendExistingReceipt({ sql, receipt, recipientEmail, description, detail, paymentMethod }) {
  try {
    const subject = `Your MAA Receipt — ${receipt.receipt_number}`;

    const PST = { timeZone: 'America/Los_Angeles' };
    const fmtDate = d => {
      if (!d) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', ...PST });
      const dt = new Date(d);
      return isNaN(dt) ? String(d) : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', ...PST });
    };

    const logoCid = 'maa-logo@maa';
    const logoBuffer = readLogoBuffer();

    const { html: emailHtml, text: emailText } = buildEmailHtml({
      receiptNumber:   receipt.receipt_number,
      recipientName:   receipt.recipient_name,
      amount:          parseFloat(receipt.amount || 0).toFixed(2),
      amountWords:     amountToWords(receipt.amount),
      description:     description || '',
      detail:          detail || '',
      paymentMethod:   paymentMethod || '',
      transactionDate: fmtDate(receipt.generated_at),
      generatedDate:   fmtDate(null),
      referenceType:   receipt.reference_type || 'donation',
      logoCid:         logoBuffer ? logoCid : null,
    });

    // Regenerate PDF with signature injected
    let pdfBuffer = null;
    try {
      const htmlForPdf = injectSignature(receipt.html_content || '', receipt.signature_base64);
      if (htmlForPdf) pdfBuffer = await generateReceiptPdf(htmlForPdf);
    } catch (pdfErr) {
      console.error('PDF regeneration failed on resend, sending without attachment:', pdfErr.message);
    }

    const attachments = [];
    if (logoBuffer) attachments.push({ filename: 'logo.jpeg', content: logoBuffer, contentType: 'image/jpeg', cid: logoCid });
    if (pdfBuffer)  attachments.push({ filename: `${receipt.receipt_number}.pdf`, content: pdfBuffer, contentType: 'application/pdf' });
    await sendEmail({ to: recipientEmail, subject, html: emailHtml, text: emailText, attachments });
    await sql`UPDATE receipts SET emailed_at = NOW() WHERE id = ${receipt.id}`;
  } catch (err) {
    console.error('resendExistingReceipt error:', err.message);
  }
}
