// app/api/gallery/upload/route.js
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const secret = request.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folderPath = formData.get('folder_path') || '';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Only JPG, PNG, GIF, WEBP images are allowed' }, { status: 400 });
    }

    // Validate file size (5 MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'File too large. Max size is 5 MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(bytes);

    // Sanitize original filename and generate unique name
    const origName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    const ext = origName.split('.').pop() || 'jpg';
    const baseName = origName.slice(0, origName.lastIndexOf('.')) || 'photo';
    const filename = `${Date.now()}-${baseName.slice(0, 30)}.${ext}`;

    // Sanitize folder path (no path traversal)
    const safeFolderPath = folderPath && !folderPath.includes('..') && !folderPath.startsWith('/') ? folderPath : '';
    const uploadDir = safeFolderPath
      ? join(process.cwd(), 'public', 'images', 'gallery', safeFolderPath)
      : join(process.cwd(), 'public', 'images', 'gallery');
    await mkdir(uploadDir, { recursive: true });

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const url = safeFolderPath ? `/images/gallery/${safeFolderPath}/${filename}` : `/images/gallery/${filename}`;
    return NextResponse.json({ success: true, url, filename });
  } catch (err) {
    console.error('Upload error:', err);
    // Vercel production filesystem is read-only — give a helpful message
    if (err.code === 'EROFS' || err.code === 'EACCES') {
      return NextResponse.json({
        success: false,
        message: 'File upload is only available in local development. On Vercel, add images to public/images/gallery/ in your git repo and enter the path manually.',
      }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
