// lib/pdf.js — server-side PDF generation via puppeteer-core + chromium-min
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

export async function generateReceiptPdf(htmlContent) {
  const executablePath = await chromium.executablePath(
    'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
  );

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: chromium.headless,
    defaultViewport: chromium.defaultViewport,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', bottom: '1cm', left: '1.5cm', right: '1.5cm' },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}
