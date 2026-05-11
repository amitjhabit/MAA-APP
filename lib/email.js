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

export async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const info = await transporter.sendMail({ from, to, subject, html });
  return info;
}

// Replace {{variable}} placeholders in a template string
export function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

// Format amount with 2 decimal places
export function fmtAmount(amount) {
  return parseFloat(amount || 0).toFixed(2);
}
