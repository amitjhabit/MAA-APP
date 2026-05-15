// app/news/page.js — server component with tagged cache; revalidates on news changes
import { unstable_cache } from 'next/cache';
import { getDb, ensureInit } from '@/lib/db';
import NewsClient from '@/app/components/NewsClient';

const getNews = unstable_cache(
  async () => {
    await ensureInit();
    const sql = getDb();
    return await sql`
      SELECT id, title, title_maithili, excerpt, content, category, author, published_at
      FROM news_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 50
    `;
  },
  ['news'],
  { tags: ['news'] }
);

export default async function NewsPage() {
  let posts = [];
  try {
    posts = await getNews();
  } catch (e) {
    console.error('NewsPage data fetch:', e.message);
  }
  return <NewsClient initialPosts={posts} />;
}
