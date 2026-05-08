// app/api/gallery/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const photos = await sql`SELECT * FROM gallery ORDER BY is_featured DESC, sort_order ASC, created_at DESC`;
    return NextResponse.json({ success: true, data: photos, stats: { total: photos.length, featured: photos.filter(p => p.is_featured).length } });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function POST(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb(), b = await request.json();
    if (!b.image_url?.trim()) return NextResponse.json({ success: false, errors: { image_url: 'Image URL required' } }, { status: 400 });
    const [p] = await sql`INSERT INTO gallery (title,description,image_url,thumbnail_url,category,is_featured,sort_order,uploaded_by) VALUES (${b.title||null},${b.description||null},${b.image_url.trim()},${b.thumbnail_url||null},${b.category||'general'},${b.is_featured||false},${parseInt(b.sort_order||0)},${b.uploaded_by||null}) RETURNING *`;
    return NextResponse.json({ success: true, data: p }, { status: 201 });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
