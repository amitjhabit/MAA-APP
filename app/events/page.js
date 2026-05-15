// app/events/page.js — server component with tagged cache; revalidates on event changes
import { unstable_cache } from 'next/cache';
import { getDb, ensureInit } from '@/lib/db';
import EventsClient from '@/app/components/EventsClient';

const getEvents = unstable_cache(
  async () => {
    await ensureInit();
    const sql = getDb();
    return await sql`
      SELECT * FROM events
      WHERE status != 'cancelled'
      ORDER BY
        CASE status WHEN 'upcoming' THEN 1 WHEN 'ongoing' THEN 2 WHEN 'completed' THEN 3 ELSE 4 END,
        event_date ASC
      LIMIT 50
    `;
  },
  ['events'],
  { tags: ['events'] }
);

export default async function EventsPage() {
  let events = [];
  try {
    events = await getEvents();
  } catch (e) {
    console.error('EventsPage data fetch:', e.message);
  }
  return <EventsClient initialEvents={events} />;
}
