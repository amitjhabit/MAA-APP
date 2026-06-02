// app/api/gallery/cloudinary-sign/route.js
// Returns a signed upload params so the browser can upload directly to Cloudinary
// — bypasses Vercel's 4.5 MB request-body limit entirely.
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  const secret = request.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({
      success: false,
      message: 'Cloudinary env vars not set. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in Vercel.',
    }, { status: 500 });
  }

  try {
    const { folder } = await request.json().catch(() => ({}));
    const safeFolder = (folder || 'general').replace(/\.\./g, '').replace(/^\//, '');
    const cloudFolder = `maa-gallery/${safeFolder}`;
    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: cloudFolder },
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      folder: cloudFolder,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    console.error('Cloudinary sign error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
