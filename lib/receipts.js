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

function makeReceiptNumber() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `RCP-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/**
 * Generate a receipt, create a PDF, and email it to the recipient.
 * Safe to call fire-and-forget (errors are logged, not thrown).
 *
 * @param {object} opts
 * @param {object} opts.sql          - Neon sql client
 * @param {string} opts.recipientName
 * @param {string} opts.recipientEmail
 * @param {number} opts.amount
 * @param {string} opts.description
 * @param {string} [opts.paymentMethod]
 * @param {string} [opts.transactionDate]  - ISO date string or human-readable
 * @param {string} [opts.referenceType]    - 'donation' | 'membership' | 'other'
 * @param {number} [opts.referenceId]
 * @returns {{ receiptId, receiptNumber } | null}
 */
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
    // 1. Find best template
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

    // 2. Build template variables
    const receiptNumber = makeReceiptNumber();
    const PST = { timeZone: 'America/Los_Angeles' };
    const fmtDate = d => {
      if (!d) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', ...PST });
      // Parse date-only strings (YYYY-MM-DD) as UTC noon to avoid DST/offset shifting the day
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

    const vars = {
      receipt_number:       receiptNumber,
      recipient_name:       recipientName || 'Valued Member',
      recipient_email:      recipientEmail || '',
      amount:               fmtAmount(amount),
      amount_words:         amountToWords(amount),
      description:          description || '',
      payment_method:       paymentMethod || '',
      transaction_date:     fmtDate(transactionDate),
      generated_date:       fmtDate(null),
      status:               'received',
      app_url:              process.env.NEXT_PUBLIC_APP_URL || '',
      representative_name:  president?.name || 'Sunil Jha',
      logo_img:             getLogoImgTag(),
    };

    // 3. Render HTML — inline any remaining /images/... paths as base64 (safety net for stale templates)
    const htmlContent = inlineLocalImages(renderTemplate(tmpl.body_html || '', vars));

    // 4. Insert receipt row
    const [saved] = await sql`
      INSERT INTO receipts (receipt_number, template_id, recipient_name, recipient_email, html_content, amount)
      VALUES (${receiptNumber}, ${tmpl.id}, ${vars.recipient_name}, ${recipientEmail || null}, ${htmlContent}, ${amount || 0})
      RETURNING *
    `;

    // 5. Generate PDF
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateReceiptPdf(htmlContent);
      await sql`UPDATE receipts SET pdf_base64 = ${pdfBuffer.toString('base64')} WHERE id = ${saved.id}`;
    } catch (pdfErr) {
      console.error('PDF generation failed (email will still send without attachment):', pdfErr.message);
    }

    // 6. Send email
    if (recipientEmail) {
      const subject = renderTemplate(tmpl.subject || 'Your MAA Receipt — {{receipt_number}}', vars);
      const attachments = pdfBuffer ? [{
        filename: `${receiptNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }] : [];
      try {
        await sendEmail({ to: recipientEmail, subject, html: htmlContent, attachments });
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
