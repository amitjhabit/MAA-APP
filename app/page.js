// app/page.js — server component: fetches data at request time, no client spinner
import { getDb, ensureInit } from '@/lib/db';
import HomeClient from '@/app/components/HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let events = [], news = [], stats = { members: 0, events: 0 };
  try {
    await ensureInit();
    const sql = getDb();
    const [evRows, newsRows, memberCount, eventCount] = await Promise.all([
      sql`
        SELECT id, title, title_maithili, description, event_date, event_time,
               location, city, state, is_online, category, status
        FROM events
        WHERE status != 'cancelled'
        ORDER BY
          CASE status WHEN 'upcoming' THEN 1 WHEN 'ongoing' THEN 2 WHEN 'completed' THEN 3 ELSE 4 END,
          event_date ASC
        LIMIT 6
      `,
      sql`
        SELECT id, title, title_maithili, excerpt, content, category, author, published_at
        FROM news_posts
        WHERE status = 'published'
        ORDER BY published_at DESC
        LIMIT 3
      `,
      sql`SELECT COUNT(*) AS c FROM members WHERE is_active = TRUE`,
      sql`SELECT COUNT(*) AS c FROM events`,
    ]);
    events = evRows;
    news   = newsRows;
    stats  = { members: parseInt(memberCount[0]?.c || 0), events: parseInt(eventCount[0]?.c || 0) };
  } catch (e) {
    console.error('HomePage data fetch:', e.message);
  }

  return <HomeClient events={events} news={news} stats={stats} />;
}
