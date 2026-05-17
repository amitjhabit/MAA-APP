// lib/pdf.js — server-side PDF generation
import { existsSync } from 'fs';
import puppeteer from 'puppeteer-core';

const CHROMIUM_TAR = 'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar';

const WIN_CHROME_PATHS = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function getLaunchOptions() {
  // Vercel / Linux serverless — use chromium-min
  if (process.env.VERCEL || process.platform === 'linux') {
    const chromium = (await import('@sparticuz/chromium-min')).default;
    const executablePath = await chromium.executablePath(CHROMIUM_TAR);
    return {
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    };
  }

  // Local Windows — use installed Chrome
  for (const p of WIN_CHROME_PATHS) {
    if (existsSync(p)) {
      return { executablePath: p, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
    }
  }

  // Local Mac — use installed Chrome
  if (existsSync(MAC_CHROME)) {
    return { executablePath: MAC_CHROME, headless: true, args: ['--no-sandbox'] };
  }

  throw new Error('No Chrome found. Install Chrome or deploy to Vercel.');
}

export async function generateReceiptPdf(htmlContent) {
  const options = await getLaunchOptions();
  const browser = await puppeteer.launch(options);
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
