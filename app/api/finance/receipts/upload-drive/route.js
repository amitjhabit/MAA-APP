// app/api/finance/receipts/upload-drive/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
import { generateReceiptPdf } from '@/lib/pdf';
import { uploadPdfToDrive } from '@/lib/drive';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { receipt_ids, folder_id } = await req.json();
    if (!receipt_ids?.length) return NextResponse.json({ success: false, message: 'No receipts selected' }, { status: 400 });

    const targetFolder = folder_id || process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!targetFolder) return NextResponse.json({ success: false, message: 'No Google Drive folder configured. Set GOOGLE_DRIVE_FOLDER_ID in .env.local' }, { status: 400 });

    const results = [];

    for (const id of receipt_ids) {
      const [receipt] = await sql`SELECT * FROM receipts WHERE id = ${id}`;
      if (!receipt) { results.push({ id, success: false, error: 'Not found' }); continue; }

      try {
        let pdfBuffer;
        if (receipt.pdf_base64) {
          pdfBuffer = Buffer.from(receipt.pdf_base64, 'base64');
        } else {
          if (!receipt.html_content) { results.push({ id, success: false, error: 'No HTML content' }); continue; }
          pdfBuffer = await generateReceiptPdf(receipt.html_content);
          await sql`UPDATE receipts SET pdf_base64 = ${pdfBuffer.toString('base64')} WHERE id = ${id}`;
        }

        const filename = `${receipt.receipt_number || `receipt-${id}`}.pdf`;
        const { fileId, link } = await uploadPdfToDrive(pdfBuffer, filename, targetFolder);
        await sql`UPDATE receipts SET drive_file_id = ${fileId}, drive_link = ${link} WHERE id = ${id}`;

        results.push({ id, success: true, name: filename, link });
      } catch (e) {
        results.push({ id, success: false, error: e.message });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    return NextResponse.json({ success: true, uploaded: succeeded, failed: results.length - succeeded, results });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
