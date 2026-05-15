export const dynamic = 'force-dynamic';
// app/api/public/gallery/albums/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

export async function GET() {
  try {
    await ensureInit();
    const sql = getDb();
    const albums = await sql`
      SELECT ga.id, ga.name, ga.display_name, ga.description, ga.cover_image_url,
             ga.sort_order, COUNT(g.id)::int AS photo_count
      FROM gallery_albums ga
      LEFT JOIN gallery g ON g.album_id = ga.id
      GROUP BY ga.id
      ORDER BY ga.sort_order ASC, ga.created_at DESC
    `;
    const res = NextResponse.json({ success: true, data: albums });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
