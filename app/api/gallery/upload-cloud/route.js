// app/api/gallery/upload-cloud/route.js
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  const secret = request.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({ success: false, message: 'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables.' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folderPath = formData.get('folder_path') || 'general';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Only JPG, PNG, GIF, WEBP images are allowed' }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB for mobile photos
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'File too large. Max size is 10 MB.' }, { status: 400 });
    }

    const safeFolder = folderPath.replace(/\.\./g, '').replace(/^\//, '') || 'general';
    const cloudFolder = `maa-gallery/${safeFolder}`;

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: cloudFolder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
        (err, res) => err ? reject(err) : resolve(res)
      );
      stream.end(Buffer.from(bytes));
    });

    return NextResponse.json({ success: true, url: result.secure_url, filename: result.public_id });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Cloudinary upload failed' }, { status: 500 });
  }
}
