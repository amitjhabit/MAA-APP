// lib/email.js — Nodemailer SMTP helper
import nodemailer from 'nodemailer';

function getTransporter() {
  if (!process.env.SMTP_HOST) throw new Error('SMTP_HOST not configured in .env.local');
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({ to, subject, html, text, attachments = [] }) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  // Plain-text fallback improves deliverability — HTML-only emails score poorly in spam filters
  const plainText = text || htmlToPlainText(html || '');
  const info = await transporter.sendMail({
    from,
    to,
    replyTo: process.env.SMTP_USER,
    subject,
    text: plainText,
    html,
    attachments,
    headers: {
      // Mark as one-to-one transactional mail (not bulk/marketing)
      'Precedence':        'transactional',
      'Auto-Submitted':    'no',
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'X-Mailer':          'MAA-CRM',
      'X-Entity-Ref-ID':  `maa-${Date.now()}`,
    },
  });
  return info;
}

// Strip HTML tags to produce a plain-text fallback for spam filter compliance
function htmlToPlainText(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&middot;/g, '·')
    .replace(/&mdash;/g, '—')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Replace {{variable}} placeholders in a template string
export function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

// Format amount with 2 decimal places
export function fmtAmount(amount) {
  return parseFloat(amount || 0).toFixed(2);
}
