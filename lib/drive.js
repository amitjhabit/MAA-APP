// lib/drive.js — shared Google Drive upload utility
import { google } from 'googleapis';
import { Readable } from 'stream';

export function getDriveClient() {
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  if (!key || !email) throw new Error('Google Drive credentials not configured');
  const auth = new google.auth.GoogleAuth({
    credentials: { type: 'service_account', client_email: email, private_key: key },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  return google.drive({ version: 'v3', auth });
}

// Upload a PDF buffer to Drive, make it public, return { fileId, link } or throw.
export async function uploadPdfToDrive(pdfBuffer, filename, folderId) {
  const drive = getDriveClient();
  const stream = Readable.from(pdfBuffer);
  const uploaded = await drive.files.create({
    requestBody: { name: filename, mimeType: 'application/pdf', parents: [folderId] },
    media: { mimeType: 'application/pdf', body: stream },
    fields: 'id,name,webViewLink',
  });
  await drive.permissions.create({
    fileId: uploaded.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });
  return { fileId: uploaded.data.id, link: uploaded.data.webViewLink };
}

// Upload receipt PDF to Drive and persist drive_link + drive_file_id on the receipt row.
// Returns { fileId, link } on success, null if credentials/folder not configured.
export async function uploadReceiptToDrive(sql, receiptId, pdfBuffer, receiptNumber) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) return null;

  const filename = `${receiptNumber || `receipt-${receiptId}`}.pdf`;
  const result = await uploadPdfToDrive(pdfBuffer, filename, folderId);
  await sql`UPDATE receipts SET drive_file_id = ${result.fileId}, drive_link = ${result.link} WHERE id = ${receiptId}`;
  return result;
}
