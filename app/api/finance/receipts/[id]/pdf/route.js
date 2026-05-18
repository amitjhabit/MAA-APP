// app/api/finance/receipts/[id]/pdf/route.js — stream PDF download
export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/db';
import { generateReceiptPdf } from '@/lib/pdf';

function auth(req) {
  const secret = process.env.ADMIN_SECRET;
  return req.headers.get('x-admin-secret') === secret ||
         new URL(req.url).searchParams.get('secret') === secret;
}

export async function GET(req, { params }) {
  if (!auth(req)) return new Response('Unauthorized', { status: 401 });
  try {
    const sql = getDb();
    const [receipt] = await sql`SELECT * FROM receipts WHERE id = ${params.id}`;
    if (!receipt) return new Response('Receipt not found', { status: 404 });

    // Always regenerate from html_content so logo/images are always inlined fresh
    if (!receipt.html_content) return new Response('No HTML content to generate PDF from', { status: 400 });

    // Inject signature into PDF — replace whatever signature div is stored with a larger one
    let htmlForPdf = receipt.html_content;
    if (receipt.template_id) {
      const [tmpl] = await sql`SELECT signature_base64 FROM receipt_templates WHERE id = ${receipt.template_id}`;
      if (tmpl?.signature_base64) {
        const sigImg = `<img src="${tmpl.signature_base64}" alt="Authorized Signature" style="height:100px;max-width:300px;display:block;">`;
        const sigDiv = `<div style="border-bottom:2px solid #333;min-height:110px;padding:10px 0 6px">${sigImg}</div>`;
        // Match any version of the signature div (old flex version, new plain version, or already-injected)
        htmlForPdf = htmlForPdf.replace(
          /<div[^>]*(?:height:50px|min-height:50px|align-items:flex-end)[^>]*>(?:<img[^>]*>)?<\/div>(\s*<p[^>]*>Representative's Signature<\/p>)/,
          `${sigDiv}$1`
        );
      }
    }

    const pdfBuffer = await generateReceiptPdf(htmlForPdf);
    // Update cached copy
    await sql`UPDATE receipts SET pdf_base64 = ${pdfBuffer.toString('base64')} WHERE id = ${params.id}`;

    const filename = `${receipt.receipt_number || `receipt-${params.id}`}.pdf`;
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
