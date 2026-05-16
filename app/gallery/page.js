// app/gallery/page.js — server component, always fetches fresh from DB
export const dynamic = 'force-dynamic';
import { getDb, ensureInit } from '@/lib/db';
import GalleryClient from '@/app/components/GalleryClient';

export default async function GalleryPage() {
  let albums = [];
  try {
    await ensureInit();
    const sql = getDb();
    albums = await sql`
      SELECT ga.*, COUNT(g.id)::int AS photo_count
      FROM gallery_albums ga
      LEFT JOIN gallery g ON g.album_id = ga.id
      GROUP BY ga.id
      ORDER BY ga.sort_order ASC, ga.created_at ASC
    `;
  } catch (e) {
    console.error('GalleryPage data fetch:', e.message);
  }
  return <GalleryClient initialAlbums={albums} />;
}
