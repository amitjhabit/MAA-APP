// lib/pdf.js — server-side PDF generation
import puppeteer from 'puppeteer-core';

const CHROMIUM_TAR = 'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar';

// Windows paths to look for Chrome
const WIN_CHROME_PATHS = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

async function getLaunchOptions() {
  // On Vercel / Linux serverless — use chromium-min
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

  // Local Windows / Mac — use installed Chrome
  const { existsSync } = await import('fs');
  for (const p of WIN_CHROME_PATHS) {
    if (existsSync(p)) {
      return { executablePath: p, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
    }
  }

  // Mac fallback
  const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (existsSync(macPath)) {
    return { executablePath: macPath, headless: true, args: ['--no-sandbox'] };
  }

  throw new Error('No Chrome/Chromium found. Install Chrome or set VERCEL=1 env var.');
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
