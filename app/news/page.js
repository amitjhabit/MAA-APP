// app/news/page.js — server component, always fetches fresh from DB
export const dynamic = 'force-dynamic';
import { getDb, ensureInit } from '@/lib/db';
import NewsClient from '@/app/components/NewsClient';

export default async function NewsPage() {
  let posts = [];
  try {
    await ensureInit();
    const sql = getDb();
    posts = await sql`
      SELECT id, title, title_maithili, excerpt, content, category, author, published_at
      FROM news_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 50
    `;
  } catch (e) {
    console.error('NewsPage data fetch:', e.message);
  }
  return <NewsClient initialPosts={posts} />;
}
