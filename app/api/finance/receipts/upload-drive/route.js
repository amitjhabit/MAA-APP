// app/api/finance/receipts/upload-drive/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { getDb, ensureInit } from '@/lib/db';
import { generateReceiptPdf } from '@/lib/pdf';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

function getDriveClient() {
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  if (!key || !email) throw new Error('Google Drive credentials not configured. Add GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY to .env.local');

  const auth = new google.auth.GoogleAuth({
    credentials: { type: 'service_account', client_email: email, private_key: key },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  return google.drive({ version: 'v3', auth });
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { receipt_ids, folder_id } = await req.json();
    if (!receipt_ids?.length) return NextResponse.json({ success: false, message: 'No receipts selected' }, { status: 400 });

    const targetFolder = folder_id || process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!targetFolder) return NextResponse.json({ success: false, message: 'No Google Drive folder configured. Set GOOGLE_DRIVE_FOLDER_ID in .env.local' }, { status: 400 });

    const drive = getDriveClient();
    const results = [];

    for (const id of receipt_ids) {
      const [receipt] = await sql`SELECT * FROM receipts WHERE id = ${id}`;
      if (!receipt) { results.push({ id, success: false, error: 'Not found' }); continue; }

      try {
        // Get or generate PDF buffer
        let pdfBuffer;
        if (receipt.pdf_base64) {
          pdfBuffer = Buffer.from(receipt.pdf_base64, 'base64');
        } else {
          if (!receipt.html_content) { results.push({ id, success: false, error: 'No HTML content' }); continue; }
          pdfBuffer = await generateReceiptPdf(receipt.html_content);
          await sql`UPDATE receipts SET pdf_base64 = ${pdfBuffer.toString('base64')} WHERE id = ${id}`;
        }

        const filename = `${receipt.receipt_number || `receipt-${id}`}.pdf`;
        const stream = Readable.from(pdfBuffer);

        const uploaded = await drive.files.create({
          requestBody: {
            name: filename,
            mimeType: 'application/pdf',
            parents: [targetFolder],
          },
          media: { mimeType: 'application/pdf', body: stream },
          fields: 'id,name,webViewLink',
        });

        // Make file viewable by anyone with the link
        await drive.permissions.create({
          fileId: uploaded.data.id,
          requestBody: { role: 'reader', type: 'anyone' },
        });

        results.push({ id, success: true, name: filename, link: uploaded.data.webViewLink });
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
