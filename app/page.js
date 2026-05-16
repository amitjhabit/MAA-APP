// app/page.js — server component with tagged cache; revalidates on event/news/member changes
import { unstable_cache } from 'next/cache';
import { getDb, ensureInit } from '@/lib/db';
import HomeClient from '@/app/components/HomeClient';

const getHomeData = unstable_cache(
  async () => {
    await ensureInit();
    const sql = getDb();
    const [evRows, newsRows, memberCount, eventCount, contentRows] = await Promise.all([
      sql`
        SELECT id, title, title_maithili, description, event_date, event_time,
               end_date, location, address, city, state, is_online, meeting_link,
               category, status, cover_image, organizer, contact_email,
               max_attendees, registration_fee
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
      sql`SELECT section, key, value FROM homepage_content WHERE is_active = TRUE`,
    ]);
    const content = {};
    for (const row of contentRows) content[`${row.section}.${row.key}`] = row.value;
    return {
      events:  evRows,
      news:    newsRows,
      stats:   { members: parseInt(memberCount[0]?.c || 0), events: parseInt(eventCount[0]?.c || 0) },
      content,
    };
  },
  ['home'],
  { tags: ['home'] }
);

export default async function HomePage() {
  let events = [], news = [], stats = { members: 0, events: 0 }, content = {};
  try {
    ({ events, news, stats, content } = await getHomeData());
  } catch (e) {
    console.error('HomePage data fetch:', e.message);
  }
  return <HomeClient events={events} news={news} stats={stats} content={content} />;
}
