// Temporary diagnostic endpoint — remove after Drive is confirmed working
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/drive';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) return NextResponse.json({ success: false, message: 'GOOGLE_DRIVE_FOLDER_ID not set' });

    const drive = getDriveClient();

    // Try to list files in the folder — will fail if folder not shared or API not enabled
    const res = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id,name)',
      pageSize: 1,
    });

    return NextResponse.json({
      success: true,
      message: 'Drive connection OK',
      folder_id: folderId,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      files_found: res.data.files?.length ?? 0,
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message, details: e.errors ?? null }, { status: 500 });
  }
}
