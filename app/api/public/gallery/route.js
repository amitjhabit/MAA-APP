export const dynamic = 'force-dynamic';
// app/api/public/gallery/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

export async function GET(request) {
  try {
    await ensureInit();
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const limit    = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category');

    const photos = category
      ? await sql`SELECT * FROM gallery WHERE category = ${category} ORDER BY is_featured DESC, sort_order ASC, created_at DESC LIMIT ${limit}`
      : await sql`SELECT * FROM gallery ORDER BY is_featured DESC, sort_order ASC, created_at DESC LIMIT ${limit}`;

    const res = NextResponse.json({ success: true, data: photos });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
