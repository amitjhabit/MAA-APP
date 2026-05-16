// lib/receipts.js — shared auto-generate-and-send receipt logic
import { renderTemplate, fmtAmount, sendEmail } from '@/lib/email';
import { generateReceiptPdf } from '@/lib/pdf';

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
    const fmtDate = d => {
      if (!d) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const dt = new Date(d);
      return isNaN(dt) ? d : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const vars = {
      receipt_number:   receiptNumber,
      recipient_name:   recipientName || 'Valued Member',
      recipient_email:  recipientEmail || '',
      amount:           fmtAmount(amount),
      description:      description || '',
      payment_method:   paymentMethod || '',
      transaction_date: fmtDate(transactionDate),
      generated_date:   fmtDate(null),
      status:           'received',
      app_url:          process.env.NEXT_PUBLIC_APP_URL || '',
    };

    // 3. Render HTML
    const htmlContent = renderTemplate(tmpl.body_html || '', vars);

    // 4. Insert receipt row
    const [saved] = await sql`
      INSERT INTO receipts (receipt_number, template_id, recipient_name, recipient_email, html_content)
      VALUES (${receiptNumber}, ${tmpl.id}, ${vars.recipient_name}, ${recipientEmail || null}, ${htmlContent})
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
