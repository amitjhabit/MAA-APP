// app/gallery/page.js  — server component, fetches albums server-side with cache tag
import { unstable_cache } from 'next/cache';
import { getDb, ensureInit } from '@/lib/db';
import GalleryClient from '@/app/components/GalleryClient';

const getAlbums = unstable_cache(
  async () => {
    await ensureInit();
    const sql = getDb();
    return await sql`
      SELECT ga.*, COUNT(g.id)::int AS photo_count
      FROM gallery_albums ga
      LEFT JOIN gallery g ON g.album_id = ga.id
      GROUP BY ga.id
      ORDER BY ga.sort_order ASC, ga.created_at ASC
    `;
  },
  ['gallery-albums'],
  { tags: ['gallery-albums'] }
);

export default async function GalleryPage() {
  let albums = [];
  try { albums = await getAlbums(); } catch {}
  return <GalleryClient initialAlbums={albums} />;
}
