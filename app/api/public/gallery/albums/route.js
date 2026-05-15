export const dynamic = 'force-dynamic';
// app/api/public/gallery/albums/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

export async function GET() {
  try {
    await ensureInit();
    const sql = getDb();
    const albums = await sql`
      SELECT ga.*, COUNT(g.id)::int AS photo_count
      FROM gallery_albums ga
      LEFT JOIN gallery g ON g.album_id = ga.id
      GROUP BY ga.id
      ORDER BY ga.sort_order ASC, ga.id ASC
    `;
    const res = NextResponse.json({ success: true, data: albums, total: albums.length });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message, data: [] });
  }
}
