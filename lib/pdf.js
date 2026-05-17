// lib/pdf.js — server-side PDF generation
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
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

// Replace relative /images/... paths with inline base64 so puppeteer can render them
function inlineLocalImages(html) {
  return html.replace(/src="(\/[^"]+)"/g, (match, relPath) => {
    try {
      const filePath = join(process.cwd(), 'public', relPath);
      if (existsSync(filePath)) {
        const ext = relPath.split('.').pop().toLowerCase();
        const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp' }[ext] || 'image/jpeg';
        const b64 = readFileSync(filePath).toString('base64');
        return `src="data:${mime};base64,${b64}"`;
      }
    } catch {}
    return match;
  });
}

// If html_content was generated before the logo migration, inject it now
function ensureLogo(html) {
  if (html.includes('Mithila_logo') || html.includes('data:image')) return html;
  try {
    const logoPath = join(process.cwd(), 'public', 'images', 'gallery', 'Mithila_logo.jpeg');
    if (!existsSync(logoPath)) return html;
    const b64 = readFileSync(logoPath).toString('base64');
    const logoTag = `<img src="data:image/jpeg;base64,${b64}" alt="MAA Logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;border:3px solid #E8720C;" />`;
    // Insert before the first <h1 in the header block
    return html.replace(/<h1 /i, `${logoTag}<h1 `);
  } catch { return html; }
}

export async function generateReceiptPdf(htmlContent) {
  const html = ensureLogo(inlineLocalImages(htmlContent));
  const options = await getLaunchOptions();
  const browser = await puppeteer.launch(options);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
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
