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

    // Use stored PDF if available, else generate on-the-fly
    let pdfBuffer;
    if (receipt.pdf_base64) {
      pdfBuffer = Buffer.from(receipt.pdf_base64, 'base64');
    } else {
      if (!receipt.html_content) return new Response('No HTML content to generate PDF from', { status: 400 });
      pdfBuffer = await generateReceiptPdf(receipt.html_content);
      // Cache it for next time
      await sql`UPDATE receipts SET pdf_base64 = ${pdfBuffer.toString('base64')} WHERE id = ${params.id}`;
    }

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
